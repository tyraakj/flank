import { prisma } from "@flank/database";
import { registry } from "../providers/registry";
import {
  DiscoveryPlanSchema,
  DiscoveryPlan,
  DiscoveryStrategy,
  DiscoveryStageOutput,
} from "@flank/shared";
import { publishRunEvent } from "../progress/publisher";
import { ZodError } from "zod";
import * as crypto from "crypto";

// ============================================================================
// LAYER 1: SYSTEM PROMPT (STATIC PREFIX - CACHE CANDIDATE)
// ============================================================================
const DISCOVERY_SYSTEM_PROMPT = `You are a Principal Competitive Intelligence Analyst at Flank.
Your objective is to generate targeted, high-yield web search strategies to discover direct competitors, indirect competitors, and substitute products for a target software company.

### SEARCH ANGLE TAXONOMY:
1. category: Broad and narrow product category queries (e.g. "B2B customer onboarding software", "automated code review tools").
2. alternative: Explicit displacement/migration queries (e.g. "alternatives to Linear", "software like Datadog").
3. versus: Head-to-head comparison queries (e.g. "Postman vs", "Figma vs").
4. review-listing: Queries targeting review platforms and market maps (e.g. "site:g2.com/categories product analytics", "site:capterra.com subscription billing").
5. competitor-list: Industry roundup and market landscape queries (e.g. "top cloud cost optimization tools", "best open source observability platforms").
6. adjacent-job: Queries focusing on the core Job-to-be-Done (JTBD) the user hires the software to solve.

### RULES & CONSTRAINTS:
- Generate 6 to 8 distinct, non-redundant search strategies.
- Cover all 6 required angles.
- Use the Target's exact product name, category, ICP, and seed keywords.
- Formulate precise, search-engine-friendly queries.`;

// ============================================================================
// LAYER 2: STATIC FEW-SHOT EXAMPLES (STATIC - CACHE CANDIDATE)
// ============================================================================
const DISCOVERY_STATIC_EXAMPLES = `### FEW-SHOT EXAMPLES:

Example Input:
Target Product: "Linear" (linear.app)
Category: "Issue Tracking & Agile Project Management"
ICP: "High-growth software engineering teams and product managers"

Example Output:
{
  "strategies": [
    {
      "angle": "alternative",
      "query": "alternatives to Linear issue tracker",
      "rationale": "Direct displacement queries targeting software teams looking to migrate from or replace Linear.",
      "maxResults": 10
    },
    {
      "angle": "versus",
      "query": "Linear vs Jira for startups",
      "rationale": "Direct comparison queries to capture dominant market incumbent comparisons.",
      "maxResults": 10
    },
    {
      "angle": "category",
      "query": "best developer project management tools 2026",
      "rationale": "Category-level benchmark to uncover new and established modern issue tracking tools.",
      "maxResults": 10
    },
    {
      "angle": "competitor-list",
      "query": "top modern agile project management software competitors",
      "rationale": "Roundup articles and market maps listing modern competitors.",
      "maxResults": 10
    },
    {
      "angle": "review-listing",
      "query": "site:g2.com/products issue tracking software",
      "rationale": "Structured software directory listings and market grids.",
      "maxResults": 10
    },
    {
      "angle": "adjacent-job",
      "query": "software sprint planning and bug tracking tools for developers",
      "rationale": "Job-to-be-done query capturing tools solving the same core workflow.",
      "maxResults": 10
    }
  ],
  "summary": "Multi-angle search plan covering displacement, direct comparison, market roundups, and JTBD workflows."
}`;

// ============================================================================
// LAYER 3: TOOLS & OUTPUT SCHEMA SPECIFICATION (STATIC - CACHE CANDIDATE)
// ============================================================================
const DISCOVERY_TOOLS_SPEC = `### OUTPUT FORMAT SPECIFICATION:
Format output strictly conforming to the DiscoveryPlan JSON schema:
- strategies: Array of 6 to 8 strategy objects, each containing:
  - angle: One of "category", "alternative", "versus", "review-listing", "competitor-list", "adjacent-job"
  - query: Exact search string
  - rationale: Tactical reason for this query
  - maxResults: Integer between 5 and 15 (default: 10)
- summary: High-level overview of the discovery strategy`;

const NON_COMPETITOR_DOMAINS = new Set([
  "google.com",
  "www.google.com",
  "bing.com",
  "www.bing.com",
  "duckduckgo.com",
  "search.brave.com",
  "yahoo.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "www.linkedin.com",
  "facebook.com",
  "instagram.com",
  "youtube.com",
  "www.youtube.com",
  "github.com",
  "reddit.com",
  "www.reddit.com",
  "wikipedia.org",
  "en.wikipedia.org",
  "medium.com",
  "substack.com",
  "quora.com",
  "news.ycombinator.com",
  "producthunt.com",
]);

function cleanUrl(rawUrl: string): { valid: boolean; url: string; domain: string } {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { valid: false, url: "", domain: "" };
    }
    // Strip query and hash tracking parameters
    parsed.search = "";
    parsed.hash = "";

    const domain = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return {
      valid: true,
      url: parsed.href,
      domain,
    };
  } catch {
    return { valid: false, url: "", domain: "" };
  }
}

function extractNameHint(title: string, domain: string): string {
  if (!title) return domain;
  // Clean common title separators: "Acme - Best Tool" -> "Acme"
  const parts = title.split(/[-|:–—]/);
  const candidate = parts[0]?.trim();
  if (candidate && candidate.length > 1 && candidate.length < 40) {
    return candidate;
  }
  return domain;
}

function calculateFirstPassRelevance(
  angle: string,
  rank: number,
  title: string,
  snippet: string,
  seedKeywords: string[],
): number {
  let score = 60;
  switch (angle) {
    case "alternative":
    case "versus":
      score = 85;
      break;
    case "competitor-list":
      score = 75;
      break;
    case "category":
      score = 70;
      break;
    case "review-listing":
      score = 65;
      break;
    case "adjacent-job":
      score = 55;
      break;
  }

  // Adjust by rank (higher rank = slightly higher confidence)
  score -= Math.min(rank * 2, 20);

  // Bonus if keywords appear in title or snippet
  const combined = (title + " " + snippet).toLowerCase();
  for (const kw of seedKeywords) {
    if (kw && kw !== "unknown" && combined.includes(kw.toLowerCase())) {
      score += 5;
      break;
    }
  }

  return Math.max(10, Math.min(95, score));
}

export async function runDiscoveryAgent(
  runId: string,
  targetId: string,
  _inputArtifact?: unknown,
): Promise<DiscoveryStageOutput> {
  const target = await prisma.target.findUnique({ where: { id: targetId } });
  if (!target) throw new Error(`Target ${targetId} not found`);

  const profile = await prisma.targetProfile.findUnique({ where: { runId } });
  if (!profile) {
    throw new Error(
      `TargetProfile not found for run ${runId}. Discovery cannot execute without a profile.`,
    );
  }

  const llm = registry.getLlmProvider();
  const searchProvider = registry.getSearchProvider();

  const valueProps = (profile.valueProps as string[]) || [];
  const seedKeywords: string[] = [];
  if (profile.category) seedKeywords.push(profile.category);
  if (target.name) seedKeywords.push(target.name);

  // ============================================================================
  // LAYER 4: DYNAMIC CONTEXT (TARGET PROFILE & PRODUCT INFO)
  // ============================================================================
  const dynamicContext = `### DYNAMIC CONTEXT (Target Product Details):
Target Product Name: ${target.name}
Target Domain: ${target.canonicalDomain}
Category: ${profile.category || "unknown"}
ICP: ${profile.icp || "unknown"}
Pricing Model: ${profile.pricingModel || "unknown"}
Key Value Propositions: ${valueProps.join("; ") || "unknown"}`;

  // ============================================================================
  // LAYER 5: USER TURN / DIRECTIVE
  // ============================================================================
  const userDirective = `### USER DIRECTIVE:
Generate a targeted, high-yield multi-angle competitor discovery search plan across all 6 required angles (category, alternative, versus, review-listing, competitor-list, adjacent-job) for "${target.name}". Strictly adhere to the schema and few-shot guidance.`;

  const fullPrompt = `${DISCOVERY_STATIC_EXAMPLES}\n\n${DISCOVERY_TOOLS_SPEC}\n\n${dynamicContext}\n\n${userDirective}`;

  const fallbackStrategies: DiscoveryStrategy[] = [
    {
      angle: "alternative",
      query: `alternatives to ${target.name}`,
      rationale: "Direct competitor discovery via displacement searches.",
      maxResults: 10,
    },
    {
      angle: "versus",
      query: `${target.name} vs`,
      rationale: "Head-to-head comparison search queries.",
      maxResults: 10,
    },
    {
      angle: "category",
      query: `best ${profile.category || "software"} tools`,
      rationale: "Market category benchmark search.",
      maxResults: 10,
    },
    {
      angle: "competitor-list",
      query: `top competitors of ${target.name} ${profile.category || ""}`,
      rationale: "Industry roundups and competitor listings.",
      maxResults: 10,
    },
    {
      angle: "review-listing",
      query: `site:g2.com/products ${profile.category || target.name}`,
      rationale: "Review directory category listings.",
      maxResults: 10,
    },
    {
      angle: "adjacent-job",
      query: `${profile.category || target.name} software solutions`,
      rationale: "Adjacent workflow search.",
      maxResults: 10,
    },
  ];

  const fallbackPlan: DiscoveryPlan = {
    strategies: fallbackStrategies,
    summary: "Deterministic 6-angle query template fallback.",
  };

  let discoveryPlan: DiscoveryPlan;
  try {
    const result = await llm.generateStructured({
      prompt: fullPrompt,
      schema: DiscoveryPlanSchema,
      schemaName: "DiscoveryPlan",
      schemaDescription: "Multi-angle competitor discovery search strategy plan",
      system: DISCOVERY_SYSTEM_PROMPT,
      fallback: fallbackPlan,
    });
    discoveryPlan = result.data as DiscoveryPlan;
  } catch (err) {
    if (err instanceof ZodError) {
      const repairPrompt = `Your previous DiscoveryPlan failed validation with errors:\n${err.message}\n\nPlease regenerate the DiscoveryPlan strictly adhering to the schema:\n${fullPrompt}`;
      try {
        const repairResult = await llm.generateStructured({
          prompt: repairPrompt,
          schema: DiscoveryPlanSchema,
          schemaName: "DiscoveryPlan",
          system: DISCOVERY_SYSTEM_PROMPT,
          fallback: fallbackPlan,
        });
        discoveryPlan = repairResult.data as DiscoveryPlan;
      } catch {
        discoveryPlan = fallbackPlan;
      }
    } else {
      discoveryPlan = fallbackPlan;
    }
  }

  // Deduplicate strategies by query
  const seenQueries = new Set<string>();
  const uniqueStrategies: DiscoveryStrategy[] = [];
  for (const s of discoveryPlan.strategies) {
    const normalized = s.query.trim().toLowerCase();
    if (!seenQueries.has(normalized)) {
      seenQueries.add(normalized);
      uniqueStrategies.push(s);
    }
  }

  // 2. Bounded Search Execution (concurrency: 3)
  interface RawCandidate {
    url: string;
    canonicalDomain: string;
    name: string;
    query: string;
    angle: string;
    firstPassRelevance: number;
    title: string;
    snippet: string;
  }

  const harvested: RawCandidate[] = [];
  const concurrency = 3;

  for (let i = 0; i < uniqueStrategies.length; i += concurrency) {
    const batch = uniqueStrategies.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (strategy) => {
        const searchResult = await searchProvider.search({
          query: strategy.query,
          limit: strategy.maxResults || 10,
          fresh: false,
        });
        return { strategy, searchResult };
      }),
    );

    for (const res of batchResults) {
      if (res.status === "fulfilled") {
        const { strategy, searchResult } = res.value;
        for (const item of searchResult.results) {
          const cleaned = cleanUrl(item.url);
          if (!cleaned.valid) continue;

          // Filter target's own domain, subdomains, and search/social platforms
          if (
            cleaned.domain === target.canonicalDomain ||
            cleaned.domain.endsWith(`.${target.canonicalDomain}`) ||
            NON_COMPETITOR_DOMAINS.has(cleaned.domain)
          ) {
            continue;
          }

          const relevance = calculateFirstPassRelevance(
            strategy.angle,
            item.rank,
            item.title,
            item.snippet || "",
            seedKeywords,
          );

          harvested.push({
            url: cleaned.url,
            canonicalDomain: cleaned.domain,
            name: extractNameHint(item.title, cleaned.domain),
            query: strategy.query,
            angle: strategy.angle,
            firstPassRelevance: relevance,
            title: item.title,
            snippet: item.snippet || "",
          });
        }
      } else {
        console.warn("[Discovery Agent] Search query failed:", res.reason);
      }
    }
  }

  // 3. Aggregate unique candidates by canonicalDomain, keeping highest relevance
  const domainMap = new Map<
    string,
    {
      bestCandidate: RawCandidate;
      allExcerpts: Array<{ url: string; query: string; title: string; snippet: string }>;
    }
  >();

  for (const item of harvested) {
    const existing = domainMap.get(item.canonicalDomain);
    if (!existing) {
      domainMap.set(item.canonicalDomain, {
        bestCandidate: item,
        allExcerpts: [
          { url: item.url, query: item.query, title: item.title, snippet: item.snippet },
        ],
      });
    } else {
      existing.allExcerpts.push({
        url: item.url,
        query: item.query,
        title: item.title,
        snippet: item.snippet,
      });
      if (item.firstPassRelevance > existing.bestCandidate.firstPassRelevance) {
        existing.bestCandidate = item;
      }
    }
  }

  // 4. Transactional persistence
  await prisma.$transaction(async (tx) => {
    // Delete previous candidates & candidate evidence for this run
    await tx.candidate.deleteMany({ where: { runId } });
    await tx.evidence.deleteMany({ where: { runId, claimType: "CANDIDATE" } });

    for (const [canonicalDomain, { bestCandidate, allExcerpts }] of domainMap.entries()) {
      const candidateRecord = await tx.candidate.create({
        data: {
          runId,
          name: bestCandidate.name,
          url: bestCandidate.url,
          canonicalDomain,
          rationale: `Discovered via ${bestCandidate.angle} query: "${bestCandidate.query}". Found across ${allExcerpts.length} search occurrence(s).`,
          confidence: bestCandidate.firstPassRelevance,
          status: "PENDING",
        },
      });

      // Attach evidence for each search occurrence
      for (const excerpt of allExcerpts) {
        const content = `Search Query: "${excerpt.query}"\nTitle: ${excerpt.title}\nSnippet: ${excerpt.snippet}`;
        const hash = crypto.createHash("sha256").update(content).digest("hex");

        await tx.evidence.create({
          data: {
            runId,
            claimType: "CANDIDATE",
            claimId: candidateRecord.id,
            url: excerpt.url,
            canonicalUrl: excerpt.url,
            excerpt: content,
            contentHash: hash,
            trustTier: "MEDIUM",
          },
        });
      }
    }
  });

  const output: DiscoveryStageOutput = {
    targetId,
    strategiesExecuted: uniqueStrategies.length,
    candidatesHarvested: harvested.length,
    uniqueDomains: domainMap.size,
  };

  await publishRunEvent(runId, {
    type: "STAGE_SUMMARY",
    runId,
    targetId,
    stageKey: "DISCOVERY",
    stageStatus: "COMPLETED",
    timestamp: new Date().toISOString(),
    summary: `Harvested ${domainMap.size} unique candidate competitors across ${uniqueStrategies.length} search angles.`,
    payload: output,
  });

  return output;
}
