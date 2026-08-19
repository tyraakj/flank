import { prisma, SupportStatus } from "@flank/database";
import { registry } from "../providers/registry";
import {
  CompetitorFeatureExtractionSchema,
  CompetitorFeatureExtraction,
  ExtractedFeatureItem,
  FeatureStageOutput,
} from "@flank/shared";
import { FeatureTaxonomyService } from "../services/feature-taxonomy";
import { publishRunEvent } from "../progress/publisher";
import * as cheerio from "cheerio";
import { ZodError } from "zod";
import * as crypto from "crypto";

const FEATURE_SYSTEM_PROMPT = `You are a Principal Technical Product Analyst & SaaS Feature Taxonomy Specialist at Flank.
Your mission is to perform an exhaustive, evidence-backed feature extraction from scraped competitor product pages, documentation, feature checklists, and changelogs.

### TAXONOMY & CLASSIFICATION RULES:
1. Strict Grounding: Every extracted capability must be directly evidenced in the provided page copy. DO NOT invent or infer unmentioned features.
2. Support Status Definitions:
   - YES: Actively supported, shipped, and generally available.
   - PARTIAL: Available with notable limits, restricted to specific enterprise tiers, or available only as a separate paid add-on.
   - NO: Explicitly stated as unsupported or missing (e.g. "Does not support SSO", "No self-hosted version available").
   - UNKNOWN: Mentioned ambiguously without clear confirmation of capability.
3. Shipping State Distinction:
   - shipped: Production-ready and accessible to users.
   - announced: Future roadmap items, waitlist, upcoming beta, or "coming soon" previews.
   - IMPORTANT: If a feature is only "announced", set shippingState: "announced" and support: "UNKNOWN" (unless explicitly launched). Never convert roadmap announcements to YES.
4. Verbatim Excerpts:
   - Provide an exact verbatim quote from the page proving the claim, including constraints or tier requirements.
5. Canonical Taxonomy Mapping:
   - Provide a clean canonical name (e.g. "Single Sign-On (SSO)", "Role-Based Access Control (RBAC)", "REST API Access", "Audit Logs") that maps to standardized SaaS categories.`;

export function computeDeterministicFeatureFallback(params: {
  pageText: string;
  sourceUrl: string;
  competitorName: string;
}): CompetitorFeatureExtraction {
  const text = params.pageText || "";
  const textLower = text.toLowerCase();
  const features: ExtractedFeatureItem[] = [];

  // Keywords and patterns to scan
  const featureSignatures: Array<{
    term: string;
    canonicalName: string;
    category: string;
    detail: string;
  }> = [
    {
      term: "single sign on",
      canonicalName: "Single Sign-On (SSO)",
      category: "Security & Access",
      detail: "SAML 2.0 / SSO authentication capabilities detected.",
    },
    {
      term: "sso",
      canonicalName: "Single Sign-On (SSO)",
      category: "Security & Access",
      detail: "SSO authentication support mentioned in page text.",
    },
    {
      term: "saml",
      canonicalName: "Single Sign-On (SSO)",
      category: "Security & Access",
      detail: "SAML identity provider integration.",
    },
    {
      term: "two-factor",
      canonicalName: "Multi-Factor Authentication (MFA)",
      category: "Security & Access",
      detail: "Two-factor authentication (2FA/MFA) support.",
    },
    {
      term: "mfa",
      canonicalName: "Multi-Factor Authentication (MFA)",
      category: "Security & Access",
      detail: "Multi-factor authentication support.",
    },
    {
      term: "rbac",
      canonicalName: "Role-Based Access Control (RBAC)",
      category: "Security & Access",
      detail: "Role-based user permissions and access control.",
    },
    {
      term: "audit log",
      canonicalName: "Audit Logs",
      category: "Security & Access",
      detail: "Activity tracking and security audit logging.",
    },
    {
      term: "soc 2",
      canonicalName: "SOC 2 & Compliance Certifications",
      category: "Security & Access",
      detail: "SOC 2 security compliance certification.",
    },
    {
      term: "api",
      canonicalName: "REST API Access",
      category: "Integrations & API",
      detail: "Developer API access and integration endpoints.",
    },
    {
      term: "webhook",
      canonicalName: "Webhooks",
      category: "Integrations & API",
      detail: "Real-time HTTP webhook event notifications.",
    },
    {
      term: "zapier",
      canonicalName: "Third-Party App Integrations",
      category: "Integrations & API",
      detail: "Zapier and third-party connector support.",
    },
    {
      term: "csv export",
      canonicalName: "Export & Data Portability",
      category: "Analytics & Reporting",
      detail: "CSV / tabular data export capabilities.",
    },
    {
      term: "dashboard",
      canonicalName: "Custom Dashboards & Visualizations",
      category: "Analytics & Reporting",
      detail: "Reporting dashboard and metric visualizations.",
    },
    {
      term: "workspace",
      canonicalName: "Team Workspaces & Multi-Tenancy",
      category: "Collaboration & Workflow",
      detail: "Multi-user team workspaces and organization support.",
    },
    {
      term: "dark mode",
      canonicalName: "Dark Mode & Theme Customization",
      category: "Customization & Branding",
      detail: "Dark theme visual mode support.",
    },
    {
      term: "custom domain",
      canonicalName: "Custom Domain & SSL",
      category: "Customization & Branding",
      detail: "Custom CNAME domain and SSL support.",
    },
  ];

  const seenCanonicals = new Set<string>();
  const statements = text
    .split(/\r?\n|•|\*|;|\.\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

  for (const sig of featureSignatures) {
    if (seenCanonicals.has(sig.canonicalName)) continue;

    // Find the statement/line containing this term
    const matchedStatement = statements.find((s) => s.toLowerCase().includes(sig.term));
    if (matchedStatement) {
      seenCanonicals.add(sig.canonicalName);
      const statementLower = matchedStatement.toLowerCase();

      // Check for negative support cues strictly within this statement
      const isNegative =
        statementLower.includes("not support") ||
        statementLower.includes("does not include") ||
        statementLower.includes("no support") ||
        statementLower.includes("unavailable in") ||
        statementLower.includes("lacks");

      // Check for announced / beta cues strictly within this statement
      const isAnnounced =
        statementLower.includes("coming soon") ||
        statementLower.includes("roadmap") ||
        statementLower.includes("beta preview") ||
        statementLower.includes("waitlist") ||
        statementLower.includes("in development");

      // Check for partial / tier-restricted cues strictly within this statement
      const isPartial =
        statementLower.includes("enterprise only") ||
        statementLower.includes("add-on") ||
        statementLower.includes("optional") ||
        statementLower.includes("limited to") ||
        statementLower.includes("paid plans only");

      let support: "YES" | "PARTIAL" | "NO" | "UNKNOWN" = "YES";
      let shippingState: "shipped" | "announced" | "unknown" = "shipped";

      if (isNegative) {
        support = "NO";
      } else if (isAnnounced) {
        shippingState = "announced";
        support = "UNKNOWN";
      } else if (isPartial) {
        support = "PARTIAL";
      }

      features.push({
        verbatimLabel: sig.canonicalName,
        canonicalName: sig.canonicalName,
        category: sig.category,
        support,
        shippingState,
        detail: sig.detail,
        sourceUrl: params.sourceUrl,
        excerpt: `Found reference: "${matchedStatement}" on ${params.sourceUrl}`,
        confidence: 70,
      });
    }
  }

  return {
    features,
    summary: `Deterministic feature extraction identified ${features.length} standard feature signatures on ${params.sourceUrl}.`,
    keyStrengths: features.filter((f) => f.support === "YES").map((f) => f.canonicalName),
    notableGaps: features.filter((f) => f.support === "NO").map((f) => f.canonicalName),
  };
}

export function discoverFeatureUrls(params: {
  homepageUrl: string;
  homepageHtml?: string;
}): string[] {
  const discovered = new Set<string>();
  const base = new URL(params.homepageUrl);
  const hostname = base.hostname.toLowerCase().replace(/^www\./, "");

  if (params.homepageHtml) {
    try {
      const $ = cheerio.load(params.homepageHtml);
      $("a").each((_, el) => {
        const href = $(el).attr("href");
        const text = $(el).text().toLowerCase().trim();
        if (!href) return;

        try {
          const resolved = new URL(href, params.homepageUrl);
          const resolvedHost = resolved.hostname.toLowerCase().replace(/^www\./, "");

          if (
            resolvedHost === hostname ||
            resolvedHost === `docs.${hostname}` ||
            resolvedHost === `help.${hostname}`
          ) {
            const pathLower = resolved.pathname.toLowerCase();
            const isFeatureMatch =
              pathLower.includes("/features") ||
              pathLower.includes("/product") ||
              pathLower.includes("/platform") ||
              pathLower.includes("/solutions") ||
              pathLower.includes("/docs") ||
              pathLower.includes("/integrations") ||
              pathLower.includes("/changelog") ||
              pathLower.includes("/whats-new") ||
              text.includes("feature") ||
              text.includes("product") ||
              text.includes("platform") ||
              text.includes("documentation") ||
              text.includes("docs") ||
              text.includes("integrations") ||
              text.includes("changelog");

            if (isFeatureMatch) {
              discovered.add(resolved.href.split("#")[0]);
            }
          }
        } catch {
          // Ignore invalid URLs
        }
      });
    } catch {
      // Ignore parsing errors
    }
  }

  // Standard fallback candidate paths
  const origin = base.origin;
  const standardPaths = [
    "/features",
    "/product",
    "/platform",
    "/docs",
    "/integrations",
    "/changelog",
  ];
  for (const p of standardPaths) {
    discovered.add(`${origin}${p}`);
  }

  return Array.from(discovered);
}

export async function runFeatureAgent(
  runId: string,
  targetId: string,
  _inputArtifact?: unknown,
): Promise<FeatureStageOutput> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error(`Target ${targetId} not found`);

  // Load active verified competitors
  const competitors = await prisma.competitor.findMany({
    where: { runId, status: "ACTIVE" },
    orderBy: { confidence: "desc" },
  });

  if (competitors.length === 0) {
    const emptyOutput: FeatureStageOutput = {
      targetId,
      competitorsEvaluated: 0,
      featurePagesFound: 0,
      featurePagesRead: 0,
      taxonomyNodesCount: 0,
      claimsExtracted: 0,
      supportYesCount: 0,
      supportPartialCount: 0,
      supportNoCount: 0,
      supportUnknownCount: 0,
    };
    return emptyOutput;
  }

  const reader = registry.getBrowserReader();
  const llm = registry.getLlmProvider();

  let featurePagesFoundCount = 0;
  let featurePagesReadCount = 0;
  let totalClaimsExtracted = 0;
  let supportYesCount = 0;
  let supportPartialCount = 0;
  let supportNoCount = 0;
  let supportUnknownCount = 0;

  const taxonomyNodeSlugs = new Set<string>();

  const concurrency = 3;
  for (let i = 0; i < competitors.length; i += concurrency) {
    const batch = competitors.slice(i, i + concurrency);

    await Promise.allSettled(
      batch.map(async (comp) => {
        let homepageHtml = "";
        let homepageText = "";

        try {
          const homeResult = await reader.read({ url: comp.url, mode: "auto", fresh: false });
          homepageHtml = homeResult.html || "";
          homepageText = homeResult.text || "";
        } catch (err) {
          console.warn(`[Feature Agent] Could not read competitor homepage ${comp.url}:`, err);
        }

        const candidateUrls = discoverFeatureUrls({
          homepageUrl: comp.url,
          homepageHtml,
        });

        featurePagesFoundCount += candidateUrls.length;

        // Read up to 3 candidate pages
        const readPages: Array<{
          url: string;
          canonicalUrl: string;
          text: string;
          contentHash: string;
          snapshotKey?: string;
        }> = [];

        for (const candUrl of candidateUrls.slice(0, 3)) {
          try {
            const pageResult = await reader.read({ url: candUrl, mode: "auto", fresh: false });
            if (pageResult.text && pageResult.text.length > 150) {
              readPages.push({
                url: candUrl,
                canonicalUrl: pageResult.canonicalUrl,
                text: pageResult.text,
                contentHash: pageResult.contentHash,
                snapshotKey: pageResult.snapshotKey,
              });
              featurePagesReadCount++;
            }
          } catch {
            // Continue to next page
          }
        }

        // If no dedicated feature pages succeeded, use homepage if available
        if (readPages.length === 0 && homepageText.length > 200) {
          readPages.push({
            url: comp.url,
            canonicalUrl: comp.url,
            text: homepageText,
            contentHash: crypto.createHash("sha256").update(homepageText).digest("hex"),
          });
          featurePagesReadCount++;
        }

        if (readPages.length === 0) {
          console.warn(`[Feature Agent] No readable pages found for competitor: ${comp.name}`);
          return;
        }

        const combinedText = readPages
          .map((p) => `--- SOURCE: ${p.canonicalUrl} ---\n${p.text.substring(0, 15000)}`)
          .join("\n\n")
          .substring(0, 35000);

        const primarySourceUrl = readPages[0].canonicalUrl || readPages[0].url;

        const prompt = `Analyze the product, documentation, and feature pages for competitor "${comp.name}" (${comp.url}) and extract all detailed capability and feature claims.

COMPETITOR DETAILS:
- Name: ${comp.name}
- Canonical Domain: ${comp.canonicalDomain}
- Type: ${comp.type}

SCRAPED FEATURE & PRODUCT PAGES:
${combinedText}

Extract structured feature claims adhering strictly to the CompetitorFeatureExtraction schema.`;

        const fallback = computeDeterministicFeatureFallback({
          pageText: readPages.map((p) => p.text).join(" "),
          sourceUrl: primarySourceUrl,
          competitorName: comp.name,
        });

        let extraction: CompetitorFeatureExtraction;
        try {
          const res = await llm.generateStructured({
            prompt,
            schema: CompetitorFeatureExtractionSchema,
            schemaName: "CompetitorFeatureExtraction",
            schemaDescription: "Structured feature and capability claims for a software competitor",
            system: FEATURE_SYSTEM_PROMPT,
            fallback,
          });
          extraction = res.data as CompetitorFeatureExtraction;
        } catch (err) {
          if (err instanceof ZodError) {
            const repairPrompt = `Your previous CompetitorFeatureExtraction failed schema validation:\n${err.message}\n\nPlease fix the errors, ensure all required fields are valid, and output valid JSON:\n${prompt}`;
            try {
              const repairRes = await llm.generateStructured({
                prompt: repairPrompt,
                schema: CompetitorFeatureExtractionSchema,
                schemaName: "CompetitorFeatureExtraction",
                system: FEATURE_SYSTEM_PROMPT,
                fallback,
              });
              extraction = repairRes.data as CompetitorFeatureExtraction;
            } catch {
              extraction = fallback;
            }
          } else {
            extraction = fallback;
          }
        }

        // Transactional persistence
        await prisma.$transaction(async (tx) => {
          // Clear prior feature claims for this competitor in this run
          const existingClaims = await tx.featureClaim.findMany({
            where: { runId, competitorId: comp.id },
            select: { id: true },
          });
          const existingClaimIds = existingClaims.map((c) => c.id);

          if (existingClaimIds.length > 0) {
            await tx.evidence.deleteMany({
              where: {
                runId,
                claimType: "FEATURE_CLAIM",
                claimId: { in: existingClaimIds },
              },
            });
            await tx.featureClaim.deleteMany({
              where: { runId, competitorId: comp.id },
            });
          }

          for (const item of extraction.features) {
            // Resolve canonical feature taxonomy node
            const resolved = FeatureTaxonomyService.resolveCanonicalFeature(
              item.canonicalName || item.verbatimLabel,
              item.category,
            );

            // Upsert canonical Feature node
            const featureNode = await FeatureTaxonomyService.upsertFeatureNode(
              tx,
              resolved.canonicalName,
              resolved.slug,
              resolved.category,
              resolved.description,
            );

            taxonomyNodeSlugs.add(featureNode.slug);

            // Map SupportStatus to Prisma enum
            const support: SupportStatus =
              item.support === "YES" ||
              item.support === "PARTIAL" ||
              item.support === "NO" ||
              item.support === "UNKNOWN"
                ? item.support
                : "UNKNOWN";

            if (support === "YES") supportYesCount++;
            else if (support === "PARTIAL") supportPartialCount++;
            else if (support === "NO") supportNoCount++;
            else supportUnknownCount++;

            // Create FeatureClaim record
            const claimRecord = await tx.featureClaim.create({
              data: {
                runId,
                competitorId: comp.id,
                featureId: featureNode.id,
                support,
                detail: item.detail || `${item.verbatimLabel} (${item.shippingState || "shipped"})`,
                confidence: item.confidence || 80,
                confidenceReasons: {
                  verbatimLabel: item.verbatimLabel,
                  shippingState: item.shippingState,
                  category: resolved.category,
                },
              },
            });

            // Write auditable Evidence row
            const matchingReadPage =
              readPages.find((p) => p.canonicalUrl === item.sourceUrl) || readPages[0];
            const excerpt =
              item.excerpt || `Claim for ${item.verbatimLabel} (${support}) from ${item.sourceUrl}`;

            await tx.evidence.create({
              data: {
                runId,
                claimType: "FEATURE_CLAIM",
                claimId: claimRecord.id,
                url: item.sourceUrl || primarySourceUrl,
                canonicalUrl: item.sourceUrl || primarySourceUrl,
                excerpt,
                contentHash:
                  matchingReadPage?.contentHash ||
                  crypto.createHash("sha256").update(excerpt).digest("hex"),
                snapshotKey: matchingReadPage?.snapshotKey,
                trustTier: "HIGH",
              },
            });

            totalClaimsExtracted++;
          }
        });
      }),
    );
  }

  const output: FeatureStageOutput = {
    targetId,
    competitorsEvaluated: competitors.length,
    featurePagesFound: featurePagesFoundCount,
    featurePagesRead: featurePagesReadCount,
    taxonomyNodesCount: taxonomyNodeSlugs.size,
    claimsExtracted: totalClaimsExtracted,
    supportYesCount,
    supportPartialCount,
    supportNoCount,
    supportUnknownCount,
  };

  await publishRunEvent(runId, {
    type: "STAGE_SUMMARY",
    runId,
    targetId,
    stageKey: "FEATURE",
    stageStatus: "COMPLETED",
    timestamp: new Date().toISOString(),
    summary: `Extracted ${totalClaimsExtracted} feature claims across ${competitors.length} competitors (${supportYesCount} yes, ${supportPartialCount} partial, ${supportNoCount} no, ${supportUnknownCount} unknown) into ${taxonomyNodeSlugs.size} canonical taxonomy nodes.`,
    payload: output,
  });

  return output;
}
