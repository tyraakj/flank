import { prisma, CompetitorType } from "@flank/database";
import { registry } from "../providers/registry";
import { VerificationResultSchema, VerificationResult, VerifierStageOutput } from "@flank/shared";
import { publishRunEvent } from "../progress/publisher";
import { ZodError } from "zod";
import * as crypto from "crypto";

const VERIFIER_SYSTEM_PROMPT = `You are a Senior Product Marketing Analyst & Competitor Verification Specialist at Flank.
Your job is to rigorously evaluate discovered software candidate websites against a Target product, determine if they are genuine software products/services (rather than blogs, directories, aggregators, or non-products), and accurately classify their competitor relationship.

### CLASSIFICATION TAXONOMY:
1. DIRECT: Competitors that target the same Ideal Customer Profile (ICP), solve the same core problem, and offer directly overlapping feature capabilities.
2. INDIRECT: Companies targeting the same audience with an adjacent or partial solution, or offering a similar product to a different market tier/niche.
3. SUBSTITUTE: Different technological approaches or workflows that solve the same underlying Job-To-Be-Done (e.g. spreadsheets vs automated billing software).

### NON-PRODUCT CRITERIA (isRealProduct = false):
- Blogs, news publications, and editorial articles.
- Review directories and aggregators (e.g. G2, Capterra listings, Top-10 lists).
- Freelance agencies, consultancies, or custom service providers (unless productized SaaS).
- Parked, expired, placeholder, or 404 domains.
- General consumer marketplaces or unrelated platforms.

### RULES:
- Ground all classifications strictly in the candidate's homepage text.
- If isRealProduct is true, you MUST provide a type (DIRECT, INDIRECT, or SUBSTITUTE).
- If isRealProduct is false, set type to null.
- Provide a clear, evidence-based rationale citing specific capabilities.`;

function computeDeterministicVerification(params: {
  canonicalHost: string;
  candidateName: string;
  homepageText: string;
  targetCategory?: string | null;
  targetName: string;
}): VerificationResult {
  const textLower = params.homepageText.toLowerCase();

  // 1. Check for directory / article / aggregator signals
  const isDirectoryOrArticle =
    textLower.includes("top 10") ||
    textLower.includes("best alternatives to") ||
    textLower.includes("review and pricing") ||
    textLower.includes("sponsored post") ||
    textLower.includes("directory of software") ||
    textLower.includes("find software") ||
    textLower.includes("compare software");

  // 2. Check for real SaaS product CTAs
  const productSignals = [
    "sign up",
    "get started",
    "pricing",
    "features",
    "request demo",
    "book a demo",
    "start free trial",
    "log in",
    "login",
    "dashboard",
    "api documentation",
    "integrations",
  ];
  const matchedSignals = productSignals.filter((signal) => textLower.includes(signal));
  const hasStrongProductSignals = matchedSignals.length >= 2;

  if (isDirectoryOrArticle || !hasStrongProductSignals) {
    return {
      canonicalDomain: params.canonicalHost,
      productName: params.candidateName,
      isRealProduct: false,
      type: null,
      rationale: `Rejected via deterministic heuristic: Lacks sufficient product conversion signals (${matchedSignals.length}/12 CTAs detected) or matches directory/article patterns.`,
      sourceNotes: `Deterministic evaluation based on ${matchedSignals.length} detected product signals.`,
    };
  }

  // 3. Compute category & keyword overlap to classify relationship
  const targetCategoryLower = (params.targetCategory || "").toLowerCase();
  const categoryTerms = targetCategoryLower
    .split(/[\s,/-]+/)
    .filter((t) => t.length > 3 && !["software", "tools", "platform", "system", "app"].includes(t));

  const categoryMatches = categoryTerms.filter((term) => textLower.includes(term));
  const categoryOverlapRatio =
    categoryTerms.length > 0 ? categoryMatches.length / categoryTerms.length : 0;

  let compType: "DIRECT" | "INDIRECT" | "SUBSTITUTE" = "INDIRECT";
  let rationale = "";

  if (
    categoryOverlapRatio >= 0.5 ||
    (targetCategoryLower && textLower.includes(targetCategoryLower))
  ) {
    compType = "DIRECT";
    rationale = `Deterministically classified as DIRECT competitor: High market category overlap on "${categoryMatches.join(", ")}".`;
  } else if (categoryMatches.length > 0) {
    compType = "INDIRECT";
    rationale = `Deterministically classified as INDIRECT competitor: Partial category overlap on "${categoryMatches.join(", ")}".`;
  } else {
    compType = "SUBSTITUTE";
    rationale = `Deterministically classified as SUBSTITUTE: Solves related workflow with distinct market positioning.`;
  }

  return {
    canonicalDomain: params.canonicalHost,
    productName: params.candidateName,
    isRealProduct: true,
    type: compType,
    rationale,
    sourceNotes: `Deterministic heuristic computed from ${categoryMatches.length} category term matches and ${matchedSignals.length} CTA signals.`,
  };
}

export async function runVerifierAgent(
  runId: string,
  targetId: string,
  _inputArtifact?: unknown,
): Promise<VerifierStageOutput> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error(`Target ${targetId} not found`);

  const profile = await prisma.targetProfile.findUnique({ where: { runId } });
  if (!profile) {
    throw new Error(
      `TargetProfile not found for run ${runId}. Verification requires a valid profile.`,
    );
  }

  // Load top candidates from Discovery stage
  const candidates = await prisma.candidate.findMany({
    where: { runId },
    orderBy: { confidence: "desc" },
    take: 15,
  });

  if (candidates.length === 0) {
    const emptyOutput: VerifierStageOutput = {
      targetId,
      candidatesEvaluated: 0,
      competitorsVerified: 0,
      candidatesRejected: 0,
      competitorsDirect: 0,
      competitorsIndirect: 0,
      competitorsSubstitute: 0,
    };
    return emptyOutput;
  }

  const reader = registry.getBrowserReader();
  const llm = registry.getLlmProvider();

  interface EvaluatedCandidate {
    candidateId: string;
    originalUrl: string;
    canonicalDomain: string;
    productName: string;
    isRealProduct: boolean;
    type: CompetitorType | null;
    rationale: string;
    duplicateOf?: string | null;
    sourceNotes: string;
    homepageExcerpt: string;
    contentHash: string;
  }

  const evaluated: EvaluatedCandidate[] = [];
  const concurrency = 3;

  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (cand) => {
        let pageText = "";
        let pageCanonicalUrl = cand.url;
        let contentHash = "";

        try {
          const pageResult = await reader.read({ url: cand.url, mode: "auto", fresh: false });
          pageText = pageResult.text.trim();
          pageCanonicalUrl = pageResult.canonicalUrl;
          contentHash = pageResult.contentHash;
        } catch (readErr) {
          console.warn(`[Verifier Agent] Failed to read candidate homepage: ${cand.url}`, readErr);
        }

        if (!pageText || pageText.length < 50) {
          // Reject inaccessible or empty homepage
          return {
            candidateId: cand.id,
            originalUrl: cand.url,
            canonicalDomain: cand.canonicalDomain,
            productName: cand.name,
            isRealProduct: false,
            type: null,
            rationale: "Inaccessible, blank, or unresponsive homepage.",
            sourceNotes: "Homepage reading failed or yielded insufficient content.",
            homepageExcerpt: "[Inaccessible homepage]",
            contentHash: crypto.createHash("sha256").update(cand.url).digest("hex"),
          };
        }

        const canonicalHost = new URL(pageCanonicalUrl).hostname
          .toLowerCase()
          .replace(/^www\./, "");
        const boundedExcerpt = pageText.substring(0, 25000);

        const prompt = `Evaluate the candidate product against the Target company:

TARGET COMPANY:
- Name: ${target.name}
- Domain: ${target.canonicalDomain}
- Category: ${profile.category || "unknown"}
- ICP: ${profile.icp || "unknown"}
- Pricing Model: ${profile.pricingModel || "unknown"}

CANDIDATE TO EVALUATE:
- Discovered Domain: ${cand.canonicalDomain}
- Resolved Domain: ${canonicalHost}
- Name Hint: ${cand.name}
- Discovery Rationale: ${cand.rationale || "None"}

CANDIDATE HOMEPAGE CONTENT (${pageCanonicalUrl}):
${boundedExcerpt}

Determine if this is a genuine software product and classify its competitive relationship.`;

        const fallbackResult = computeDeterministicVerification({
          canonicalHost,
          candidateName: cand.name,
          homepageText: pageText,
          targetCategory: profile.category,
          targetName: target.name,
        });

        let verification: VerificationResult;
        try {
          const res = await llm.generateStructured({
            prompt,
            schema: VerificationResultSchema,
            schemaName: "VerificationResult",
            schemaDescription: "Evaluation and competitor classification of candidate product",
            system: VERIFIER_SYSTEM_PROMPT,
            fallback: fallbackResult,
          });
          verification = res.data as VerificationResult;
        } catch (err) {
          if (err instanceof ZodError) {
            const repairPrompt = `Your previous VerificationResult failed validation:\n${err.message}\n\nPlease fix errors and output a valid JSON:\n${prompt}`;
            try {
              const repairRes = await llm.generateStructured({
                prompt: repairPrompt,
                schema: VerificationResultSchema,
                schemaName: "VerificationResult",
                system: VERIFIER_SYSTEM_PROMPT,
                fallback: fallbackResult,
              });
              verification = repairRes.data as VerificationResult;
            } catch {
              verification = fallbackResult;
            }
          } else {
            verification = fallbackResult;
          }
        }

        const compType =
          verification.isRealProduct && verification.type
            ? (verification.type as CompetitorType)
            : null;

        return {
          candidateId: cand.id,
          originalUrl: cand.url,
          canonicalDomain: verification.canonicalDomain || canonicalHost,
          productName: verification.productName || cand.name,
          isRealProduct: verification.isRealProduct,
          type: compType,
          rationale: verification.rationale,
          duplicateOf: verification.duplicateOf,
          sourceNotes: verification.sourceNotes,
          homepageExcerpt: boundedExcerpt.substring(0, 1000),
          contentHash:
            contentHash || crypto.createHash("sha256").update(boundedExcerpt).digest("hex"),
        };
      }),
    );

    for (const r of batchResults) {
      if (r.status === "fulfilled") {
        evaluated.push(r.value);
      }
    }
  }

  // Group by canonicalDomain to prevent duplicate competitors
  const verifiedMap = new Map<string, EvaluatedCandidate>();
  const rejectedList: EvaluatedCandidate[] = [];

  for (const item of evaluated) {
    if (item.isRealProduct && item.type) {
      const existing = verifiedMap.get(item.canonicalDomain);
      if (!existing) {
        verifiedMap.set(item.canonicalDomain, item);
      } else {
        // If already exists, keep DIRECT over INDIRECT/SUBSTITUTE
        if (item.type === "DIRECT" && existing.type !== "DIRECT") {
          verifiedMap.set(item.canonicalDomain, item);
        }
      }
    } else {
      rejectedList.push(item);
    }
  }

  // Rank verified competitors: DIRECT first, then INDIRECT, then SUBSTITUTE
  const typeRank: Record<CompetitorType, number> = {
    DIRECT: 3,
    INDIRECT: 2,
    SUBSTITUTE: 1,
  };

  const rankedCompetitors = Array.from(verifiedMap.values()).sort((a, b) => {
    const rankA = a.type ? typeRank[a.type] : 0;
    const rankB = b.type ? typeRank[b.type] : 0;
    return rankB - rankA;
  });

  // Cap working set at top 8
  const MAX_COMPETITORS = 8;
  const activeCompetitors = rankedCompetitors.slice(0, MAX_COMPETITORS);
  const inactiveCompetitors = rankedCompetitors.slice(MAX_COMPETITORS);

  let directCount = 0;
  let indirectCount = 0;
  let substituteCount = 0;

  // Persist to Postgres transactionally
  await prisma.$transaction(async (tx) => {
    // Clear prior competitors for this run
    await tx.competitor.deleteMany({ where: { runId } });
    await tx.evidence.deleteMany({ where: { runId, claimType: "COMPETITOR" } });

    // 1. Create active Competitor rows
    for (const comp of activeCompetitors) {
      if (!comp.type) continue;
      if (comp.type === "DIRECT") directCount++;
      else if (comp.type === "INDIRECT") indirectCount++;
      else if (comp.type === "SUBSTITUTE") substituteCount++;

      const confidenceScore = comp.type === "DIRECT" ? 85 : comp.type === "INDIRECT" ? 75 : 65;

      const competitorRecord = await tx.competitor.create({
        data: {
          runId,
          name: comp.productName,
          canonicalDomain: comp.canonicalDomain,
          url: comp.originalUrl,
          type: comp.type,
          status: "ACTIVE",
          confidence: confidenceScore,
          confidenceReasons: {
            rationale: comp.rationale,
            sourceNotes: comp.sourceNotes,
          },
        },
      });

      // Update candidate status to VERIFIED
      await tx.candidate.update({
        where: { id: comp.candidateId },
        data: { status: "VERIFIED" },
      });

      // Attach evidence row
      await tx.evidence.create({
        data: {
          runId,
          claimType: "COMPETITOR",
          claimId: competitorRecord.id,
          url: comp.originalUrl,
          canonicalUrl: comp.originalUrl,
          excerpt: `Verified ${comp.type} competitor:\n${comp.rationale}\n\nHomepage Excerpt:\n${comp.homepageExcerpt}`,
          contentHash: comp.contentHash,
          trustTier: "HIGH",
        },
      });
    }

    // 2. Mark capped competitors as INACTIVE
    for (const comp of inactiveCompetitors) {
      if (!comp.type) continue;
      await tx.competitor.create({
        data: {
          runId,
          name: comp.productName,
          canonicalDomain: comp.canonicalDomain,
          url: comp.originalUrl,
          type: comp.type,
          status: "INACTIVE",
          confidence: 50,
          confidenceReasons: {
            rationale: `${comp.rationale} (Excluded from active working set due to size cap)`,
          },
        },
      });
      await tx.candidate.update({
        where: { id: comp.candidateId },
        data: { status: "VERIFIED" },
      });
    }

    // 3. Mark rejected candidates
    for (const rej of rejectedList) {
      await tx.candidate.update({
        where: { id: rej.candidateId },
        data: {
          status: rej.duplicateOf ? "DUPLICATE" : "REJECTED",
          rationale: rej.rationale,
        },
      });

      // Write rejection evidence
      await tx.evidence.create({
        data: {
          runId,
          claimType: "CANDIDATE",
          claimId: rej.candidateId,
          url: rej.originalUrl,
          canonicalUrl: rej.originalUrl,
          excerpt: `Rejection Rationale: ${rej.rationale}\n\nHomepage Snippet:\n${rej.homepageExcerpt}`,
          contentHash: rej.contentHash,
          trustTier: "MEDIUM",
        },
      });
    }
  });

  const output: VerifierStageOutput = {
    targetId,
    candidatesEvaluated: evaluated.length,
    competitorsVerified: activeCompetitors.length + inactiveCompetitors.length,
    candidatesRejected: rejectedList.length,
    competitorsDirect: directCount,
    competitorsIndirect: indirectCount,
    competitorsSubstitute: substituteCount,
  };

  await publishRunEvent(runId, {
    type: "STAGE_SUMMARY",
    runId,
    targetId,
    stageKey: "VERIFIER",
    stageStatus: "COMPLETED",
    timestamp: new Date().toISOString(),
    summary: `Verified ${activeCompetitors.length} active competitors (${directCount} direct, ${indirectCount} indirect, ${substituteCount} substitute) and rejected ${rejectedList.length} non-products.`,
    payload: output,
  });

  return output;
}
