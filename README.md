# Flank

> One input: your product's URL. One output: a live competitive intelligence report with pricing, positioning, feature matrix, cited sources, and concrete edge recommendations.

---

## What It Does

Paste your product URL. Flank figures out what you actually are, searches the open web for real competitors, reads each competitor's pricing and feature pages, normalizes everything into a comparable shape, and produces a report:

- **Who you're up against** — verified competitors classified by type (direct, indirect, adjacent, substitute)
- **What they charge** — pricing plans, tiers, limits, and add-ons side by side
- **How they position** — ICP, messaging axes, 2×2 positioning map, cluster shading
- **What they ship** — feature matrix with market coverage percentages and gap filters
- **What you should do** — ranked edge opportunities, each with a suggested move, evidence, impact/effort scores, and a "what to say" positioning line

Every claim links to the page it came from. Nothing is asserted without a source.

---

## Core Loop

```
Paste URL → Profile product → Discover candidates → Semantic dedup
  → Verify competitors → Extract pricing + features → Synthesize positioning
  → Find gaps → Recommend edge → Report → Push to tools / Monitor
```

Re-running on the same target produces a **diff** against the previous run — not a duplicate report.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App framework | Next.js (App Router) + TypeScript |
| UI | React Server Components + Tailwind CSS + custom component primitives |
| Auth | Better Auth (session cookies) |
| Database | Postgres + Prisma — hosted on **Neon** free tier |
| Cache / queue | Redis + BullMQ — hosted on **Upstash** free tier |
| Worker | Standalone Node/TypeScript process — deployed on **Fly.io** free tier (always-on) |
| App hosting | **Vercel** Hobby — free, unlimited deploys |
| Progress transport | Server-Sent Events (SSE) via BFF |
| Object storage | **Cloudflare R2** free tier — 10 GB, zero egress, S3-compatible |
| LLM | Vercel AI SDK — Gemini free tier default, provider-swappable |
| Embeddings | Vercel AI SDK (Gemini text-embedding) + pgvector (HNSW index) |
| Search | DuckDuckGo HTML (no key) · Brave API (optional) |
| Page reading | HTTP reader · Playwright (JS-rendered pricing pages) |
| Monorepo | pnpm workspaces |
| Containers | Docker multi-stage builds (app + worker images → ghcr.io) |

---

## Architecture

Two deployables, one shared contract layer:

```
apps/
  app/        — Next.js (BFF + UI). Browser talks here and nowhere else.
  worker/     — Standalone Node process. All LLM, search, and pipeline logic lives here.

packages/
  shared/     — Zod contracts, job payloads, SSE events, provider interfaces, env schemas.
  database/   — Prisma schema and cached client. Single source of DB truth.
  evals/      — Golden-set fixtures, precision/recall scoring, CI regression gate.

infra/
  docker-compose.yml — Local Postgres + Redis with persistent volumes and health checks.
```

**Key invariants:**
- The browser only ever talks to Next.js route handlers — never to Redis, the worker, or any provider.
- Every persisted fact has at least one `Evidence` row (URL + excerpt + content hash + snapshot key).
- Stages are replayable: any stage re-runs from its persisted input artifacts without touching earlier stages.
- The Critic's retry budget is bounded — no infinite loops.
- Confidence is deterministic: identical inputs + formula version = identical score.

---

## Agent Pipeline

| # | Agent | What it writes |
|---|---|---|
| 1 | **Profiler** | `TargetProfile` — category, ICP, pricing model, value props |
| 2 | **Discovery** | `Candidate[]` — multi-angle web search across 6 query strategies |
| 2b | **Semantic Dedup** | Clusters candidates by embedding similarity; marks duplicates before verify |
| 3 | **Verifier** | `Competitor[]` — verified, deduplicated, classified, capped working set |
| 4 | **Pricing** | `PricingPlan[]` — plans, tiers, limits, add-ons per competitor |
| 5 | **Feature** | `FeatureClaim[]` — normalized feature matrix with shared taxonomy |
| 6 | **Positioning** | `Positioning`, `PositioningMap` — ICP, axes, clusters, messaging |
| 7 | **Strategist** | `Opportunity[]` — ranked edge recommendations with evidence |
| 8 | **Critic** | `QualityReport` — deterministic quality gates; can force targeted stage replay |

The Critic is what makes this agentic: it can reject a stage's output and route work back with a specific reason, bounded by a retry budget.

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for local Postgres and Redis)

### Setup

```bash
# Clone and install
git clone <repo-url>
cd flank
pnpm install

# Copy and configure environment
cp .env.example .env
# Fill in: DATABASE_URL, REDIS_URL, R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID,
#           R2_SECRET_ACCESS_KEY, BETTER_AUTH_SECRET, BETTER_AUTH_URL,
#           GEMINI_API_KEY (free tier at aistudio.google.com)

# Start local services
docker compose -f infra/docker-compose.yml up -d

# Run database migrations
pnpm db:migrate

# Start both app and worker in development
pnpm dev
```

### Running individually

```bash
pnpm --filter app dev       # Next.js app only (port 3000)
pnpm --filter worker dev    # Worker only
```

### Database commands

```bash
pnpm db:generate    # Regenerate Prisma client after schema changes
pnpm db:migrate     # Apply pending migrations
pnpm db:reset       # Drop and recreate (dev only)
pnpm db:studio      # Open Prisma Studio
```

### Type checking and linting

```bash
pnpm typecheck      # Type-check all packages
pnpm lint           # Lint all packages
```

### Eval harness

```bash
pnpm evals          # Run golden-set regression (required before merging agent/prompt/contract changes)
```

---

## Environment Variables

| Variable | Required by | Description |
|---|---|---|
| `DATABASE_URL` | app + worker | Postgres connection string |
| `REDIS_URL` | app + worker | Redis connection string |
| `BETTER_AUTH_SECRET` | app | Better Auth signing secret |
| `BETTER_AUTH_URL` | app | App base URL for Better Auth |
| `R2_ENDPOINT` | worker | Cloudflare R2 S3-compatible endpoint URL |
| `R2_BUCKET` | worker | R2 bucket name |
| `R2_ACCESS_KEY_ID` | worker | R2 API key ID |
| `R2_SECRET_ACCESS_KEY` | worker | R2 API secret |
| `GEMINI_API_KEY` | worker | Gemini API key (free tier at aistudio.google.com) |
| `BRAVE_API_KEY` | worker | Optional — Brave Search API key (free tier available) |
| `WORKER_CONCURRENCY` | worker | Max concurrent BullMQ jobs (default: conservative) |

---

## Spec Index

All feature specs live in `specs/`. Read `specs/00-product-map.md` first.

**Foundation** — `01` Architecture · `02` Design System · `03` App Shell · `04` Auth · `05` Data Model · `06` BFF API · `07` Queue & Worker · `08` Run Orchestration · `09` SSE Progress · `10` Provider Abstraction

**Intelligence** — `11` Profiler · `12` Discovery · `13` Verifier · `14` Pricing · `15` Feature · `16` Positioning · `17` Strategist · `18` Critic · `19` Evidence Store · `20` Confidence Scoring · `41` Semantic Candidate Deduplication *(embeddings + pgvector)*

**Experience** — `21` URL Submission · `22` Run Progress · `23` Report Shell · `24` Target Profile Card · `25` Competitor Table · `26` Pricing Matrix · `27` Feature Matrix · `28` Positioning Map · `29` Edge Opportunities · `30` Sources · `31` Manual Curation · `32` Export · `33` Public Share Links · `34` History & Diffs

**Platform** — `35` Integrations Framework · `36` Slack / Notion / Issue Trackers · `37` Webhooks / Public API / MCP · `38` Monitoring & Scheduled Re-runs · `39` Quotas & Rate Limits · `40` Observability & Eval Harness

**Context (AI agent guidance)** — `context/project-overview.md` · `context/architecture-context.md` · `context/ui-context.md` · `context/code-standards.md` · `context/ai-workflow-rules.md` · `context/progress-tracker.md`

---

## Non-Goals (v1)

- No manual competitor research workflow — discovery is automatic, curation is a correction
- No CRM or deal-tracking features
- No scraping behind logins, paywalls, or access controls
- No sub-daily price monitoring (weekly scheduled re-runs only)
- No AI chat as the primary interface
- No mobile-first layouts (responsive to tablet, optimized for desktop)
