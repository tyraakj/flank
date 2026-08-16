# Progress Tracker

Update this file whenever the current phase, active unit, or implementation state changes. Progress state must reflect the actual implementation, not the intended state.

---

## Current Phase

**Implementation — Foundation units underway.**

## Current Goal

Complete Unit 04 (Auth and Workspaces) and Unit 05 (Data Model) integration.

---

## Spec Status

### Foundation

| Unit | Spec                              | Status           |
| ---- | --------------------------------- | ---------------- |
| 00   | Product Map                       | ✅ Spec complete |
| 01   | Architecture and Shared Contracts | ✅ Complete      |
| 02   | Design System                     | ✅ Complete      |
| 03   | App Shell and Navigation          | ✅ Complete      |
| 04   | Auth and Workspaces               | ✅ Complete      |
| 05   | Data Model                        | ✅ Complete      |
| 06   | BFF API Surface                   | ✅ Complete      |
| 07   | Queue and Worker Runtime          | ✅ Complete      |
| 08   | Run Orchestration                 | ✅ Complete      |
| 09   | SSE Progress Channel              | ✅ Complete      |
| 10   | Provider Abstraction Layer        | ✅ Complete      |

### Intelligence

| Unit | Spec                             | Status         |
| ---- | -------------------------------- | -------------- |
| 11   | Profiler Agent                   | ⬜ Not started |
| 12   | Discovery Agent                  | ⬜ Not started |
| 13   | Verifier Agent                   | ⬜ Not started |
| 14   | Pricing Agent                    | ⬜ Not started |
| 15   | Feature Agent and Taxonomy       | ⬜ Not started |
| 16   | Positioning Agent                | ⬜ Not started |
| 17   | Strategist Agent                 | ⬜ Not started |
| 18   | Critic Agent and Quality Gates   | ⬜ Not started |
| 19   | Evidence and Snapshot Store      | ⬜ Not started |
| 20   | Confidence Scoring               | ⬜ Not started |
| 41   | Semantic Candidate Deduplication | ⬜ Not started |

### Experience

| Unit | Spec                            | Status         |
| ---- | ------------------------------- | -------------- |
| 21   | URL Submission Flow             | ⬜ Not started |
| 22   | Run Progress Screen             | ⬜ Not started |
| 23   | Report Shell                    | ⬜ Not started |
| 24   | Target Profile Card             | ⬜ Not started |
| 25   | Competitor Table and Drawer     | ⬜ Not started |
| 26   | Pricing Matrix                  | ⬜ Not started |
| 27   | Feature Matrix                  | ⬜ Not started |
| 28   | Positioning Map                 | ⬜ Not started |
| 29   | Edge Opportunities              | ⬜ Not started |
| 30   | Sources Screen                  | ⬜ Not started |
| 31   | Manual Curation and Corrections | ⬜ Not started |
| 32   | Export                          | ⬜ Not started |
| 33   | Public Share Links              | ⬜ Not started |
| 34   | History and Diffs               | ⬜ Not started |

### Platform

| Unit | Spec                              | Status         |
| ---- | --------------------------------- | -------------- |
| 35   | Integrations Framework            | ⬜ Not started |
| 36   | Slack, Notion, and Issue Trackers | ⬜ Not started |
| 37   | Webhooks, Public API, and MCP     | ⬜ Not started |
| 38   | Monitoring and Scheduled Re-runs  | ⬜ Not started |
| 39   | Quotas and Rate Limits            | ⬜ Not started |
| 40   | Observability and Eval Harness    | ⬜ Not started |

---

## Completed

- ✅ Full spec suite written (Units 00–40 + Unit 41 Semantic Deduplication)
- ✅ Object storage decision: Cloudflare R2 (free tier, S3-compatible, zero egress fees) — all specs updated
- ✅ Context files created for AI agent guidance
- ✅ **Unit 01** — Created monorepo structure: `apps/app`, `apps/worker`, `packages/shared`, `packages/database`, `infra/docker-compose.yml`, root `.gitignore` & `env.example`.
- ✅ **Unit 02** — Design system: Tailwind config, shadcn/ui components, `cn()`, and flank-specific components (confidence, support-status, matrix, data-table).
- ✅ **Unit 03** — App Shell and Navigation: Initial `app/(workspace)` routing structure created.
- ✅ **Unit 04** — Auth and Workspaces: Better Auth config, session management, access control logic in `apps/app/lib/access.ts`, and workspace switcher component.
- ✅ **Unit 05** — Data Model: Complete Prisma schema with workspace ownership, targeting, running, and all domain constraints enforced inside `migration.sql` with check conditions.
- ✅ **Unit 06 & 07** — BFF API Surface and Queue Worker Runtime: Implemented BullMQ queues, standard API handlers with Zod schema validation, API guards, worker entrypoint, shutdown, and dead-letter queue. Upstash Redis configuration added to architecture context.
- ✅ **Unit 42** — CI Workflows: Configured GitHub Actions for typechecking, linting, building, and dependency review. Defined branch protection rules (excluding evals per user request).
- ✅ **Unit 08** — Run Orchestration: Implemented BullMQ orchestrator state machine (`run-service`, `execute-stage`, `replay-stage`, `cancellation`) using real agent dispatchers and transaction safety.

---

- ✅ **Unit 10** — Provider Abstraction Layer: Created core interfaces, DuckDuckGo search, HTTP/Playwright readers, Gemini LLM with Vercel AI SDK, and R2/Postgres caching.
- ✅ **Frontend Branding & Logo** — Locked brand colors (light canvas, pastel pink & yellow accents, charcoal foundation), implemented 3D halftone dithered dot globe SVG logo (`FlankLogo`), updated landing page hero subtext, and replaced logo references across TopBar, Footer, and interactive dashboard mockups.

---

## In Progress

- 🏗️ **Unit 11** — Profiler Agent (Next up)

---

## Next Up

1. **Unit 11** — Profiler Agent: Implement the first intelligent agent.
2. **Unit 12** — Discovery Agent: Implement search discovery.

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
