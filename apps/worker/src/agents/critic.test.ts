import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  StageQualityScoreSchema,
  QualityReportDataSchema,
  CriticStageOutputSchema,
} from "@flank/shared";
import { QualityEvaluator, QualityEvaluationInputs } from "../services/quality-evaluator";

describe("Unit 18: Critic Agent & Quality Gates", () => {
  describe("Zod Contracts Validation", () => {
    it("validates StageQualityScoreSchema", () => {
      const score = {
        stageKey: "PRICING" as const,
        completeness: 100,
        sourcing: 95,
        plausibility: 100,
        contradictionCount: 0,
        status: "PASS" as const,
        issues: [],
      };

      const parsed = StageQualityScoreSchema.safeParse(score);
      assert.strictEqual(parsed.success, true);
    });

    it("validates QualityReportDataSchema", () => {
      const report = {
        runId: "run-123",
        score: 92,
        completeness: 95,
        sourcing: 90,
        plausibility: 95,
        overallStatus: "PASS" as const,
        canPublish: true,
        isPartialReportAllowed: false,
        blockingReasons: [],
        warnings: [],
        stageScores: [
          {
            stageKey: "PROFILER" as const,
            completeness: 100,
            sourcing: 90,
            plausibility: 100,
            contradictionCount: 0,
            status: "PASS" as const,
            issues: [],
          },
        ],
        retryDirective: null,
        rulesVersion: "1.0.0",
      };

      const parsed = QualityReportDataSchema.safeParse(report);
      assert.strictEqual(parsed.success, true);
    });

    it("validates CriticStageOutputSchema", () => {
      const output = {
        targetId: "target-123",
        qualityScore: 88,
        overallStatus: "PASS" as const,
        canPublish: true,
        rerunStage: null,
        blockingIssuesCount: 0,
        warningsCount: 0,
        rulesVersion: "1.0.0",
      };

      const parsed = CriticStageOutputSchema.safeParse(output);
      assert.strictEqual(parsed.success, true);
    });
  });

  describe("QualityEvaluator Deterministic Logic", () => {
    const mockValidRunInputs: QualityEvaluationInputs = {
      runId: "run-full-valid",
      target: { id: "target-1", name: "Flank Intelligence", url: "https://flank.dev" },
      profile: {
        id: "profile-1",
        category: "Competitive Intelligence",
        icp: "Product Managers & Founders",
        pricingModel: "Subscription",
      },
      candidates: [
        { id: "cand-1", domain: "comp1.com", name: "Comp 1" },
        { id: "cand-2", domain: "comp2.com", name: "Comp 2" },
        { id: "cand-3", domain: "comp3.com", name: "Comp 3" },
      ],
      competitors: [
        {
          id: "comp-1",
          name: "Comp 1",
          canonicalDomain: "comp1.com",
          type: "DIRECT",
          status: "ACTIVE",
        },
        {
          id: "comp-2",
          name: "Comp 2",
          canonicalDomain: "comp2.com",
          type: "INDIRECT",
          status: "ACTIVE",
        },
      ],
      pricingPlans: [
        { id: "plan-1", competitorId: "comp-1", name: "Pro Plan", amount: 49, currency: "USD" },
      ],
      features: [
        {
          id: "feat-1",
          name: "Single Sign-On (SSO)",
          slug: "single-sign-on-sso",
          category: "Security",
        },
      ],
      featureClaims: [
        {
          id: "claim-1",
          competitorId: "comp-1",
          featureId: "feat-1",
          support: "YES",
          shippingState: "shipped",
        },
      ],
      positionings: [
        {
          id: "pos-1",
          competitorId: "comp-1",
          categoryClaim: "Security Suite",
          axes: { x: 50, y: 50 },
        },
      ],
      opportunities: [
        {
          id: "opp-1",
          kind: "PRICING",
          gap: "Opaque pricing",
          suggestedMove: "Transparent tiers",
          rank: 1,
        },
      ],
      evidences: [
        {
          id: "ev-1",
          claimType: "TARGET_PROFILE",
          claimId: "profile-1",
          url: "https://flank.dev",
          excerpt: "Flank",
        },
        {
          id: "ev-2",
          claimType: "COMPETITOR",
          claimId: "comp-1",
          url: "https://comp1.com",
          excerpt: "Comp 1",
        },
        {
          id: "ev-3",
          claimType: "COMPETITOR",
          claimId: "comp-2",
          url: "https://comp2.com",
          excerpt: "Comp 2",
        },
        {
          id: "ev-4",
          claimType: "PRICING_PLAN",
          claimId: "plan-1",
          url: "https://comp1.com/pricing",
          excerpt: "$49",
        },
        {
          id: "ev-5",
          claimType: "FEATURE_CLAIM",
          claimId: "claim-1",
          url: "https://comp1.com/features",
          excerpt: "SSO",
        },
        {
          id: "ev-6",
          claimType: "POSITIONING",
          claimId: "pos-1",
          url: "https://comp1.com/about",
          excerpt: "Security",
        },
        {
          id: "ev-7",
          claimType: "OPPORTUNITY",
          claimId: "opp-1",
          url: "https://comp1.com",
          excerpt: "Pricing quote",
        },
      ],
    };

    it("passes all quality gates on a fully grounded, complete run", () => {
      const report = QualityEvaluator.evaluateRunQuality(mockValidRunInputs);

      assert.strictEqual(report.overallStatus, "PASS");
      assert.strictEqual(report.canPublish, true);
      assert.strictEqual(report.blockingReasons.length, 0);
      assert.strictEqual(report.retryDirective, null);
      assert.ok(report.score >= 80, `Expected score >= 80, got ${report.score}`);
    });

    it("blocks publication and issues a PROFILER retry directive when TargetProfile is missing", () => {
      const missingProfileInputs: QualityEvaluationInputs = {
        ...mockValidRunInputs,
        profile: null,
      };

      const report = QualityEvaluator.evaluateRunQuality(missingProfileInputs);

      assert.strictEqual(report.canPublish, false);
      assert.strictEqual(report.overallStatus, "REJECT");
      assert.ok(report.blockingReasons.some((r) => r.includes("Missing TargetProfile")));
      assert.strictEqual(report.retryDirective?.targetStage, "PROFILER");
    });

    it("blocks publication and routes to VERIFIER when 0 competitors were verified", () => {
      const zeroCompetitorsInputs: QualityEvaluationInputs = {
        ...mockValidRunInputs,
        competitors: [],
      };

      const report = QualityEvaluator.evaluateRunQuality(zeroCompetitorsInputs);

      assert.strictEqual(report.canPublish, false);
      assert.strictEqual(report.overallStatus, "REJECT");
      assert.strictEqual(report.retryDirective?.targetStage, "VERIFIER");
    });

    it("detects contradictions when a feature claim is both 'YES' and 'announced'", () => {
      const contradictoryInputs: QualityEvaluationInputs = {
        ...mockValidRunInputs,
        featureClaims: [
          {
            id: "claim-bad",
            competitorId: "comp-1",
            featureId: "feat-1",
            support: "YES",
            shippingState: "announced",
          },
        ],
      };

      const report = QualityEvaluator.evaluateRunQuality(contradictoryInputs);

      const featureStage = report.stageScores.find((s) => s.stageKey === "FEATURE");
      assert.ok(featureStage);
      assert.strictEqual(featureStage?.contradictionCount, 1);
      assert.strictEqual(featureStage?.status, "REJECT");
      assert.strictEqual(report.retryDirective?.targetStage, "FEATURE");
    });

    it("penalizes sourcing score when claims lack backing Evidence rows", () => {
      const ungroundedInputs: QualityEvaluationInputs = {
        ...mockValidRunInputs,
        evidences: [], // zero evidence rows
      };

      const report = QualityEvaluator.evaluateRunQuality(ungroundedInputs);

      assert.ok(report.sourcing < 60, `Expected sourcing score < 60, got ${report.sourcing}`);
      assert.ok(report.warnings.length >= 3, "Expected multiple sourcing warnings");
    });
  });
});
