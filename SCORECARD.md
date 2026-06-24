# Scorecard

**Repo:** registry-stats
**Date:** 2026-06-24
**Version:** 3.4.0
**Type tags:** `[npm]` `[cli]` `[dashboard]` `[desktop]`

## Current Assessment

| Category | Score | Notes |
|----------|-------|-------|
| A. Security | 10/10 | SECURITY.md with current supported versions; threat model in README; no secrets/telemetry |
| B. Error Handling | 10/10 | Typed errors with retry logic; CLI exit codes; no raw stack traces |
| C. Operator Docs | 10/10 | Comprehensive README; 8-page Starlight handbook; CHANGELOG; --help accurate |
| D. Shipping Hygiene | 10/10 | vitest + tsup verify; version matches tag; CI with dep scanning; MSIX desktop builds |
| E. Identity (soft) | 10/10 | Logo, translations (7 languages + English source), landing page, handbook, GitHub topics |
| **Overall** | **50/50** | |

## History

| Date | Version | Overall | Notes |
|------|---------|---------|-------|
| 2026-02-27 | 0.4.1 | 34/50 | Initial audit — no SECURITY.md, no CHANGELOG, pre-1.0 |
| 2026-02-27 | 1.0.0 | 50/50 | Post-remediation — all gates passed |
| 2026-03-28 | 3.2.2 | 50/50 | Re-audit — expanded to dashboard + desktop, all gates pass |
| 2026-03-28 | 3.2.3 | 50/50 | Security-hardening re-audit — path traversal, WebView2 nav guard, CSP/SRI, server rate limiting; all gates pass |
| 2026-06-14 | 3.3.0 | 50/50 | Dogfood swarm — full health pass (A/B/C/D) + honesty/parity feature fixes; engine 236→271 tests, desktop tests revived (0→13 run in CI), OIDC Trusted Publishing; all gates pass |
| 2026-06-14 | 3.3.1 | 50/50 | Dev-dependency security upgrade — esbuild pinned to `0.28.1` via `overrides` + tsup 8.5 + vitest 4 (engine), Astro 5→6 + Starlight 0.40 + vite 7 (dashboard); cleared all high/critical advisories in both trees, restored full-tree `npm audit` gate in CI + added a site audit gate; all gates pass |
| 2026-06-24 | 3.4.0 | 50/50 | Feature — GitHub Releases provider (6th registry): cumulative release-asset download counts per repo, snapshot-delta weekly, OIDC `githubToken`; 24 release-shipping repos tracked; 271→276 tests; all gates pass |
