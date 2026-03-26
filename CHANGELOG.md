# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [3.2.2] - 2026-03-25

### Added
- `--version` / `-V` CLI flag (reads from package.json)
- 5 version consistency tests

## [3.0.0] - 2026-03-04

### Added
- **Pulse AI co-pilot** — complete rewrite of the AI chat into a named personality ("Pulse") with sharp, warm, concise voice
- **Streaming voice synthesis** — voice starts speaking as sentences arrive from the LLM, not after the full response completes
- **Web search** — Wikipedia API (zero setup, CORS-enabled) and optional SearXNG local Docker for broader web results; smart intent detection skips portfolio questions
- **Voice output** — 4 voices via mcp-voice-soundboard (George/Narrator, Bella/Assistant, Emma/Storyteller, Michael/Announcer) with auto-speak toggle
- **Fullscreen mode** — distraction-free chat with keyboard shortcut
- **GitHub org data connector** — optional PAT for org-level context injection (repos, stars, languages)
- **Auto-speak toggle** — persisted in localStorage, speaks responses automatically when enabled

### Changed
- Dashboard upgraded from "Registry Assistant" to "Pulse AI co-pilot" with richer system prompt and portfolio-aware context
- Voice playback uses Web Audio API (AudioContext) for Chrome autoplay policy compliance
- README and landing page updated; translations refreshed for all 7 languages

## [2.3.0] - 2026-03-03

### Changed
- Version bump for npm publish; MSIX desktop build

## [2.2.0] - 2026-03-02

### Added
- **Live refresh** — client-side fetch from npm and PyPI APIs with progress indicator, no rebuild needed
- **Export reports** — three-format dropdown (Executive PDF, LLM JSONL, Developer Markdown) with professional-quality output
- **Pulse panel redesign** — separated Established Movers (prev ≥ 50) from Emerging & New, added sparklines and executive summary

### Fixed
- Package discovery now reads full manifest (132 packages) instead of leaderboard subset (78)
- jsPDF CDN switched from cdnjs (empty 404 files) to jsdelivr
- PDF export rewrites emoji to colored bullet dots (Helvetica can't render emoji)
- Decliner deltas now show correct sign in Markdown export

### Changed
- Markdown export: right-aligned number columns, Top-5 concentration metric, trend labels, collapsible sparkline stats
- JSONL export: schema v2.0 envelope, nested scope/totals/health, mover signal classification, package velocity score
- No-data export UX: styled toast with Refresh-button pulse replaces raw alert()
- README updated with live refresh, export, and Pulse panel documentation
- Leaderboard cap raised from 100 to 250

## [2.1.0] - 2026-03-02

### Added
- **AI chat assistant** — Ollama-powered Registry Assistant on the Home tab with RAG context injection, streaming responses, model selector, conversation memory (localStorage), typing indicator, and offline fallback
- **Six interactive charts** (Analytics tab) — 30-day trend (aggregate / per-registry / top-5 toggles), registry share (polar area), portfolio risk (distribution histogram + Gini & P90), top-10 momentum, velocity tracker with sparklines, and 30-day heatmap with spike detection (>2σ)
- **Smart growth engine** — baseline threshold (prev < 20 → "🚀 Emerging"), percentage cap (> 500% → "▲ 500%+"), and damped velocity formula `(curr − prev) / √(prev + k)` applied consistently across all 8 display surfaces
- **Actionable insights panel** — auto-generated recommendations and "Needs Attention" alerts for declining packages
- **Help tab** — human-friendly guide covering every tab, key concepts (smart growth, velocity, spike detection, health score, confidence badges), AI assistant tips, data pipeline diagram, companion tools, and useful links
- **Setup page enhancements** — portfolio editor with validation, registry-sync companion section (install / audit / plan commands, detection grid, external links), and updated pipeline hint
- **Chat loading UX** — animated progress bar, elapsed time counter, send button spinner, model pre-warming on connect
- **Tabbed dashboard** — Home, Analytics, Leaderboard, and Help tabs with hash-based navigation

### Fixed
- `formatGrowth()` scope bug — function was defined in the runtime-refresh IIFE but called inside the chart-init IIFE, causing a ReferenceError that crashed the Velocity Tracker and 30-Day Heatmap

### Changed
- Dashboard restructured from single-page into four-tab layout
- Executive snapshot upgraded with health score (0–100), Shannon diversity index, and composite metric cards
- Leaderboard trend column now uses smart growth badges instead of raw percentages
- Landing page updated to reflect AI-powered dashboard features

## [2.0.0] - 2026-03-02

### Added
- Merged registry-pulse dashboard + desktop app into monorepo — registry-stats is now a complete platform (engine + dashboard + desktop)
- Snapshot-delta tracking for cumulative registries (Docker, VS Code, NuGet)
- Privacy policy and setup pages for dashboard
- AppNav and AppShell components for dashboard navigation
- WinUI 3 desktop app (MSIX) with WebView2 dashboard viewer — offline-capable with live stats refresh
- Desktop CI workflow for MSIX builds
- Repo structure section in README

### Changed
- Major version bump: scope expanded from library-only to full stats platform
- Dashboard upgraded to pulse version with richer UI and more tracked packages
- `fetch-stats.mjs` now persists snapshots for delta computation across builds
- README rewritten to reflect engine + dashboard + desktop architecture
- Package description updated for broader scope

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
