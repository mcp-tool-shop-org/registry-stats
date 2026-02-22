import type { RegistryName, PackageStats, DailyDownloads, StatsOptions, StatsCache, RegistryProvider } from './types.js';
import { RegistryError } from './types.js';
import { npm } from './providers/npm.js';
import { pypi } from './providers/pypi.js';
import { nuget } from './providers/nuget.js';
import { vscode } from './providers/vscode.js';
import { docker } from './providers/docker.js';

export { calc } from './calc.js';
export type { RegistryName, PackageStats, DailyDownloads, StatsOptions, StatsCache, RegistryProvider, RateLimitConfig, Config, PackageConfig } from './types.js';
export { RegistryError } from './types.js';
export { loadConfig, defaultConfig, starterConfig } from './config.js';

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
  const concurrency = options?.concurrency ?? 5;
  const limit = pLimit(concurrency);
  return Promise.all(packages.map((pkg) => limit(() => stats(registry, pkg, options))));
};

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

export { stats, registerProvider };
