# Modernization Backlog - 2026-08-04

| ID | Title | Priority | Size | Acceptance Criteria |
| --- | --- | --- | --- | --- |
| API-001 | Complete endpoint idempotency/atomicity | P1 | M | Duplicate complete does not create duplicate snapshots; session update and snapshot write cannot leave inconsistent state. Requires transaction/RPC plan before migration. |
| API-002 | Domain validation for answers | P1 | M | Answers are checked against active/session model questions and allowed option values, not only Zod shape. |
| API-003 | Pin session to axis model | P1 | L | A session uses the model active at session creation even if activation changes mid-survey. Requires forward migration plan. |
| RLS-001 | Run RLS matrix audit | P1 | M | `npm run audit:rls` succeeds against intended DB; anon/auth/service policy matrix is documented. |
| RATE-001 | Shared rate limiter for scaling | P1 | M | Multi-replica deployment uses Redis/KV-backed limiter or docs explicitly keep single replica. |
| SEO-001 | Dynamic public claims | P2 | M | Homepage and methodology claims match active model counts and active parties. |
| PERF-001 | Hero video optimization | P2 | M | Remove/archive duplicate old videos; add mobile/data-saver strategy; verify LCP impact. |
| SURVEY-001 | Survey behavior tests | P2 | M | Auto-advance, importance cancellation, no-opinion, required validation, back navigation, and ranking defaults are covered before refactor. |
| SURVEY-002 | Survey page split | P2 | L | Extract codec/validation, navigation, renderer, and submission hooks without changing wire format. |
| RESULTS-001 | Result runtime parser | P2 | M | Results page validates API payload at runtime and handles corrupt legacy snapshots gracefully. |
| DOC-001 | Historical docs archive pass | P3 | S | Stale superpowers docs are clearly marked historical or moved to archive. |
| DEP-001 | Dependency audit remediation | P2 | M | Remaining 14 npm audit issues triaged without forced breaking upgrades. |

## Product/Legal Decisions Needed

- Whether any analytics should ever run on public marketing pages, and under what consent model.
- Retention policy for incomplete sessions, completed answers, result snapshots, IP/device hashes, behavior events, and admin audit data.
- Whether legal pages should be indexable for transparency or remain noindex as currently configured.
