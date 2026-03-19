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
- **Seven interactive charts** — 30-day trend (aggregate / per-registry / top-5 toggles + click-to-drill-down + scroll zoom/pan), registry share (polar area), portfolio risk (histogram + Gini & P90), top-10 momentum, velocity tracker with sparklines, 30-day heatmap with spike detection (>2σ), and portfolio trend (stacked area, yearly)
- **AI Inference Panel** — portfolio momentum, risk score, 7-day forecast, automated recommendations, actionable advice with severity/urgency levels, and package health scoreboard (A-F grades)
- **Actionable advice** — severity-tagged cards (critical/warning/info/success) with urgency levels, specific action steps, and affected package lists
- **Package health scores** — 0-100 composite score (activity + consistency + growth + stability) with letter grades per package
- **Yearly progress tracking** — persistent history layer accumulates monthly per-package and weekly portfolio aggregates; portfolio trend chart with per-registry stacking
- **Live refresh** — on-demand fetch from npm and PyPI APIs with session caching
- **Export reports** — PDF (jsPDF), JSONL (for AI ingestion), and Markdown (GFM tables)
- **Leaderboard** — packages ranked by weekly downloads with 30-day sparklines and smart trend badges
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

All Chart.js charts support:

- **Scroll zoom/pan** — mouse wheel to zoom, drag to pan (via chartjs-plugin-zoom)
- **Pinch zoom** — touch devices supported via Hammer.js
- **Reset Zoom** button to return to default view
- **Click-to-drill-down** — click the trend chart to cycle through aggregate, per-registry, and top-5 modes
- **Anomaly tooltips** — hover over anomaly markers for z-score details

## Data pipeline

Stats are fetched at build time and rebuilt weekly by CI (Mondays 06:00 UTC). The live refresh feature pulls latest numbers directly from registry APIs. Configure tracked packages in `site/src/data/packages.json`.

Historical data accumulates in `site/src/data/history.json`, tracking monthly per-package aggregates and weekly portfolio totals (up to 2 years).

## Development

```bash
# Dev server
npm run site:dev

# Production build
npm run site:build
```
