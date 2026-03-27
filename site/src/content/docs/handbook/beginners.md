---
title: Beginners
description: New to registry-stats? This page covers what it does, who it helps, and how to get started.
sidebar:
  order: 99
---

## What is registry-stats?

registry-stats is a TypeScript tool that pulls download statistics from five package registries — npm, PyPI, NuGet, the VS Code Marketplace, and Docker Hub — through a single interface. Instead of visiting five different websites to check how your packages are performing, you run one command or call one API and get consolidated results.

It ships as an npm package (`@mcptoolshop/registry-stats`) with three surfaces: a CLI for quick terminal lookups, a programmatic API for automation, and a REST server for integrating with other tools. There is also a web dashboard with AI-powered analytics and a native Windows desktop app.

Zero runtime dependencies. Uses native `fetch()`. Requires Node 18 or later.

## Who is it for?

- **Open-source maintainers** who publish to multiple registries and want a single view of their download numbers
- **DevRel and developer advocacy teams** tracking package adoption across ecosystems
- **Engineering managers** who need weekly reports on package health and growth trends
- **Automation builders** who want download data in CI pipelines, dashboards, or Slack bots
- **Solo developers** who want to know if anyone is actually using their packages

If you publish anything to npm, PyPI, NuGet, the VS Code Marketplace, or Docker Hub, this tool saves you time.

## Key concepts

**Registries** — The five package hosts that registry-stats can query: npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub. Each returns different data (npm gives daily/weekly/monthly counts; NuGet only gives totals). See the [Registries](/registry-stats/handbook/registries/) page for details.

**Stats** — The download counts and metadata returned for a package. The core `PackageStats` object includes `downloads` (with optional `total`, `lastDay`, `lastWeek`, `lastMonth` fields), the `registry` name, `package` name, and a `fetchedAt` timestamp.

**Time series** — Daily download counts over a date range. Only npm (up to 549 days) and PyPI (up to 180 days) support this. Used for trend analysis, forecasting, and charting.

**Config file** — A `registry-stats.config.json` that lists all the packages you want to track. Run `registry-stats --init` to create one. When you run the CLI with no arguments, it reads this file and fetches stats for everything listed.

**AI inference** — A built-in set of pure-math algorithms (no ML runtime, no API calls) that compute forecasts, anomaly detection, momentum scores, health grades, and actionable advice from time-series data.

## Installation and first run

Install globally to use the CLI anywhere, or locally in a project:

```bash
# Global install
npm install -g @mcptoolshop/registry-stats

# Or local install
npm install @mcptoolshop/registry-stats
```

Run your first query:

```bash
registry-stats express -r npm
```

This fetches download stats for the `express` package from npm and prints them as a table. To query all five registries at once, omit the `-r` flag:

```bash
registry-stats express
```

To set up a config file for tracking your own packages:

```bash
registry-stats --init
```

Edit the generated `registry-stats.config.json` to list your packages, then run with no arguments:

```bash
registry-stats
```

## Common tasks

### Check stats for a single package

```bash
registry-stats requests -r pypi
```

### Compare a package across registries

```bash
registry-stats express --compare
```

### Get time-series data as CSV

```bash
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
```

### See all your npm packages at once

```bash
registry-stats --mine your-npm-username
```

### Start a REST server

```bash
registry-stats serve --port 3000
```

Then query it: `GET http://localhost:3000/stats/npm/express`

### Use the API in your own code

```typescript
import { stats } from '@mcptoolshop/registry-stats';

const result = await stats('npm', 'my-package');
console.log(result?.downloads.lastWeek);
```

## FAQ

**Does it cost anything?**
No. registry-stats is free and open source (MIT). It queries public registry APIs that are also free.

**Does it send telemetry?**
No. Zero telemetry, zero analytics. It only makes HTTPS requests to the public registry APIs you ask it to query.

**Which Node versions are supported?**
Node 18 and later. The library uses native `fetch()` which was stabilized in Node 18.

**Why do some registries show less data than others?**
Each registry API exposes different levels of detail. npm provides daily/weekly/monthly counts plus up to 549 days of history. NuGet only gives an all-time total. This is a limitation of the upstream APIs, not registry-stats.

**What happens if a registry is down or rate-limits me?**
The library automatically retries with exponential backoff on 429 and 5xx errors, and respects `Retry-After` headers. If all retries fail, it throws a `RegistryError` with the status code. The `stats.all()` method uses `Promise.allSettled` and never throws — it returns results for whichever registries responded.

**Can I add a registry that is not built in?**
Yes. Use `registerProvider()` with a custom `RegistryProvider` object. See the [Configuration](/registry-stats/handbook/configuration/) page.

**How does the AI inference work without an ML runtime?**
All algorithms are pure math on arrays of numbers — weighted linear regression for forecasting, rolling z-scores for anomaly detection, composite formulas for momentum and health scores. No TensorFlow, no ONNX, no API calls. It runs in milliseconds.

## Troubleshooting

**"Unknown registry" error** — You passed a registry name that is not built in. The five built-in registries are `npm`, `pypi`, `nuget`, `vscode`, and `docker`. Names are lowercase. If you need a different registry, use `registerProvider()`.

**"does not support time-series data" error** — You called `stats.range()` on a registry that does not support it. Only `npm` and `pypi` have daily download history. NuGet, VS Code, and Docker do not.

**429 Too Many Requests** — You are hitting the registry's rate limit. The library retries automatically with backoff, but very large bulk queries can still exhaust limits. Reduce `concurrency` in your config or add a cache. For Docker Hub, set the `dockerToken` config field to raise limits.

**Empty results from `stats.all()`** — The package name may not exist on any registry, or all registries timed out. Check the name and try a single registry first with `-r npm` to isolate the issue.

**Config file not found** — The CLI walks up from your current directory looking for `registry-stats.config.json`. Make sure it exists somewhere in the parent chain, or run `registry-stats --init` to create one.
