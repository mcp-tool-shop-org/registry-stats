import type { RegistryProvider, PackageStats, StatsOptions } from '../types.js';
import { RegistryError } from '../types.js';
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

    // Encoding alone does NOT stop traversal: encodeURIComponent('..') === '..',
    // so '..' / '.' segments would survive and collapse the path to a different
    // hub.docker.com resource. Reject those segments outright, then encode the
    // rest to neutralize spaces / injection characters.
    const segments = pkg.split('/');
    for (const seg of segments) {
      if (seg === '..' || seg === '.') {
        throw new RegistryError('docker', 0, `Invalid image name "${pkg}": path traversal not allowed`);
      }
    }
    const safePkg = segments.map(s => encodeURIComponent(s)).join('/');

    const json = await fetchWithRetry<{
      name: string;
      namespace: string;
      pull_count: number;
      star_count: number;
      last_updated: string;
    }>(`${API}/${safePkg}`, 'docker', { headers });

    if (!json || !json.name || !json.namespace) return null;

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
