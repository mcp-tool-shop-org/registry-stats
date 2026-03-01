# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.2.1] - 2026-03-01

### Changed
- Executive snapshot now emits structured `narrativeLines` array (6 labeled rows with icons) alongside flat `narrative` string
- Each line includes richer context: runner-up package, delta counts, portfolio concentration verdict

## [1.2.0] - 2026-03-01

### Added
- Executive snapshot: rich one-sentence narrative (registry lead, top package, top gainer with delta, concentration, data confidence)
- Growth Pulse panel: precomputed top gainers, decliners, newly active packages
- Data Health panel: per-registry coverage, confidence badges (ok/partial/missing), expandable error details
- Per-row 30-day sparklines in leaderboard (npm only, CSS-only)
- `manifestCounts`, `fetchedCounts`, `errorsByRegistry`, `confidence`, `narrative`, and `movers` fields in stats.json payload
- `isNew` flag on packages (prev7=0 && last7>0); `trendPct` set to null for new packages to avoid infinity display

### Changed
- Dashboard restructured into two-column Pulse layout (Growth + Ops) replacing standalone Top Movers
- Concentration metric replaces "Active registries" summary card
- Updated timestamp is now relative ("5m ago") with hover for exact UTC

## [1.1.0] - 2026-03-01

### Added
- Static dashboard page at `/dashboard/` showing download stats across all registries
- Build-time fetch script (`site/scripts/fetch-stats.mjs`) generating pre-computed stats
- Weekly CI rebuild (Mondays 06:00 UTC) to keep dashboard data fresh
- Summary cards, per-registry breakdown bars, CSS-only 30-day sparkline, package leaderboard
- Dark/light theme support with system preference detection

### Changed
- Site now uses `file:..` devDependency for build-time registry queries
- Pages workflow builds library before site to support fetch script

## [1.0.0] - 2026-02-27

### Changed
- Promoted to v1.0.0 — production-stable release
- Shipcheck audit pass: SECURITY.md, threat model, structured errors, operator docs

## [0.4.1] - 2026-02-22

### Added
- Initial public release with multi-registry support
- CLI and programmatic API for npm, PyPI, NuGet, VS Code Marketplace, Docker Hub
- Time series, comparison, bulk queries, REST API server
- In-memory caching with TTL
- Config file support
- Landing page and translations
