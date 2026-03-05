---
title: API
description: Programmatic usage and REST server.
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
