import { describe, it } from "node:test";
import * as assert from "node:assert";
import {
  CompetitorPositioningDataSchema,
  PositioningMapSchema,
  PositioningStageOutputSchema,
} from "@flank/shared";
import {
  PositioningMapService,
  EntitySignalPacket,
} from "../services/positioning-map";
import {
  computeDeterministicPositioningFallback,
  discoverPositioningUrls,
} from "./positioning";

describe("Unit 16: Positioning Agent & 2x2 Map Logic", () => {
  describe("Zod Contracts Validation", () => {
    it("validates CompetitorPositioningData", () => {
      const data = {
        icp: "Engineering Leaders and DevOps Architects",
        categoryClaim: "The AI-native developer data platform",
        differentiators: [
          "Zero-latency edge indexing",
          "SOC 2 Type II compliance",
          "Automated schema migrations",
        ],
        tone: "Developer-First / Technical",
        headlineValueProps: [
          "Ship features 10x faster with AI-native data pipelines",
          "Unified data layer for modern microservices",
        ],
        sourceUrls: ["https://example.com", "https://example.com/about"],
        excerpt: "Ship features 10x faster with AI-native data pipelines.",
        confidence: 90,
      };

      const parsed = CompetitorPositioningDataSchema.safeParse(data);
      assert.strictEqual(parsed.success, true);
    });

    it("validates PositioningMapSchema", () => {
      const map = {
        xAxis: {
          name: "Price & Monetization Posture",
          lowLabel: "Accessible / Self-Serve",
          highLabel: "Enterprise Custom Quote",
          metricKey: "price_monetization",
        },
        yAxis: {
          name: "Feature Breadth & Platform Scope",
          lowLabel: "Focused Point Solution",
          highLabel: "All-in-One Enterprise Platform",
          metricKey: "feature_breadth",
        },
        coordinates: [
          {
            competitorId: "comp-1",
            name: "EnterpriseSuite",
            isTarget: false,
            x: 85,
            y: 90,
            clusterId: "cluster-1",
            clusterName: "Enterprise All-in-One Platforms",
            rationale: "Enterprise quote; 12 verified features.",
          },
          {
            competitorId: "comp-2",
            name: "DevTool Lite",
            isTarget: false,
            x: 20,
            y: 25,
            clusterId: "cluster-2",
            clusterName: "Accessible Point Solutions",
            rationale: "Free self-serve plan; 2 features.",
          },
        ],
        clusters: [
          {
            id: "cluster-1",
            label: "Enterprise All-in-One Platforms",
            description: "High price with deep enterprise feature set.",
            entityIds: ["comp-1"],
            centroid: { x: 85, y: 90 },
          },
          {
            id: "cluster-2",
            label: "Accessible Point Solutions",
            description: "Low cost focused tool.",
            entityIds: ["comp-2"],
            centroid: { x: 20, y: 25 },
          },
        ],
        whitespaces: [
          {
            id: "ws-1",
            quadrant: "High Feature Breadth / Accessible Self-Serve",
            xRange: [0, 50] as [number, number],
            yRange: [50, 100] as [number, number],
            opportunity: "Price-Disruptive Alternative",
            rationale: "Zero occupants in this quadrant.",
          },
        ],
        summary: "Competitive landscape map with 2 entities.",
      };

      const parsed = PositioningMapSchema.safeParse(map);
      assert.strictEqual(parsed.success, true);
    });

    it("validates PositioningStageOutputSchema", () => {
      const output = {
        targetId: "target-123",
        competitorsEvaluated: 6,
        positioningsPersisted: 6,
        mapGenerated: true,
        clustersCount: 3,
        whitespaceCount: 2,
      };

      const parsed = PositioningStageOutputSchema.safeParse(output);
      assert.strictEqual(parsed.success, true);
    });
  });

  describe("PositioningMapService Coordinate Calculations", () => {
    it("places enterprise custom quote platforms in the top-right quadrant", () => {
      const enterpriseEntity: EntitySignalPacket = {
        id: "comp-enterprise",
        name: "MegaCorp Suite",
        isTarget: false,
        pricingModel: "Enterprise Custom Quote",
        plansCount: 1,
        highestPriceAmount: null,
        hasCustomEnterpriseQuote: true,
        featuresCount: 12,
        enterpriseFeaturesCount: 4,
      };

      const { x, y } = PositioningMapService.computeEntityCoordinate(enterpriseEntity);
      assert.ok(x >= 70, `Expected X >= 70 for enterprise, got ${x}`);
      assert.ok(y >= 70, `Expected Y >= 70 for enterprise platform, got ${y}`);
    });

    it("places lightweight freemium point solutions in the bottom-left quadrant", () => {
      const freemiumEntity: EntitySignalPacket = {
        id: "comp-free",
        name: "QuickTool",
        isTarget: false,
        pricingModel: "Freemium",
        plansCount: 2,
        highestPriceAmount: 19,
        hasCustomEnterpriseQuote: false,
        featuresCount: 2,
        enterpriseFeaturesCount: 0,
      };

      const { x, y } = PositioningMapService.computeEntityCoordinate(freemiumEntity);
      assert.ok(x <= 40, `Expected X <= 40 for low-cost tool, got ${x}`);
      assert.ok(y <= 45, `Expected Y <= 45 for point solution, got ${y}`);
    });

    it("places high-value self-serve disruptors in the top-left quadrant", () => {
      const disruptorEntity: EntitySignalPacket = {
        id: "comp-disruptor",
        name: "OpenPlatform",
        isTarget: false,
        pricingModel: "Per-Seat Subscription",
        plansCount: 3,
        highestPriceAmount: 39,
        hasCustomEnterpriseQuote: false,
        featuresCount: 10,
        enterpriseFeaturesCount: 3,
      };

      const { x, y } = PositioningMapService.computeEntityCoordinate(disruptorEntity);
      assert.ok(x <= 50, `Expected X <= 50 for accessible pricing, got ${x}`);
      assert.ok(y >= 65, `Expected Y >= 65 for broad features, got ${y}`);
    });
  });

  describe("PositioningMapService Clustering & Whitespace", () => {
    it("groups proximate entities into clusters and identifies whitespace", () => {
      const entities: EntitySignalPacket[] = [
        {
          id: "comp-1",
          name: "Suite A",
          isTarget: false,
          plansCount: 1,
          hasCustomEnterpriseQuote: true,
          featuresCount: 10,
          enterpriseFeaturesCount: 3,
        },
        {
          id: "comp-2",
          name: "Suite B",
          isTarget: false,
          plansCount: 1,
          hasCustomEnterpriseQuote: true,
          featuresCount: 11,
          enterpriseFeaturesCount: 4,
        },
        {
          id: "target-1",
          name: "Target App",
          isTarget: true,
          plansCount: 2,
          highestPriceAmount: 29,
          hasCustomEnterpriseQuote: false,
          featuresCount: 3,
          enterpriseFeaturesCount: 0,
        },
      ];

      const map = PositioningMapService.generatePositioningMap(entities);

      assert.strictEqual(map.coordinates.length, 3);
      assert.ok(map.clusters.length >= 1, "Should identify at least 1 cluster");
      assert.ok(map.whitespaces.length >= 1, "Should identify at least 1 whitespace quadrant");

      // Suite A and Suite B should cluster together
      const suiteA = map.coordinates.find((c) => c.competitorId === "comp-1");
      const suiteB = map.coordinates.find((c) => c.competitorId === "comp-2");
      assert.ok(suiteA?.clusterId);
      assert.strictEqual(suiteA?.clusterId, suiteB?.clusterId);
    });
  });

  describe("computeDeterministicPositioningFallback", () => {
    it("derives ICP, category claim, headline value props, and tone from HTML & text", () => {
      const html = `
        <html>
          <head>
            <title>Acme Developer Platform - Automated CI/CD for Modern Cloud</title>
            <meta name="description" content="Ship resilient software faster with automated developer CI/CD workflows." />
          </head>
          <body>
            <h1>Automate your continuous delivery with zero configuration</h1>
          </body>
        </html>
      `;

      const text = `
        Automate your continuous delivery with zero configuration.
        Designed for software engineers, technical leads, and engineering teams.
        Includes robust REST APIs, developer CLI, and GitHub integration.
      `;

      const result = computeDeterministicPositioningFallback({
        pageText: text,
        pageHtml: html,
        sourceUrl: "https://acme.dev",
        competitorName: "Acme",
        featuresCount: 8,
      });

      assert.strictEqual(result.tone, "Developer-First / Technical");
      assert.ok(result.icp.toLowerCase().includes("engineer"));
      assert.ok(result.headlineValueProps.length >= 1);
      assert.strictEqual(
        result.headlineValueProps[0],
        "Automate your continuous delivery with zero configuration",
      );
      assert.ok(result.differentiators.length >= 1);
    });
  });

  describe("discoverPositioningUrls", () => {
    it("finds about, company, solutions, and customers links from HTML", () => {
      const html = `
        <html>
          <body>
            <nav>
              <a href="/about-us">About Us</a>
              <a href="/company">Company</a>
              <a href="/customers/case-studies">Customers</a>
              <a href="/solutions/enterprise">Enterprise Solutions</a>
              <a href="https://external.com/about">External</a>
            </nav>
          </body>
        </html>
      `;

      const urls = discoverPositioningUrls({
        homepageUrl: "https://acme.dev",
        homepageHtml: html,
      });

      assert.ok(urls.includes("https://acme.dev/about-us"));
      assert.ok(urls.includes("https://acme.dev/company"));
      assert.ok(urls.includes("https://acme.dev/customers/case-studies"));
      assert.ok(urls.includes("https://acme.dev/solutions/enterprise"));
      assert.ok(!urls.includes("https://external.com/about"));
    });

    it("provides standard fallback paths", () => {
      const urls = discoverPositioningUrls({
        homepageUrl: "https://saas.app",
      });

      assert.ok(urls.includes("https://saas.app/about"));
      assert.ok(urls.includes("https://saas.app/company"));
      assert.ok(urls.includes("https://saas.app/solutions"));
    });
  });
});
