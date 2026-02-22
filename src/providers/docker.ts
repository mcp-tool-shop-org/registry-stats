import type { RegistryProvider, PackageStats, StatsOptions } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const API = 'https://hub.docker.com/v2/repositories';

export const docker: RegistryProvider = {
  name: 'docker',
  rateLimit: { maxRequests: 10, windowSeconds: 3600, authRaisesLimit: true },

  async getStats(pkg: string, options?: StatsOptions): Promise<PackageStats | null> {
    const headers: Record<string, string> = {};
    if (options?.dockerToken) {
      headers['Authorization'] = `Bearer ${options.dockerToken}`;
    }

    const json = await fetchWithRetry<{
      name: string;
      namespace: string;
      pull_count: number;
      star_count: number;
      last_updated: string;
    }>(`${API}/${pkg}`, 'docker', { headers });

    if (!json) return null;

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
