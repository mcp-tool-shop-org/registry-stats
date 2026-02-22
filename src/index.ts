import type { RegistryName, PackageStats, DailyDownloads, StatsOptions, RegistryProvider } from './types.js';
import { RegistryError } from './types.js';
import { npm } from './providers/npm.js';
import { pypi } from './providers/pypi.js';
import { nuget } from './providers/nuget.js';
import { vscode } from './providers/vscode.js';
import { docker } from './providers/docker.js';

export { calc } from './calc.js';
export type { RegistryName, PackageStats, DailyDownloads, StatsOptions, RegistryProvider, RateLimitConfig } from './types.js';
export { RegistryError } from './types.js';

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

async function stats(
  registry: string,
  pkg: string,
  options?: StatsOptions,
): Promise<PackageStats | null> {
  const provider = providers[registry];
  if (!provider) {
    throw new RegistryError(registry as RegistryName, 0, `Unknown registry "${registry}". Use registerProvider() to add custom registries.`);
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
  return Promise.all(packages.map((pkg) => provider.getStats(pkg, options)));
};

stats.range = async function range(
  registry: string,
  pkg: string,
  start: string,
  end: string,
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
  return provider.getRange(pkg, start, end);
};

export { stats, registerProvider };
