---
title: Dashboard
description: Live web dashboard with Pulse AI co-pilot.
sidebar:
  order: 4
---

The dashboard is a self-updating stats application deployed to GitHub Pages.

## Features

- **Tabbed interface** — Home, Analytics, Leaderboard, and Help tabs
- **Executive snapshot** — health score (0-100), diversity index, weekly change, total downloads
- **Six interactive charts** — 30-day trend, registry share, portfolio risk, top-10 momentum, velocity tracker, and 30-day heatmap
- **Live refresh** — on-demand fetch from npm and PyPI APIs with session caching
- **Export reports** — PDF (jsPDF), JSONL (for AI ingestion), and Markdown (GFM tables)
- **Leaderboard** — 132 packages ranked by weekly downloads with 30-day sparklines
- **Dark/light theme** — follows system preference

## Pulse AI co-pilot

The dashboard includes a conversational AI assistant powered by Ollama:

- Streaming voice synthesis (4 voices via mcp-voice-soundboard)
- Web search (Wikipedia + optional SearXNG)
- GitHub org data connector
- Model selector and conversation memory
- Fullscreen mode

## Smart growth engine

The dashboard handles small-denominator distortion with:

- Baseline threshold for minimum meaningful sample size
- Percentage cap to prevent misleading numbers
- Damped velocity formula for accurate trend detection

## Data pipeline

Stats are fetched at build time and rebuilt weekly by CI (Mondays 06:00 UTC). The live refresh feature pulls latest numbers directly from registry APIs. Configure tracked packages in `site/src/data/packages.json`.

## Development

```bash
# Dev server
npm run site:dev

# Production build
npm run site:build
```
