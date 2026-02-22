import type { RegistryName, PackageStats, DailyDownloads, StatsOptions, RegistryProvider } from './types.js';
import { RegistryError } from './types.js';
import { npm } from './providers/npm.js';
import { pypi } from './providers/pypi.js';
import { nuget } from './providers/nuget.js';
import { vscode } from './providers/vscode.js';
import { docker } from './providers/docker.js';

export { calc } from './calc.js';
export type { RegistryName, PackageStats, DailyDownloads, StatsOptions } from './types.js';
export { RegistryError } from './types.js';

const providers: Record<RegistryName, RegistryProvider> = {
  npm,
  pypi,
  nuget,
  vscode,
  docker,
};

async function stats(
  registry: RegistryName,
  pkg: string,
  options?: StatsOptions,
): Promise<PackageStats | null> {
  const provider = providers[registry];
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
  registry: RegistryName,
  packages: string[],
  options?: StatsOptions,
): Promise<(PackageStats | null)[]> {
  const provider = providers[registry];
  return Promise.all(packages.map((pkg) => provider.getStats(pkg, options)));
};

stats.range = async function range(
  registry: RegistryName,
  pkg: string,
  start: string,
  end: string,
): Promise<DailyDownloads[]> {
  const provider = providers[registry];
  if (!provider.getRange) {
    throw new RegistryError(
      registry,
      0,
      `${registry} does not support time-series data. Only npm and pypi support getRange().`,
    );
  }
  return provider.getRange(pkg, start, end);
};

export { stats };
