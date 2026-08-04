# Repository Health Audit - 2026-08-04

## Baseline

| Command | Result | Notes |
| --- | --- | --- |
| `git status --short` | exit 0 | Dirty before work; many pre-existing `.omc`, log, Supabase, and line-ending changes present. |
| `git branch --show-current` | exit 0 | `main` |
| `git log -15 --oneline` | exit 0 | Latest: `008b1a2 docs: update agent instructions` |
| `node --version` | exit 0 | `v24.11.1` |
| `npm --version` | exit 0 | `11.10.1` |
| `npm ci` | exit 0 | 504 packages installed; 14 audit vulnerabilities reported. |
| `npm run lint` | exit 0 | No ESLint warnings/errors. `next lint` deprecation warning remains. |
| `npm test` | exit 0 | Before: 91 tests. After: 98 tests. |
| `npm run build` | exit 0 | Build passed. Workspace-root warning fixed by `outputFileTracingRoot`. |
| `npx tsc --noEmit` | exit 0 | No TypeScript errors. |

## Inventory

- App Router pages: 22
- Layouts: 6
- API route handlers: 10
- Client components/files with `'use client'`: 35
- Migrations: 10
- Scripts: 21
- Unit test files after changes: 8
- E2E spec files: 1
- Docs before report files: 12
- Public assets: 5
- TS/TSX files over 500 lines: `lib/supabase/client.ts` (716), `app/survey/page.tsx` (617)
- Assets over 500 KB: `public/logo.png`, `public/videos/hero-bg.mp4`, `hero-bg.old.mp4`, `hero-bg.old2.mp4`

## Implemented Health Fixes

- Removed deprecated npm `crypto` package; Node built-in `crypto` remains in use.
- Added remote write guard for smoke and Playwright E2E targets.
- Added security/helper unit tests and included `scripts/**/*.test.ts` in Vitest.
- Updated README, Coolify guide, and AGENTS notes for Next 15, secret requirements, and write-test safety.

## Remaining Health Backlog

- Replace deprecated `next lint` script before Next 16.
- Review `npm audit` vulnerabilities; do not run `npm audit fix --force` without dependency impact review.
- Optimize or archive duplicate large hero videos.
- Refactor `app/survey/page.tsx` only after behavior tests are expanded.
