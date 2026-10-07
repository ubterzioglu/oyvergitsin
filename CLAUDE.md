# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

oyvergitsin.org — a Turkish political-alignment survey platform (Next.js 14 App Router + TypeScript + Supabase). Users answer a survey, the scoring engine compares their answers against party positions on ideological axes, and they get a similarity result. There's also a public methodology page, an admin panel, and a "radar" news-scanning feature.

## Commands

```bash
npm run dev              # dev server, localhost:3000
npm run build / start    # production build / serve
npm run lint              # next lint
npm test                  # vitest run (lib/**/*.test.ts(x) only)
npm run test:watch        # vitest watch mode
npx vitest run lib/scoring/axis-score.test.ts   # single test file
npm run test:e2e          # playwright, starts its own dev server (see below)
npm run smoke              # exercises the live API chain end-to-end
npm run audit:rls          # prints RLS policies on sensitive tables
```

Database / content scripts (`scripts/`):
```bash
npm run db:push            # supabase db push (prompts for password)
npm run db:migrate <file.sql>   # apply one migration via DBLINK, uses .env.local — the unattended path
npm run db:seed / db:seed:admin
npm run db:reset

npm run v2:seed            # writes v2 axis/question content (idempotent, leaves model inactive)
npm run v2:positions       # derives party positions for v2 axes
npm run v2:verify          # checks row counts / invariants
npm run v2:activate        # flips the active axis model — do this LAST
```

`PREVIEW_AXIS_MODEL_VERSION=v2 npm run dev` previews an inactive axis model locally without touching the live `is_active` flag. Never set this in production.

E2E tests write real sessions/answers to whichever database they target. Point at a deployed target with `BASE_URL=https://... npm run test:e2e` (skips starting a local server) — be aware this writes real data there too.

## Architecture

**Scoring engine is deliberately pure.** `lib/scoring/core.ts`, `axis-score.ts`, `party-match.ts`, `item-score.ts`, `parse-answer.ts` have zero Supabase/Next.js imports — they're plain functions over typed inputs (`lib/scoring/types.ts`) so they can be unit-tested without a database. All data fetching lives in `lib/scoring/engine.ts` (`calculateResults`, `formatStoredResults`). Keep this separation when touching scoring code.

**Axis models are versioned, and only one is "active".** `lib/scoring/active-model.ts` (`getActiveAxisModelId`) is the single source of truth both the survey (`/api/questions`) and the scoring engine use to decide which axes/questions apply. `v1` is old demo content; `v2` is the methodology-derived set (from `resultdeepresearch.html` / `docs/party-positions-v2-derivation.md`). Never resolve axes independently elsewhere — go through this function.

**Result snapshots are frozen at completion time.** From v2 onward, `result_snapshots.result_payload` stores the full computed result. `formatStoredResults` returns that payload as-is rather than recomputing — if party positions change later, previously-seen results must not silently change. Old (v1) snapshots lack `result_payload` and get reconstructed from axis/party ids stored in the snapshot, not from the currently-active model (v1's axes may no longer be active).

**Four different Supabase client constructors, not interchangeable:**
- `lib/supabase/client.ts` — browser client, anon key.
- `lib/supabase/server.ts` — SSR client for Server Components, cookie-based session, anon key.
- `lib/supabase/route.ts` — `getRouteClient()` (service role, RLS bypass, for API route handlers) vs `getPublicServerClient()` (anon key, respects RLS). `route.ts` is `server-only`.
- `lib/supabase/admin.ts` — `getAdminClient()`, service role, for admin-panel server actions.

**`/admin/*` auth happens in `middleware.ts`**, not per-page: it checks the Supabase session, redirects to `/admin/login` if absent, and calls the `is_admin` RPC to gate non-admins. `lib/radar/admin-auth.ts` (`requireAdmin`) is a second, separate check used inside radar admin API routes.

**RLS is the real security boundary, not the Next.js API layer.** The Supabase REST endpoint is reachable directly with the public anon key, so session-ownership checks in API routes don't protect data by themselves — protection must exist in RLS policies. Use `npm run audit:rls` when touching anything session/answer-related.

**Radar** (`lib/radar/`, `app/admin/radar/`, `app/api/cron/radar-scan`) is an independent subsystem that scans RSS/Atom news sources (`lib/radar/scan.ts`), dedupes/normalizes/scores relevance, and surfaces candidates for admin review. Guards against concurrent scans via a `news_scan_runs` "running" row with a staleness threshold. Cron trigger is authenticated via `CRON_SECRET`.

**Validation** uses Zod schemas per domain in `lib/validation/` (`survey.ts`, `feedback.ts`, `radar.ts`) — apply new user/API input through these rather than ad hoc checks.

## Structure

- `app/` — App Router: public flow (`/`, `/consent`, `/survey`, `/results/[sessionId]`), `/legal/*`, `/metodoloji`, `/admin/*` (axes, questions, parties, consent, feedback, radar, responses), `app/api/*` route handlers.
- `lib/scoring/` — pure scoring core + `engine.ts` (DB-aware) + `active-model.ts`.
- `lib/supabase/` — the four client variants above.
- `lib/radar/` — news scanning subsystem.
- `lib/email/` — Zoho SMTP feedback notifications.
- `lib/validation/` — Zod schemas.
- `supabase/migrations/` — schema; `docs/party-positions-v2-derivation.md` documents how v2 party positions were derived; `docs/COOLIFY_DEPLOYMENT.md` covers deployment.

## Conventions

TypeScript strict mode, 2-space indent, single quotes, no semicolons. PascalCase components/types, camelCase functions, lowercase route folders. Use the `@/` path alias over relative imports. Turkish is used in-code for comments/strings tied to domain content (survey copy, methodology notes); this is intentional, not inconsistency.

## Deployment note

Coolify's webhook deploys from `main` only — pushing a feature branch does not update production. The database is shared across branches (same Supabase project), so schema/data changes are live immediately even when code isn't deployed yet; verify what's actually deployed before assuming a seed script's effects are safe.
