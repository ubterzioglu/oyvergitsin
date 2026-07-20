# Repository Guidelines

## Project Structure & Module Organization
`app/` contains the Next.js 14 App Router code: public pages in `app/page.tsx`, `app/consent`, `app/survey`, results in `app/results/[sessionId]`, admin tooling in `app/admin`, and API handlers in `app/api/*`. Shared logic lives in `lib/`, mainly `lib/supabase/*` for client/server setup and `lib/scoring/engine.ts` for match calculation. Database assets live in `supabase/migrations/`, while operational scripts such as `scripts/seed.js` and migration helpers stay in `scripts/`. Deployment notes are documented in `docs/COOLIFY_DEPLOYMENT.md`.

## Build, Test, and Development Commands
Use `npm install` to sync dependencies. `npm run dev` starts the local app on port 3000. `npm run build` creates the production bundle, and `npm run start` serves that build. `npm run lint` runs the Next.js ESLint rules. For database work, use `npm run db:push` to apply Supabase schema changes, `npm run db:seed` to seed content, and `npm run db:reset` to rebuild the local database. For container checks, `docker compose up --build` mirrors the Coolify deployment path.

## Coding Style & Naming Conventions
Follow the existing TypeScript-first style with `strict` mode enabled. Use 2-space indentation, single quotes, and semicolon-free files to match the current codebase. Name React components and exported types in PascalCase, helper functions in camelCase, and route folders in lowercase (`app/api/health`, `app/admin/questions`). Prefer the `@/` path alias over long relative imports.

## Testing Guidelines
There is no dedicated automated test suite committed yet. Until one is added, treat `npm run lint` and `npm run build` as required checks, then smoke-test the main flows: `/`, `/consent`, `/survey`, `/results/[sessionId]`, `/admin`, and `/api/health`. If you add tests, colocate them near the feature or under a clear `tests/` folder and use names ending in `.test.ts` or `.test.tsx`.

## Commit & Pull Request Guidelines
Recent history favors short, imperative subjects such as `seo geo`, `tr check`, and focused fixes like `Fix Docker build: install all deps...`. Keep commits small, scoped, and descriptive; start with the area when useful, for example `admin: validate consent form`. PRs should include a brief summary, note any schema or env changes, link the issue if there is one, and attach screenshots for UI changes.

## Security & Configuration Tips
Keep secrets in `.env.local` or platform-managed variables only; never commit Supabase keys. Validate changes touching `lib/supabase/`, API routes, or admin pages carefully, and re-check Docker or Coolify settings when editing `Dockerfile`, `docker-compose.yml`, or deployment env vars.
