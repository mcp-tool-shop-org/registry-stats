---
title: Dashboard
description: Live web dashboard with Pulse AI co-pilot and AI inference.
sidebar:
  order: 4
---

The dashboard is a self-updating stats application deployed to GitHub Pages.

## Features

- **Tabbed interface** — Home, Analytics, Leaderboard, and Help tabs
- **Executive snapshot** — health score (0-100), diversity index, weekly change, total downloads
- **Seven interactive charts** — 30-day trend (aggregate / per-registry / top-5 toggles + click-to-drill-down), registry share (polar area), portfolio risk (histogram + Gini & P90), top-10 momentum, velocity tracker with sparklines, 30-day heatmap with spike detection (>2σ), and portfolio trend (stacked area, yearly). Scroll zoom and pan are on the 30-day trend and the portfolio trend only.
- **AI Inference Panel** — portfolio momentum, risk score, 7-day forecast, automated recommendations, actionable advice with severity/urgency levels, and package health scoreboard (A-F grades)
- **Actionable advice** — severity-tagged cards (critical/warning/info/success) with urgency levels, specific action steps, and affected package lists
- **Package health scores** — 0-100 composite score (activity + consistency + growth + stability) with letter grades per package
- **Yearly progress tracking** — persistent history layer accumulates monthly per-package and weekly portfolio aggregates; portfolio trend chart with per-registry stacking
- **Live refresh** — the page re-fetches same-origin `data/stats.json`. It does not call the npm or PyPI APIs from the browser.
- **Export reports** — PDF (jsPDF), JSONL (for AI ingestion), and Markdown (GFM tables)
- **Leaderboard** — ranked by the Downloads column. npm and PyPI are the week. VS Code, NuGet, Docker, and GitHub are all-time. Month is npm and PyPI. Sparklines and trend badges are the npm 30-day series.
- **Dark/light theme** — follows system preference

## Pulse AI co-pilot

The dashboard includes a conversational AI assistant powered by Ollama:

- Streaming voice synthesis (4 voices via mcp-voice-soundboard)
- Web search (Wikipedia + optional SearXNG)
- GitHub org data connector
- Model selector and conversation memory
- Fullscreen mode

## AI Inference Engine

Zero-dependency, pure-math inference that runs at build time:

| Capability | What it does |
|-----------|-------------|
| **Forecast** | 7-day weighted linear regression with 80% confidence intervals |
| **Anomaly detection** | Adaptive rolling z-score (14-day window), spikes and drops |
| **Momentum** | Composite score (-100 to +100): direction + acceleration + consistency + volume |
| **Health score** | Multi-factor composite (0-100, A-F grade): activity + consistency + growth + stability |
| **Yearly progress** | Monthly accumulation, YoY growth, projected year-end, milestone tracking |
| **Actionable advice** | Severity rule engine: critical/warning/info/success with urgency and specific actions |
| **Recommendations** | Growth, risk, opportunity, and attention categories |

## Smart growth engine

The dashboard handles small-denominator distortion with:

- Baseline threshold for minimum meaningful sample size
- Percentage cap to prevent misleading numbers
- Damped velocity formula for accurate trend detection

## Interactive charts

Scroll zoom, drag pan, and pinch zoom are on the 30-day trend chart and the portfolio trend chart (chartjs-plugin-zoom and Hammer.js). Registry share, the portfolio risk histogram, and the top-10 chart do not zoom.

- **Reset Zoom** is on the 30-day trend chart only
- **Click-to-drill-down** — click the 30-day trend chart to cycle through aggregate, per-registry, and top-5 modes
- **Anomaly tooltips** — hover over anomaly markers on that trend chart for z-score details

## Data pipeline

Two CI schedules keep the dashboard current: a daily data refresh (`daily-refresh.yml` at 06:00 UTC) and a full site rebuild and deploy (`pages.yml` on Mondays at 07:00 UTC). The page re-fetches same-origin `data/stats.json`. `site/src/data/packages.json` is the registry arrays `npm`, `pypi`, `vscode`, `nuget`, `docker`, and `github`, plus an optional `npmMaintainer` string. A non-empty string calls `stats.mine` and adds discovered names that are not already in the `npm` array. If discovery throws, the script warns and keeps the explicit npm list. This file is not `registry-stats.config.json`.

Historical data accumulates in `site/src/data/history.json`, tracking monthly per-package aggregates and weekly portfolio totals (up to 2 years).

## Development

```bash
# Dev server
npm run site:dev

# Production build
npm run site:build
```
