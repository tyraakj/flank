import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  FeatureTaxonomyNodeSchema,
  ExtractedFeatureItemSchema,
  CompetitorFeatureExtractionSchema,
  FeatureStageOutputSchema,
} from "@flank/shared";
import { FeatureTaxonomyService } from "../services/feature-taxonomy";
import { computeDeterministicFeatureFallback, discoverFeatureUrls } from "./feature";

describe("Unit 15: Feature Agent & Taxonomy Contracts & Logic", () => {
  describe("Contracts & Schemas", () => {
    it("validates a FeatureTaxonomyNode", () => {
      const node = {
        name: "Single Sign-On (SSO)",
        slug: "single-sign-on-sso",
        category: "Security & Access",
        description: "Enterprise SAML/OIDC identity provider login.",
        aliases: ["sso", "saml", "saml login"],
      };

      const parsed = FeatureTaxonomyNodeSchema.safeParse(node);
      assert.strictEqual(parsed.success, true);
    });

    it("validates an ExtractedFeatureItem with shipped YES support", () => {
      const item = {
        verbatimLabel: "Okta & SAML 2.0 Integration",
        canonicalName: "Single Sign-On (SSO)",
        category: "Security & Access",
        support: "YES" as const,
        shippingState: "shipped" as const,
        detail: "Available on Enterprise plan with SCIM user provisioning.",
        sourceUrl: "https://example.com/features/security",
        excerpt: "We support SAML 2.0 and Okta SSO on Enterprise tiers.",
        confidence: 90,
      };

      const parsed = ExtractedFeatureItemSchema.safeParse(item);
      assert.strictEqual(parsed.success, true);
    });

    it("validates an announced feature with UNKNOWN support status", () => {
      const item = {
        verbatimLabel: "Audit Logs (Coming Soon)",
        canonicalName: "Audit Logs",
        category: "Security & Access",
        support: "UNKNOWN" as const,
        shippingState: "announced" as const,
        detail: "On Q4 public roadmap.",
        sourceUrl: "https://example.com/roadmap",
        excerpt: "Audit Logs: Coming soon in Q4 2026.",
        confidence: 85,
      };

      const parsed = ExtractedFeatureItemSchema.safeParse(item);
      assert.strictEqual(parsed.success, true);
    });

    it("validates an explicit negative support claim", () => {
      const item = {
        verbatimLabel: "Self-Hosted Deployment",
        canonicalName: "Self-Hosted & On-Premises",
        category: "Infrastructure",
        support: "NO" as const,
        shippingState: "shipped" as const,
        detail: "Cloud SaaS only; no on-prem version available.",
        sourceUrl: "https://example.com/faq",
        excerpt: "Does not support on-premise or self-hosted deployments.",
        confidence: 95,
      };

      const parsed = ExtractedFeatureItemSchema.safeParse(item);
      assert.strictEqual(parsed.success, true);
    });

    it("rejects invalid support status", () => {
      const item = {
        verbatimLabel: "SSO",
        canonicalName: "Single Sign-On (SSO)",
        support: "INVALID_STATUS",
        detail: "Some detail",
        sourceUrl: "https://example.com",
        excerpt: "SSO support",
      };

      const parsed = ExtractedFeatureItemSchema.safeParse(item);
      assert.strictEqual(parsed.success, false);
    });

    it("validates CompetitorFeatureExtractionSchema", () => {
      const extraction = {
        features: [
          {
            verbatimLabel: "REST API",
            canonicalName: "REST API Access",
            category: "Integrations & API",
            support: "YES" as const,
            shippingState: "shipped" as const,
            detail: "Full REST API with personal access tokens.",
            sourceUrl: "https://example.com/docs",
            excerpt: "Use our REST API to automate workflows.",
            confidence: 85,
          },
        ],
        summary: "Robust developer-first platform with modern API.",
        keyStrengths: ["REST API Access"],
        notableGaps: [],
      };

      const parsed = CompetitorFeatureExtractionSchema.safeParse(extraction);
      assert.strictEqual(parsed.success, true);
    });

    it("validates FeatureStageOutputSchema", () => {
      const output = {
        targetId: "target-123",
        competitorsEvaluated: 5,
        featurePagesFound: 12,
        featurePagesRead: 10,
        taxonomyNodesCount: 8,
        claimsExtracted: 24,
        supportYesCount: 18,
        supportPartialCount: 3,
        supportNoCount: 1,
        supportUnknownCount: 2,
      };

      const parsed = FeatureStageOutputSchema.safeParse(output);
      assert.strictEqual(parsed.success, true);
    });
  });

  describe("FeatureTaxonomyService", () => {
    it("normalizes and collapses synonyms (SSO, SAML login, Okta) into Single Sign-On (SSO)", () => {
      const sso1 = FeatureTaxonomyService.resolveCanonicalFeature("SSO");
      assert.strictEqual(sso1.canonicalName, "Single Sign-On (SSO)");
      assert.strictEqual(sso1.slug, "single-sign-on-sso");
      assert.strictEqual(sso1.category, "Security & Access");

      const sso2 = FeatureTaxonomyService.resolveCanonicalFeature("SAML Login");
      assert.strictEqual(sso2.canonicalName, "Single Sign-On (SSO)");

      const sso3 = FeatureTaxonomyService.resolveCanonicalFeature("Okta Integration");
      assert.strictEqual(sso3.canonicalName, "Single Sign-On (SSO)");
    });

    it("resolves 2FA and Multi-Factor Auth synonyms", () => {
      const mfa1 = FeatureTaxonomyService.resolveCanonicalFeature("2FA");
      assert.strictEqual(mfa1.canonicalName, "Multi-Factor Authentication (MFA)");
      assert.strictEqual(mfa1.slug, "multi-factor-authentication-mfa");

      const mfa2 = FeatureTaxonomyService.resolveCanonicalFeature("Two-factor Authentication");
      assert.strictEqual(mfa2.canonicalName, "Multi-Factor Authentication (MFA)");
    });

    it("resolves RBAC and User Permissions synonyms", () => {
      const rbac1 = FeatureTaxonomyService.resolveCanonicalFeature("RBAC");
      assert.strictEqual(rbac1.canonicalName, "Role-Based Access Control (RBAC)");

      const rbac2 = FeatureTaxonomyService.resolveCanonicalFeature("Roles and Permissions");
      assert.strictEqual(rbac2.canonicalName, "Role-Based Access Control (RBAC)");
    });

    it("resolves Audit Trail and Audit Logging synonyms", () => {
      const audit = FeatureTaxonomyService.resolveCanonicalFeature("Audit Trail");
      assert.strictEqual(audit.canonicalName, "Audit Logs");
      assert.strictEqual(audit.slug, "audit-logs");
    });

    it("creates clean canonical names and slugs for novel unindexed features", () => {
      const custom = FeatureTaxonomyService.resolveCanonicalFeature(
        "ai automated video transcriber",
        "AI Features",
      );
      assert.strictEqual(custom.canonicalName, "Ai Automated Video Transcriber");
      assert.strictEqual(custom.slug, "ai-automated-video-transcriber");
      assert.strictEqual(custom.category, "AI Features");
      assert.strictEqual(custom.matchedExisting, false);
    });
  });

  describe("discoverFeatureUrls", () => {
    it("finds feature, doc, platform, and changelog links from HTML", () => {
      const html = `
        <html>
          <body>
            <nav>
              <a href="/features">Product Features</a>
              <a href="/platform/architecture">Platform</a>
              <a href="/docs/api">Documentation</a>
              <a href="/changelog">What's New</a>
              <a href="https://external.com/docs">External</a>
            </nav>
          </body>
        </html>
      `;

      const urls = discoverFeatureUrls({
        homepageUrl: "https://saas.app",
        homepageHtml: html,
      });

      assert.ok(urls.includes("https://saas.app/features"));
      assert.ok(urls.includes("https://saas.app/platform/architecture"));
      assert.ok(urls.includes("https://saas.app/docs/api"));
      assert.ok(urls.includes("https://saas.app/changelog"));
      assert.ok(!urls.includes("https://external.com/docs"));
    });

    it("provides standard fallback paths when no HTML links found", () => {
      const urls = discoverFeatureUrls({
        homepageUrl: "https://company.io",
      });

      assert.ok(urls.includes("https://company.io/features"));
      assert.ok(urls.includes("https://company.io/product"));
      assert.ok(urls.includes("https://company.io/docs"));
    });
  });

  describe("computeDeterministicFeatureFallback", () => {
    it("extracts multiple standard feature signatures with correct support states", () => {
      const text = `
        Features & Security Overview:
        - We support SAML 2.0 Single Sign On for enterprise teams.
        - Multi-factor authentication (MFA / 2FA) is enforced on all accounts.
        - REST API access and Webhooks for developers.
        - Custom Dashboards with real-time CSV Export.
        - Team Workspaces for seamless collaboration.
        - Dark Mode theme toggle.
        - RBAC is enterprise only.
        - Does not support custom domain SSL.
        - Audit logs coming soon on our Q4 roadmap.
      `;

      const extraction = computeDeterministicFeatureFallback({
        pageText: text,
        sourceUrl: "https://competitor.com/features",
        competitorName: "Competitor",
      });

      assert.ok(extraction.features.length >= 6);

      // Check YES support
      const sso = extraction.features.find((f) => f.canonicalName === "Single Sign-On (SSO)");
      assert.ok(sso);
      assert.strictEqual(sso?.support, "YES");
      assert.strictEqual(sso?.shippingState, "shipped");

      // Check PARTIAL support
      const rbac = extraction.features.find(
        (f) => f.canonicalName === "Role-Based Access Control (RBAC)",
      );
      assert.ok(rbac);
      assert.strictEqual(rbac?.support, "PARTIAL");

      // Check NO support
      const customDomain = extraction.features.find(
        (f) => f.canonicalName === "Custom Domain & SSL",
      );
      assert.ok(customDomain);
      assert.strictEqual(customDomain?.support, "NO");

      // Check announced / roadmap support (UNKNOWN)
      const audit = extraction.features.find((f) => f.canonicalName === "Audit Logs");
      assert.ok(audit);
      assert.strictEqual(audit?.shippingState, "announced");
      assert.strictEqual(audit?.support, "UNKNOWN");
    });
  });
});
