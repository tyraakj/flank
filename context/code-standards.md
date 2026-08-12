# Code Standards

## General

- Keep modules small and single-purpose. One agent per file. One stage runner per file.
- Fix root causes — do not layer workarounds.
- Do not mix unrelated concerns in one module, route, or component.
- Respect the system boundaries defined in `architecture-context.md`.
- Name files after the responsibility they contain, not the technology.

## TypeScript

- Strict mode is required everywhere (`"strict": true`).
- Avoid `any`. Use explicit interfaces or narrowly scoped generics.
- Validate all unknown external input at system boundaries using Zod before trusting it.
- Export inferred TypeScript types beside every Zod schema — never write types manually for Zod-covered shapes.
- Use `interface` for object contracts that extend or are implemented by classes; use `type` for union types and Zod inference aliases.

## Zod and Contracts

- All shared contracts (request, response, job payload, stage artifact, SSE event, provider output) live in `packages/shared/src/contracts/`.
- Every Zod schema is validated before persistence, before enqueueing, and before returning from a route handler.
- On schema failure from an LLM, make exactly one repair request with the original context and validation errors. On a second failure, use the deterministic fallback — never omit the record.
- Never export route handlers, React components, or provider SDK clients from `packages/shared`.

## Agent Modules

- Each agent lives in `apps/worker/src/agents/<name>.ts` and has a single exported function: `run<Name>Agent()`.
- Agents depend on provider interfaces only — never import a vendor SDK (Gemini, DuckDuckGo, Playwright) directly.
- Every derived field is a claim and must produce at least one `Evidence` row. Persist nothing uncited.
- Log model name, prompt version, input tokens, output tokens, and estimated cost on every LLM call.
- Set unresolved or unknown fields to `"unknown"` — never invent values.

## Provider Implementations

- All providers live in `apps/worker/src/providers/` and implement the interfaces defined in `packages/shared/src/contracts/providers.ts`.
- Register all provider implementations through `apps/worker/src/providers/registry.ts`. Stage code depends on the registry, not on concrete implementations.
- Respect `robots.txt` before fetching any page. Log and return a typed unavailable result for disallowed paths — do not bypass or treat denial as an error to retry.
- Never expose provider credentials, raw page content, or vendor-specific types to `packages/shared` or the BFF.

## Route Handlers (BFF)

- Call `requireSession` and the typed access helpers from `apps/app/lib/access.ts` before any read or mutation.
- Parse and validate request body once using the shared Zod schema. Return 422 with field-level errors on validation failure.
- Return `{ data, meta }` on success and `{ error: { code, message, fields? } }` on failure. Never return raw Prisma records or provider output.
- BFF handlers enqueue work and read persisted state. They do not execute agents, call providers, or write stage outputs.
- Add `Cache-Control: no-store` to all authenticated mutable and progress responses.
- Log request IDs without logging secrets, session tokens, or personal data.

## Database and Persistence

- All domain records belong in Postgres via Prisma using `packages/database`.
- Use `cuid` string primary keys, `createdAt`/`updatedAt` UTC timestamps, and explicit relation names.
- Use transactions when writing artifacts plus Evidence together. Reject the transaction if required Evidence is absent.
- Do not use JSON columns for fields that need filtering, uniqueness, indexing, or relational joins.
- Large binary content (page snapshots, PDF exports) belongs in Cloudflare R2. Postgres stores only the storage key reference.
- Never use Redis as the source of truth for Run state, Stage state, authorization, or Evidence.

## Queue and Jobs

- Job payloads contain IDs and intent only — never credentials, large artifacts, or raw page content.
- Use deterministic job IDs (job type + Run ID + Stage key + attempt + intent) for idempotency.
- Retry only retryable failures (transient network, provider rate limit, lock contention). Fail immediately on validation errors, authorization errors, malformed payloads, and exhausted budgets.
- Never auto-loop permanently failing jobs. Dead-lettered work requires an explicit BFF-authorized replay.

## Styling (UI)

- Use the semantic CSS custom property tokens defined in `apps/app/app/globals.css`. No hardcoded hex values or raw Tailwind color classes like `zinc-*`.
- Default to React Server Components. Add `"use client"` only when the component needs browser interactivity, hooks, or SSE subscription.
- Never use color alone as the only signal for confidence level, feature support status, warning, or error. Always include a shape, label, or accessible text.
- Use semantic HTML tables for tabular data. Do not emulate tables with generic divs.
- Match loading skeleton layouts to final content dimensions. Never use a centered spinner on data-dense report screens.

## Observability

- Emit structured JSON logs from both `apps/app` and `apps/worker` with correlation IDs: Workspace, Target, Run, Stage, queue job, provider call.
- Redact credentials, API keys, webhook secrets, authorization headers, raw prompts containing private context, raw page bodies, and unredacted provider responses before logs leave the process.
- Record token counts, estimated cost, and latency on every LLM and embedding call.

## File Organization

```
apps/app/
  app/api/              — BFF route handlers
  app/(workspace)/      — RSC page tree for authenticated screens
  lib/                  — access.ts, api-guard.ts, queue-producer.ts, api-response.ts
  components/flank/     — product-specific UI components
  components/ui/        — shadcn/ui primitives (do not modify after generation)

apps/worker/
  src/agents/           — one file per agent
  src/stages/           — one stage runner per pipeline step
  src/orchestration/    — stage machine, run service, replay, critic router, cancellation
  src/providers/        — search, reader, LLM, embedding implementations and registry
  src/services/         — evidence store, confidence, domain trust, clusterer, ranker
  src/jobs/             — scheduled and maintenance jobs
  src/observability/    — structured logger, metrics, alerts

packages/shared/
  src/contracts/        — all Zod schemas and inferred types
  src/events/           — SSE event envelopes
  src/env.ts            — appEnvSchema and workerEnvSchema validators

packages/database/
  prisma/               — schema.prisma (single source of truth)
  src/client.ts         — cached Prisma client export

packages/evals/
  src/fixtures/         — golden-set Targets, labels, tolerances
  src/scoring.ts        — precision, recall, F1, extraction accuracy
  src/regression-gate.ts — CI pass/fail logic
```
