---
title: Configuration
description: Config file, caching, and custom registries.
sidebar:
  order: 5
---

## Config file

Create a `registry-stats.config.json` in your project root:

```bash
registry-stats --init
```

Example config:

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

## Config API

```typescript
import { loadConfig, defaultConfig, starterConfig } from '@mcptoolshop/registry-stats';

const config = loadConfig();       // finds nearest config file, or null
const defaults = defaultConfig();  // returns default Config object
const template = starterConfig();  // returns starter JSON string
```

## Caching

In-memory cache with 5-minute TTL (default):

```typescript
const cache = createCache();
await stats('npm', 'express', { cache });
```

The `StatsCache` interface supports custom backends (synchronous — no async needed):

```typescript
interface StatsCache {
  get(key: string): PackageStats | DailyDownloads[] | undefined;
  set(key: string, value: PackageStats | DailyDownloads[], ttlMs: number): void;
}
```

## Custom registries

Add support for registries not built in:

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

## Config options reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `registries` | `string[]` | All five | Default registries to query |
| `packages` | `object` | `{}` | Map of display names to registry-specific package IDs |
| `cache` | `boolean` | `true` | Enable in-memory caching |
| `cacheTtlMs` | `number` | `300000` | Cache TTL in milliseconds (5 minutes) |
| `concurrency` | `number` | `5` | Max concurrent requests for bulk operations |
| `dockerToken` | `string` | — | Docker Hub auth token (raises rate limits) |

## Built-in reliability

- Automatic retry with exponential backoff on 429/5xx errors
- Respects `Retry-After` headers
- 30-second request timeouts via `AbortSignal.timeout`
- Per-registry throttling (npm: 400ms, PyPI: 2.2s, Docker: 4s between requests)
- Concurrency limiting for bulk requests (default: 5)
