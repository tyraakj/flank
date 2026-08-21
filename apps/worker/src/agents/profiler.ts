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
      } catch (_e) {
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

  // ============================================================================
  // LAYER 1: SYSTEM PROMPT (STATIC PREFIX - CACHE CANDIDATE)
  // ============================================================================
  const PROFILER_SYSTEM_PROMPT = `You are a Principal Product Marketing Strategist and Competitive Intelligence Specialist at Flank.
Your mission is to perform an exhaustive, evidence-based market and product profile analysis of a target software company from its live website content (including Homepage, Pricing, and About/Product pages).

### CORE ANALYSIS DIRECTIVES & CONSTRAINTS:
1. Grounding & Rigor: Every claim MUST be grounded in the provided scraped website text. Do NOT hallucinate features, customer profiles, or pricing models not substantiated by the copy.
2. Specificity over Buzzwords: Avoid empty generic marketing filler (e.g., do not say "an AI-powered platform that revolutionizes workflows"). Extract the exact functional category, concrete workflows, and domain-specific capabilities.
3. Strict Fallback to 'unknown': If a dimension (e.g., pricing model, ICP) cannot be determined from the provided text, explicitly output "unknown" rather than speculating.
4. Language Preservation & Normalization: If the website is non-English, detect the language code accurately, provide standardized English classifications for category, ICP, and pricingModel, while preserving the semantic meaning of the original copy.`;

  // ============================================================================
  // LAYER 2: STATIC FEW-SHOT EXAMPLES (STATIC - CACHE CANDIDATE)
  // ============================================================================
  const PROFILER_STATIC_EXAMPLES = `### FEW-SHOT EXAMPLES & EDGE CASE GUARDS:

Example 1: B2B Developer Tool (SaaS with Freemium & Per-Seat Tiers)
Target URL: https://example-apm.io
Output:
{
  "category": "Observability & Application Performance Monitoring (APM)",
  "icp": "DevOps Engineers, Site Reliability Engineers (SREs), and Engineering Leads at mid-market to enterprise tech companies",
  "pricingModel": "Freemium with Per-Host & Ingestion-Based Paid Tiers",
  "valueProps": [
    "Sub-millisecond distributed tracing across Kubernetes clusters",
    "Automated root-cause anomaly detection with zero configuration overhead",
    "Unified metrics and log correlation in a single pane of glass"
  ],
  "jobsToBeDone": [
    "Identify and remediate production latency regressions before customer impact",
    "Consolidate fragmented telemetry data into a standardized OpenTelemetry pipeline"
  ],
  "seedKeywords": ["APM", "observability", "distributed tracing", "kubernetes monitoring", "log analytics"],
  "detectedLanguage": "en",
  "sourceNotes": "Extracted from homepage hero copy and dedicated /pricing table."
}

Example 2: Open Source / Missing Pricing Edge Case
Target URL: https://example-db.org
Output:
{
  "category": "Vector Database & Semantic Search Engine",
  "icp": "AI Engineers and Backend Developers building RAG applications",
  "pricingModel": "Open Source / Self-Hosted",
  "valueProps": [
    "HNSW-indexed vector search with millisecond query latency",
    "Native multi-modal embedding storage and hybrid BM25 full-text search"
  ],
  "jobsToBeDone": [
    "Index and query millions of document embeddings for generative AI retrieval"
  ],
  "seedKeywords": ["vector database", "semantic search", "embeddings storage", "RAG infrastructure"],
  "detectedLanguage": "en",
  "sourceNotes": "Self-hosted GitHub repository; no commercial pricing tiers detected on public site."
}`;

  // ============================================================================
  // LAYER 3: TOOLS & OUTPUT SCHEMA SPECIFICATION (STATIC - CACHE CANDIDATE)
  // ============================================================================
  const PROFILER_TOOLS_SPEC = `### OUTPUT FORMAT SPECIFICATION:
Extract and format your output strictly conforming to the TargetProfile schema:
- category: Standard industry B2B/B2C category (e.g. "Continuous Integration / Continuous Deployment (CI/CD)").
- icp: Concrete buyer/user persona (maturity, title, company size).
- pricingModel: Monetization architecture (e.g. "Per-Seat Subscription", "Usage-Based", "Freemium", "Enterprise Quote Only").
- valueProps: 3 to 5 punchy, distinct value propositions.
- jobsToBeDone: 2 to 5 actionable Jobs-to-be-Done statements.
- seedKeywords: 5 to 10 high-intent search terms and category keywords for competitor discovery.
- detectedLanguage: 2-letter ISO 639-1 language code.
- sourceNotes: Analytical summary detailing key observations and source reliability.`;

  // ============================================================================
  // LAYER 4: DYNAMIC CONTEXT (PER-REQUEST SCRAPED DATA)
  // ============================================================================
  let dynamicContext = `### DYNAMIC CONTEXT (Scraped Content for ${target.name} at ${mainPage.canonicalUrl}):\n\n`;
  dynamicContext += `==================== SECTION 1: HOMEPAGE (${mainPage.canonicalUrl}) ====================\n`;
  dynamicContext += `${mainPage.text.trim() || "[No text extracted from homepage]"}\n\n`;

  if (pricingUrl) {
    dynamicContext += `==================== SECTION 2: PRICING PAGE (${pricingUrl}) ====================\n`;
    dynamicContext += `${combinedText.includes("PRICING PAGE") ? combinedText.split("PRICING PAGE")[1]?.split("ABOUT PAGE")[0]?.trim() : "[Pricing page content unavailable]"}\n\n`;
  } else {
    dynamicContext += `==================== SECTION 2: PRICING PAGE ====================\n[No dedicated pricing page discovered or content was inaccessible]\n\n`;
  }

  if (aboutUrl) {
    dynamicContext += `==================== SECTION 3: ABOUT / COMPANY PAGE (${aboutUrl}) ====================\n`;
    dynamicContext += `${combinedText.includes("ABOUT PAGE") ? combinedText.split("ABOUT PAGE")[1]?.trim() : "[About page content unavailable]"}\n\n`;
  } else {
    dynamicContext += `==================== SECTION 3: ABOUT / COMPANY PAGE ====================\n[No dedicated about/company page discovered or content was inaccessible]\n\n`;
  }

  // ============================================================================
  // LAYER 5: USER TURN / DIRECTIVE
  // ============================================================================
  const userDirective = `### USER DIRECTIVE:
Analyze the dynamic scraped website context provided above for "${target.name}" (${mainPage.canonicalUrl}) and extract the structured TargetProfile JSON object strictly adhering to the schema and few-shot guidance.`;

  const fullPrompt = `${PROFILER_STATIC_EXAMPLES}\n\n${PROFILER_TOOLS_SPEC}\n\n${dynamicContext}\n\n${userDirective}`;

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
      prompt: fullPrompt.substring(0, 50000),
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
      const repairPrompt = `Your previous extraction of the TargetProfile failed schema validation with the following error(s):\n${error.message}\n\nPlease re-analyze the provided context below, correct all schema violations, ensure all array bounds and string constraints are strictly met, and return a valid structured TargetProfile object.\n\n${fullPrompt.substring(0, 45000)}`;
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
      } catch (_repairError) {
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
