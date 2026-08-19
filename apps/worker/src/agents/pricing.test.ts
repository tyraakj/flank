import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  PricingPlanSchema,
  CompetitorPricingExtractionSchema,
  PricingStageOutputSchema,
} from "@flank/shared";
import { computeDeterministicPricingFallback, discoverPricingUrls } from "./pricing";

describe("Unit 14: Pricing Agent Contracts & Logic", () => {
  describe("PricingPlanSchema validation", () => {
    it("validates a published monthly plan", () => {
      const plan = {
        name: "Pro",
        band: "GROWTH" as const,
        amount: 29,
        currency: "USD",
        interval: "MONTHLY" as const,
        seatModel: "per user/month",
        usageLimits: ["Up to 10 team members", "10,000 API requests"],
        includedFeatures: ["Advanced Analytics", "Custom Dashboards", "Priority Email Support"],
        addOns: ["Extra 1,000 API calls for $5"],
        availability: "published" as const,
        sourceUrl: "https://example.com/pricing",
        rawPriceString: "$29 / user / month",
        excerpt:
          "Pro Plan: $29/user/month billed monthly. Includes Advanced Analytics and 10k API requests.",
        confidence: 90,
      };

      const parsed = PricingPlanSchema.safeParse(plan);
      assert.strictEqual(parsed.success, true);
    });

    it("validates an annual variant plan", () => {
      const plan = {
        name: "Pro (Annual)",
        band: "GROWTH" as const,
        amount: 288,
        currency: "USD",
        interval: "YEARLY" as const,
        seatModel: "per user/year",
        usageLimits: [],
        includedFeatures: ["All Pro features"],
        addOns: [],
        availability: "published" as const,
        sourceUrl: "https://example.com/pricing",
        rawPriceString: "$288 / year",
        excerpt: "Pro Annual: $288 billed annually ($24/mo equivalent).",
        confidence: 85,
      };

      const parsed = PricingPlanSchema.safeParse(plan);
      assert.strictEqual(parsed.success, true);
    });

    it("validates a contact-sales custom plan with null amount", () => {
      const plan = {
        name: "Enterprise",
        band: "CUSTOM" as const,
        amount: null,
        currency: "USD",
        interval: "MONTHLY" as const,
        seatModel: "custom quote",
        usageLimits: ["Unlimited seats", "Dedicated infrastructure"],
        includedFeatures: ["SSO / SAML", "Custom SLA", "Dedicated Account Manager"],
        addOns: [],
        availability: "contact-sales" as const,
        sourceUrl: "https://example.com/pricing",
        rawPriceString: "Contact Sales",
        excerpt: "Enterprise: Contact sales for volume discounts and custom deployments.",
        confidence: 95,
      };

      const parsed = PricingPlanSchema.safeParse(plan);
      assert.strictEqual(parsed.success, true);
    });

    it("validates a free tier plan", () => {
      const plan = {
        name: "Free Forever",
        band: "FREE" as const,
        amount: 0,
        currency: "USD",
        interval: "MONTHLY" as const,
        seatModel: "free",
        usageLimits: ["1 user only", "100 credits"],
        includedFeatures: ["Basic features"],
        addOns: [],
        availability: "free" as const,
        sourceUrl: "https://example.com/pricing",
        rawPriceString: "$0",
        excerpt: "Free Forever plan: $0/mo. Perfect for hobbyists.",
        confidence: 90,
      };

      const parsed = PricingPlanSchema.safeParse(plan);
      assert.strictEqual(parsed.success, true);
    });

    it("rejects invalid band values", () => {
      const plan = {
        name: "Pro",
        band: "INVALID_BAND",
        amount: 29,
        currency: "USD",
        interval: "MONTHLY",
        availability: "published",
        sourceUrl: "https://example.com/pricing",
        excerpt: "Pro: $29/mo",
      };

      const parsed = PricingPlanSchema.safeParse(plan);
      assert.strictEqual(parsed.success, false);
    });
  });

  describe("CompetitorPricingExtractionSchema", () => {
    it("validates a complete competitor pricing response", () => {
      const extraction = {
        plans: [
          {
            name: "Free",
            band: "FREE" as const,
            amount: 0,
            currency: "USD",
            interval: "MONTHLY" as const,
            seatModel: "free",
            usageLimits: [],
            includedFeatures: ["Community support"],
            addOns: [],
            availability: "free" as const,
            sourceUrl: "https://competitor.com/pricing",
            rawPriceString: "$0",
            excerpt: "Free tier: $0",
            confidence: 80,
          },
          {
            name: "Growth",
            band: "GROWTH" as const,
            amount: 49,
            currency: "USD",
            interval: "MONTHLY" as const,
            seatModel: "per seat/month",
            usageLimits: ["5 users"],
            includedFeatures: ["Everything in Free", "API Access"],
            addOns: [],
            availability: "published" as const,
            sourceUrl: "https://competitor.com/pricing",
            rawPriceString: "$49 / mo",
            excerpt: "Growth: $49/mo per seat",
            confidence: 85,
          },
        ],
        availabilitySummary: "published" as const,
        pricingModelType: "Freemium + Per-Seat Tiered Subscription",
        trialAvailable: true,
        trialDays: 14,
        notes: "14-day free trial available without credit card.",
      };

      const parsed = CompetitorPricingExtractionSchema.safeParse(extraction);
      assert.strictEqual(parsed.success, true);
    });
  });

  describe("PricingStageOutputSchema", () => {
    it("validates stage output metrics", () => {
      const output = {
        targetId: "target-123",
        competitorsEvaluated: 6,
        pricingPagesFound: 5,
        pricingPagesRead: 5,
        plansExtracted: 14,
        unavailablePricingCount: 1,
        competitorsDirectWithPricing: 3,
        warnings: [],
      };

      const parsed = PricingStageOutputSchema.safeParse(output);
      assert.strictEqual(parsed.success, true);
    });
  });

  describe("discoverPricingUrls", () => {
    it("extracts pricing links from anchor tags in HTML", () => {
      const html = `
        <html>
          <head><title>Test App</title></head>
          <body>
            <header>
              <a href="/features">Features</a>
              <a href="/pricing">Pricing</a>
              <a href="https://app.test.com/plans">Plans & Pricing</a>
              <a href="https://external.com/pricing">Partner</a>
            </header>
          </body>
        </html>
      `;

      const urls = discoverPricingUrls({
        homepageUrl: "https://test.com",
        homepageHtml: html,
      });

      assert.ok(urls.includes("https://test.com/pricing"));
      assert.ok(urls.some((u) => u.includes("/plans")));
      // External domain should be excluded
      assert.ok(!urls.includes("https://external.com/pricing"));
    });

    it("includes standard candidate fallback paths", () => {
      const urls = discoverPricingUrls({
        homepageUrl: "https://saas-company.io",
      });

      assert.ok(urls.includes("https://saas-company.io/pricing"));
      assert.ok(urls.includes("https://saas-company.io/plans"));
    });
  });

  describe("computeDeterministicPricingFallback", () => {
    it("extracts prices, free tier, and contact sales from text", () => {
      const text = `
        Simple, predictable pricing for teams of all sizes.
        Start for free with our Free Forever tier ($0/mo).
        Starter Plan: $29/mo with up to 5 seats and 1,000 requests.
        Pro Plan: $99/mo with unlimited seats and priority support.
        Enterprise: Contact sales for dedicated infrastructure and custom SLAs.
        Try any plan with a 14-day trial.
      `;

      const result = computeDeterministicPricingFallback({
        pageText: text,
        sourceUrl: "https://competitor.com/pricing",
        competitorName: "Competitor",
      });

      assert.ok(result.plans.length >= 3);
      assert.strictEqual(result.trialAvailable, true);
      assert.strictEqual(result.trialDays, 14);

      const freePlan = result.plans.find((p) => p.band === "FREE");
      assert.ok(freePlan, "Should find Free plan");
      assert.strictEqual(freePlan?.amount, 0);

      const starterPlan = result.plans.find((p) => p.amount === 29);
      assert.ok(starterPlan, "Should find $29 plan");
      assert.strictEqual(starterPlan?.currency, "USD");
      assert.strictEqual(starterPlan?.interval, "MONTHLY");

      const proPlan = result.plans.find((p) => p.amount === 99);
      assert.ok(proPlan, "Should find $99 plan");

      const enterprisePlan = result.plans.find((p) => p.band === "CUSTOM");
      assert.ok(enterprisePlan, "Should find Enterprise custom plan");
      assert.strictEqual(enterprisePlan?.amount, null);
      assert.strictEqual(enterprisePlan?.availability, "contact-sales");
    });

    it("handles contact-sales only pages gracefully without hallucinating amounts", () => {
      const text = `
        Custom Pricing for Enterprise Organizations.
        Talk to sales to build a custom plan tailored to your team's compliance and volume requirements.
        Request a quote today.
      `;

      const result = computeDeterministicPricingFallback({
        pageText: text,
        sourceUrl: "https://enterprise-only.com/pricing",
        competitorName: "Enterprise Only",
      });

      assert.ok(result.plans.length > 0);
      assert.strictEqual(
        result.plans.every((p) => p.amount === null),
        true,
      );
      assert.strictEqual(result.availabilitySummary, "contact-sales");
    });

    it("extracts Indian Rupees (INR / ₹ / Rs) pricing tiers accurately", () => {
      const text = `
        Simple pricing for Indian businesses and global teams.
        Free Community Plan (₹0/mo).
        Starter: ₹1,499/month for up to 5 team members.
        Pro: ₹4,999/mo with priority support.
        Enterprise: ₹24,999/yr or custom quote.
        14-day free trial.
      `;

      const result = computeDeterministicPricingFallback({
        pageText: text,
        sourceUrl: "https://competitor.in/pricing",
        competitorName: "Competitor India",
      });

      assert.ok(result.plans.length >= 3);
      assert.strictEqual(result.trialAvailable, true);
      assert.strictEqual(result.trialDays, 14);

      const freePlan = result.plans.find((p) => p.band === "FREE");
      assert.ok(freePlan, "Should find Free plan");
      assert.strictEqual(freePlan?.currency, "INR");
      assert.strictEqual(freePlan?.amount, 0);

      const starterPlan = result.plans.find((p) => p.amount === 1499);
      assert.ok(starterPlan, "Should find ₹1,499 plan");
      assert.strictEqual(starterPlan?.currency, "INR");
      assert.strictEqual(starterPlan?.interval, "MONTHLY");

      const proPlan = result.plans.find((p) => p.amount === 4999);
      assert.ok(proPlan, "Should find ₹4,999 plan");
      assert.strictEqual(proPlan?.currency, "INR");

      const enterprisePlan = result.plans.find((p) => p.amount === 24999);
      assert.ok(enterprisePlan, "Should find ₹24,999 enterprise tier");
      assert.strictEqual(enterprisePlan?.currency, "INR");
      assert.strictEqual(enterprisePlan?.band, "ENTERPRISE");
    });

    it("validates INR in PricingPlanSchema", () => {
      const inrPlan = {
        name: "Growth (India)",
        band: "GROWTH" as const,
        amount: 1999,
        currency: "INR",
        interval: "MONTHLY" as const,
        seatModel: "per seat/month",
        usageLimits: ["Up to 10 users"],
        includedFeatures: ["GST Invoicing", "UPI Integration"],
        addOns: [],
        availability: "published" as const,
        sourceUrl: "https://example.in/pricing",
        rawPriceString: "₹1,999 / mo",
        excerpt: "Growth Plan: ₹1,999/month billed monthly. Includes GST Invoicing.",
        confidence: 90,
      };

      const parsed = PricingPlanSchema.safeParse(inrPlan);
      assert.strictEqual(parsed.success, true);
    });
  });
});
