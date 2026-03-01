import type { RegistryName, PackageStats, DailyDownloads, StatsOptions, StatsCache, RegistryProvider, ComparisonResult } from './types.js';
import { RegistryError } from './types.js';
import { npm } from './providers/npm.js';
import { npmBulkPoint } from './providers/npm.js';
import { pypi } from './providers/pypi.js';
import { nuget } from './providers/nuget.js';
import { vscode } from './providers/vscode.js';
import { docker } from './providers/docker.js';
import { ghcr } from './providers/ghcr.js';
import { fetchDirect } from './fetch.js';

export { calc } from './calc.js';
export type { RegistryName, PackageStats, DailyDownloads, StatsOptions, StatsCache, RegistryProvider, RateLimitConfig, Config, PackageConfig, ComparisonResult, ChartData } from './types.js';
export { RegistryError } from './types.js';
export { loadConfig, defaultConfig, starterConfig } from './config.js';
export { createHandler, serve } from './server.js';
export type { ServerOptions } from './server.js';

// --- Built-in TTL cache ---

function createCache(): StatsCache {
  const store = new Map<string, { value: PackageStats | DailyDownloads[]; expiresAt: number }>();
  return {
    get(key) {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (Date.now() > entry.expiresAt) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value, ttlMs) {
      store.set(key, { value, expiresAt: Date.now() + ttlMs });
    },
  };
}

export { createCache };

// --- Concurrency limiter ---

function pLimit(concurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  function next() {
    if (queue.length > 0 && active < concurrency) {
      active++;
      queue.shift()!();
    }
  }

  return <T>(fn: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      queue.push(() => {
        fn().then(resolve, reject).finally(() => {
          active--;
          next();
        });
      });
      next();
    });
}

const providers: Record<string, RegistryProvider> = {
  npm,
  pypi,
  nuget,
  vscode,
  docker,
  ghcr,
};

function registerProvider(provider: RegistryProvider): void {
  providers[provider.name] = provider;
}

const DEFAULT_TTL = 300_000; // 5 minutes

async function stats(
  registry: string,
  pkg: string,
  options?: StatsOptions,
): Promise<PackageStats | null> {
  const provider = providers[registry];
  if (!provider) {
    throw new RegistryError(registry as RegistryName, 0, `Unknown registry "${registry}". Use registerProvider() to add custom registries.`);
  }

  const cache = options?.cache;
  if (cache) {
    const key = `stats:${registry}:${pkg}`;
    const cached = cache.get(key) as PackageStats | undefined;
    if (cached) return cached;
    const result = await provider.getStats(pkg, options);
    if (result) cache.set(key, result, options?.cacheTtlMs ?? DEFAULT_TTL);
    return result;
  }

  return provider.getStats(pkg, options);
}

stats.all = async function all(
  pkg: string,
  options?: StatsOptions,
): Promise<PackageStats[]> {
  const results = await Promise.allSettled(
    Object.values(providers).map((p) => p.getStats(pkg, options)),
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<PackageStats | null> =>
        r.status === 'fulfilled' && r.value !== null,
    )
    .map((r) => r.value!);
};

stats.bulk = async function bulk(
  registry: string,
  packages: string[],
  options?: StatsOptions,
): Promise<(PackageStats | null)[]> {
  const provider = providers[registry];
  if (!provider) {
    throw new RegistryError(registry as RegistryName, 0, `Unknown registry "${registry}".`);
  }

  // Smart path for npm: use bulk API for unscoped, throttled for scoped
  if (registry === 'npm' && packages.length > 1) {
    return npmBulkStats(packages, options);
  }

  const concurrency = options?.concurrency ?? 5;
  const limit = pLimit(concurrency);
  return Promise.all(packages.map((pkg) => limit(() => stats(registry, pkg, options))));
};

/**
 * Smart npm bulk: uses the bulk point API for unscoped packages (single HTTP call),
 * falls back to throttled sequential for scoped packages.
 */
async function npmBulkStats(
  packages: string[],
  options?: StatsOptions,
): Promise<(PackageStats | null)[]> {
  const scoped: string[] = [];
  const unscoped: string[] = [];

  for (const pkg of packages) {
    if (pkg.startsWith('@')) {
      scoped.push(pkg);
    } else {
      unscoped.push(pkg);
    }
  }

  // Unscoped: single bulk API call
  const bulkMonth = unscoped.length > 0 ? await npmBulkPoint(unscoped, 'last-month') : new Map();
  const bulkWeek = unscoped.length > 0 ? await npmBulkPoint(unscoped, 'last-week') : new Map();
  const bulkDay = unscoped.length > 0 ? await npmBulkPoint(unscoped, 'last-day') : new Map();

  const unscopedResults = new Map<string, PackageStats | null>();
  for (const pkg of unscoped) {
    const month = bulkMonth.get(pkg);
    const week = bulkWeek.get(pkg);
    const day = bulkDay.get(pkg);
    if (month === undefined && week === undefined && day === undefined) {
      unscopedResults.set(pkg, null);
    } else {
      unscopedResults.set(pkg, {
        registry: 'npm',
        package: pkg,
        downloads: {
          lastDay: day,
          lastWeek: week,
          lastMonth: month,
        },
        fetchedAt: new Date().toISOString(),
      });
    }
  }

  // Scoped: serial — the per-provider throttle in fetch.ts spaces requests 400ms apart.
  // Concurrency=1 ensures throttle chain works correctly without races.
  const limit = pLimit(1);
  const scopedResults = await Promise.all(
    scoped.map((pkg) => limit(() => stats('npm', pkg, options))),
  );
  const scopedMap = new Map<string, PackageStats | null>();
  scoped.forEach((pkg, i) => scopedMap.set(pkg, scopedResults[i]));

  // Return in original order
  return packages.map((pkg) => unscopedResults.get(pkg) ?? scopedMap.get(pkg) ?? null);
}

stats.range = async function range(
  registry: string,
  pkg: string,
  start: string,
  end: string,
  options?: StatsOptions,
): Promise<DailyDownloads[]> {
  const provider = providers[registry];
  if (!provider) {
    throw new RegistryError(registry as RegistryName, 0, `Unknown registry "${registry}".`);
  }
  if (!provider.getRange) {
    throw new RegistryError(
      registry as RegistryName,
      0,
      `${registry} does not support time-series data. Only npm and pypi support getRange().`,
    );
  }

  const cache = options?.cache;
  if (cache) {
    const key = `range:${registry}:${pkg}:${start}:${end}`;
    const cached = cache.get(key) as DailyDownloads[] | undefined;
    if (cached) return cached;
    const result = await provider.getRange(pkg, start, end);
    cache.set(key, result, options?.cacheTtlMs ?? DEFAULT_TTL);
    return result;
  }

  return provider.getRange(pkg, start, end);
};

stats.compare = async function compare(
  pkg: string,
  registries?: string[],
  options?: StatsOptions,
): Promise<ComparisonResult> {
  const regs = registries ?? Object.keys(providers);
  const results = await Promise.allSettled(
    regs.map(async (reg) => {
      const result = await stats(reg, pkg, options);
      return result ? { reg, result } : null;
    }),
  );

  const registryMap: Record<string, PackageStats> = {};
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) {
      registryMap[r.value.reg] = r.value.result;
    }
  }

  return {
    package: pkg,
    registries: registryMap,
    fetchedAt: new Date().toISOString(),
  };
};

// --- Maintainer discovery ---

interface NpmSearchResult {
  objects: { package: { name: string } }[];
  total: number;
}

/**
 * Discover all npm packages by a maintainer username, then fetch stats for each.
 * Uses the npm registry search API for discovery, then smart bulk for stats.
 */
stats.mine = async function mine(
  maintainer: string,
  options?: StatsOptions & { onProgress?: (done: number, total: number, pkg: string) => void },
): Promise<PackageStats[]> {
  // Discover all packages by this maintainer
  const packages: string[] = [];
  const PAGE_SIZE = 250;
  let offset = 0;

  while (true) {
    const url = `https://registry.npmjs.org/-/v1/search?text=maintainer:${encodeURIComponent(maintainer)}&size=${PAGE_SIZE}&from=${offset}`;
    const data = await fetchDirect<NpmSearchResult>(url, 'npm');
    if (!data || data.objects.length === 0) break;

    for (const obj of data.objects) {
      packages.push(obj.package.name);
    }

    offset += data.objects.length;
    if (offset >= data.total) break;
  }

  if (packages.length === 0) return [];

  // Fetch stats for all discovered packages using smart bulk
  const results: PackageStats[] = [];
  const bulkResults = await stats.bulk('npm', packages, options);

  for (let i = 0; i < packages.length; i++) {
    const r = bulkResults[i];
    if (r) results.push(r);
    options?.onProgress?.(i + 1, packages.length, packages[i]);
  }

  // Sort by monthly downloads descending
  results.sort((a, b) => (b.downloads.lastMonth ?? 0) - (a.downloads.lastMonth ?? 0));

  return results;
};

export { stats, registerProvider };
