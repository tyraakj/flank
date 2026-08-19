import {
  PositioningMap,
  PositioningMapCoordinate,
  PositioningMapCluster,
  PositioningMapWhitespace,
  PositioningMapAxis,
} from "@flank/shared";

export interface EntitySignalPacket {
  id: string;
  name: string;
  isTarget: boolean;
  pricingModel?: string | null;
  plansCount: number;
  highestPriceAmount?: number | null;
  hasCustomEnterpriseQuote: boolean;
  featuresCount: number;
  enterpriseFeaturesCount: number; // SSO, RBAC, Audit Logs, SOC2
  tone?: string | null;
  category?: string | null;
}

export class PositioningMapService {
  static readonly DEFAULT_X_AXIS: PositioningMapAxis = {
    name: "Price & Monetization Posture",
    lowLabel: "Accessible / Self-Serve",
    highLabel: "Enterprise Custom Quote",
    metricKey: "price_monetization",
  };

  static readonly DEFAULT_Y_AXIS: PositioningMapAxis = {
    name: "Feature Breadth & Platform Scope",
    lowLabel: "Focused Point Solution",
    highLabel: "All-in-One Enterprise Platform",
    metricKey: "feature_breadth",
  };

  /**
   * Deterministically calculates (x, y) coordinates from 0 to 100 based on price and feature signals.
   */
  static computeEntityCoordinate(entity: EntitySignalPacket): {
    x: number;
    y: number;
    rationale: string;
  } {
    // 1. Calculate X-Axis (Price & Monetization Posture: 0 - 100)
    let x = 30; // default mid self-serve
    const priceRationaleParts: string[] = [];

    if (entity.hasCustomEnterpriseQuote && entity.plansCount <= 1) {
      x = 90;
      priceRationaleParts.push("Exclusive custom enterprise quote");
    } else if (entity.hasCustomEnterpriseQuote) {
      x = Math.min(85, 65 + (entity.highestPriceAmount ? Math.min(20, entity.highestPriceAmount / 50) : 10));
      priceRationaleParts.push("Tiered pricing with custom enterprise tier");
    } else if (entity.highestPriceAmount && entity.highestPriceAmount > 200) {
      x = Math.min(80, 50 + entity.highestPriceAmount / 15);
      priceRationaleParts.push(`Published high-tier pricing ($${entity.highestPriceAmount})`);
    } else if (entity.highestPriceAmount && entity.highestPriceAmount > 0) {
      x = Math.min(60, 25 + entity.highestPriceAmount / 6);
      priceRationaleParts.push(`Accessible paid tiers ($${entity.highestPriceAmount})`);
    } else if (entity.pricingModel?.toLowerCase().includes("free") || entity.pricingModel?.toLowerCase().includes("open source")) {
      x = 15;
      priceRationaleParts.push("Free / Open Source / Freemium model");
    } else {
      x = 35;
      priceRationaleParts.push("Standard self-serve pricing model");
    }

    // 2. Calculate Y-Axis (Feature Breadth & Platform Scope: 0 - 100)
    let y = 30;
    const featureRationaleParts: string[] = [];

    const totalFeatures = Math.max(0, entity.featuresCount);
    const enterpriseBonus = entity.enterpriseFeaturesCount * 10;
    const baseBreadthScore = Math.min(60, totalFeatures * 7);

    y = Math.min(95, Math.max(10, 15 + baseBreadthScore + enterpriseBonus));

    if (totalFeatures >= 8 || entity.enterpriseFeaturesCount >= 3) {
      featureRationaleParts.push(`Broad platform scope (${totalFeatures} features, ${entity.enterpriseFeaturesCount} enterprise capabilities)`);
    } else if (totalFeatures >= 4) {
      featureRationaleParts.push(`Moderate capability breadth (${totalFeatures} features)`);
    } else {
      featureRationaleParts.push(`Specialized point solution scope (${totalFeatures} features detected)`);
    }

    // Clamp coordinates to [5, 95] for clean chart margins
    const clampedX = Math.round(Math.max(5, Math.min(95, x)));
    const clampedY = Math.round(Math.max(5, Math.min(95, y)));

    const rationale = `${priceRationaleParts.join("; ")}. ${featureRationaleParts.join("; ")}. Placed at (${clampedX}, ${clampedY}).`;

    return {
      x: clampedX,
      y: clampedY,
      rationale,
    };
  }

  /**
   * Clusters entities in 2D space based on Euclidean proximity.
   */
  static clusterCoordinates(
    coordinates: PositioningMapCoordinate[],
  ): {
    clusteredCoordinates: PositioningMapCoordinate[];
    clusters: PositioningMapCluster[];
  } {
    if (coordinates.length === 0) {
      return { clusteredCoordinates: [], clusters: [] };
    }

    const clusters: PositioningMapCluster[] = [];
    const assigned = new Set<string>();

    // Distance threshold for clustering (in 0-100 space)
    const CLUSTER_DISTANCE_THRESHOLD = 32;

    let clusterIndex = 1;
    for (let i = 0; i < coordinates.length; i++) {
      const coordA = coordinates[i];
      if (assigned.has(coordA.competitorId)) continue;

      const clusterGroup: PositioningMapCoordinate[] = [coordA];
      assigned.add(coordA.competitorId);

      for (let j = i + 1; j < coordinates.length; j++) {
        const coordB = coordinates[j];
        if (assigned.has(coordB.competitorId)) continue;

        const dist = Math.hypot(coordA.x - coordB.x, coordA.y - coordB.y);
        if (dist <= CLUSTER_DISTANCE_THRESHOLD) {
          clusterGroup.push(coordB);
          assigned.add(coordB.competitorId);
        }
      }

      // Compute centroid
      const centroidX = Math.round(
        clusterGroup.reduce((sum, c) => sum + c.x, 0) / clusterGroup.length,
      );
      const centroidY = Math.round(
        clusterGroup.reduce((sum, c) => sum + c.y, 0) / clusterGroup.length,
      );

      // Generate descriptive cluster label based on centroid coordinates
      let label = "Mid-Market Growth Tools";
      let description = "Balanced feature set with standard tiered pricing.";

      if (centroidX >= 60 && centroidY >= 60) {
        label = "Enterprise All-in-One Platforms";
        description = "Comprehensive platform capabilities with enterprise-grade pricing and custom contracts.";
      } else if (centroidX <= 45 && centroidY >= 60) {
        label = "High-Value Disruptors";
        description = "Broad feature coverage delivered at accessible, transparent self-serve pricing.";
      } else if (centroidX <= 45 && centroidY <= 45) {
        label = "Accessible Point Solutions";
        description = "Focused, specialized tooling optimized for fast onboarding and individual/SMB budgets.";
      } else if (centroidX >= 60 && centroidY <= 45) {
        label = "Premium Niche Specialists";
        description = "High-touch specialized tools commanding premium pricing in focused domain workflows.";
      }

      const clusterId = `cluster-${clusterIndex}`;
      clusters.push({
        id: clusterId,
        label,
        description,
        entityIds: clusterGroup.map((c) => c.competitorId),
        centroid: { x: centroidX, y: centroidY },
      });

      // Update cluster association on coordinate records
      for (const c of clusterGroup) {
        c.clusterId = clusterId;
        c.clusterName = label;
      }

      clusterIndex++;
    }

    return {
      clusteredCoordinates: coordinates,
      clusters,
    };
  }

  /**
   * Identifies uncrowded market quadrants and formulates strategic whitespace opportunities.
   */
  static detectWhitespaces(
    coordinates: PositioningMapCoordinate[],
  ): PositioningMapWhitespace[] {
    const whitespaces: PositioningMapWhitespace[] = [];

    // Define 4 strategic quadrants in (0..100, 0..100)
    const quadrants: Array<{
      id: string;
      quadrant: string;
      xRange: [number, number];
      yRange: [number, number];
      opportunity: string;
      rationale: string;
    }> = [
      {
        id: "ws-high-breadth-low-price",
        quadrant: "High Feature Breadth / Accessible Self-Serve",
        xRange: [0, 50],
        yRange: [50, 100],
        opportunity: "Price-Disruptive Enterprise Alternative: Offer high-value platform capabilities (SSO, Audit Logs, API) at transparent self-serve rates to capture cost-conscious buyers migrating from legacy suites.",
        rationale: "Few or no competitors currently offer rich platform breadth without forcing buyers into expensive opaque enterprise sales contracts.",
      },
      {
        id: "ws-lightweight-fast-time-to-value",
        quadrant: "Focused Point Solution / Low Price",
        xRange: [0, 50],
        yRange: [0, 50],
        opportunity: "Frictionless Micro-SaaS Entry: Capture early-stage teams with a single hyper-optimized workflow, instant setup, and zero bloat.",
        rationale: "Incumbents have moved upmarket with heavy enterprise suites, leaving simpler user workflows underserved.",
      },
      {
        id: "ws-premium-vertical-specialist",
        quadrant: "Specialized Niche / High Willingness-to-Pay",
        xRange: [50, 100],
        yRange: [0, 50],
        opportunity: "Vertical Industry Specialist: Charge premium rates by solving a deep regulatory or compliance-specific workflow that generalist tools cannot handle.",
        rationale: "High customer willingness-to-pay exists for mission-critical specialized workflows with zero generalist competition.",
      },
      {
        id: "ws-enterprise-suite-consolidation",
        quadrant: "Consolidated Enterprise Powerhouse",
        xRange: [50, 100],
        yRange: [50, 100],
        opportunity: "Consolidated Enterprise Suite: Displace fragmented multi-vendor tool stacks with an all-in-one platform under unified governance.",
        rationale: "Enterprise buyers prefer single-vendor procurement for governance, security auditing, and vendor consolidation.",
      },
    ];

    for (const q of quadrants) {
      const occupants = coordinates.filter(
        (c) =>
          c.x >= q.xRange[0] &&
          c.x <= q.xRange[1] &&
          c.y >= q.yRange[0] &&
          c.y <= q.yRange[1],
      );

      // Whitespace condition: quadrant has 0 or 1 occupant
      if (occupants.length <= 1) {
        whitespaces.push({
          id: q.id,
          quadrant: q.quadrant,
          xRange: q.xRange,
          yRange: q.yRange,
          opportunity: q.opportunity,
          rationale: `${q.rationale} (Occupancy: ${occupants.length} entity in this sector).`,
        });
      }
    }

    return whitespaces;
  }

  /**
   * Generates the complete, validated PositioningMap artifact.
   */
  static generatePositioningMap(entities: EntitySignalPacket[]): PositioningMap {
    const rawCoordinates: PositioningMapCoordinate[] = entities.map((entity) => {
      const { x, y, rationale } = this.computeEntityCoordinate(entity);
      return {
        competitorId: entity.id,
        name: entity.name,
        isTarget: entity.isTarget,
        x,
        y,
        rationale,
      };
    });

    const { clusteredCoordinates, clusters } = this.clusterCoordinates(rawCoordinates);
    const whitespaces = this.detectWhitespaces(clusteredCoordinates);

    const summary = `Generated competitive positioning map with ${clusteredCoordinates.length} entities across ${clusters.length} market clusters and ${whitespaces.length} strategic whitespace opportunities.`;

    return {
      xAxis: this.DEFAULT_X_AXIS,
      yAxis: this.DEFAULT_Y_AXIS,
      coordinates: clusteredCoordinates,
      clusters,
      whitespaces,
      summary,
    };
  }
}
