---
title: CLI
description: Full command-line reference for registry-stats.
sidebar:
  order: 2
---

## Basic usage

```bash
# Single registry
registry-stats <package> -r <registry>

# All registries
registry-stats <package>

# With config file (all tracked packages)
registry-stats
```

## Options

| Flag | Description |
|------|-------------|
| `-r, --registry` | Registry to query: `npm`, `pypi`, `nuget`, `vscode`, `docker` |
| `--json` | Raw JSON output |
| `--range <start>:<end>` | Time series (YYYY-MM-DD format) |
| `--format csv\|chart` | Export format for time series data |
| `--compare` | Compare across all registries |
| `--init` | Create a config file |

## Time series

```bash
registry-stats express -r npm --range 2025-01-01:2025-06-30
```

Returns daily download counts. Available for npm (549 days history) and PyPI (180 days).

## Export formats

```bash
# CSV
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv

# Chart.js-compatible JSON
registry-stats express -r npm --range 2025-01-01:2025-06-30 --format chart
```

## Compare

```bash
registry-stats express --compare
```

Shows the same package across all registries side by side.

## REST server

Start a local REST API:

```bash
registry-stats serve --port 3000
```

Endpoints:

```
GET /stats/:package              # all registries
GET /stats/:registry/:package    # single registry
GET /compare/:package?registries=npm,pypi
GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart
```
