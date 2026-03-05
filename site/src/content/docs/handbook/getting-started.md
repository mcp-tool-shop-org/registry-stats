---
title: Getting Started
description: Install registry-stats and run your first query.
sidebar:
  order: 1
---

## Install

```bash
npm install @mcptoolshop/registry-stats
```

## First query

Query a single package from npm:

```bash
registry-stats express -r npm
```

Output:

```
npm     | express
          month: 283,472,710  week: 67,367,773  day: 11,566,113
```

## Query all registries at once

```bash
registry-stats express
```

This checks npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub for the package name.

## Other registries

```bash
registry-stats requests -r pypi
registry-stats Newtonsoft.Json -r nuget
registry-stats esbenp.prettier-vscode -r vscode
registry-stats library/node -r docker
```

## Set up a config file

Create a config to track all your packages:

```bash
registry-stats --init
```

This generates `registry-stats.config.json`. Edit it to list your packages, then run with no arguments:

```bash
registry-stats
```

## Raw JSON output

```bash
registry-stats express -r npm --json
```

## Time series

```bash
registry-stats express -r npm --range 2025-01-01:2025-06-30
```

Returns daily download counts with monthly breakdown and trend analysis. Available for npm (549 days) and PyPI (180 days).
