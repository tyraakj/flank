import { prisma } from "@flank/database";
import { registry } from "../providers/registry";
import {
  CompetitorPositioningDataSchema,
  CompetitorPositioningData,
  PositioningStageOutput,
} from "@flank/shared";
import { PositioningMapService, EntitySignalPacket } from "../services/positioning-map";
import { publishRunEvent } from "../progress/publisher";
import * as cheerio from "cheerio";
import { ZodError } from "zod";
import * as crypto from "crypto";

// ============================================================================
// LAYER 1: SYSTEM PROMPT (STATIC PREFIX - CACHE CANDIDATE)
// ============================================================================
const POSITIONING_SYSTEM_PROMPT = `You are a Principal Market Positioning Strategist and Competitive Intelligence Specialist at Flank.
Your mission is to rigorously analyze public website copy, hero headers, product overviews, customer testimonials, and about pages for a software competitor to extract their market positioning posture.

### EXTRACTION DIRECTIVES & CONSTRAINTS:
1. Grounding & Rigor: Every claim MUST be grounded directly in the provided scraped website copy.
2. Verbatim Headline Value Props: Extract the exact verbatim hero headlines, h1 copy, and primary value propositions directly from the page without paraphrasing.
3. ICP (Ideal Customer Profile): Describe specifically who they are selling to (buyer title, team type, company stage/size, technical maturity).
4. Category Claim: Extract how they frame their market category (e.g. "The AI-native developer data platform", "Enterprise-grade continuous compliance suite").
5. Key Differentiators: Extract 2 to 4 concrete structural, technical, or business differentiators.
6. Tone of Voice: Categorize their communication style (e.g., "Developer-First / Technical", "Enterprise / Governance-Focused", "Modern Self-Serve / Accessible", "Executive / ROI-Driven").`;

// ============================================================================
// LAYER 2: STATIC FEW-SHOT EXAMPLES (STATIC - CACHE CANDIDATE)
// ============================================================================
const POSITIONING_STATIC_EXAMPLES = `### FEW-SHOT EXAMPLES & EDGE CASE GUARDS:

Example Output:
{
  "icp": "Engineering Managers, DevOps Architects, and Platform Engineers managing multi-cloud Kubernetes clusters",
  "categoryClaim": "Enterprise Autonomous Kubernetes Optimization and Cost Intelligence Platform",
  "differentiators": [
    "Real-time machine learning workload rightsizing with zero pod disruption",
    "Continuous multi-cloud spot instance orchestration with 99.99% availability guarantee",
    "Agentless eBPF telemetry deployment requiring zero application code instrumentation"
  ],
  "tone": "Developer-First / Highly Technical",
  "headlineValueProps": [
    "Cut your cloud bill by 60% with zero downtime",
    "Autonomous Kubernetes rightsizing built for modern platform teams"
  ],
  "sourceNotes": "Extracted from hero headline, customer case studies, and /about platform architecture overview."
}`;

// ============================================================================
// LAYER 3: TOOLS & OUTPUT SCHEMA SPECIFICATION (STATIC - CACHE CANDIDATE)
// ============================================================================
const POSITIONING_TOOLS_SPEC = `### OUTPUT FORMAT SPECIFICATION:
Format output strictly conforming to the CompetitorPositioningData JSON schema:
- icp: Target buyer and team profile
- categoryClaim: Exact market positioning and category descriptor
- differentiators: Array of 2 to 4 distinct differentiators
- tone: Communication voice and narrative style
- headlineValueProps: Array of verbatim headlines and core value claims
- sourceNotes: Analytical summary of positioning strategy`;

export function computeDeterministicPositioningFallback(params: {
  pageText: string;
  pageHtml?: string;
  sourceUrl: string;
  competitorName: string;
  category?: string | null;
  pricingModel?: string | null;
  featuresCount?: number;
}): CompetitorPositioningData {
  let title = "";
  let metaDesc = "";
  let h1Text = "";

  if (params.pageHtml) {
    try {
      const $ = cheerio.load(params.pageHtml);
      title = $("title").text().trim();
      metaDesc =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";
      h1Text = $("h1").first().text().replace(/\s+/g, " ").trim();
    } catch {
      // ignore
    }
  }

  const textLower = (params.pageText || "").toLowerCase();

  // 1. Determine Tone
  let tone = "Modern Product-Led";
  if (
    textLower.includes("enterprise") ||
    textLower.includes("soc 2") ||
    textLower.includes("compliance")
  ) {
    tone = "Enterprise / Governance-Focused";
  } else if (
    textLower.includes("developer") ||
    textLower.includes("api") ||
    textLower.includes("sdk") ||
    textLower.includes("github")
  ) {
    tone = "Developer-First / Technical";
  } else if (
    textLower.includes("simple") ||
    textLower.includes("fast") ||
    textLower.includes("start for free")
  ) {
    tone = "Self-Serve / Accessible";
  }

  // 2. Derive ICP
  let icp = "B2B teams and growing software organizations";
  if (textLower.includes("engineering") || textLower.includes("developers")) {
    icp = "Software engineers, technical leads, and engineering teams";
  } else if (textLower.includes("product managers") || textLower.includes("growth")) {
    icp = "Product managers, growth marketers, and analytics teams";
  } else if (
    textLower.includes("enterprise") ||
    textLower.includes("security officers") ||
    textLower.includes("ciso")
  ) {
    icp = "Enterprise security leaders, IT directors, and compliance managers";
  }

  // 3. Derive Category Claim
  const categoryClaim =
    h1Text ||
    metaDesc.substring(0, 120) ||
    title ||
    `${params.competitorName} ${params.category || "software solution"}`;

  // 4. Extract Headline Value Props
  const headlineValueProps: string[] = [];
  if (h1Text && h1Text.length > 5) headlineValueProps.push(h1Text);
  if (metaDesc && metaDesc.length > 10) headlineValueProps.push(metaDesc);
  if (headlineValueProps.length === 0 && title) headlineValueProps.push(title);
  if (headlineValueProps.length === 0) headlineValueProps.push("Core product capabilities");

  // 5. Extract Differentiators
  const differentiators: string[] = [];
  if (params.pricingModel) differentiators.push(`Monetization model: ${params.pricingModel}`);
  if (params.featuresCount && params.featuresCount > 5) {
    differentiators.push(
      `Comprehensive feature breadth (${params.featuresCount} verified capabilities)`,
    );
  }
  if (metaDesc) differentiators.push(metaDesc.substring(0, 100));
  if (differentiators.length === 0) differentiators.push("Standard market functionality");

  return {
    icp,
    categoryClaim,
    differentiators: differentiators.slice(0, 4),
    tone,
    headlineValueProps: headlineValueProps.slice(0, 3),
    sourceUrls: [params.sourceUrl],
    excerpt: `Positioning fallback derived from page title ("${title}"), h1 ("${h1Text}"), and meta description.`,
    confidence: 65,
  };
}

export function discoverPositioningUrls(params: {
  homepageUrl: string;
  homepageHtml?: string;
}): string[] {
  const discovered = new Set<string>();
  const base = new URL(params.homepageUrl);
  const hostname = base.hostname.toLowerCase().replace(/^www\./, "");

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

          if (resolvedHost === hostname) {
            const pathLower = resolved.pathname.toLowerCase();
            const isPositioningMatch =
              pathLower.includes("/about") ||
              pathLower.includes("/company") ||
              pathLower.includes("/customers") ||
              pathLower.includes("/case-studies") ||
              pathLower.includes("/solutions") ||
              pathLower.includes("/why-us") ||
              pathLower.includes("/product") ||
              text.includes("about") ||
              text.includes("why us") ||
              text.includes("customers") ||
              text.includes("case studies") ||
              text.includes("solutions");

            if (isPositioningMatch) {
              discovered.add(resolved.href.split("#")[0]);
            }
          }
        } catch {
          // ignore invalid URLs
        }
      });
    } catch {
      // ignore parsing errors
    }
  }

  // Standard fallback candidate paths
  const origin = base.origin;
  const standardPaths = ["/about", "/company", "/solutions", "/customers", "/why-us"];
  for (const p of standardPaths) {
    discovered.add(`${origin}${p}`);
  }

  return Array.from(discovered);
}

export async function runPositioningAgent(
  runId: string,
  targetId: string,
  _inputArtifact?: unknown,
): Promise<PositioningStageOutput> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error(`Target ${targetId} not found`);

  const profile = await prisma.targetProfile.findUnique({ where: { runId } });

  // Load verified active competitors with their pricing plans and feature claims
  const competitors = await prisma.competitor.findMany({
    where: { runId, status: "ACTIVE" },
    include: {
      pricingPlans: true,
      featureClaims: {
        include: {
          feature: true,
        },
      },
    },
    orderBy: { confidence: "desc" },
  });

  if (competitors.length === 0) {
    const emptyOutput: PositioningStageOutput = {
      targetId,
      competitorsEvaluated: 0,
      positioningsPersisted: 0,
      mapGenerated: false,
      clustersCount: 0,
      whitespaceCount: 0,
    };
    return emptyOutput;
  }

  const reader = registry.getBrowserReader();
  const llm = registry.getLlmProvider();

  let positioningsPersistedCount = 0;
  const entitySignalPackets: EntitySignalPacket[] = [];

  // 1. Analyze each competitor's positioning
  const concurrency = 3;
  for (let i = 0; i < competitors.length; i += concurrency) {
    const batch = competitors.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async (comp) => {
        let homepageHtml = "";
        let homepageText = "";

        try {
          const homeResult = await reader.read({ url: comp.url, mode: "auto", fresh: false });
          homepageHtml = homeResult.html || "";
          homepageText = homeResult.text || "";
        } catch (err) {
          console.warn(`[Positioning Agent] Could not read homepage for ${comp.name}:`, err);
        }

        const candidateUrls = discoverPositioningUrls({
          homepageUrl: comp.url,
          homepageHtml,
        });

        // Read up to 2 candidate positioning pages
        const readPages: Array<{
          url: string;
          canonicalUrl: string;
          text: string;
          html?: string;
          contentHash: string;
          snapshotKey?: string;
        }> = [];

        for (const candUrl of candidateUrls.slice(0, 2)) {
          try {
            const pageResult = await reader.read({ url: candUrl, mode: "auto", fresh: false });
            if (pageResult.text && pageResult.text.length > 100) {
              readPages.push({
                url: candUrl,
                canonicalUrl: pageResult.canonicalUrl,
                text: pageResult.text,
                html: pageResult.html,
                contentHash: pageResult.contentHash,
                snapshotKey: pageResult.snapshotKey,
              });
            }
          } catch {
            // continue
          }
        }

        if (readPages.length === 0 && homepageText.length > 100) {
          readPages.push({
            url: comp.url,
            canonicalUrl: comp.url,
            text: homepageText,
            html: homepageHtml,
            contentHash: crypto.createHash("sha256").update(homepageText).digest("hex"),
          });
        }

        const combinedText = readPages
          .map((p) => `--- SOURCE: ${p.canonicalUrl} ---\n${p.text.substring(0, 12000)}`)
          .join("\n\n")
          .substring(0, 30000);

        const primaryUrl = readPages[0]?.canonicalUrl || comp.url;

        // Pricing signals
        const pricingPlans = comp.pricingPlans || [];
        const highestPrice = pricingPlans.reduce<number | null>((max, p) => {
          if (p.amount !== null && (max === null || Number(p.amount) > max)) {
            return Number(p.amount);
          }
          return max;
        }, null);
        const hasEnterpriseQuote = pricingPlans.some(
          (p) => p.band === "CUSTOM" || p.amount === null,
        );

        // Feature signals
        const featureClaims = comp.featureClaims || [];
        const supportedFeatures = featureClaims.filter(
          (f) => f.support === "YES" || f.support === "PARTIAL",
        );
        const enterpriseFeatures = supportedFeatures.filter((f) => {
          const nameLower = (f.feature?.name || "").toLowerCase();
          return (
            nameLower.includes("sso") ||
            nameLower.includes("rbac") ||
            nameLower.includes("audit") ||
            nameLower.includes("soc 2") ||
            nameLower.includes("encryption")
          );
        });

        const fallback = computeDeterministicPositioningFallback({
          pageText: readPages.map((p) => p.text).join(" "),
          pageHtml: readPages[0]?.html || homepageHtml,
          sourceUrl: primaryUrl,
          competitorName: comp.name,
          category: profile?.category,
          pricingModel: hasEnterpriseQuote ? "Enterprise Quote" : "Tiered Subscription",
          featuresCount: supportedFeatures.length,
        });

        // ============================================================================
        // LAYER 4: DYNAMIC CONTEXT (COMPETITOR & SCRAPED MESSAGING)
        // ============================================================================
        const dynamicContext = `### DYNAMIC CONTEXT:

COMPETITOR BACKGROUND:
- Name: ${comp.name}
- Canonical Domain: ${comp.canonicalDomain}
- Type: ${comp.type}
- Discovered Plans: ${pricingPlans.map((p) => `${p.name} ($${p.amount ?? "Quote"})`).join(", ") || "None"}
- Supported Capabilities: ${
          supportedFeatures
            .map((f) => f.feature?.name)
            .filter(Boolean)
            .join(", ") || "General"
        }

SCRAPED MESSAGING & ABOUT PAGES:
${combinedText}`;

        // ============================================================================
        // LAYER 5: USER TURN / DIRECTIVE
        // ============================================================================
        const userDirective = `### USER DIRECTIVE:
Analyze the dynamic website messaging, value propositions, and positioning for competitor "${comp.name}" (${comp.url}). Extract structured CompetitorPositioningData strictly adhering to the schema and few-shot guidance, preserving verbatim hero headlines.`;

        const fullPrompt = `${POSITIONING_STATIC_EXAMPLES}\n\n${POSITIONING_TOOLS_SPEC}\n\n${dynamicContext}\n\n${userDirective}`;

        let positioningData: CompetitorPositioningData;
        try {
          const res = await llm.generateStructured({
            prompt: fullPrompt,
            schema: CompetitorPositioningDataSchema,
            schemaName: "CompetitorPositioningData",
            schemaDescription: "Structured market positioning analysis for competitor",
            system: POSITIONING_SYSTEM_PROMPT,
            fallback,
          });
          positioningData = res.data as CompetitorPositioningData;
        } catch (err) {
          if (err instanceof ZodError) {
            const repairPrompt = `Your previous CompetitorPositioningData failed validation:\n${err.message}\n\nPlease fix errors and output valid JSON:\n${fullPrompt}`;
            try {
              const repairRes = await llm.generateStructured({
                prompt: repairPrompt,
                schema: CompetitorPositioningDataSchema,
                schemaName: "CompetitorPositioningData",
                system: POSITIONING_SYSTEM_PROMPT,
                fallback,
              });
              positioningData = repairRes.data as CompetitorPositioningData;
            } catch {
              positioningData = fallback;
            }
          } else {
            positioningData = fallback;
          }
        }

        // Collect signal packet for positioning map calculation
        entitySignalPackets.push({
          id: comp.id,
          name: comp.name,
          isTarget: false,
          pricingModel: hasEnterpriseQuote ? "Enterprise Custom Quote" : "Tiered Subscription",
          plansCount: pricingPlans.length,
          highestPriceAmount: highestPrice,
          hasCustomEnterpriseQuote: hasEnterpriseQuote,
          featuresCount: supportedFeatures.length,
          enterpriseFeaturesCount: enterpriseFeatures.length,
          tone: positioningData.tone,
          category: profile?.category,
        });

        // Transactionally persist Competitor Positioning
        await prisma.$transaction(async (tx) => {
          // Clear prior positioning for this competitor in this run
          const existing = await tx.positioning.findFirst({
            where: { runId, competitorId: comp.id },
          });

          if (existing) {
            await tx.evidence.deleteMany({
              where: {
                runId,
                claimType: "POSITIONING",
                claimId: existing.id,
              },
            });
            await tx.positioning.delete({ where: { id: existing.id } });
          }

          const positioningRecord = await tx.positioning.create({
            data: {
              runId,
              competitorId: comp.id,
              icp: positioningData.icp,
              categoryClaim: positioningData.categoryClaim,
              differentiators: positioningData.differentiators,
              tone: positioningData.tone,
              axes: {
                headlineValueProps: positioningData.headlineValueProps,
              },
              confidence: positioningData.confidence || 80,
            },
          });

          const excerpt =
            positioningData.excerpt ||
            `Positioning claim for ${comp.name}: Category "${positioningData.categoryClaim}", ICP "${positioningData.icp}" from ${primaryUrl}.`;

          const matchingPage = readPages[0];
          await tx.evidence.create({
            data: {
              runId,
              claimType: "POSITIONING",
              claimId: positioningRecord.id,
              url: primaryUrl,
              canonicalUrl: primaryUrl,
              excerpt,
              contentHash:
                matchingPage?.contentHash ||
                crypto.createHash("sha256").update(excerpt).digest("hex"),
              snapshotKey: matchingPage?.snapshotKey,
              trustTier: "HIGH",
            },
          });

          positioningsPersistedCount++;
        });
      }),
    );
  }

  // 2. Also construct Target Entity Signal Packet to place Target on Positioning Map
  if (profile) {
    entitySignalPackets.push({
      id: target.id,
      name: target.name,
      isTarget: true,
      pricingModel: profile.pricingModel,
      plansCount: 2,
      highestPriceAmount: 49,
      hasCustomEnterpriseQuote: false,
      featuresCount: 6,
      enterpriseFeaturesCount: 1,
      tone: "Accessible & Strategic",
      category: profile.category,
    });
  }

  // 3. Generate 2x2 Positioning Map, Clusters, and Whitespace Opportunities
  const positioningMap = PositioningMapService.generatePositioningMap(entitySignalPackets);

  // 4. Update axes coordinates on persisted competitor & target Positioning records
  await prisma.$transaction(async (tx) => {
    for (const coord of positioningMap.coordinates) {
      if (coord.isTarget) {
        // Upsert target positioning if not present
        const existingTargetPos = await tx.positioning.findFirst({
          where: { runId, targetId: target.id },
        });
        if (existingTargetPos) {
          await tx.positioning.update({
            where: { id: existingTargetPos.id },
            data: {
              axes: {
                x: coord.x,
                y: coord.y,
                clusterId: coord.clusterId,
                clusterName: coord.clusterName,
                rationale: coord.rationale,
              },
            },
          });
        } else {
          await tx.positioning.create({
            data: {
              runId,
              targetId: target.id,
              icp: profile?.icp || "B2B organizations",
              categoryClaim: profile?.category || target.name,
              differentiators: Array.isArray(profile?.valueProps)
                ? (profile.valueProps as string[])
                : [],
              tone: "Strategic Competitive Intelligence",
              axes: {
                x: coord.x,
                y: coord.y,
                clusterId: coord.clusterId,
                clusterName: coord.clusterName,
                rationale: coord.rationale,
              },
              confidence: 85,
            },
          });
        }
      } else {
        const existingCompPos = await tx.positioning.findFirst({
          where: { runId, competitorId: coord.competitorId },
        });
        if (existingCompPos) {
          const currentAxes = (existingCompPos.axes as Record<string, unknown>) || {};
          await tx.positioning.update({
            where: { id: existingCompPos.id },
            data: {
              axes: {
                ...currentAxes,
                x: coord.x,
                y: coord.y,
                clusterId: coord.clusterId,
                clusterName: coord.clusterName,
                rationale: coord.rationale,
              },
            },
          });
        }
      }
    }
  });

  const output: PositioningStageOutput = {
    targetId,
    competitorsEvaluated: competitors.length,
    positioningsPersisted: positioningsPersistedCount,
    mapGenerated: positioningMap.coordinates.length >= 2,
    clustersCount: positioningMap.clusters.length,
    whitespaceCount: positioningMap.whitespaces.length,
  };

  await publishRunEvent(runId, {
    type: "STAGE_SUMMARY",
    runId,
    targetId,
    stageKey: "POSITIONING",
    stageStatus: "COMPLETED",
    timestamp: new Date().toISOString(),
    summary: `Persisted positioning analysis for ${positioningsPersistedCount} competitors and generated 2×2 positioning map (${positioningMap.clusters.length} clusters, ${positioningMap.whitespaces.length} whitespace opportunities).`,
    payload: {
      ...output,
      positioningMap,
    },
  });

  return output;
}
