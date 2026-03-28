# Scorecard

**Repo:** registry-stats
**Date:** 2026-03-28
**Version:** 3.2.2
**Type tags:** `[npm]` `[cli]` `[dashboard]` `[desktop]`

## Current Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 10/10 | SECURITY.md with current supported versions; threat model in README; no secrets/telemetry |
| B. Error Handling | 10/10 | Typed errors with retry logic; CLI exit codes; no raw stack traces |
| C. Operator Docs | 10/10 | Comprehensive README; 8-page Starlight handbook; CHANGELOG; --help accurate |
| D. Shipping Hygiene | 10/10 | vitest + tsup verify; version matches tag; CI with dep scanning; MSIX desktop builds |
| E. Identity (soft) | 10/10 | Logo, translations (7 languages), landing page, handbook, GitHub topics |
| **Overall** | **50/50** | |

## History

| Date | Version | Overall | Notes |
|------|---------|---------|-------|
| 2026-02-27 | 0.4.1 | 34/50 | Initial audit — no SECURITY.md, no CHANGELOG, pre-1.0 |
| 2026-02-27 | 1.0.0 | 50/50 | Post-remediation — all gates passed |
| 2026-03-28 | 3.2.2 | 50/50 | Re-audit — expanded to dashboard + desktop, all gates pass |
