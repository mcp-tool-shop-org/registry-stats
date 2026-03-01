import type { RegistryProvider, PackageStats, StatsOptions } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const API = 'https://api.github.com';

interface GhcrVersion {
  id: number;
  name: string;
  metadata?: {
    container?: {
      tags?: string[];
    };
    package_type?: string;
  };
  download_count?: number;
}

export const ghcr: RegistryProvider = {
  name: 'ghcr',
  rateLimit: { maxRequests: 50, windowSeconds: 3600, authRaisesLimit: true },

  async getStats(pkg: string, options?: StatsOptions): Promise<PackageStats | null> {
    // pkg format: "org/image-name" e.g. "mcp-tool-shop-org/backpropagate"
    const slash = pkg.indexOf('/');
    if (slash === -1) return null;

    const owner = pkg.slice(0, slash);
    const name = pkg.slice(slash + 1);

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (options?.ghcrToken) {
      headers['Authorization'] = `Bearer ${options.ghcrToken}`;
    }

    // Fetch versions to sum download_count
    const versions = await fetchWithRetry<GhcrVersion[]>(
      `${API}/orgs/${owner}/packages/container/${encodeURIComponent(name)}/versions?per_page=100`,
      'ghcr',
      { headers },
    );

    if (!versions || !Array.isArray(versions)) return null;

    const totalPulls = versions.reduce((sum, v) => sum + (v.download_count ?? 0), 0);
    const tags = versions.flatMap(v => v.metadata?.container?.tags ?? []);

    return {
      registry: 'ghcr',
      package: pkg,
      downloads: {
        total: totalPulls,
      },
      extra: {
        tags: tags.slice(0, 10),
        versionCount: versions.length,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
};
