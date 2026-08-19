import { prisma, StageKey } from "@flank/database";
import { CriticStageOutput, QualityReportData } from "@flank/shared";
import { QualityEvaluator, QualityEvaluationInputs } from "../services/quality-evaluator";
import { publishRunEvent } from "../progress/publisher";

export async function runCriticAgent(
  runId: string,
  targetId: string,
  _inputArtifact?: unknown,
): Promise<CriticStageOutput> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error(`Target ${targetId} not found`);

  // Load all persisted domain entities for this run
  const [
    profile,
    candidates,
    competitors,
    pricingPlans,
    features,
    featureClaims,
    positionings,
    opportunities,
    evidences,
  ] = await Promise.all([
    prisma.targetProfile.findUnique({ where: { runId } }),
    prisma.candidate.findMany({ where: { runId } }),
    prisma.competitor.findMany({ where: { runId } }),
    prisma.pricingPlan.findMany({
      where: {
        competitor: { runId },
      },
    }),
    prisma.feature.findMany(),
    prisma.featureClaim.findMany({ where: { runId } }),
    prisma.positioning.findMany({ where: { runId } }),
    prisma.opportunity.findMany({ where: { runId } }),
    prisma.evidence.findMany({ where: { runId } }),
  ]);

  const evaluationInputs: QualityEvaluationInputs = {
    runId,
    target: { id: target.id, name: target.name, url: target.url },
    profile,
    candidates: candidates.map((c) => ({ id: c.id, domain: c.canonicalDomain, name: c.name })),
    competitors: competitors.map((c) => ({
      id: c.id,
      name: c.name,
      canonicalDomain: c.canonicalDomain,
      type: c.type,
      status: c.status,
    })),
    pricingPlans: pricingPlans.map((p) => ({
      id: p.id,
      competitorId: p.competitorId,
      name: p.name,
      amount: p.amount,
      currency: p.currency,
      interval: p.interval,
    })),
    features: features.map((f) => ({
      id: f.id,
      name: f.name,
      slug: f.slug,
      category: f.category ?? "General",
    })),
    featureClaims: featureClaims.map((f) => {
      const reasons = f.confidenceReasons as { shippingState?: string } | null;
      return {
        id: f.id,
        competitorId: f.competitorId,
        featureId: f.featureId,
        support: f.support,
        shippingState: reasons?.shippingState ?? "shipped",
      };
    }),
    positionings: positionings.map((p) => ({
      id: p.id,
      competitorId: p.competitorId,
      targetId: p.targetId,
      categoryClaim: p.categoryClaim,
      icp: p.icp,
      axes: p.axes,
    })),
    opportunities: opportunities.map((o) => ({
      id: o.id,
      kind: o.kind,
      gap: o.gap,
      suggestedMove: o.suggestedMove,
      rank: o.rank,
    })),
    evidences: evidences.map((e) => ({
      id: e.id,
      claimType: e.claimType,
      claimId: e.claimId,
      url: e.url,
      excerpt: e.excerpt ?? "",
    })),
  };

  // Run deterministic quality evaluation
  const qualityReport: QualityReportData = QualityEvaluator.evaluateRunQuality(evaluationInputs);

  // Persist QualityReport record in Postgres
  const rerunStage = qualityReport.retryDirective?.targetStage as StageKey | null;

  await prisma.qualityReport.upsert({
    where: { runId },
    create: {
      runId,
      stageKey: "CRITIC",
      score: qualityReport.score,
      completeness: qualityReport.completeness,
      sourcing: qualityReport.sourcing,
      plausibility: qualityReport.plausibility,
      issues: {
        overallStatus: qualityReport.overallStatus,
        canPublish: qualityReport.canPublish,
        isPartialReportAllowed: qualityReport.isPartialReportAllowed,
        blockingReasons: qualityReport.blockingReasons,
        warnings: qualityReport.warnings,
        stageScores: qualityReport.stageScores,
        retryDirective: qualityReport.retryDirective,
        rulesVersion: qualityReport.rulesVersion,
      },
      rerunStage,
    },
    update: {
      score: qualityReport.score,
      completeness: qualityReport.completeness,
      sourcing: qualityReport.sourcing,
      plausibility: qualityReport.plausibility,
      issues: {
        overallStatus: qualityReport.overallStatus,
        canPublish: qualityReport.canPublish,
        isPartialReportAllowed: qualityReport.isPartialReportAllowed,
        blockingReasons: qualityReport.blockingReasons,
        warnings: qualityReport.warnings,
        stageScores: qualityReport.stageScores,
        retryDirective: qualityReport.retryDirective,
        rulesVersion: qualityReport.rulesVersion,
      },
      rerunStage,
    },
  });

  const output: CriticStageOutput = {
    targetId,
    qualityScore: qualityReport.score,
    overallStatus: qualityReport.overallStatus,
    canPublish: qualityReport.canPublish,
    rerunStage: qualityReport.retryDirective?.targetStage ?? null,
    blockingIssuesCount: qualityReport.blockingReasons.length,
    warningsCount: qualityReport.warnings.length,
    rulesVersion: qualityReport.rulesVersion,
  };

  await publishRunEvent(runId, {
    type: "STAGE_SUMMARY",
    runId,
    targetId,
    stageKey: "CRITIC",
    stageStatus: "COMPLETED",
    timestamp: new Date().toISOString(),
    summary: `Quality gates completed with score ${qualityReport.score}/100 (${qualityReport.overallStatus}). Publication Gate: ${qualityReport.canPublish ? "PASSED" : "BLOCKED"}.${rerunStage ? ` Retry Directive: ${rerunStage}` : ""}`,
    payload: {
      ...output,
      qualityReport,
    },
  });

  return output;
}
