import { prisma, PlanBand, BillingInterval } from "@flank/database";
import { registry } from "../providers/registry";
import {
  PricingPlanData,
  CompetitorPricingExtractionSchema,
  CompetitorPricingExtraction,
  PricingStageOutput,
} from "@flank/shared";
import { publishRunEvent } from "../progress/publisher";
import * as cheerio from "cheerio";
import { ZodError } from "zod";
import * as crypto from "crypto";

const PRICING_SYSTEM_PROMPT = `You are a Principal Pricing & Monetization Analyst at Flank.
Your task is to analyze scraped public pricing page content (or homepage/product content) for a software competitor and extract a comprehensive, structured array of PricingPlans and monetization metadata.

### CORE RULES & DIRECTIVES:
1. Grounding & Rigor: Every extracted plan, tier name, price amount, currency, and feature claim MUST be strictly grounded in the provided page text. DO NOT hallucinate prices, tiers, or features.
2. Separate Monthly & Annual Variants: If a plan offers both monthly (e.g. $29/mo or ₹2,499/mo) and annual (e.g. $24/mo or ₹1,999/mo or ₹24,000/yr) billing options, produce TWO separate plan objects:
   - One with interval: "MONTHLY" and the exact monthly amount.
   - One with interval: "YEARLY" and the exact annual amount.
3. Currency Detection & ISO Codes:
   - Accurately identify and preserve currency codes as ISO-4217 standards:
     - USD for US Dollars ($, USD).
     - INR for Indian Rupees (₹, Rs, Rs., INR).
     - EUR for Euros (€, EUR), GBP for British Pounds (£, GBP), etc.
   - Never confuse ₹ / INR with USD or vice versa.
4. No Inferred Prices:
   - NEVER compute or infer an artificial numeric price from discount percentages (e.g., "Save 20% on annual plans" without explicit prices).
   - If a plan is "Contact Sales", "Custom", or "Request a Quote", set amount: null, band: "CUSTOM", and availability: "contact-sales".
   - If a price is listed as a range (e.g., "$50 - $100" or "₹3,000 - ₹5,000"), set amount: null, rawPriceString: verbatim range, and note the range in the excerpt.
5. Tier Band Classification:
   - FREE: Plans costing 0 ($0, ₹0) or explicitly designated as "Free", "Community", or "Open Source".
   - GROWTH: Entry-level, Starter, Basic, Pro, Team, or Standard paid tiers.
   - ENTERPRISE: Advanced, Business, Scale, Enterprise, or High-volume commercial tiers.
   - CUSTOM: Quote-only, Contact Sales, or bespoke enterprise tiers.
6. Verbatim Auditable Excerpts:
   - For every plan, provide an exact verbatim excerpt from the page containing the plan header, price, billing cadence, and key terms for evidence verification.
7. Unknown Values:
   - If seatModel or usage limits are not stated, set seatModel: "unknown" and usageLimits: [].`;

export function computeDeterministicPricingFallback(params: {
  pageText: string;
  pageHtml?: string;
  sourceUrl: string;
  competitorName: string;
}): CompetitorPricingExtraction {
  const text = params.pageText || "";
  const textLower = text.toLowerCase();
  const plans: PricingPlanData[] = [];

  // Check if page predominantly uses Indian Rupees or USD
  const hasInrSignals =
    text.includes("₹") ||
    textLower.includes("inr") ||
    textLower.includes("rs.") ||
    textLower.includes("rs ") ||
    textLower.includes("rupee") ||
    textLower.includes("rupees");

  const defaultCurrency = hasInrSignals ? "INR" : "USD";

  // Check for common pricing patterns
  const isFreeTier =
    textLower.includes("free tier") ||
    textLower.includes("free forever") ||
    textLower.includes("start for free") ||
    textLower.includes("$0") ||
    textLower.includes("₹0") ||
    textLower.includes("rs 0") ||
    textLower.includes("rs. 0") ||
    textLower.includes("0€") ||
    textLower.includes("free plan");

  const isContactSales =
    textLower.includes("contact sales") ||
    textLower.includes("talk to sales") ||
    textLower.includes("custom pricing") ||
    textLower.includes("request a quote") ||
    textLower.includes("get a quote") ||
    textLower.includes("enterprise pricing");

  const hasTrial =
    textLower.includes("free trial") ||
    textLower.includes("14-day trial") ||
    textLower.includes("30-day trial") ||
    textLower.includes("start your trial") ||
    textLower.includes("try free");

  let trialDays: number | null = null;
  if (textLower.includes("14-day") || textLower.includes("14 day")) trialDays = 14;
  else if (textLower.includes("30-day") || textLower.includes("30 day")) trialDays = 30;
  else if (textLower.includes("7-day") || textLower.includes("7 day")) trialDays = 7;

  // Search for currency & price matches (e.g. $29, ₹1,499, Rs 999, INR 4999, €49, £19, $9.99)
  const priceRegex =
    /(?:([$€£¥₹]|(?:Rs\.?|INR|USD|EUR|GBP))\s*)(\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?|\d+(?:\.\d{2})?)\s*(?:\/|\s*per\s*)?(mo|month|yr|year|seat|user)?/gi;
  const matches: Array<{ symbol: string; amount: number; cadence?: string; raw: string }> = [];

  let match: RegExpExecArray | null;
  while ((match = priceRegex.exec(text)) !== null) {
    const rawSymbol = match[1] ? match[1].trim() : "";
    const cleanAmountStr = match[2].replace(/,/g, "");
    const amount = parseFloat(cleanAmountStr);
    const cadence = match[3]?.toLowerCase();
    if (!isNaN(amount)) {
      matches.push({ symbol: rawSymbol, amount, cadence, raw: match[0].trim() });
    }
    if (matches.length >= 8) break; // Bounded extraction
  }

  const currencyMap: Record<string, string> = {
    $: "USD",
    "€": "EUR",
    "£": "GBP",
    "¥": "JPY",
    "₹": "INR",
    inr: "INR",
    rs: "INR",
    "rs.": "INR",
    usd: "USD",
    eur: "EUR",
    gbp: "GBP",
  };

  // 1. If free tier detected, add Free plan
  if (isFreeTier) {
    plans.push({
      name: "Free",
      band: "FREE",
      amount: 0,
      currency: defaultCurrency,
      interval: "MONTHLY",
      seatModel: "free",
      usageLimits: [],
      includedFeatures: ["Core platform access"],
      addOns: [],
      availability: "free",
      sourceUrl: params.sourceUrl,
      rawPriceString: defaultCurrency === "INR" ? "₹0 / free" : "$0 / free",
      excerpt: `Free plan detected on ${params.sourceUrl}`,
      confidence: 70,
    });
  }

  // 2. Add plans from regex matches
  const seenAmounts = new Set<number>();
  let planIndex = 1;

  for (const m of matches) {
    if (seenAmounts.has(m.amount)) continue;
    seenAmounts.add(m.amount);

    if (m.amount === 0) continue; // already handled free

    const interval: BillingInterval =
      m.cadence === "yr" || m.cadence === "year" ? "YEARLY" : "MONTHLY";
    const lookupKey = m.symbol.toLowerCase();
    const currency = currencyMap[m.symbol] || currencyMap[lookupKey] || defaultCurrency;

    // Thresholds: For INR, enterprise is typically > ₹10,000, for USD > $100
    const enterpriseThreshold = currency === "INR" ? 10000 : 100;
    const band: PlanBand = m.amount >= enterpriseThreshold ? "ENTERPRISE" : "GROWTH";
    const planName =
      m.amount >= enterpriseThreshold
        ? `Tier ${planIndex} (Pro/Enterprise)`
        : `Tier ${planIndex} (Starter/Growth)`;

    plans.push({
      name: planName,
      band,
      amount: m.amount,
      currency,
      interval,
      seatModel: m.cadence === "seat" || m.cadence === "user" ? "per seat" : "per user/month",
      usageLimits: [],
      includedFeatures: [],
      addOns: [],
      availability: "published",
      sourceUrl: params.sourceUrl,
      rawPriceString: m.raw,
      excerpt: `Discovered price token "${m.raw}" on ${params.sourceUrl}`,
      confidence: 60,
    });
    planIndex++;
  }

  // 3. If contact sales detected, add Enterprise Custom plan
  if (isContactSales || plans.length === 0) {
    plans.push({
      name: "Enterprise",
      band: "CUSTOM",
      amount: null,
      currency: defaultCurrency,
      interval: "MONTHLY",
      seatModel: "custom quote",
      usageLimits: [],
      includedFeatures: ["Dedicated support", "Custom enterprise contract"],
      addOns: [],
      availability: "contact-sales",
      sourceUrl: params.sourceUrl,
      rawPriceString: "Contact Sales / Custom Quote",
      excerpt: `Custom enterprise quote / Contact sales option detected on ${params.sourceUrl}`,
      confidence: 75,
    });
  }

  let availabilitySummary:
    "published" | "contact-sales" | "free-only" | "trial-only" | "not-published" | "inaccessible" =
    "published";
  if (plans.every((p) => p.availability === "contact-sales")) {
    availabilitySummary = "contact-sales";
  } else if (plans.every((p) => p.availability === "free")) {
    availabilitySummary = "free-only";
  }

  return {
    plans,
    availabilitySummary,
    pricingModelType: plans.some((p) => p.amount !== null)
      ? "Tiered Subscription"
      : "Enterprise Quote / Contact Sales",
    trialAvailable: hasTrial,
    trialDays,
    notes: `Deterministic pricing extraction from ${params.sourceUrl} (${matches.length} price tokens detected, currency: ${defaultCurrency}).`,
  };
}

export function discoverPricingUrls(params: {
  homepageUrl: string;
  homepageHtml?: string;
}): string[] {
  const discovered = new Set<string>();
  const base = new URL(params.homepageUrl);
  const hostname = base.hostname.toLowerCase().replace(/^www\./, "");

  // 1. Scan anchor tags in homepage HTML
  if (params.homepageHtml) {
    try {
      const $ = cheerio.load(params.homepageHtml);
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().toLowerCase().trim();
        if (!href) return;

        try {
          const resolved = new URL(href, params.homepageUrl);
          const resolvedHost = resolved.hostname.toLowerCase().replace(/^www\./, "");

          // Same root domain or pricing subdomain
          if (resolvedHost === hostname || resolvedHost === `pricing.${hostname}`) {
            const pathLower = resolved.pathname.toLowerCase();
            const isPricingMatch =
              pathLower.includes("/pricing") ||
              pathLower.includes("/plans") ||
              pathLower.includes("/tarifs") ||
              pathLower.includes("/preise") ||
              pathLower.includes("/subscription") ||
              text.includes("pricing") ||
              text.includes("plans") ||
              text === "tarifs" ||
              text === "preise";

            if (isPricingMatch) {
              // Strip trailing slash and hash for deduplication
              discovered.add(resolved.href.split("#")[0]);
            }
          }
        } catch {
          // Ignore invalid URLs
        }
      });
    } catch {
      // Ignore parsing errors
    }
  }

  // 2. Add common standard pricing path fallbacks
  const origin = base.origin;
  const standardPaths = ["/pricing", "/pricing/", "/plans", "/pricing-plans"];
  for (const p of standardPaths) {
    discovered.add(`${origin}${p}`);
  }

  return Array.from(discovered);
}

export async function runPricingAgent(
  runId: string,
  targetId: string,
  _inputArtifact?: unknown,
): Promise<PricingStageOutput> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error(`Target ${targetId} not found`);

  // Load active verified competitors from Verifier stage
  const competitors = await prisma.competitor.findMany({
    where: { runId, status: "ACTIVE" },
    orderBy: { confidence: "desc" },
  });

  if (competitors.length === 0) {
    const emptyOutput: PricingStageOutput = {
      targetId,
      competitorsEvaluated: 0,
      pricingPagesFound: 0,
      pricingPagesRead: 0,
      plansExtracted: 0,
      unavailablePricingCount: 0,
      competitorsDirectWithPricing: 0,
    };
    return emptyOutput;
  }

  const reader = registry.getBrowserReader();
  const llm = registry.getLlmProvider();

  let pricingPagesFoundCount = 0;
  let pricingPagesReadCount = 0;
  let totalPlansExtracted = 0;
  let unavailablePricingCount = 0;
  let directWithPricingCount = 0;

  // Process competitors in small concurrent batches
  const concurrency = 3;
  for (let i = 0; i < competitors.length; i += concurrency) {
    const batch = competitors.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async (comp) => {
        // Step 1: Discover pricing candidate URLs
        let homepageHtml = "";
        let homepageText = "";

        // Read competitor homepage first if needed to discover links
        try {
          const homeResult = await reader.read({ url: comp.url, mode: "auto", fresh: false });
          homepageHtml = homeResult.html || "";
          homepageText = homeResult.text || "";
        } catch (err) {
          console.warn(`[Pricing Agent] Could not read competitor homepage ${comp.url}:`, err);
        }

        const candidateUrls = discoverPricingUrls({
          homepageUrl: comp.url,
          homepageHtml,
        });

        // Bounded attempts: try up to 3 candidate pricing URLs
        let selectedPricingPage: {
          url: string;
          canonicalUrl: string;
          text: string;
          html?: string;
          contentHash: string;
          snapshotKey?: string;
        } | null = null;

        for (const candUrl of candidateUrls.slice(0, 3)) {
          try {
            const pageResult = await reader.read({ url: candUrl, mode: "auto", fresh: false });
            if (pageResult.text && pageResult.text.length > 100) {
              const textLower = pageResult.text.toLowerCase();
              const hasPricingSignals =
                textLower.includes("pricing") ||
                textLower.includes("plan") ||
                textLower.includes("$") ||
                textLower.includes("€") ||
                textLower.includes("£") ||
                textLower.includes("month") ||
                textLower.includes("year") ||
                textLower.includes("contact sales") ||
                textLower.includes("free");

              if (hasPricingSignals) {
                selectedPricingPage = {
                  url: candUrl,
                  canonicalUrl: pageResult.canonicalUrl,
                  text: pageResult.text,
                  html: pageResult.html,
                  contentHash: pageResult.contentHash,
                  snapshotKey: pageResult.snapshotKey,
                };
                pricingPagesFoundCount++;
                pricingPagesReadCount++;
                break;
              }
            }
          } catch {
            // Try next candidate
          }
        }

        // If no dedicated pricing page found, check if homepage contains pricing info
        if (!selectedPricingPage && homepageText.length > 200) {
          const homeLower = homepageText.toLowerCase();
          if (
            homeLower.includes("pricing") ||
            homeLower.includes("/mo") ||
            homeLower.includes("$") ||
            homeLower.includes("€") ||
            homeLower.includes("free tier") ||
            homeLower.includes("contact sales")
          ) {
            selectedPricingPage = {
              url: comp.url,
              canonicalUrl: comp.url,
              text: homepageText,
              html: homepageHtml,
              contentHash: crypto.createHash("sha256").update(homepageText).digest("hex"),
            };
            pricingPagesReadCount++;
          }
        }

        // Step 2: Extract pricing structure
        if (!selectedPricingPage) {
          // Record unavailable pricing evidence
          unavailablePricingCount++;
          await prisma.$transaction(async (tx) => {
            await tx.evidence.create({
              data: {
                runId,
                claimType: "COMPETITOR",
                claimId: comp.id,
                url: comp.url,
                canonicalUrl: comp.url,
                excerpt: `No public pricing page or published plan offers discovered after checking paths: ${candidateUrls.slice(0, 3).join(", ")}.`,
                contentHash: crypto.createHash("sha256").update(comp.url).digest("hex"),
                trustTier: "HIGH",
              },
            });
          });
          return;
        }

        const sourceUrl = selectedPricingPage.canonicalUrl || selectedPricingPage.url;
        const boundedText = selectedPricingPage.text.substring(0, 25000);

        const prompt = `Analyze the scraped pricing page content for competitor "${comp.name}" (${sourceUrl}) and extract all published plans, tiers, and pricing structures.

COMPETITOR DETAILS:
- Name: ${comp.name}
- Canonical Domain: ${comp.canonicalDomain}
- URL: ${sourceUrl}
- Competitor Type: ${comp.type}

PRICING PAGE CONTENT:
${boundedText}

Extract all plans into structured JSON adhering to the CompetitorPricingExtraction schema.`;

        const fallback = computeDeterministicPricingFallback({
          pageText: selectedPricingPage.text,
          pageHtml: selectedPricingPage.html,
          sourceUrl,
          competitorName: comp.name,
        });

        let extraction: CompetitorPricingExtraction;
        try {
          const res = await llm.generateStructured({
            prompt,
            schema: CompetitorPricingExtractionSchema,
            schemaName: "CompetitorPricingExtraction",
            schemaDescription: "Structured pricing extraction for competitor",
            system: PRICING_SYSTEM_PROMPT,
            fallback,
          });
          extraction = res.data as CompetitorPricingExtraction;
        } catch (err) {
          if (err instanceof ZodError) {
            const repairPrompt = `Your previous CompetitorPricingExtraction failed schema validation:\n${err.message}\n\nPlease fix the errors, ensure all required fields (name, band, interval, availability, excerpt, sourceUrl) are valid, and output valid JSON:\n${prompt}`;
            try {
              const repairRes = await llm.generateStructured({
                prompt: repairPrompt,
                schema: CompetitorPricingExtractionSchema,
                schemaName: "CompetitorPricingExtraction",
                system: PRICING_SYSTEM_PROMPT,
                fallback,
              });
              extraction = repairRes.data as CompetitorPricingExtraction;
            } catch {
              extraction = fallback;
            }
          } else {
            extraction = fallback;
          }
        }

        // Step 3: Transactional persistence
        await prisma.$transaction(async (tx) => {
          // Delete existing pricing plans for this competitor in this run
          const existingPlans = await tx.pricingPlan.findMany({
            where: { competitorId: comp.id },
            select: { id: true },
          });
          const existingPlanIds = existingPlans.map((p) => p.id);

          if (existingPlanIds.length > 0) {
            await tx.evidence.deleteMany({
              where: {
                runId,
                claimType: "PRICING_PLAN",
                claimId: { in: existingPlanIds },
              },
            });
            await tx.pricingPlan.deleteMany({
              where: { competitorId: comp.id },
            });
          }

          // Insert extracted plans
          for (const plan of extraction.plans) {
            // Map plan band to Prisma enum
            const band: PlanBand =
              plan.band === "FREE" ||
              plan.band === "GROWTH" ||
              plan.band === "ENTERPRISE" ||
              plan.band === "CUSTOM"
                ? plan.band
                : "CUSTOM";

            // Map interval to Prisma enum
            const interval: BillingInterval =
              plan.interval === "YEARLY" || plan.interval === "ONE_TIME"
                ? plan.interval
                : "MONTHLY";

            const planRecord = await tx.pricingPlan.create({
              data: {
                competitorId: comp.id,
                name: plan.name,
                band,
                amount: plan.amount !== null ? plan.amount : null,
                currency: plan.currency || "USD",
                interval,
                limits: plan.usageLimits.length > 0 ? plan.usageLimits : undefined,
                includedFeatures:
                  plan.includedFeatures.length > 0 ? plan.includedFeatures : undefined,
                confidence: plan.confidence || 80,
              },
            });

            // Write evidence for this plan
            const planExcerpt =
              plan.excerpt ||
              `Extracted plan "${plan.name}" (${plan.amount !== null ? `${plan.currency} ${plan.amount}` : "Custom quote"} / ${interval}) from ${plan.sourceUrl}.`;

            await tx.evidence.create({
              data: {
                runId,
                claimType: "PRICING_PLAN",
                claimId: planRecord.id,
                url: plan.sourceUrl,
                canonicalUrl: plan.sourceUrl,
                excerpt: planExcerpt,
                contentHash:
                  selectedPricingPage?.contentHash ||
                  crypto.createHash("sha256").update(planExcerpt).digest("hex"),
                snapshotKey: selectedPricingPage?.snapshotKey,
                trustTier: "HIGH",
              },
            });

            totalPlansExtracted++;
          }

          // If no plans were extracted, create a no-pricing evidence row
          if (extraction.plans.length === 0) {
            unavailablePricingCount++;
            await tx.evidence.create({
              data: {
                runId,
                claimType: "COMPETITOR",
                claimId: comp.id,
                url: sourceUrl,
                canonicalUrl: sourceUrl,
                excerpt: `Competitor page at ${sourceUrl} does not contain published pricing plans. Notes: ${extraction.notes || "No pricing tiers detected."}`,
                contentHash:
                  selectedPricingPage.contentHash ||
                  crypto.createHash("sha256").update(sourceUrl).digest("hex"),
                snapshotKey: selectedPricingPage.snapshotKey,
                trustTier: "HIGH",
              },
            });
          } else if (comp.type === "DIRECT") {
            directWithPricingCount++;
          }
        });
      }),
    );
  }

  const output: PricingStageOutput = {
    targetId,
    competitorsEvaluated: competitors.length,
    pricingPagesFound: pricingPagesFoundCount,
    pricingPagesRead: pricingPagesReadCount,
    plansExtracted: totalPlansExtracted,
    unavailablePricingCount,
    competitorsDirectWithPricing: directWithPricingCount,
  };

  await publishRunEvent(runId, {
    type: "STAGE_SUMMARY",
    runId,
    targetId,
    stageKey: "PRICING",
    stageStatus: "COMPLETED",
    timestamp: new Date().toISOString(),
    summary: `Extracted ${totalPlansExtracted} pricing plans across ${competitors.length} competitors (${pricingPagesReadCount} pages read, ${unavailablePricingCount} unavailable/contact-sales).`,
    payload: output,
  });

  return output;
}
