# Architecture Context

## Stack

| Layer | Technology | Role |
|---|---|---|
| App framework | Next.js (App Router) + TypeScript | Full-stack application, React Server Components, BFF route handlers |
| UI | React Server Components + Tailwind CSS + custom component primitives | Data-dense report surfaces, matrices, real-time progress |
| Auth | Better Auth (session cookies) | Session management, workspace access control |
| Database | Postgres 16 + Prisma | Hosted on Neon free tier (0.5 GB); Prisma connects via `DATABASE_URL` |
| Cache / queue | Redis 7 + BullMQ | Hosted on Upstash free tier (10K cmds/day); TLS `rediss://` connection |
| Worker | Standalone Node/TypeScript process | Deployed on Fly.io free tier — always-on Docker container, no sleep |
| App hosting | Vercel Hobby | Free tier — Next.js app, unlimited deploys, 100 GB bandwidth |
| Progress transport | Server-Sent Events (SSE) via BFF | Live run progress from worker → Redis pub/sub → BFF → browser |
| Object storage | Cloudflare R2 (free tier) | Raw page snapshots, PDF exports — S3-compatible API, zero egress |
| LLM access | Vercel AI SDK, provider-agnostic | Structured output via Zod; default: Gemini free tier |
| Embeddings | Vercel AI SDK (Gemini text-embedding) + pgvector | Semantic candidate deduplication in Discovery stage |
| Search | DuckDuckGo HTML (default), Brave API (optional) | Competitor discovery; no key required for default |
| Page reading | HTTP reader + Playwright (JS-rendered pages) | Public page extraction; robots.txt respected |
| Monorepo | pnpm workspaces | `apps/app`, `apps/worker`, `packages/shared`, `packages/database` |
| Containers | Docker (multi-stage builds) | Separate images for app and worker; pushed to ghcr.io |
| Container registry | GitHub Container Registry (ghcr.io) | Free with GitHub Actions |

## Deployables

Two and only two deployables:

- **`apps/app`** — Next.js application. Owns BFF route handlers, React UI, server components, and SSE endpoints. Never calls providers, runs LLM, or accesses Redis pub/sub directly.
- **`apps/worker`** — Standalone Node process. Owns BullMQ consumers, all agent modules, provider implementations, pipeline orchestration, and snapshot writes. Never renders UI or exports React components.

They share:
- **`packages/shared`** — Zod contracts: request/response, job payloads, stage artifacts, SSE events, provider interfaces, domain schemas, environment validators.
- **`packages/database`** — Prisma schema, generated client, and cached client export. The only Prisma boundary.

## System Boundaries

| Boundary | Owns |
|---|---|
| `apps/app/app/api/` | BFF route handlers — auth, validation, ownership, job enqueueing, report reads |
| `apps/app/lib/` | `access.ts` (auth helpers), `api-guard.ts`, `queue-producer.ts` (server-only), `api-response.ts` |
| `apps/app/app/(workspace)/` | RSC page tree, report screens, progress UI |
| `apps/worker/src/agents/` | Individual agent modules — one per pipeline role |
| `apps/worker/src/stages/` | Stage runner entry points wiring agents to the orchestration layer |
| `apps/worker/src/orchestration/` | Stage machine, run service, replay, critic router, cancellation |
| `apps/worker/src/providers/` | Search, page reader, LLM, embedding implementations and registry |
| `apps/worker/src/services/` | Evidence store, confidence scorer, domain trust, semantic clusterer, opportunity ranker |
| `packages/shared/src/contracts/` | All shared Zod schemas and inferred TypeScript types |
| `packages/evals/` | Golden-set fixtures, scoring, regression gate, CI harness |

## Storage Model

- **Postgres (via Prisma)**: all relational domain data — Workspaces, Targets, Runs, Stages, Candidates, Competitors, PricingPlans, FeatureClaims, Positioning, Opportunities, Evidence, QualityReports, Confidence, Diffs, Integrations, ApiKeys, RunMetrics, StageMetrics, CandidateEmbeddings.
- **Cloudflare R2**: raw public-page snapshots (content-hash keyed), PDF export files. Metadata and storage keys are stored in Postgres; the worker is the only component that writes to R2.
- **Redis (Upstash)**: BullMQ job queues and pub/sub channels for SSE progress events. Hosted via Upstash Serverless Redis (standard TCP connection). Not a source of truth — all authoritative state lives in Postgres.
- **pgvector**: vector column on `CandidateEmbedding` in Postgres; HNSW index for cosine nearest-neighbour queries during semantic deduplication.

## Auth and Ownership Model

- Sessions managed by Better Auth with database-backed session cookies.
- Access always resolved from the authenticated session + resource ID server-side.
- Access chain: `requireSession` → `requireWorkspaceMember` → `requireTargetAccess` / `requireRunAccess`.
- Client-supplied `userId`, `workspaceId`, `orgId`, or role assertions are never trusted.
- API keys (for REST v1 and MCP) are hashed at rest, scoped, and Workspace-bound. Plaintext shown once on creation only.

## Pipeline Invariants

1. **BFF only.** The browser talks exclusively to Next.js route handlers. Redis, workers, providers, and R2 are never reachable from the client.
2. **Two deployables.** `apps/app` and `apps/worker` do not import each other's application code.
3. **Worker owns the pipeline.** All network-heavy and LLM work happens in the worker. BFF handlers enqueue and read persisted state.
4. **Ownership is derived server-side.** Never accept client-supplied identity as proof of access.
5. **Every fact carries evidence.** No pricing number, feature claim, or positioning statement is persisted without at least one `Evidence` row.
6. **Stages are replayable.** Each stage reads persisted input artifacts and writes persisted output artifacts. Any stage can be re-run alone.
7. **Providers are swappable.** Search, page reading, LLM, and embedding access sit behind interfaces. No pipeline stage imports a vendor SDK directly.
8. **Retry budgets are bounded.** The Critic can force a targeted stage replay within a per-Run retry budget. No infinite loops.
9. **Confidence is deterministic.** The 0–100 scoring formula is versioned and reproducible from persisted inputs alone — no live provider calls.
10. **Eval gates block regressions.** Changes to agent prompts, model config, Zod contracts, or provider adapters require a passing golden-set CI run.
