import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  OpportunityItemSchema,
  StrategistExtractionSchema,
  OpportunityStageOutputSchema,
  OpportunityItem,
} from "@flank/shared";
import { OpportunityRankingService } from "../services/opportunity-ranking";
import { computeDeterministicStrategyFallback } from "./strategist";

describe("Unit 17: Strategist Agent & Opportunity Ranking", () => {
  describe("Zod Contracts Validation", () => {
    it("validates an OpportunityItem", () => {
      const opp: OpportunityItem = {
        kind: "PRICING",
        gap: "Opaque Enterprise Custom Quoting among Market Incumbents",
        supportingCompetitorIds: ["comp-1", "comp-2"],
        absentCompetitorIds: ["comp-3"],
        suggestedMove: "Publish 100% transparent tiered pricing with instant onboarding.",
        whatToSay: "Enterprise power without the sales friction. Transparent pricing, no mandatory demo.",
        rationale: "Competitors gate core features behind Contact Sales forms.",
        impact: 5,
        effort: 2,
        defensibility: 4,
        evidenceExcerpts: ["Competitor 1 requires sales quote."],
        sourceUrls: ["https://example.com/pricing"],
        confidence: 90,
      };

      const parsed = OpportunityItemSchema.safeParse(opp);
      assert.strictEqual(parsed.success, true);
    });

    it("validates StrategistExtractionSchema", () => {
      const extraction = {
        opportunities: [
          {
            kind: "PRODUCT" as const,
            gap: "Democratized SAML Single Sign-On",
            supportingCompetitorIds: ["comp-1"],
            absentCompetitorIds: [],
            suggestedMove: "Include SSO in standard plans.",
            whatToSay: "Security is not a luxury.",
            rationale: "Competitors charge a 5x enterprise tax for SSO.",
            impact: 4,
            effort: 2,
            defensibility: 3,
            evidenceExcerpts: ["SSO only on Enterprise plan."],
            sourceUrls: ["https://example.com"],
            confidence: 85,
          },
        ],
        strategicSummary: "Strong self-serve positioning opportunities exist.",
        primaryWedge: "Transparent Self-Serve Pricing",
      };

      const parsed = StrategistExtractionSchema.safeParse(extraction);
      assert.strictEqual(parsed.success, true);
    });

    it("validates OpportunityStageOutputSchema", () => {
      const output = {
        targetId: "target-123",
        candidatesGenerated: 8,
        opportunitiesPersisted: 5,
        byKind: {
          PRODUCT: 2,
          PRICING: 1,
          POSITIONING: 1,
          MARKETING: 1,
        },
        topOpportunity: "Opaque Enterprise Pricing",
      };

      const parsed = OpportunityStageOutputSchema.safeParse(output);
      assert.strictEqual(parsed.success, true);
    });
  });

  describe("OpportunityRankingService Scoring & Deduplication", () => {
    it("calculates higher priority scores for high-impact, low-effort opportunities with rich evidence", () => {
      const highValueOpp: OpportunityItem = {
        kind: "PRICING",
        gap: "Transparent Self-Serve Pricing",
        supportingCompetitorIds: ["comp-1", "comp-2", "comp-3"],
        absentCompetitorIds: ["comp-4"],
        suggestedMove: "Instant self-serve tiers.",
        whatToSay: "No demo required.",
        rationale: "Opaque incumbent pricing.",
        impact: 5,
        effort: 1, // lowest effort (easiest)
        defensibility: 4,
        evidenceExcerpts: ["Quote 1", "Quote 2", "Quote 3"],
        sourceUrls: [],
        confidence: 95,
      };

      const lowValueOpp: OpportunityItem = {
        kind: "PRODUCT",
        gap: "Minor Custom Dark Theme",
        supportingCompetitorIds: ["comp-1"],
        absentCompetitorIds: [],
        suggestedMove: "Add dark theme.",
        whatToSay: "Dark mode.",
        rationale: "Nice to have.",
        impact: 1,
        effort: 4, // hard effort
        defensibility: 1,
        evidenceExcerpts: [],
        sourceUrls: [],
        confidence: 60,
      };

      const highScore = OpportunityRankingService.calculateScore(highValueOpp);
      const lowScore = OpportunityRankingService.calculateScore(lowValueOpp);

      assert.ok(
        highScore > lowScore * 2,
        `Expected highScore (${highScore}) to be significantly greater than lowScore (${lowScore})`,
      );
    });

    it("deduplicates similar opportunities within the same kind", () => {
      const opp1: OpportunityItem = {
        kind: "PRODUCT",
        gap: "Enterprise SAML Single Sign-On and Access Control",
        supportingCompetitorIds: ["comp-1"],
        absentCompetitorIds: [],
        suggestedMove: "Implement SAML 2.0 and OIDC single sign on.",
        whatToSay: "SSO included.",
        rationale: "Incumbents gate SSO.",
        impact: 4,
        effort: 3,
        defensibility: 3,
        evidenceExcerpts: ["Excerpt 1"],
        sourceUrls: ["https://example.com/1"],
        confidence: 80,
      };

      const opp2: OpportunityItem = {
        kind: "PRODUCT",
        gap: "SAML SSO and Single Sign-On Identity Provider",
        supportingCompetitorIds: ["comp-2"],
        absentCompetitorIds: ["comp-3"],
        suggestedMove: "Add SAML SSO identity login for teams.",
        whatToSay: "Enterprise SSO.",
        rationale: "Enterprise SSO demand.",
        impact: 5,
        effort: 2,
        defensibility: 4,
        evidenceExcerpts: ["Excerpt 2"],
        sourceUrls: ["https://example.com/2"],
        confidence: 90,
      };

      const deduplicated = OpportunityRankingService.deduplicateOpportunities([opp1, opp2]);

      assert.strictEqual(deduplicated.length, 1);
      assert.strictEqual(deduplicated[0].impact, 5);
      assert.strictEqual(deduplicated[0].effort, 2);
      assert.strictEqual(deduplicated[0].supportingCompetitorIds.length, 2);
      assert.strictEqual(deduplicated[0].evidenceExcerpts.length, 2);
    });

    it("ranks opportunities with sequential 1-based ranks", () => {
      const items: OpportunityItem[] = [
        {
          kind: "MARKETING",
          gap: "Low priority minor blog post",
          supportingCompetitorIds: [],
          absentCompetitorIds: [],
          suggestedMove: "Post blog.",
          whatToSay: "Read our blog.",
          rationale: "Content.",
          impact: 1,
          effort: 4,
          defensibility: 1,
          evidenceExcerpts: [],
          sourceUrls: [],
          confidence: 60,
        },
        {
          kind: "PRICING",
          gap: "High priority pricing disruption",
          supportingCompetitorIds: ["c1", "c2"],
          absentCompetitorIds: [],
          suggestedMove: "Launch free tier.",
          whatToSay: "Free forever.",
          rationale: "Wedge.",
          impact: 5,
          effort: 1,
          defensibility: 4,
          evidenceExcerpts: ["Ex 1", "Ex 2"],
          sourceUrls: [],
          confidence: 95,
        },
      ];

      const ranked = OpportunityRankingService.rankOpportunities(items, 5);

      assert.strictEqual(ranked.length, 2);
      assert.strictEqual(ranked[0].rank, 1);
      assert.strictEqual(ranked[0].gap, "High priority pricing disruption");
      assert.strictEqual(ranked[1].rank, 2);
    });
  });

  describe("computeDeterministicStrategyFallback", () => {
    it("generates structured opportunities across multiple dimensions from competitor data", () => {
      const fallback = computeDeterministicStrategyFallback({
        targetName: "MyTargetApp",
        category: "Developer Tooling",
        competitors: [
          {
            id: "comp-1",
            name: "LegacyCorp",
            pricingPlans: [{ name: "Enterprise", amount: null, band: "CUSTOM" }],
            featureClaims: [
              { featureName: "Single Sign-On (SSO)", support: "YES" },
              { featureName: "REST API Access", support: "YES" },
            ],
            positioning: { icp: "Enterprise IT", tone: "Enterprise / Governance" },
          },
          {
            id: "comp-2",
            name: "OldSuite",
            pricingPlans: [{ name: "Contact Sales", amount: null, band: "CUSTOM" }],
            featureClaims: [
              { featureName: "Single Sign-On (SSO)", support: "YES" },
              { featureName: "REST API Access", support: "YES" },
            ],
            positioning: { icp: "Security Officers", tone: "Enterprise / Governance" },
          },
        ],
      });

      assert.ok(fallback.opportunities.length >= 3);
      assert.ok(fallback.opportunities.some((o) => o.kind === "PRICING"));
      assert.ok(fallback.opportunities.some((o) => o.kind === "PRODUCT"));
      assert.ok(fallback.opportunities.some((o) => o.kind === "POSITIONING"));
      assert.ok(fallback.primaryWedge.length > 5);
    });
  });
});
