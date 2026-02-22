import type { RegistryProvider, PackageStats, StatsOptions } from '../types.js';
import { RegistryError } from '../types.js';

const API = 'https://hub.docker.com/v2/repositories';

export const docker: RegistryProvider = {
  name: 'docker',

  async getStats(pkg: string, options?: StatsOptions): Promise<PackageStats | null> {
    const headers: Record<string, string> = {};
    if (options?.dockerToken) {
      headers['Authorization'] = `Bearer ${options.dockerToken}`;
    }

    const res = await fetch(`${API}/${pkg}`, { headers });

    if (res.status === 404) return null;
    if (!res.ok) {
      const retryAfter = res.headers.get('retry-after');
      throw new RegistryError(
        'docker',
        res.status,
        `${res.statusText}`,
        retryAfter ? parseInt(retryAfter, 10) : undefined,
      );
    }

    const json = (await res.json()) as {
      name: string;
      namespace: string;
      pull_count: number;
      star_count: number;
      last_updated: string;
    };

    return {
      registry: 'docker',
      package: `${json.namespace}/${json.name}`,
      downloads: {
        total: json.pull_count,
      },
      extra: {
        stars: json.star_count,
        lastUpdated: json.last_updated,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
};
