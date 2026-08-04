# Documentation Audit - 2026-08-04

## Updated

- `README.md`: Next 15, active model wording, read-only admin wording, env requirements, write-test warning, license accuracy.
- `AGENTS.md`: production `SESSION_HASH_SECRET` and analytics/session-replay restrictions.
- `docs/COOLIFY_DEPLOYMENT.md`: required secrets, Supabase-vs-Coolify Postgres warning, horizontal scaling/rate-limit warning, production write-test warning.
- Legal privacy/cookie pages: Clarity behavior aligned with code.

## Classification

| Path | Classification | Notes |
| --- | --- | --- |
| `README.md` | MAINTAINED | Updated in this batch. |
| `AGENTS.md` | MAINTAINED | Canonical agent rules. |
| `docs/COOLIFY_DEPLOYMENT.md` | MAINTAINED | Updated but still needs full operational review. |
| `docs/party-positions-v2-derivation.md` | REFERENCE | Methodology derivation reference. |
| `docs/superpowers/plans/*` | HISTORICAL | Contains stale Clarity/footer-link assumptions; do not treat as current behavior. |
| `docs/superpowers/specs/*` | HISTORICAL | Useful context, not source of truth. |
| `.omc/*`, `.logs/*`, `.next/*` | SENSITIVE_DO_NOT_TRACK / GENERATED | Left untouched. |

## Remaining Conflicts

- Historical docs still mention the removed Clarity/footer links.
- README still summarizes schema at a high level; exact table contract should be generated from migrations or Supabase types in a later batch.
- `CLAUDE.md` was not created to avoid duplicating `AGENTS.md`.
