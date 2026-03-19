<p align="center">
  <a href="README.ja.md">日本語</a> | <a href="README.zh.md">中文</a> | <a href="README.es.md">Español</a> | <a href="README.fr.md">Français</a> | <a href="README.hi.md">हिन्दी</a> | <a href="README.it.md">Italiano</a> | <a href="README.pt-BR.md">Português (BR)</a>
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/mcp-tool-shop-org/brand/main/logos/registry-stats/readme.png" alt="registry-stats logo" width="400" />
</p>

<p align="center">
  Five registries. One engine. Dashboard included.
</p>

<p align="center">
  <a href="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml"><img src="https://github.com/mcp-tool-shop-org/registry-stats/actions/workflows/pages.yml/badge.svg" alt="CI"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <a href="https://www.npmjs.com/package/@mcptoolshop/registry-stats"><img src="https://img.shields.io/npm/v/@mcptoolshop/registry-stats" alt="npm version"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/dashboard/"><img src="https://img.shields.io/badge/Dashboard-live-green" alt="Dashboard"></a>
  <a href="https://mcp-tool-shop-org.github.io/registry-stats/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

<p align="center">
  <a href="#dashboard">Dashboard</a> &middot;
  <a href="#desktop-app">Desktop App</a> &middot;
  <a href="#install">Install</a> &middot;
  <a href="#cli">CLI</a> &middot;
  <a href="#programmatic-api">API</a> &middot;
  <a href="#rest-api-server">REST Server</a> &middot;
  <a href="#config-file">Config</a> &middot;
  <a href="#license">License</a>
</p>

---

You publish to npm, PyPI, NuGet, the VS Code Marketplace, and Docker Hub. Right now, answering "how are my packages doing?" means checking five different sites. **registry-stats** is the complete platform: a TypeScript engine (CLI + API + REST server), a live web dashboard, and a native Windows desktop app — all from one repo.

Zero runtime dependencies. Uses native `fetch()`. Node 18+.

## What's inside

| Layer | What it does |
|-------|-------------|
| **Engine** | TypeScript library + CLI + REST server + AI inference. Query five registries with one interface. Published to npm as `@mcptoolshop/registry-stats`. |
| **Dashboard** | Astro-powered web app with AI inference panel (health scores, forecasts, actionable advice), Pulse AI co-pilot (streaming voice, web search, fullscreen, GitHub data connectors), seven interactive charts with zoom/pan, live refresh, export reports (PDF / JSONL / Markdown), and tabbed Help guide. Rebuilt daily by CI; refreshable on demand. |
| **Desktop** | WinUI 3 + WebView2 native Windows app. Bundles the dashboard offline, fetches live stats on demand. |

## Dashboard

A self-updating stats dashboard lives at [`/dashboard/`](https://mcp-tool-shop-org.github.io/registry-stats/dashboard/).

- **Tabbed interface** — Home, Analytics, Leaderboard, and Help tabs
- **Pulse AI co-pilot** — Ollama-powered conversational assistant with streaming voice synthesis (speaks as the LLM streams, 4 voices via [mcp-voice-soundboard](https://github.com/mcp-tool-shop-org/mcp-voice-soundboard)), web search (Wikipedia + optional SearXNG), auto-speak, fullscreen mode, GitHub org data connector, model selector, and conversation memory
- **Executive snapshot** — health score (0–100), diversity index, weekly change, total downloads across all registries
- **Seven interactive charts** — 30-day trend (aggregate / per-registry / top-5 toggles + click-to-drill-down + scroll zoom/pan), registry share (polar area), portfolio risk (histogram + Gini & P90), top-10 momentum, velocity tracker with sparklines, 30-day heatmap with spike detection (>2σ), and portfolio trend (stacked area, yearly)
- **Smart growth engine** — handles small-denominator distortion with baseline threshold, percentage cap, and damped velocity formula
- **AI Inference Panel** — portfolio momentum (-100 to +100), risk score, 7-day forecast with confidence intervals, automated recommendations, actionable advice with severity/urgency levels, and package health scoreboard (A–F grades)
- **Actionable advice** — severity-tagged advice cards (critical/warning/info/success) with urgency levels, specific action steps, and affected package lists
- **Package health scores** — 0–100 composite score (activity + consistency + growth + stability) with letter grades per package
- **Yearly progress tracking** — persistent history layer accumulates monthly per-package and weekly portfolio aggregates; portfolio trend chart with per-registry stacking
- **Pulse panel** — split view of Established Movers (≥ 50 downloads/wk) and Emerging & New packages, with inline 7-day sparklines, absolute + percentage deltas, baseline context, and a one-line executive summary
- **Live refresh** — on-demand client-side fetch from npm and PyPI APIs with progress indicator; results cached in sessionStorage (5 min TTL) so tab switches are instant
- **Export reports** — dropdown next to the Refresh button offering three formats: **Exec PDF** (via jsPDF), **LLM JSONL** (typed records for AI ingestion), and **Dev Markdown** (GFM tables)
- **Leaderboard** — 132 packages ranked by weekly downloads with inline 30-day sparklines and smart trend badges
- **Setup page** — portfolio editor with validation, registry-sync companion section, and pipeline overview
- **Leaderboard search** — instant text filter for finding packages by name or registry
- **Keyboard navigation** — arrow keys to cycle between tabs
- **Help tab** — human-friendly guide covering every tab, key concepts, AI inference engine, data pipeline, and useful links
- **Dark / light theme** — follows system preference
- **Mobile responsive** — hamburger menu for small screens

Data is fetched at build time and rebuilt daily by CI (06:00 UTC). Live refresh pulls the latest numbers directly from registry APIs. Configure tracked packages in `site/src/data/packages.json`.

## AI Inference Engine

Zero-dependency, pure-math inference that runs at build time — no ML runtime, no external APIs.

```typescript
import {
  forecast, detectAnomalies, segmentTrends,
  detectSeasonality, computeMomentum,
  generateRecommendations, computeHealthScore,
  generateActionableAdvice, computeYearlyProgress,
  inferPortfolio,
} from '@mcptoolshop/registry-stats';

// 7-day forecast with 80% confidence intervals
const predictions = forecast(dailySeries, 7);
// → [{ day: 1, predicted: 142, lower: 98, upper: 186 }, ...]

// Anomaly detection (adaptive rolling z-score, 14-day window)
const anomalies = detectAnomalies(dailySeries);
// → [{ day: 20, value: 1500, expected: 120, zscore: 4.2, type: 'spike' }]

// Composite momentum score (-100 to +100)
const momentum = computeMomentum(dailySeries);

// Package health score (0-100 with A-F grade)
const health = computeHealthScore('my-pkg', 'npm', dailySeries, momentum);
// → { score: 72, grade: 'B', components: { activity: 20, consistency: 18, growth: 16, stability: 18 } }

// Yearly progress from monthly history
const progress = computeYearlyProgress('my-pkg', 'npm', monthlyHistory);
// → { currentYearTotal, yoyGrowthPct, projectedYearEnd, milestones, ... }

// Full portfolio analysis (now includes health scores + actionable advice)
const result = inferPortfolio(leaderboard, { gini: 0.6, npmPct: 85 });
// → { packages, forecastTotal7, riskScore, portfolioMomentum, recommendations, healthScores, actionableAdvice }
```

| Capability | Method | What it does |
|-----------|--------|-------------|
| **Forecast** | Weighted linear regression | Exponential recency bias, 80% CI that widens over time |
| **Anomaly detection** | Adaptive rolling z-score | 14-day baseline window, detects spikes and drops |
| **Trend segmentation** | Piecewise linear | Identifies up/down/flat segments in time series |
| **Seasonality** | Day-of-week decomposition | Detects weekly patterns, reports peak day |
| **Momentum** | Composite score | Direction + acceleration + consistency + volume |
| **Health score** | Multi-factor composite | Activity + consistency + growth + stability (0–100, A–F grade) |
| **Yearly progress** | Monthly accumulation | YoY growth, projected year-end, milestone tracking |
| **Actionable advice** | Severity rule engine | Critical/warning/info/success with urgency and specific actions |
| **Recommendations** | Rule engine | Growth, risk, opportunity, and attention categories |

## Desktop App

A native Windows app that wraps the dashboard in a local WebView2 shell:

- **Offline-capable** — ships bundled HTML/CSS/JS; works without internet
- **Live refresh** — fetches `stats.json` from GitHub Pages on demand
- **CSV export** — export leaderboard data with one click
- **MSIX packaged** — built and signed in CI via `desktop-ci.yml`

The desktop source lives in `desktop/`. Built with .NET 10 MAUI targeting WinUI 3.

## Install

```bash
npm install @mcptoolshop/registry-stats
```

## CLI

```bash
# Query a single registry
registry-stats express -r npm
#  npm     | express
#            month: 283,472,710  week: 67,367,773  day: 11,566,113

# Query all registries at once
registry-stats express

# Time series with monthly breakdown + trend
registry-stats express -r npm --range 2025-01-01:2025-06-30

# Raw JSON output
registry-stats express -r npm --json

# Other registries
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker

# Create a config file
registry-stats --init

# Run with config — fetches all tracked packages
registry-stats

# Compare across registries
registry-stats express --compare

# Export as CSV or chart-friendly JSON
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart

# Start a REST API server
registry-stats serve --port 3000
```

## Config File

Create a `registry-stats.config.json` in your project root (or run `registry-stats --init`):

```json
{
  "registries": ["npm", "pypi", "nuget", "vscode", "docker"],
  "packages": {
    "mcpt": {
      "npm": "mcpt",
      "pypi": "mcpt"
    },
    "tool-compass": {
      "npm": "@mcptoolshop/tool-compass",
      "vscode": "mcp-tool-shop.tool-compass"
    }
  },
  "cache": true,
  "cacheTtlMs": 300000,
  "concurrency": 5
}
```

Run `registry-stats` with no arguments to fetch stats for all configured packages. The CLI walks up from cwd to find the nearest config file.

The config is also available programmatically:

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();          // finds nearest config file, or null
const defaults = defaultConfig();     // returns default Config object
const template = starterConfig();     // returns starter JSON string
```

## Programmatic API

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';

// Single registry
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');
const nuget = await stats('nuget', 'Newtonsoft.Json');
const vscode = await stats('vscode', 'esbenp.prettier-vscode');
const docker = await stats('docker', 'library/node');

// All registries at once (uses Promise.allSettled — never throws)
const all = await stats.all('express');

// Bulk — multiple packages, concurrency-limited (default: 5)
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// Time series (npm + pypi only)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// Calculations
calc.total(daily);                         // sum of all downloads
calc.avg(daily);                           // daily average
calc.groupTotals(calc.monthly(daily));     // { '2025-01': 134982, ... }
calc.trend(daily);                         // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);                  // 7-day moving average
calc.popularity(daily);                    // 0-100 log-scale score

// Export formats
calc.toCSV(daily);                         // "date,downloads\n2025-01-01,1234\n..."
calc.toChartData(daily, 'express');        // { labels: [...], datasets: [{ label, data }] }

// Comparison — same package across registries
const comparison = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);  // specific registries only

// Caching (5 min TTL, in-memory)
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit
```

## Registry Support

| Registry | Package format | Time series | Data available |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Yes (549 days) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Yes (180 days) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (installs), rating, trends |
| `docker` | `namespace/repo` | No | total (pulls), stars |

## Built-in Reliability

- Automatic retry with exponential backoff on 429/5xx errors
- Respects `Retry-After` headers
- 30-second request timeouts via `AbortSignal.timeout`
- Concurrency limiting for bulk requests
- Optional TTL cache (pluggable — bring your own Redis/file backend via `StatsCache` interface)
- SHA-pinned GitHub Actions for supply chain security

## REST API Server

Run as a microservice or embed in your own server:

```bash
registry-stats serve --port 3000
```

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```

Programmatic usage for custom servers or serverless:

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Option 1: Quick start
serve({ port: 3000 });

// Option 2: Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

## Custom Registries

```typescript
import { registerProvider, type RegistryProvider } from '@mcptoolshop/registry-stats';

const cargo: RegistryProvider = {
  name: 'cargo',
  async getStats(pkg) {
    const res = await fetch(`https://crates.io/api/v1/crates/${pkg}`);
    const json = await res.json();
    return {
      registry: 'cargo' as any,
      package: pkg,
      downloads: { total: json.crate.downloads },
      fetchedAt: new Date().toISOString(),
    };
  },
};

registerProvider(cargo);
await stats('cargo', 'serde');
```

## Repo Structure

```
registry-stats/
├── src/        # TypeScript engine (published to npm)
├── site/       # Astro dashboard + landing page (deployed to GitHub Pages)
├── desktop/    # WinUI 3 desktop app (.NET 10 MAUI)
└── test/       # Library tests (vitest)
```

## Development

```bash
# Engine
npm install && npm run build && npm test

# Dashboard (dev server)
npm run site:dev

# Dashboard (production build)
npm run site:build
```

## Security & Data Scope

| Aspect | Detail |
|--------|--------|
| **Data touched** | Public download statistics from npm, PyPI, NuGet, VS Code Marketplace, Docker Hub. In-memory cache (optional) |
| **Data NOT touched** | No telemetry. No analytics. No credential storage. No user data. No file writes |
| **Permissions** | Read: public registry APIs via HTTPS. Write: stdout/stderr only |
| **Network** | HTTPS outbound to public registry APIs. Optional localhost REST server |
| **Telemetry** | None collected or sent |

See [SECURITY.md](SECURITY.md) for vulnerability reporting.

## Scorecard

| Category | Score |
|----------|-------|
| A. Security | 10 |
| B. Error Handling | 10 |
| C. Operator Docs | 10 |
| D. Shipping Hygiene | 10 |
| E. Identity (soft) | 10 |
| **Overall** | **50/50** |

> Full audit: [SHIP_GATE.md](SHIP_GATE.md) · [SCORECARD.md](SCORECARD.md)

## License

MIT

---

Built by <a href="https://mcp-tool-shop.github.io/">MCP Tool Shop</a>
