# Progress Tracker

Update this file whenever the current phase, active unit, or implementation state changes. Progress state must reflect the actual implementation, not the intended state.

---

## Current Phase

**Pre-implementation — Specs complete, no code written yet.**

## Current Goal

Begin implementation at Unit 01 (Architecture and Shared Contracts).

---

## Spec Status

### Foundation

| Unit | Spec | Status |
|---|---|---|
| 00 | Product Map | ✅ Spec complete |
| 01 | Architecture and Shared Contracts | ⬜ Not started |
| 02 | Design System | ⬜ Not started |
| 03 | App Shell and Navigation | ⬜ Not started |
| 04 | Auth and Workspaces | ⬜ Not started |
| 05 | Data Model | ⬜ Not started |
| 06 | BFF API Surface | ⬜ Not started |
| 07 | Queue and Worker Runtime | ⬜ Not started |
| 08 | Run Orchestration | ⬜ Not started |
| 09 | SSE Progress Channel | ⬜ Not started |
| 10 | Provider Abstraction Layer | ⬜ Not started |

### Intelligence

| Unit | Spec | Status |
|---|---|---|
| 11 | Profiler Agent | ⬜ Not started |
| 12 | Discovery Agent | ⬜ Not started |
| 13 | Verifier Agent | ⬜ Not started |
| 14 | Pricing Agent | ⬜ Not started |
| 15 | Feature Agent and Taxonomy | ⬜ Not started |
| 16 | Positioning Agent | ⬜ Not started |
| 17 | Strategist Agent | ⬜ Not started |
| 18 | Critic Agent and Quality Gates | ⬜ Not started |
| 19 | Evidence and Snapshot Store | ⬜ Not started |
| 20 | Confidence Scoring | ⬜ Not started |
| 41 | Semantic Candidate Deduplication | ⬜ Not started |

### Experience

| Unit | Spec | Status |
|---|---|---|
| 21 | URL Submission Flow | ⬜ Not started |
| 22 | Run Progress Screen | ⬜ Not started |
| 23 | Report Shell | ⬜ Not started |
| 24 | Target Profile Card | ⬜ Not started |
| 25 | Competitor Table and Drawer | ⬜ Not started |
| 26 | Pricing Matrix | ⬜ Not started |
| 27 | Feature Matrix | ⬜ Not started |
| 28 | Positioning Map | ⬜ Not started |
| 29 | Edge Opportunities | ⬜ Not started |
| 30 | Sources Screen | ⬜ Not started |
| 31 | Manual Curation and Corrections | ⬜ Not started |
| 32 | Export | ⬜ Not started |
| 33 | Public Share Links | ⬜ Not started |
| 34 | History and Diffs | ⬜ Not started |

### Platform

| Unit | Spec | Status |
|---|---|---|
| 35 | Integrations Framework | ⬜ Not started |
| 36 | Slack, Notion, and Issue Trackers | ⬜ Not started |
| 37 | Webhooks, Public API, and MCP | ⬜ Not started |
| 38 | Monitoring and Scheduled Re-runs | ⬜ Not started |
| 39 | Quotas and Rate Limits | ⬜ Not started |
| 40 | Observability and Eval Harness | ⬜ Not started |

---

## Completed

- ✅ Full spec suite written (Units 00–40 + Unit 41 Semantic Deduplication)
- ✅ Object storage decision: Cloudflare R2 (free tier, S3-compatible, zero egress fees) — all specs updated
- ✅ Context files created for AI agent guidance

---

## In Progress

- None

---

## Next Up

1. **Unit 01** — Create monorepo structure: `apps/app`, `apps/worker`, `packages/shared`, `packages/database`, `infra/docker-compose.yml`, root `README.md`.
2. **Unit 02** — Design system: Tailwind dark tokens, shadcn/ui generation, `cn()`, matrix/table primitives, confidence + support-status components.
3. **Unit 04** — Better Auth + workspace access helpers.
4. **Unit 05** — Full Prisma schema and initial migration.

---

## Open Questions

- None yet.

---

## Architecture Decisions

- **Object storage**: Cloudflare R2 (free tier) over AWS S3. S3-compatible API — same SDK, different endpoint. No region required. Env vars: `R2_ENDPOINT`, `R2_BUCKET`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
- **No orchestration framework**: The pipeline is a custom persisted state machine. LangChain, LlamaIndex, and similar frameworks are explicitly excluded. Handoffs are persisted Postgres rows, not in-memory chains.
- **Gemini free tier as LLM default**: via Vercel AI SDK. Provider is swappable through the registry — no pipeline stage imports Gemini SDK directly.
- **DuckDuckGo HTML endpoint as default search**: no API key required. Brave API is a configured optional upgrade.
- **Semantic deduplication via pgvector**: embedding-based candidate clustering added as Unit 41, running as a post-harvest step inside the Discovery stage before Verifier runs.

---

## Session Notes

- Specs reviewed and assessed against Full Stack Applied AI Engineer role requirements: strong alignment.
- Embeddings/pgvector gap identified and addressed with Unit 41 (Semantic Candidate Deduplication).
- All S3 references replaced with Cloudflare R2 across all 8 affected specs.
