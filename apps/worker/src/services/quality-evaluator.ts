import {
  QualityReportData,
  StageQualityScore,
  RetryDirective,
  QualityStageKey,
} from "@flank/shared";

export interface QualityEvaluationInputs {
  runId: string;
  target: { id: string; name: string; url: string };
  profile?: {
    id: string;
    category?: string | null;
    icp?: string | null;
    pricingModel?: string | null;
    valueProps?: unknown;
  } | null;
  candidates: Array<{ id: string; domain: string; name: string }>;
  competitors: Array<{
    id: string;
    name: string;
    canonicalDomain: string;
    type: string;
    status: string;
  }>;
  pricingPlans: Array<{
    id: string;
    competitorId?: string | null;
    name: string;
    amount: unknown;
    currency: string;
    interval?: string | null;
  }>;
  features: Array<{ id: string; name: string; slug: string; category: string }>;
  featureClaims: Array<{
    id: string;
    competitorId?: string | null;
    featureId: string;
    support: string;
    shippingState: string;
  }>;
  positionings: Array<{
    id: string;
    competitorId?: string | null;
    targetId?: string | null;
    categoryClaim?: string | null;
    icp?: string | null;
    axes?: unknown;
  }>;
  opportunities: Array<{
    id: string;
    kind: string;
    gap: string;
    suggestedMove: string;
    rank: number;
  }>;
  evidences: Array<{
    id: string;
    claimType: string;
    claimId: string;
    url: string;
    excerpt: string;
  }>;
  retryBudgets?: Partial<Record<QualityStageKey, number>>;
}

export class QualityEvaluator {
  static readonly RULES_VERSION = "1.0.0";

  /**
   * Deterministically evaluates the entire run against all quality rules and publication gates.
   */
  static evaluateRunQuality(inputs: QualityEvaluationInputs): QualityReportData {
    const stageScores: StageQualityScore[] = [];
    const blockingReasons: string[] = [];
    const warnings: string[] = [];

    // Map evidences by claimType and claimId
    const evidenceMap = new Map<string, Array<{ id: string; url: string; excerpt: string }>>();
    for (const ev of inputs.evidences) {
      const key = `${ev.claimType}:${ev.claimId}`;
      const list = evidenceMap.get(key) || [];
      list.push(ev);
      evidenceMap.set(key, list);
    }

    // 1. Evaluate PROFILER Stage
    const profilerScore = this.evaluateProfiler(inputs, evidenceMap);
    stageScores.push(profilerScore);
    if (profilerScore.status === "REJECT" || profilerScore.status === "BLOCKED") {
      blockingReasons.push(...profilerScore.issues);
    } else if (profilerScore.status === "WARNING") {
      warnings.push(...profilerScore.issues);
    }

    // 2. Evaluate DISCOVERY Stage
    const discoveryScore = this.evaluateDiscovery(inputs, evidenceMap);
    stageScores.push(discoveryScore);
    if (discoveryScore.status === "REJECT" || discoveryScore.status === "BLOCKED") {
      blockingReasons.push(...discoveryScore.issues);
    } else if (discoveryScore.status === "WARNING") {
      warnings.push(...discoveryScore.issues);
    }

    // 3. Evaluate VERIFIER Stage
    const verifierScore = this.evaluateVerifier(inputs, evidenceMap);
    stageScores.push(verifierScore);
    if (verifierScore.status === "REJECT" || verifierScore.status === "BLOCKED") {
      blockingReasons.push(...verifierScore.issues);
    } else if (verifierScore.status === "WARNING") {
      warnings.push(...verifierScore.issues);
    }

    // 4. Evaluate PRICING Stage
    const pricingScore = this.evaluatePricing(inputs, evidenceMap);
    stageScores.push(pricingScore);
    if (pricingScore.status === "REJECT" || pricingScore.status === "BLOCKED") {
      blockingReasons.push(...pricingScore.issues);
    } else if (pricingScore.status === "WARNING") {
      warnings.push(...pricingScore.issues);
    }

    // 5. Evaluate FEATURE Stage
    const featureScore = this.evaluateFeatures(inputs, evidenceMap);
    stageScores.push(featureScore);
    if (featureScore.status === "REJECT" || featureScore.status === "BLOCKED") {
      blockingReasons.push(...featureScore.issues);
    } else if (featureScore.status === "WARNING") {
      warnings.push(...featureScore.issues);
    }

    // 6. Evaluate POSITIONING Stage
    const positioningScore = this.evaluatePositioning(inputs, evidenceMap);
    stageScores.push(positioningScore);
    if (positioningScore.status === "REJECT" || positioningScore.status === "BLOCKED") {
      blockingReasons.push(...positioningScore.issues);
    } else if (positioningScore.status === "WARNING") {
      warnings.push(...positioningScore.issues);
    }

    // 7. Evaluate STRATEGIST Stage
    const strategistScore = this.evaluateStrategist(inputs, evidenceMap);
    stageScores.push(strategistScore);
    if (strategistScore.status === "REJECT" || strategistScore.status === "BLOCKED") {
      blockingReasons.push(...strategistScore.issues);
    } else if (strategistScore.status === "WARNING") {
      warnings.push(...strategistScore.issues);
    }

    // Overall metrics calculation
    const avgCompleteness = Math.round(
      stageScores.reduce((sum, s) => sum + s.completeness, 0) / stageScores.length,
    );
    const avgSourcing = Math.round(
      stageScores.reduce((sum, s) => sum + s.sourcing, 0) / stageScores.length,
    );
    const avgPlausibility = Math.round(
      stageScores.reduce((sum, s) => sum + s.plausibility, 0) / stageScores.length,
    );
    const totalContradictions = stageScores.reduce((sum, s) => sum + s.contradictionCount, 0);

    const overallScore = Math.round(
      avgCompleteness * 0.35 + avgSourcing * 0.4 + avgPlausibility * 0.25 - totalContradictions * 5,
    );
    const boundedOverallScore = Math.max(0, Math.min(100, overallScore));

    // Determine Hard Publication Gate
    // Hard rules: TargetProfile present, Competitors >= 1, no critical REJECT/BLOCKED stages
    const hasFatalBlocker = blockingReasons.length > 0;
    const canPublish =
      !hasFatalBlocker && inputs.profile !== null && inputs.competitors.length >= 1;

    let overallStatus: "PASS" | "WARNING" | "REJECT" | "BLOCKED" = "PASS";
    if (hasFatalBlocker) {
      overallStatus = "REJECT";
    } else if (warnings.length > 0 || boundedOverallScore < 75) {
      overallStatus = "WARNING";
    }

    // Determine Earliest Targeted Retry Directive
    let retryDirective: RetryDirective | null = null;
    const retryPriorityOrder: QualityStageKey[] = [
      "PROFILER",
      "DISCOVERY",
      "VERIFIER",
      "PRICING",
      "FEATURE",
      "POSITIONING",
      "STRATEGIST",
    ];

    for (const stageKey of retryPriorityOrder) {
      const stageScore = stageScores.find((s) => s.stageKey === stageKey);
      if (stageScore && stageScore.status === "REJECT") {
        const budgetRemaining = inputs.retryBudgets?.[stageKey] ?? 1;
        retryDirective = {
          targetStage: stageKey,
          reason: `Stage ${stageKey} failed quality criteria: ${stageScore.issues.join("; ")}`,
          failedChecks: stageScore.issues,
          retryBudgetRemaining: budgetRemaining,
          isRetryable: budgetRemaining > 0,
        };
        break;
      }
    }

    return {
      runId: inputs.runId,
      score: boundedOverallScore,
      completeness: avgCompleteness,
      sourcing: avgSourcing,
      plausibility: avgPlausibility,
      overallStatus,
      canPublish,
      isPartialReportAllowed: canPublish && warnings.length > 0,
      blockingReasons,
      warnings,
      stageScores,
      retryDirective,
      rulesVersion: this.RULES_VERSION,
    };
  }

  // --- Stage Evaluators ---

  static evaluateProfiler(
    inputs: QualityEvaluationInputs,
    evidenceMap: Map<string, Array<{ id: string; url: string; excerpt: string }>>,
  ): StageQualityScore {
    const issues: string[] = [];
    let completeness = 100;
    let plausibility = 100;

    if (!inputs.profile) {
      issues.push("Missing TargetProfile record");
      return {
        stageKey: "PROFILER",
        completeness: 0,
        sourcing: 0,
        plausibility: 0,
        contradictionCount: 0,
        status: "REJECT",
        issues,
      };
    }

    if (!inputs.profile.category) {
      completeness -= 30;
      issues.push("Target category is unpopulated");
    }
    if (!inputs.profile.icp) {
      completeness -= 20;
      issues.push("Target ICP is unpopulated");
    }

    const profileEvidences = evidenceMap.get(`TARGET_PROFILE:${inputs.profile.id}`) || [];
    const sourcing = profileEvidences.length > 0 ? 100 : 0;
    if (sourcing === 0) {
      issues.push("TargetProfile lacks supporting Evidence quotes");
    }

    const status = issues.some((i) => i.includes("Missing TargetProfile"))
      ? "REJECT"
      : issues.length > 0
        ? "WARNING"
        : "PASS";

    return {
      stageKey: "PROFILER",
      completeness: Math.max(0, completeness),
      sourcing,
      plausibility,
      contradictionCount: 0,
      status,
      issues,
    };
  }

  static evaluateDiscovery(
    inputs: QualityEvaluationInputs,
    _evidenceMap: Map<string, Array<{ id: string; url: string; excerpt: string }>>,
  ): StageQualityScore {
    const issues: string[] = [];
    let completeness = 100;

    if (inputs.candidates.length === 0) {
      issues.push("Zero discovery candidates were discovered");
      completeness = 0;
    } else if (inputs.candidates.length < 3) {
      issues.push(`Low discovery candidate density (${inputs.candidates.length} candidates)`);
      completeness = 60;
    }

    const status =
      inputs.candidates.length === 0 ? "REJECT" : issues.length > 0 ? "WARNING" : "PASS";

    return {
      stageKey: "DISCOVERY",
      completeness,
      sourcing: inputs.candidates.length > 0 ? 100 : 0,
      plausibility: 100,
      contradictionCount: 0,
      status,
      issues,
    };
  }

  static evaluateVerifier(
    inputs: QualityEvaluationInputs,
    evidenceMap: Map<string, Array<{ id: string; url: string; excerpt: string }>>,
  ): StageQualityScore {
    const issues: string[] = [];
    let completeness = 100;
    let contradictionCount = 0;

    if (inputs.competitors.length === 0) {
      issues.push("Zero competitors verified in working set");
      return {
        stageKey: "VERIFIER",
        completeness: 0,
        sourcing: 0,
        plausibility: 0,
        contradictionCount: 0,
        status: "REJECT",
        issues,
      };
    }

    // Check canonical domain uniqueness
    const seenDomains = new Set<string>();
    let backedCount = 0;
    for (const comp of inputs.competitors) {
      if (seenDomains.has(comp.canonicalDomain)) {
        contradictionCount++;
        issues.push(`Duplicate verified competitor domain detected: ${comp.canonicalDomain}`);
      }
      seenDomains.add(comp.canonicalDomain);

      // Check evidence linking
      const compEvidences = evidenceMap.get(`COMPETITOR:${comp.id}`) || [];
      if (compEvidences.length > 0) {
        backedCount++;
      } else {
        issues.push(`Competitor ${comp.name} lacks verification Evidence`);
      }
    }

    const sourcing =
      inputs.competitors.length > 0
        ? Math.round((backedCount / inputs.competitors.length) * 100)
        : 100;

    const status =
      inputs.competitors.length === 0 || contradictionCount > 0
        ? "REJECT"
        : issues.length > 0
          ? "WARNING"
          : "PASS";

    return {
      stageKey: "VERIFIER",
      completeness,
      sourcing,
      plausibility: contradictionCount > 0 ? 50 : 100,
      contradictionCount,
      status,
      issues,
    };
  }

  static evaluatePricing(
    inputs: QualityEvaluationInputs,
    evidenceMap: Map<string, Array<{ id: string; url: string; excerpt: string }>>,
  ): StageQualityScore {
    const issues: string[] = [];
    let plausibility = 100;
    let contradictionCount = 0;

    const validCurrencies = new Set(["USD", "INR", "EUR", "GBP"]);
    let backedCount = 0;

    for (const plan of inputs.pricingPlans) {
      if (plan.currency && !validCurrencies.has(plan.currency.toUpperCase())) {
        contradictionCount++;
        issues.push(`Invalid currency '${plan.currency}' in plan '${plan.name}'`);
      }

      if (plan.amount !== null && Number(plan.amount) < 0) {
        contradictionCount++;
        issues.push(`Negative pricing amount ($${plan.amount}) in plan '${plan.name}'`);
      }

      const planEvidences = evidenceMap.get(`PRICING_PLAN:${plan.id}`) || [];
      if (planEvidences.length > 0) {
        backedCount++;
      } else {
        issues.push(`Pricing plan '${plan.name}' lacks backing Evidence row`);
      }
    }

    const sourcing =
      inputs.pricingPlans.length > 0
        ? Math.round((backedCount / inputs.pricingPlans.length) * 100)
        : 100;

    const status = contradictionCount > 0 ? "REJECT" : issues.length > 0 ? "WARNING" : "PASS";

    return {
      stageKey: "PRICING",
      completeness: inputs.pricingPlans.length > 0 ? 100 : 70,
      sourcing,
      plausibility: contradictionCount > 0 ? 50 : 100,
      contradictionCount,
      status,
      issues,
    };
  }

  static evaluateFeatures(
    inputs: QualityEvaluationInputs,
    evidenceMap: Map<string, Array<{ id: string; url: string; excerpt: string }>>,
  ): StageQualityScore {
    const issues: string[] = [];
    let contradictionCount = 0;

    // Check for contradictory claims on same competitor and feature
    const compFeatureClaims = new Map<string, Array<string>>();
    let backedCount = 0;
    const nonUnknownClaims = inputs.featureClaims.filter((f) => f.support !== "UNKNOWN");

    for (const claim of inputs.featureClaims) {
      const key = `${claim.competitorId}:${claim.featureId}`;
      const statuses = compFeatureClaims.get(key) || [];
      statuses.push(claim.support);
      compFeatureClaims.set(key, statuses);

      if (claim.support === "YES" && claim.shippingState === "announced") {
        contradictionCount++;
        issues.push(`Feature claim cannot have both support 'YES' and shippingState 'announced'`);
      }

      const claimEvidences = evidenceMap.get(`FEATURE_CLAIM:${claim.id}`) || [];
      if (claimEvidences.length > 0) {
        if (claim.support !== "UNKNOWN") backedCount++;
      } else if (claim.support !== "UNKNOWN") {
        issues.push(`Feature claim ${claim.id} lacks backing Evidence row`);
      }
    }

    for (const [key, statuses] of compFeatureClaims.entries()) {
      if (statuses.includes("YES") && statuses.includes("NO")) {
        contradictionCount++;
        issues.push(
          `Direct support contradiction on feature for competitor (${key}): both YES and NO claims exist`,
        );
      }
    }

    const sourcing =
      nonUnknownClaims.length > 0 ? Math.round((backedCount / nonUnknownClaims.length) * 100) : 100;

    const status = contradictionCount > 0 ? "REJECT" : issues.length > 0 ? "WARNING" : "PASS";

    return {
      stageKey: "FEATURE",
      completeness: inputs.featureClaims.length > 0 ? 100 : 80,
      sourcing,
      plausibility: contradictionCount > 0 ? 60 : 100,
      contradictionCount,
      status,
      issues,
    };
  }

  static evaluatePositioning(
    inputs: QualityEvaluationInputs,
    evidenceMap: Map<string, Array<{ id: string; url: string; excerpt: string }>>,
  ): StageQualityScore {
    const issues: string[] = [];
    let plausibility = 100;
    let contradictionCount = 0;

    const compPositions = inputs.positionings.filter((p) => p.competitorId);
    let backedCount = 0;

    for (const pos of inputs.positionings) {
      const axes = pos.axes as { x?: number; y?: number } | null;
      if (axes) {
        if (typeof axes.x === "number" && (axes.x < 0 || axes.x > 100)) {
          contradictionCount++;
          issues.push(`Positioning X coordinate (${axes.x}) outside [0, 100] bounds`);
        }
        if (typeof axes.y === "number" && (axes.y < 0 || axes.y > 100)) {
          contradictionCount++;
          issues.push(`Positioning Y coordinate (${axes.y}) outside [0, 100] bounds`);
        }
      }

      const posEvidences = evidenceMap.get(`POSITIONING:${pos.id}`) || [];
      if (posEvidences.length > 0) {
        if (pos.competitorId) backedCount++;
      } else if (pos.competitorId) {
        issues.push(`Competitor positioning ${pos.id} lacks backing Evidence`);
      }
    }

    const sourcing =
      compPositions.length > 0 ? Math.round((backedCount / compPositions.length) * 100) : 100;

    const status = contradictionCount > 0 ? "REJECT" : issues.length > 0 ? "WARNING" : "PASS";

    return {
      stageKey: "POSITIONING",
      completeness: inputs.positionings.length > 0 ? 100 : 70,
      sourcing,
      plausibility: contradictionCount > 0 ? 60 : 100,
      contradictionCount,
      status,
      issues,
    };
  }

  static evaluateStrategist(
    inputs: QualityEvaluationInputs,
    evidenceMap: Map<string, Array<{ id: string; url: string; excerpt: string }>>,
  ): StageQualityScore {
    const issues: string[] = [];
    let contradictionCount = 0;

    const seenRanks = new Set<number>();
    let backedCount = 0;

    for (const opp of inputs.opportunities) {
      if (seenRanks.has(opp.rank)) {
        contradictionCount++;
        issues.push(`Duplicate opportunity rank detected: ${opp.rank}`);
      }
      seenRanks.add(opp.rank);

      const oppEvidences = evidenceMap.get(`OPPORTUNITY:${opp.id}`) || [];
      if (oppEvidences.length > 0) {
        backedCount++;
      } else {
        issues.push(`Opportunity '${opp.gap}' lacks backing Evidence row`);
      }
    }

    const sourcing =
      inputs.opportunities.length > 0
        ? Math.round((backedCount / inputs.opportunities.length) * 100)
        : 100;

    const status = contradictionCount > 0 ? "REJECT" : issues.length > 0 ? "WARNING" : "PASS";

    return {
      stageKey: "STRATEGIST",
      completeness: inputs.opportunities.length > 0 ? 100 : 70,
      sourcing,
      plausibility: contradictionCount > 0 ? 50 : 100,
      contradictionCount,
      status,
      issues,
    };
  }
}
