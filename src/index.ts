import type { RegistryName, PackageStats, DailyDownloads, StatsOptions, StatsCache, RegistryProvider, ComparisonResult } from './types.js';
import { RegistryError } from './types.js';
import { npm } from './providers/npm.js';
import { npmBulkPoint } from './providers/npm.js';
import { pypi } from './providers/pypi.js';
import { nuget } from './providers/nuget.js';
import { vscode } from './providers/vscode.js';
import { docker } from './providers/docker.js';
import { github } from './providers/github.js';
import { fetchDirect } from './fetch.js';

export { calc } from './calc.js';
export type { RegistryName, PackageStats, DailyDownloads, StatsOptions, StatsCache, RegistryProvider, RateLimitConfig, Config, PackageConfig, ComparisonResult, ChartData } from './types.js';
export { RegistryError } from './types.js';
export { loadConfig, defaultConfig, starterConfig } from './config.js';
export { createHandler, serve } from './server.js';
export type { ServerOptions } from './server.js';
export { forecast, detectAnomalies, segmentTrends, detectSeasonality, computeMomentum, generateRecommendations, computeYearlyProgress, computeHealthScore, generateActionableAdvice, inferPortfolio } from './inference.js';
export type { ForecastPoint, Anomaly, TrendSegment, Recommendation, PackageInference, PortfolioInference, MonthlyAggregate, YearlyProgress, PackageHealthScore, ActionableAdvice } from './inference.js';

// --- Package name validation ---

/** Pattern for valid package names: alphanumeric, hyphens, dots, underscores, slashes, @ for scoped */
const VALID_PKG_NAME = /^[@a-zA-Z0-9][\w./@-]*$/;

/**
 * Validate and sanitize a package name before use in URLs.
 * Rejects names with path traversal, whitespace, or control characters.
 */
function validatePackageName(pkg: string, registry: string): void {
  if (!pkg || typeof pkg !== 'string') {
    throw new RegistryError(registry, 0, `Invalid package name: must be a non-empty string`);
  }
  if (pkg.includes('..') || pkg.includes('\\')) {
    throw new RegistryError(registry, 0, `Invalid package name "${pkg}": path traversal not allowed`);
  }
  if (!VALID_PKG_NAME.test(pkg)) {
    throw new RegistryError(registry, 0, `Invalid package name "${pkg}": contains illegal characters`);
  }
}

// --- Built-in TTL cache ---

/** Create an in-memory TTL cache for stats and range results. */
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

/** Simple promise-based concurrency limiter. Limits parallel async tasks to `concurrency`. */
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

// Backed by a Map so provider names like 'constructor', 'prototype', or
// '__proto__' can never interact with the prototype chain and yield an
// unstructured TypeError on lookup.
const providers = new Map<string, RegistryProvider>([
  ['npm', npm],
  ['pypi', pypi],
  ['nuget', nuget],
  ['vscode', vscode],
  ['docker', docker],
  ['github', github],
]);

/** Built-in registry names — overwriting one warns (it's almost always a mistake). */
const BUILTIN_REGISTRIES = new Set(providers.keys());

/** Register a custom registry provider. The provider's name becomes the registry key for stats(). */
function registerProvider(provider: RegistryProvider): void {
  if (!provider || typeof provider.name !== 'string' || provider.name.trim() === '') {
    throw new Error('registerProvider: provider.name must be a non-empty string');
  }
  if (typeof provider.getStats !== 'function') {
    throw new Error(`registerProvider: provider "${provider.name}" must have a getStats function`);
  }
  if (BUILTIN_REGISTRIES.has(provider.name)) {
    console.warn(`registerProvider: overwriting built-in registry "${provider.name}"`);
  }
  providers.set(provider.name, provider);
}

/**
 * A single registry that failed during an all-registries / compare fan-out.
 * Surfaced on the additive `.errors` channel so a transient outage is
 * distinguishable from "package absent" without changing the primary shape.
 */
export interface RegistryFailure {
  registry: string;
  /** HTTP-ish status from RegistryError when available (0 if unknown). */
  statusCode?: number;
  message: string;
}

/** Result of stats.all(): a plain array of successes plus an additive errors channel. */
export interface AllStatsResult extends Array<PackageStats> {
  /** Registries that errored (vs. legitimately returning null/not-found). */
  errors?: RegistryFailure[];
}

/** Result of stats.compare(): ComparisonResult plus an additive errors channel. */
export interface ComparisonWithErrors extends ComparisonResult {
  /** Registries that errored (vs. legitimately returning null/not-found). */
  errors?: RegistryFailure[];
}

/** Convert an arbitrary rejection reason into a structured RegistryFailure. */
function toRegistryFailure(registry: string, reason: unknown): RegistryFailure {
  if (reason instanceof RegistryError) {
    return { registry: reason.registry ? String(reason.registry) : registry, statusCode: reason.statusCode, message: reason.message };
  }
  if (reason instanceof Error) {
    return { registry, message: reason.message };
  }
  return { registry, message: String(reason) };
}

const DEFAULT_TTL = 300_000; // 5 minutes

/**
 * Fetch download stats for a single package from one registry.
 * Returns null if the package is not found (404).
 * Supports caching via options.cache.
 */
async function stats(
  registry: string,
  pkg: string,
  options?: StatsOptions,
): Promise<PackageStats | null> {
  validatePackageName(pkg, registry);
  const provider = providers.get(registry);
  if (!provider) {
    throw new RegistryError(registry, 0, `Unknown registry "${registry}". Use registerProvider() to add custom registries.`);
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

/**
 * Fetch stats from all registered providers. Successful results are returned as
 * a plain array; registries that *errored* (vs. legitimately 404'd to null) are
 * surfaced on an additive `.errors` channel so a transient outage is not
 * mistaken for "package absent". The return type is array-compatible — existing
 * callers that treat it as PackageStats[] are unaffected.
 */
stats.all = async function all(
  pkg: string,
  options?: StatsOptions,
): Promise<AllStatsResult> {
  // Enforce the same package-name contract as stats() for every provider.
  for (const p of providers.values()) {
    validatePackageName(pkg, p.name);
  }

  const providerList = [...providers.values()];
  const settled = await Promise.allSettled(
    providerList.map((p) => p.getStats(pkg, options)),
  );

  const out: AllStatsResult = [];
  const errors: RegistryFailure[] = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      if (r.value !== null) out.push(r.value);
    } else {
      errors.push(toRegistryFailure(providerList[i].name, r.reason));
    }
  });

  out.errors = errors;
  return out;
};

/** Fetch stats for multiple packages from one registry with concurrency control. */
stats.bulk = async function bulk(
  registry: string,
  packages: string[],
  options?: StatsOptions,
): Promise<(PackageStats | null)[]> {
  const provider = providers.get(registry);
  if (!provider) {
    throw new RegistryError(registry, 0, `Unknown registry "${registry}".`);
  }

  // Enforce the package-name contract on every name up front, so the bulk
  // smart-path (which bypasses stats()) cannot smuggle traversal into a URL.
  for (const pkg of packages) {
    validatePackageName(pkg, registry);
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

/** Fetch daily download time-series for a package. Only npm and pypi support this. */
stats.range = async function range(
  registry: string,
  pkg: string,
  start: string,
  end: string,
  options?: StatsOptions,
): Promise<DailyDownloads[]> {
  validatePackageName(pkg, registry);
  const provider = providers.get(registry);
  if (!provider) {
    throw new RegistryError(registry, 0, `Unknown registry "${registry}".`);
  }
  if (!provider.getRange) {
    throw new RegistryError(
      registry,
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

/**
 * Compare a package's stats across multiple registries. Registries that errored
 * (vs. legitimately returning null) are surfaced on an additive `errors` channel
 * so a transient outage is distinguishable from "package absent". The base shape
 * (package/registries/fetchedAt) is unchanged and backward-compatible.
 */
stats.compare = async function compare(
  pkg: string,
  registries?: string[],
  options?: StatsOptions,
): Promise<ComparisonWithErrors> {
  const regs = registries ?? [...providers.keys()];
  const results = await Promise.allSettled(
    regs.map(async (reg) => {
      const result = await stats(reg, pkg, options);
      return result ? { reg, result } : null;
    }),
  );

  const registryMap: Record<string, PackageStats> = {};
  const errors: RegistryFailure[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      if (r.value) registryMap[r.value.reg] = r.value.result;
    } else {
      errors.push(toRegistryFailure(regs[i], r.reason));
    }
  });

  return {
    package: pkg,
    registries: registryMap,
    fetchedAt: new Date().toISOString(),
    errors,
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
  // Defensive cap: at 250/page this is 10k packages — far beyond any real
  // maintainer — and stops a malformed `total` or paging loop from running
  // unbounded HTTP requests.
  const MAX_PAGES = 40;
  let offset = 0;
  let page = 0;

  while (page < MAX_PAGES) {
    page++;
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
