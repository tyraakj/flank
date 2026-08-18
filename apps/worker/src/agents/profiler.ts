import { prisma } from "@flank/database";
import { registry } from "../providers/registry";
import { TargetProfileSchema, TargetProfileData } from "@flank/shared";
import * as cheerio from "cheerio";
import { ZodError } from "zod";

function computeDeterministicProfileFallback(params: {
  mainPageHtml?: string;
  mainPageTitle?: string;
  combinedText: string;
  canonicalUrl: string;
}): TargetProfileData {
  let metaDescription = "";
  let detectedLang = "en";
  let h1Text = "";

  if (params.mainPageHtml) {
    try {
      const $ = cheerio.load(params.mainPageHtml);
      metaDescription =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";
      detectedLang = $("html").attr("lang")?.split("-")[0]?.toLowerCase() || "en";
      h1Text = $("h1").first().text().trim();
    } catch {
      // ignore
    }
  }

  const textLower = params.combinedText.toLowerCase();

  // Deterministically scan for common B2B software category cues
  const categoryKeywords = [
    "crm",
    "customer relationship management",
    "developer tools",
    "project management",
    "product analytics",
    "observability",
    "monitoring",
    "continuous integration",
    "ci/cd",
    "e-commerce",
    "marketing automation",
    "subscription billing",
    "payment processing",
    "collaboration",
    "security",
    "database",
  ];

  let detectedCategory = "unknown";
  for (const cat of categoryKeywords) {
    if (textLower.includes(cat)) {
      detectedCategory = cat.toUpperCase();
      break;
    }
  }

  // Deterministically scan for pricing model cues
  let detectedPricing = "unknown";
  if (textLower.includes("open source") || textLower.includes("github.com")) {
    detectedPricing = "Open Source / Self-Hosted";
  } else if (
    textLower.includes("free tier") ||
    textLower.includes("free forever") ||
    textLower.includes("freemium")
  ) {
    detectedPricing = "Freemium";
  } else if (
    textLower.includes("/month") ||
    textLower.includes("/user") ||
    textLower.includes("per seat")
  ) {
    detectedPricing = "Per-Seat Subscription";
  } else if (
    textLower.includes("usage-based") ||
    textLower.includes("pay as you go") ||
    textLower.includes("per request")
  ) {
    detectedPricing = "Usage-Based";
  } else if (textLower.includes("contact sales") || textLower.includes("custom pricing")) {
    detectedPricing = "Enterprise Custom Quote";
  }

  // Derive value props from title, h1, and meta description
  const valueProps: string[] = [];
  if (h1Text && h1Text.length > 5 && h1Text.length < 150) {
    valueProps.push(h1Text);
  }
  if (metaDescription && metaDescription.length > 10 && metaDescription.length < 200) {
    valueProps.push(metaDescription);
  }
  if (valueProps.length === 0 && params.mainPageTitle) {
    valueProps.push(params.mainPageTitle.substring(0, 100));
  }
  if (valueProps.length === 0) {
    valueProps.push("unknown");
  }

  // Derive seed keywords from title and category
  const titleWords = (params.mainPageTitle || "")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(
      (w) =>
        w.length > 3 &&
        !["with", "your", "from", "that", "this", "home", "page"].includes(w.toLowerCase()),
    );

  const seedKeywords = Array.from(
    new Set([detectedCategory !== "unknown" ? detectedCategory : "", ...titleWords]),
  )
    .filter(Boolean)
    .slice(0, 8);

  if (seedKeywords.length === 0) {
    seedKeywords.push("unknown");
  }

  return {
    category: detectedCategory,
    icp: "unknown",
    pricingModel: detectedPricing,
    valueProps: valueProps.slice(0, 5),
    jobsToBeDone: ["unknown"],
    seedKeywords,
    detectedLanguage: detectedLang,
    sourceNotes: `Deterministic profile fallback derived from HTML title ("${params.mainPageTitle || ""}"), meta description, and page keyword heuristics.`,
  };
}

export async function runProfilerAgent(
  runId: string,
  targetId: string,
  _inputArtifact: unknown,
): Promise<TargetProfileData> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error("Target not found");

  const reader = registry.getBrowserReader();
  const llm = registry.getLlmProvider();

  // Read the main page
  const mainPage = await reader.read({ url: target.url, mode: "auto", fresh: false });

  // Handle redirects to non-canonical domains if necessary?
  // Spec: "Treat cross-domain redirects as the Target only when the final page is a real public product site"
  // For now, we accept the canonicalUrl from the PageReadResult.

  // Discover pricing and about links
  let pricingUrl: string | null = null;
  let aboutUrl: string | null = null;

  if (mainPage.html) {
    const $ = cheerio.load(mainPage.html);
    const domain = new URL(mainPage.canonicalUrl).hostname;

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      try {
        const url = new URL(href, mainPage.canonicalUrl);
        if (url.hostname === domain) {
          const text = $(el).text().toLowerCase();
          if (!pricingUrl && (text.includes("pricing") || url.pathname.includes("pricing"))) {
            pricingUrl = url.href;
          }
          if (!aboutUrl && (text.includes("about") || url.pathname.includes("about"))) {
            aboutUrl = url.href;
          }
        }
      } catch (e) {
        // ignore invalid urls
      }
    });
  }

  let combinedText = `HOMEPAGE (${mainPage.canonicalUrl}):\n${mainPage.text}\n\n`;

  const fetchedEvidence: Array<{
    url: string;
    canonicalUrl: string;
    contentHash: string;
    snapshotKey?: string;
  }> = [
    {
      url: target.url,
      canonicalUrl: mainPage.canonicalUrl,
      contentHash: mainPage.contentHash,
      snapshotKey: mainPage.snapshotKey,
    },
  ];

  if (pricingUrl) {
    try {
      const pricingPage = await reader.read({ url: pricingUrl, mode: "auto", fresh: false });
      combinedText += `PRICING PAGE (${pricingPage.canonicalUrl}):\n${pricingPage.text}\n\n`;
      fetchedEvidence.push({
        url: pricingUrl,
        canonicalUrl: pricingPage.canonicalUrl,
        contentHash: pricingPage.contentHash,
        snapshotKey: pricingPage.snapshotKey,
      });
    } catch (e) {
      console.warn("Failed to read pricing page", e);
    }
  }

  if (aboutUrl) {
    try {
      const aboutPage = await reader.read({ url: aboutUrl, mode: "auto", fresh: false });
      combinedText += `ABOUT PAGE (${aboutPage.canonicalUrl}):\n${aboutPage.text}\n\n`;
      fetchedEvidence.push({
        url: aboutUrl,
        canonicalUrl: aboutPage.canonicalUrl,
        contentHash: aboutPage.contentHash,
        snapshotKey: aboutPage.snapshotKey,
      });
    } catch (e) {
      console.warn("Failed to read about page", e);
    }
  }

  const PROFILER_SYSTEM_PROMPT = `You are a Principal Product Marketing Strategist and Competitive Intelligence Specialist at Flank.
Your mission is to perform an exhaustive, evidence-based market and product profile analysis of a target software company from its live website content (including Homepage, Pricing, and About/Product pages).

### CORE ANALYSIS DIRECTIVES:
1. Grounding & Rigor: Every claim MUST be grounded in the provided scraped website text. Do NOT hallucinate features, customer profiles, or pricing models not substantiated by the copy.
2. Specificity over Buzzwords: Avoid empty generic marketing filler (e.g., do not say "an AI-powered platform that revolutionizes workflows"). Extract the exact functional category, concrete workflows, and domain-specific capabilities.
3. Strict Fallback to 'unknown': If a dimension (e.g., pricing model, ICP) cannot be determined from the provided text, explicitly output "unknown" rather than speculating.
4. Language Preservation & Normalization: If the website is non-English, detect the language code accurately, provide standardized English classifications for category, ICP, and pricingModel, while preserving the semantic meaning of the original copy.

### FIELD EXTRACTION GUIDELINES:
- category: The standard, industry-recognized B2B/B2C market category (e.g., "Customer Relationship Management (CRM)", "Observability & APM", "Product Analytics", "Continuous Integration / Continuous Deployment (CI/CD)", "Headless CMS"). If niche, provide the primary market followed by the specific sub-niche.
- icp (Ideal Customer Profile): Detailed description of the target buyer/user persona including company maturity (e.g. Early-stage startups, Mid-market, Fortune 500 Enterprise), target role/title (e.g. VP of Engineering, Growth Product Managers, RevOps), and technical/operational context.
- pricingModel: Precise monetization architecture extracted from pricing tiers, plan comparisons, or FAQ (e.g., "Freemium with Usage-Based Add-ons", "Per-Seat Tiered Subscription (Starter/Pro/Enterprise)", "Pure Consumption / Credit-Based", "Free Open Source with Paid Managed Cloud", "Contact Sales / Enterprise Custom Quote Only").
- valueProps: 3 to 5 punchy, distinct, high-impact value propositions highlighting concrete business outcomes, efficiency gains, or technical differentiators.
- jobsToBeDone: 3 to 5 core functional or operational jobs the customer "hires" this product to accomplish. Formulate each as a concise actionable statement (e.g., "Automate end-to-end regression testing across browser environments without writing boilerplate code").
- seedKeywords: 5 to 10 high-intent search terms, market keywords, category descriptors, and alternative search queries that prospective buyers use when evaluating this product and its direct competitors.
- detectedLanguage: Two-letter ISO 639-1 language code (e.g., "en", "es", "fr", "de", "ja", "zh").
- sourceNotes: Analytical summary detailing key observations, confidence level, notable gaps (e.g., hidden pricing, missing documentation), and context for downstream competitive analysis agents.`;

  let prompt = `Analyze the scraped multi-page website content for the target product at ${mainPage.canonicalUrl} (submitted URL: ${target.url}) and extract a comprehensive, structured TargetProfile.\n\n`;
  prompt += `==================== SECTION 1: HOMEPAGE (${mainPage.canonicalUrl}) ====================\n`;
  prompt += `${mainPage.text.trim() || "[No text extracted from homepage]"}\n\n`;

  if (pricingUrl) {
    prompt += `==================== SECTION 2: PRICING PAGE (${pricingUrl}) ====================\n`;
    prompt += `${combinedText.includes("PRICING PAGE") ? combinedText.split("PRICING PAGE")[1]?.split("ABOUT PAGE")[0]?.trim() : "[Pricing page content unavailable]"}\n\n`;
  } else {
    prompt += `==================== SECTION 2: PRICING PAGE ====================\n[No dedicated pricing page discovered or content was inaccessible]\n\n`;
  }

  if (aboutUrl) {
    prompt += `==================== SECTION 3: ABOUT / COMPANY PAGE (${aboutUrl}) ====================\n`;
    prompt += `${combinedText.includes("ABOUT PAGE") ? combinedText.split("ABOUT PAGE")[1]?.trim() : "[About page content unavailable]"}\n\n`;
  } else {
    prompt += `==================== SECTION 3: ABOUT / COMPANY PAGE ====================\n[No dedicated about/company page discovered or content was inaccessible]\n\n`;
  }

  prompt += `==================== INSTRUCTIONS ====================\n`;
  prompt += `1. Synthesize insights across all provided sections.\n`;
  prompt += `2. Pay special attention to the pricing section when deriving 'pricingModel' and tier structures.\n`;
  prompt += `3. Derive high-quality 'seedKeywords' that will enable discovering direct market competitors.\n`;
  prompt += `4. Format your output strictly adhering to the TargetProfile JSON schema.`;

  let profileData: TargetProfileData;
  let usedFallback = false;

  const fallback = computeDeterministicProfileFallback({
    mainPageHtml: mainPage.html,
    mainPageTitle: mainPage.title,
    combinedText,
    canonicalUrl: mainPage.canonicalUrl,
  });

  try {
    const result = await llm.generateStructured({
      prompt: prompt.substring(0, 50000),
      schema: TargetProfileSchema,
      schemaName: "TargetProfile",
      schemaDescription:
        "Comprehensive market, pricing, and ICP profile of a software target company",
      system: PROFILER_SYSTEM_PROMPT,
      fallback,
    });
    profileData = result.data as TargetProfileData;
  } catch (error) {
    if (error instanceof ZodError) {
      // 1 repair attempt with enriched context
      const repairPrompt = `Your previous extraction of the TargetProfile failed schema validation with the following error(s):\n${error.message}\n\nPlease re-analyze the provided context below, correct all schema violations, ensure all array bounds and string constraints are strictly met, and return a valid structured TargetProfile object.\n\n${prompt.substring(0, 45000)}`;
      try {
        const repairResult = await llm.generateStructured({
          prompt: repairPrompt,
          schema: TargetProfileSchema,
          schemaName: "TargetProfile",
          schemaDescription:
            "Repaired market, pricing, and ICP profile of a software target company",
          system: PROFILER_SYSTEM_PROMPT,
          fallback,
        });
        profileData = repairResult.data as TargetProfileData;
      } catch (repairError) {
        profileData = fallback;
        usedFallback = true;
      }
    } else {
      profileData = fallback;
      usedFallback = true;
    }
  }

  // Update target if canonical domain changed
  const currentCanonicalDomain = new URL(mainPage.canonicalUrl).hostname.replace(/^www\./, "");
  if (target.canonicalDomain !== currentCanonicalDomain) {
    await prisma.target.update({
      where: { id: targetId },
      data: { canonicalDomain: currentCanonicalDomain },
    });
  }

  await prisma.$transaction(async (tx) => {
    // Delete prior profile for this run if replaying
    await tx.targetProfile.deleteMany({ where: { runId } });
    await tx.evidence.deleteMany({ where: { runId, claimType: "TARGET_PROFILE" } });

    const profile = await tx.targetProfile.create({
      data: {
        runId,
        targetId,
        category: profileData.category,
        icp: profileData.icp,
        pricingModel: profileData.pricingModel,
        valueProps: profileData.valueProps || [],
        confidence: usedFallback ? 0 : 80,
      },
    });

    const evidences = [];
    for (const source of fetchedEvidence) {
      evidences.push({
        runId,
        claimType: "TARGET_PROFILE" as const,
        claimId: profile.id,
        url: source.url,
        canonicalUrl: source.canonicalUrl,
        contentHash: source.contentHash,
        snapshotKey: source.snapshotKey,
        trustTier: "HIGH" as const,
      });
    }

    if (evidences.length > 0) {
      await tx.evidence.createMany({ data: evidences });
    }
  });

  return profileData;
}
