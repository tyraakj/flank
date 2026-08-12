# Flank

## Overview

Flank is a competitive intelligence platform. A user submits their product's URL and receives a live, fully cited report: who their real competitors are, what they charge, how they position, what features they ship, and what the user should build or say to win. Every fact links to the page it came from. Nothing is asserted without a source.

## Goals

1. Accept a single URL input and automatically produce a structured competitive analysis report.
2. Discover real competitors through multi-angle web search — no manual input required.
3. Extract, normalize, and compare pricing, features, and positioning across the competitor set.
4. Generate ranked, evidence-backed strategic recommendations (edge opportunities).
5. Make every AI claim auditable: every fact must have a source URL, excerpt, and snapshot.
6. Re-run the pipeline on the same target to produce a diff against the previous run.
7. Push reports and alerts to external tools (Slack, Notion, Linear/Jira, webhooks, API, MCP).

## Core Loop

```
Paste URL → Profile product → Discover candidates → Verify competitors
  → Extract pricing + features → Synthesize positioning → Find gaps
  → Recommend edge → Report → Push to tools / Monitor for changes
```

## Agent Roster

| # | Agent | Job |
|---|---|---|
| 1 | **Profiler** | Reads the target URL; determines category, ICP, pricing model, value props |
| 2 | **Discovery** | Generates multi-angle search queries; harvests candidate competitor domains |
| 2b | **Semantic Dedup** | Clusters candidates by embedding similarity; eliminates duplicates before verification |
| 3 | **Verifier** | Rejects false positives; deduplicates entities; classifies competitor type |
| 4 | **Pricing** | Reads pricing pages; extracts plans, tiers, limits, and add-ons |
| 5 | **Feature** | Extracts features per competitor; normalizes into a shared taxonomy |
| 6 | **Positioning** | Derives ICP, messaging axes, market clusters per competitor |
| 7 | **Strategist** | Identifies gaps; produces ranked edge opportunities with evidence |
| 8 | **Critic** | Deterministic quality gates; can force targeted stage replays within a retry budget |

## Screens

| ID | Screen |
|---|---|
| S1 | Landing / New Analysis — URL input, inline validation, optional context |
| S2 | Run Progress — live stage list, competitor pop-in, log strip, partial access after verify |
| S3 | Report Overview — target card, headline stats, top opportunities, competitor grid |
| S4 | Competitors — sortable table, competitor drawer with full evidence |
| S5 | Pricing — side-by-side pricing matrix, band chart, anomaly callouts |
| S6 | Features — feature matrix with evidence hover, gap/strength filters |
| S7 | Positioning — 2×2 map, cluster shading, messaging comparison table |
| S8 | Edge — ranked opportunity cards with move, evidence, and integration actions |
| S9 | Sources — every evidence row, filterable by competitor and stage |
| S10 | History / Changes — run timeline, diff view, monitoring toggle |
| S11 | Workspace Home — target list with last run and open opportunities |
| S12 | Integrations — Slack, Notion, Linear/Jira, webhooks, API keys, MCP |
| S13 | Share — public read-only report links with scope, expiry, and password |
| S14 | Settings / Usage — plan, quota, cost signal, member management |

## Scope

### In Scope

- Single-URL competitive analysis with fully automated research
- Multi-agent pipeline: profiler → discovery → semantic dedup → verifier → pricing → features → positioning → strategy → critic
- Evidence system: every persisted claim backed by URL, excerpt, content hash, and snapshot
- Confidence scoring: deterministic 0–100 per claim and per report section
- Partial report access after verify stage completes
- Stage replayability: any stage can re-run from persisted inputs without re-running earlier stages
- Critic-driven bounded retry loop
- Diff reports: second run on same target produces a change set
- Integrations: Slack, Notion, Linear/Jira, Google Sheets, webhooks, REST API v1, MCP server
- Scheduled monitoring (weekly re-runs with change alerts)
- Public share links with scope and expiry
- Export: Markdown, CSV, PDF
- Quota and rate limiting per workspace
- CI-gated eval harness: golden-set precision/recall regression on agent output

### Out of Scope (v1)

- Manual competitor research as the primary input
- CRM or deal-tracking features
- Scraping behind logins, paywalls, or access controls
- Real-time sub-daily price tracking
- AI chat as the primary interface
- Mobile-first layouts

## Success Criteria

1. A submitted URL produces a fully cited competitive report without manual input.
2. Every pricing number, feature claim, and positioning statement is backed by at least one Evidence row.
3. A second run on the same target produces a diff, not a duplicate report.
4. Partial results are readable as soon as verify completes, before the full pipeline finishes.
5. The Critic's quality gates block publication of reports with missing evidence or hard contradictions.
6. The eval harness passes precision/recall and extraction-accuracy regression gates in CI.
