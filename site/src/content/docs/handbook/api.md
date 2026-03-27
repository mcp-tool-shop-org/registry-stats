---
title: API
description: Programmatic usage, AI inference, and REST server.
sidebar:
  order: 3
---

## Core functions

```typescript
import { stats, calc, createCache } from '@mcptoolshop/registry-stats';
```

### stats()

Query a single registry:

```typescript
const npm = await stats('npm', 'express');
const pypi = await stats('pypi', 'requests');
const nuget = await stats('nuget', 'Newtonsoft.Json');
const vscode = await stats('vscode', 'esbenp.prettier-vscode');
const docker = await stats('docker', 'library/node');
```

### stats.all()

Query all registries at once. Uses `Promise.allSettled` — never throws:

```typescript
const all = await stats.all('express');
```

### stats.bulk()

Fetch multiple packages from one registry, concurrency-limited:

```typescript
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);
```

### stats.range()

Daily download counts (npm + PyPI only):

```typescript
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');
```

### stats.compare()

Compare across registries:

```typescript
const cmp = await stats.compare('express');
await stats.compare('express', ['npm', 'pypi']);
```

### stats.mine()

Discover all npm packages by a maintainer, then fetch stats for each:

```typescript
const results = await stats.mine('mikefrilot', {
  onProgress(done, total, pkg) {
    console.log(`${done}/${total}: ${pkg}`);
  },
});
// Returns PackageStats[] sorted by monthly downloads (descending)
```

Uses the npm search API for discovery and the smart bulk API for stats (single HTTP call for unscoped packages, throttled sequential for scoped).

## Calculations

```typescript
calc.total(daily);                    // sum of all downloads
calc.avg(daily);                      // daily average
calc.groupTotals(calc.monthly(daily)); // { '2025-01': 134982, ... }
calc.trend(daily);                    // { direction: 'up', changePercent: 8.3 }
calc.movingAvg(daily, 7);            // 7-day moving average
calc.popularity(daily);              // 0-100 log-scale score
calc.toCSV(daily);                   // CSV string
calc.toChartData(daily, 'express');  // Chart.js-compatible
```

## Caching

```typescript
const cache = createCache();
await stats('npm', 'express', { cache });  // fetches
await stats('npm', 'express', { cache });  // cache hit (5 min TTL)
```

The `StatsCache` interface is pluggable — bring your own Redis or file backend.

## AI Inference

Zero-dependency, pure-math inference — no ML runtime, no external APIs.

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

// Anomaly detection (adaptive rolling z-score, 14-day window)
const anomalies = detectAnomalies(dailySeries);

// Piecewise trend segmentation
const segments = segmentTrends(dailySeries);

// Composite momentum score (-100 to +100)
const momentum = computeMomentum(dailySeries);

// Package health score (0-100 with A-F grade)
const health = computeHealthScore('my-pkg', 'npm', dailySeries, momentum);
// → { score: 72, grade: 'B', components: { activity, consistency, growth, stability } }

// Actionable advice with severity/urgency
// Takes: (packageInferences[], healthScores[], opts)
const advice = generateActionableAdvice(packages, healthScores, { gini: 0.6, npmPct: 85 });
// → [{ type, severity, urgency, title, detail, action, packages }]

// Full portfolio analysis (the main entry point)
const result = inferPortfolio(leaderboard, { gini: 0.6, npmPct: 85 });
// → { packages, forecastTotal7, riskScore, portfolioMomentum, recommendations, healthScores, actionableAdvice }
```

## REST server

```typescript
import { createHandler, serve } from '@mcptoolshop/registry-stats';

// Quick start
serve({ port: 3000 });

// Bring your own server
import { createServer } from 'node:http';
const handler = createHandler();
createServer(handler).listen(3000);
```

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check (lists available endpoints) |
| `GET` | `/stats/:package` | All registries for a package |
| `GET` | `/stats/:registry/:package` | Single registry |
| `GET` | `/compare/:package?registries=npm,pypi` | Cross-registry comparison |
| `GET` | `/range/:registry/:package?start=...&end=...&format=json\|csv\|chart` | Time series data |

All endpoints return JSON by default. The `/range` endpoint supports `format=csv` (returns CSV with `Content-Disposition` header) and `format=chart` (returns Chart.js-compatible JSON). CORS is enabled for all origins.
