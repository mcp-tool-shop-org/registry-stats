# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
