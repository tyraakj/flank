import { prisma } from "@flank/database";
import { registry } from "../providers/registry";
import {
  StrategistExtractionSchema,
  StrategistExtraction,
  OpportunityItem,
  OpportunityStageOutput,
} from "@flank/shared";
import { OpportunityRankingService } from "../services/opportunity-ranking";
import { publishRunEvent } from "../progress/publisher";
import { ZodError } from "zod";
import * as crypto from "crypto";

const STRATEGIST_SYSTEM_PROMPT = `You are a Principal Product Strategist and Market Positioning Analyst at Flank.
Your mission is to synthesize all verified competitive intelligence (features, pricing, positioning, messaging, and market whitespace) to formulate high-leverage, defensible strategic opportunities for the target product.

### STRATEGIC DIMENSIONS:
- PRODUCT: Feature gaps, missing standard capabilities, or disruptive product workflows.
- PRICING: Transparent self-serve disruption, packaging moves, free-tier wedges, or usage-based pricing advantage.
- POSITIONING: Category reframing, exploiting competitor messaging bloat, or owning an underserved customer persona (ICP).
- MARKETING: Wedge distribution tactics, migration campaigns, or transparent comparison narratives.

### CONSTRAINTS & EVIDENCE INVARIANTS:
1. Every opportunity MUST name specific supporting competitors (who set the standard or exhibit the gap) and absent competitors (who fail to deliver it).
2. Ground all claims in real verified competitor findings; do not hallucinate market trends or customer sentiment.
3. Score impact (1-5), effort (1-5), and defensibility (1-5) realistically.
4. Craft an audience-facing 'whatToSay' positioning copy line for each recommendation.`;

export function computeDeterministicStrategyFallback(params: {
  targetName: string;
  category?: string | null;
  competitors: Array<{
    id: string;
    name: string;
    pricingPlans: Array<{ name: string; amount: unknown; band?: string | null }>;
    featureClaims: Array<{ featureName: string; support: string }>;
    positioning?: {
      icp?: string | null;
      categoryClaim?: string | null;
      tone?: string | null;
    } | null;
  }>;
}): StrategistExtraction {
  const opportunities: OpportunityItem[] = [];

  const verifiedCompetitorIds = params.competitors.map((c) => c.id);

  // 1. Pricing Transparency Gap
  const enterpriseQuoteComps = params.competitors.filter((c) =>
    c.pricingPlans.some((p) => p.band === "CUSTOM" || p.amount === null),
  );

  if (enterpriseQuoteComps.length > 0) {
    opportunities.push({
      kind: "PRICING",
      gap: "Opaque Enterprise Custom Quoting among Market Incumbents",
      supportingCompetitorIds: enterpriseQuoteComps.map((c) => c.id),
      absentCompetitorIds: params.competitors
        .filter((c) => !enterpriseQuoteComps.includes(c))
        .map((c) => c.id),
      suggestedMove:
        "Publish 100% transparent, self-serve tiered pricing with an instant onboarding trial to capture buyers frustrated by multi-week sales cycles.",
      whatToSay:
        "Enterprise power without the enterprise sales friction. Transparent pricing, instant signup, no mandatory demo calls.",
      rationale: `${enterpriseQuoteComps.map((c) => c.name).join(", ")} gate core features behind opaque 'Contact Sales' forms. Offering instant pricing transparency creates a fast self-serve acquisition wedge.`,
      impact: 4,
      effort: 2,
      defensibility: 3,
      evidenceExcerpts: enterpriseQuoteComps.map((c) => `${c.name} requires custom quote pricing.`),
      sourceUrls: [],
      confidence: 85,
    });
  }

  // 2. Security & Compliance Feature Gap
  const ssoComps = params.competitors.filter((c) =>
    c.featureClaims.some(
      (f) =>
        f.featureName.toLowerCase().includes("sso") &&
        (f.support === "YES" || f.support === "PARTIAL"),
    ),
  );

  if (ssoComps.length >= 2) {
    opportunities.push({
      kind: "PRODUCT",
      gap: "Enterprise Identity & SAML Single Sign-On Standards",
      supportingCompetitorIds: ssoComps.map((c) => c.id),
      absentCompetitorIds: params.competitors.filter((c) => !ssoComps.includes(c)).map((c) => c.id),
      suggestedMove:
        "Bundle SAML 2.0 / OIDC SSO into mid-tier growth plans rather than charging a punitive 5x enterprise tax.",
      whatToSay:
        "Security is not a luxury. Single Sign-On and team access control included on all team plans.",
      rationale: `Enterprise competitors (${ssoComps.map((c) => c.name).join(", ")}) treat SSO as an expensive enterprise-only add-on. Democratizing SSO unlocks security-conscious mid-market teams.`,
      impact: 4,
      effort: 3,
      defensibility: 4,
      evidenceExcerpts: ssoComps.map((c) => `${c.name} supports SAML/SSO on enterprise tiers.`),
      sourceUrls: [],
      confidence: 80,
    });
  }

  // 3. Developer / API-First Positioning Wedge
  const apiComps = params.competitors.filter((c) =>
    c.featureClaims.some((f) => f.featureName.toLowerCase().includes("api") && f.support === "YES"),
  );

  opportunities.push({
    kind: "POSITIONING",
    gap: "Developer-First Automated Workflows vs Legacy Manual Interfaces",
    supportingCompetitorIds: apiComps.map((c) => c.id),
    absentCompetitorIds: params.competitors.filter((c) => !apiComps.includes(c)).map((c) => c.id),
    suggestedMove:
      "Position as the modern, programmable API-first alternative with comprehensive CLI, SDKs, and webhook automation.",
    whatToSay: "Built for engineers who automate. Full REST API, webhooks, and CLI out of the box.",
    rationale:
      "Incumbents are burdened by legacy UI-heavy interfaces that require manual clicking. A developer-centric workflow creates viral bottom-up adoption.",
    impact: 4,
    effort: 3,
    defensibility: 3,
    evidenceExcerpts: ["Market demands modern automated programmable workflows."],
    sourceUrls: [],
    confidence: 75,
  });

  // 4. Lightweight Modern Speed Wedge
  opportunities.push({
    kind: "MARKETING",
    gap: "Incumbent Feature Bloat and Slow Time-to-Value",
    supportingCompetitorIds: verifiedCompetitorIds.slice(0, 2),
    absentCompetitorIds: [],
    suggestedMove:
      "Launch migration guides and 1-click import utilities from top competitors, highlighting zero-config instant setup.",
    whatToSay: "Switch from complex legacy platforms in under 5 minutes with zero data loss.",
    rationale:
      "Market leaders have accrued significant feature complexity, leading to long onboarding cycles and user dissatisfaction.",
    impact: 3,
    effort: 2,
    defensibility: 2,
    evidenceExcerpts: ["Users frequently seek lightweight, high-velocity alternatives."],
    sourceUrls: [],
    confidence: 70,
  });

  return {
    opportunities,
    strategicSummary: `Identified ${opportunities.length} high-leverage strategic opportunities across pricing transparency, enterprise democratization, and developer-first positioning for ${params.targetName}.`,
    primaryWedge: "Transparent Self-Serve Pricing and Instant Developer Onboarding",
  };
}

export async function runStrategistAgent(
  runId: string,
  targetId: string,
  _inputArtifact?: unknown,
): Promise<OpportunityStageOutput> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error(`Target ${targetId} not found`);

  const profile = await prisma.targetProfile.findUnique({ where: { runId } });

  // Load verified active competitors with all intelligence artifacts
  const competitors = await prisma.competitor.findMany({
    where: { runId, status: "ACTIVE" },
    include: {
      pricingPlans: true,
      featureClaims: {
        include: {
          feature: true,
        },
      },
      positionings: {
        where: { runId },
      },
    },
    orderBy: { confidence: "desc" },
  });

  if (competitors.length === 0) {
    const emptyOutput: OpportunityStageOutput = {
      targetId,
      candidatesGenerated: 0,
      opportunitiesPersisted: 0,
      byKind: { PRODUCT: 0, PRICING: 0, POSITIONING: 0, MARKETING: 0 },
    };
    return emptyOutput;
  }

  const verifiedCompetitorIds = new Set(competitors.map((c) => c.id));
  const competitorMap = new Map(competitors.map((c) => [c.id, c]));

  // Load existing evidence from previous stages for grounding
  const competitorEvidences = await prisma.evidence.findMany({
    where: { runId },
    take: 40,
    orderBy: { createdAt: "desc" },
  });

  // Prepare structured competitive intelligence digest for LLM
  const competitorDigest = competitors
    .map((comp) => {
      const plans =
        comp.pricingPlans.map((p) => `${p.name} ($${p.amount ?? "Custom"})`).join(", ") ||
        "Unlisted";
      const features =
        comp.featureClaims.map((f) => `${f.feature?.name}: ${f.support}`).join(", ") || "None";
      const pos = comp.positionings[0];
      return `### COMPETITOR: ${comp.name} (${comp.canonicalDomain}) [ID: ${comp.id}]
- Type: ${comp.type}
- Pricing Plans: ${plans}
- Feature Support: ${features}
- Category Claim: ${pos?.categoryClaim || "Standard"}
- ICP: ${pos?.icp || "General"}
- Tone: ${pos?.tone || "Standard"}`;
    })
    .join("\n\n");

  const evidenceDigest = competitorEvidences
    .map((e) => `- [${e.claimType}] ${e.excerpt} (Source: ${e.url})`)
    .slice(0, 15)
    .join("\n");

  const fallbackData = computeDeterministicStrategyFallback({
    targetName: target.name,
    category: profile?.category,
    competitors: competitors.map((c) => ({
      id: c.id,
      name: c.name,
      pricingPlans: c.pricingPlans,
      featureClaims: c.featureClaims.map((f) => ({
        featureName: f.feature?.name || "Feature",
        support: f.support,
      })),
      positioning: c.positionings[0] || null,
    })),
  });

  const prompt = `Analyze the verified competitive intelligence data for target product "${target.name}" and formulate ranked strategic opportunities.

TARGET PRODUCT PROFILE:
- Name: ${target.name}
- Category: ${profile?.category || "B2B Software"}
- Current ICP: ${profile?.icp || "B2B Teams"}
- Pricing Model: ${profile?.pricingModel || "Subscription"}

VERIFIED COMPETITOR ARTIFACTS:
${competitorDigest}

SUPPORTING EVIDENCE SAMPLES:
${evidenceDigest}

Produce a structured StrategistExtraction with concrete, defensible opportunities across PRODUCT, PRICING, POSITIONING, and MARKETING. Cite only valid competitor IDs from the dataset.`;

  const llm = registry.getLlmProvider();
  let strategyExtraction: StrategistExtraction;

  try {
    const res = await llm.generateStructured({
      prompt,
      schema: StrategistExtractionSchema,
      schemaName: "StrategistExtraction",
      schemaDescription: "Ranked strategic opportunities and edge recommendations",
      system: STRATEGIST_SYSTEM_PROMPT,
      fallback: fallbackData,
    });
    strategyExtraction = res.data as StrategistExtraction;
  } catch (err) {
    if (err instanceof ZodError) {
      const repairPrompt = `Your previous StrategistExtraction failed validation:\n${err.message}\n\nPlease fix errors and output valid JSON:\n${prompt}`;
      try {
        const repairRes = await llm.generateStructured({
          prompt: repairPrompt,
          schema: StrategistExtractionSchema,
          schemaName: "StrategistExtraction",
          system: STRATEGIST_SYSTEM_PROMPT,
          fallback: fallbackData,
        });
        strategyExtraction = repairRes.data as StrategistExtraction;
      } catch {
        strategyExtraction = fallbackData;
      }
    } else {
      strategyExtraction = fallbackData;
    }
  }

  // Sanitize and filter opportunities to strictly retain valid competitor IDs
  const sanitizedCandidates: OpportunityItem[] = strategyExtraction.opportunities
    .map((opp) => ({
      ...opp,
      supportingCompetitorIds: opp.supportingCompetitorIds.filter((id) =>
        verifiedCompetitorIds.has(id),
      ),
      absentCompetitorIds: opp.absentCompetitorIds.filter((id) => verifiedCompetitorIds.has(id)),
    }))
    .filter(
      (opp) =>
        opp.supportingCompetitorIds.length > 0 ||
        opp.absentCompetitorIds.length > 0 ||
        opp.rationale.length > 20,
    );

  // If LLM returned fewer than 2 valid opportunities, combine with deterministic fallback candidates
  const allCandidates =
    sanitizedCandidates.length >= 2
      ? sanitizedCandidates
      : [...sanitizedCandidates, ...fallbackData.opportunities];

  // Rank and deduplicate opportunities deterministically
  const rankedOpportunities = OpportunityRankingService.rankOpportunities(allCandidates, 6);

  // Transactionally persist opportunities and evidence
  await prisma.$transaction(async (tx) => {
    // 1. Delete prior opportunities for this run
    const priorOpportunities = await tx.opportunity.findMany({
      where: { runId },
    });
    if (priorOpportunities.length > 0) {
      const priorIds = priorOpportunities.map((o) => o.id);
      await tx.evidence.deleteMany({
        where: {
          runId,
          claimType: "OPPORTUNITY",
          claimId: { in: priorIds },
        },
      });
      await tx.opportunity.deleteMany({
        where: { runId },
      });
    }

    // 2. Persist new ranked opportunities
    for (const opp of rankedOpportunities) {
      const opportunityRecord = await tx.opportunity.create({
        data: {
          runId,
          kind: opp.kind,
          gap: opp.gap,
          suggestedMove: opp.suggestedMove,
          whatToSay: opp.whatToSay,
          rationale: opp.rationale,
          impact: opp.impact,
          effort: opp.effort,
          defensibility: opp.defensibility,
          rank: opp.rank,
          confidence: opp.confidence,
        },
      });

      // Write auditable evidence rows for supporting competitors
      const citedCompetitorNames = opp.supportingCompetitorIds
        .map((id) => competitorMap.get(id)?.name)
        .filter(Boolean);

      const excerpt =
        opp.evidenceExcerpts[0] ||
        `Strategic gap "${opp.gap}" validated across competitors: ${citedCompetitorNames.join(", ") || "Market baseline"}. Suggested move: ${opp.suggestedMove}`;

      const primaryUrl =
        opp.sourceUrls[0] ||
        (opp.supportingCompetitorIds[0]
          ? competitorMap.get(opp.supportingCompetitorIds[0])?.url
          : target.url) ||
        target.url;

      await tx.evidence.create({
        data: {
          runId,
          claimType: "OPPORTUNITY",
          claimId: opportunityRecord.id,
          url: primaryUrl,
          canonicalUrl: primaryUrl,
          excerpt,
          contentHash: crypto.createHash("sha256").update(excerpt).digest("hex"),
          trustTier: "HIGH",
        },
      });
    }
  });

  const byKindCounts: Record<string, number> = {
    PRODUCT: rankedOpportunities.filter((o) => o.kind === "PRODUCT").length,
    PRICING: rankedOpportunities.filter((o) => o.kind === "PRICING").length,
    POSITIONING: rankedOpportunities.filter((o) => o.kind === "POSITIONING").length,
    MARKETING: rankedOpportunities.filter((o) => o.kind === "MARKETING").length,
  };

  const output: OpportunityStageOutput = {
    targetId,
    candidatesGenerated: allCandidates.length,
    opportunitiesPersisted: rankedOpportunities.length,
    byKind: byKindCounts as Record<"PRODUCT" | "PRICING" | "POSITIONING" | "MARKETING", number>,
    topOpportunity: rankedOpportunities[0]?.gap,
  };

  await publishRunEvent(runId, {
    type: "STAGE_SUMMARY",
    runId,
    targetId,
    stageKey: "STRATEGIST",
    stageStatus: "COMPLETED",
    timestamp: new Date().toISOString(),
    summary: `Synthesized ${rankedOpportunities.length} ranked strategic edge opportunities (Top Edge: "${rankedOpportunities[0]?.gap || "None"}").`,
    payload: {
      ...output,
      strategicSummary: strategyExtraction.strategicSummary,
      primaryWedge: strategyExtraction.primaryWedge,
      rankedOpportunities,
    },
  });

  return output;
}
