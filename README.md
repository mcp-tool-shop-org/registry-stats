# @mcptoolshop/registry-stats

Multi-registry download stats for npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub.

Zero dependencies — uses native `fetch()` (Node 18+).

## Install

```bash
npm install @mcptoolshop/registry-stats
```

## Usage

```typescript
import { stats, calc } from '@mcptoolshop/registry-stats';

// Single registry
const npm = await stats('npm', 'express');
// → { registry: 'npm', package: 'express', downloads: { lastDay: 4521, lastWeek: 31247, lastMonth: 134982 } }

const pypi = await stats('pypi', 'requests');
const nuget = await stats('nuget', 'Newtonsoft.Json');
const vscode = await stats('vscode', 'esbenp.prettier-vscode');
const docker = await stats('docker', 'library/node');

// All registries at once (uses Promise.allSettled — never throws)
const all = await stats.all('express');

// Bulk — multiple packages from one registry
const bulk = await stats.bulk('npm', ['express', 'koa', 'fastify']);

// Time series (npm + pypi only)
const daily = await stats.range('npm', 'express', '2025-01-01', '2025-06-30');

// Calculations on time-series data
calc.total(daily);                         // sum of all downloads
calc.avg(daily);                           // daily average
calc.groupTotals(calc.monthly(daily));     // { '2025-01': 134982, '2025-02': 128451, ... }
calc.trend(daily);                         // { slope: 12.5, direction: 'up', changePercent: 8.3 }
```

## API

### `stats(registry, package, options?)`

Fetch stats from a single registry. Returns `PackageStats | null`.

| Registry | Package format | Time series | Data available |
|----------|---------------|-------------|----------------|
| `npm` | `express`, `@scope/pkg` | Yes (549 days) | lastDay, lastWeek, lastMonth |
| `pypi` | `requests` | Yes (180 days) | lastDay, lastWeek, lastMonth, total |
| `nuget` | `Newtonsoft.Json` | No | total |
| `vscode` | `publisher.extension` | No | total (installs), rating, trends |
| `docker` | `namespace/repo` | No | total (pulls), stars |

### `stats.all(package)`

Query all registries. Returns results for any that have the package, never throws.

### `stats.bulk(registry, packages)`

Fetch stats for multiple packages from one registry.

### `stats.range(registry, package, start, end)`

Fetch daily download counts. Only `npm` and `pypi` support this.

### `calc`

Calculation utilities for `DailyDownloads[]` arrays:

- `calc.total(records)` — sum
- `calc.avg(records)` — daily average
- `calc.monthly(records)` — group by month
- `calc.yearly(records)` — group by year
- `calc.group(records, fn)` — group by custom function
- `calc.groupTotals(grouped)` — sum per group
- `calc.groupAvgs(grouped)` — average per group
- `calc.trend(records, windowDays?)` — trend detection (up/down/flat)

## License

MIT
