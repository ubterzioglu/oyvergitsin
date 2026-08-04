# Security and Privacy Audit - 2026-08-04

## Findings

| ID | Area | Severity | Evidence | Implemented |
| --- | --- | --- | --- | --- |
| SEC-001 | Session hash secret | P0 | `app/api/sessions/route.ts` used `SESSION_HASH_SECRET || SUPABASE_SERVICE_KEY || dev-only-fallback-secret`. | Yes: production now fails closed without `SESSION_HASH_SECRET`; service key fallback removed. |
| SEC-002 | Third-party analytics | P0 | Microsoft Clarity loaded from root layout on every route, including survey/results/admin. | Yes: root Clarity script removed; CSP Clarity domains removed; legal text updated. |
| SEC-003 | Footer outbound SEO links | P1 | Footer contained unrelated dofollow links to moving, scrap metal, and adult-shop URLs. | Yes: links removed. Historical docs still mention old links as stale context. |
| SEC-004 | Sensitive cache/indexing | P1 | API/results relied mostly on robots/layout metadata. | Yes: `X-Robots-Tag` and `Cache-Control: no-store, private` headers added for API/results; priority API responses use `noStoreJson`. |
| SEC-005 | Production test writes | P1 | Smoke and E2E could target `BASE_URL=https://...` and create sessions/answers. | Yes: remote write guard added; remote targets require `ALLOW_REMOTE_TEST_WRITES=true`. |
| SEC-006 | RLS verification | P1 | `npm run audit:rls` could not reach configured DB host. | Blocked: `getaddrinfo ENOENT db.inejvgbkesnrohvjqmon.supabase.co`. |

## Service-role Call Sites

- `app/api/sessions/route.ts`: session creation, consent lookup, token hash insert.
- `app/api/answers/route.ts`: answer insert after cookie-token ownership check.
- `app/api/complete/route.ts`: completion update, result snapshot insert.
- `app/api/results/[sessionId]/route.ts`: snapshot/result read after ownership check.
- `app/api/feedback/route.ts`: feedback insert.
- `lib/scoring/engine.ts`: scoring data fetch and legacy result formatting.
- `lib/session-ownership.ts`: admin lookup of stored token hash.
- Radar admin/cron routes: service-role use for privileged scan/candidate mutation.

## Session Ownership Notes

- Session token uses 32 random bytes hex, stored in `httpOnly`, `sameSite: strict`, `secure` in production cookie.
- Token hash verification uses SHA-256 and `timingSafeEqual`.
- `localStorage.sessionId` remains a navigation pointer only; authorization is cookie-token based.
- Remaining risk: session/model consistency is not pinned to session start; backlog item API-003 tracks this.

## RLS Status

`npm run audit:rls` is read-only but blocked by DB DNS resolution. Do not claim RLS is verified until the audit can run against the intended environment.
