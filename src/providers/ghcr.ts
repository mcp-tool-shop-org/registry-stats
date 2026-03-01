import type { RegistryProvider, PackageStats, StatsOptions } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const API = 'https://api.github.com';

interface GhcrVersion {
  id: number;
  name: string;
  created_at?: string;
  updated_at?: string;
  metadata?: {
    container?: {
      tags?: string[];
    };
    package_type?: string;
  };
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

    const versions = await fetchWithRetry<GhcrVersion[]>(
      `${API}/orgs/${owner}/packages/container/${encodeURIComponent(name)}/versions?per_page=100`,
      'ghcr',
      { headers },
    );

    if (!versions || !Array.isArray(versions)) return null;

    const now = Date.now();
    const DAY = 86_400_000;
    let activity7d = 0;
    let activity30d = 0;
    let lastPublished: string | null = null;

    for (const v of versions) {
      const created = v.created_at ? new Date(v.created_at).getTime() : 0;
      if (created > 0) {
        const age = now - created;
        if (age <= 7 * DAY) activity7d++;
        if (age <= 30 * DAY) activity30d++;
        if (!lastPublished || v.created_at! > lastPublished) {
          lastPublished = v.created_at!;
        }
      }
    }

    const tags = versions.flatMap(v => v.metadata?.container?.tags ?? []);

    // GHCR does not expose pull counts via public API.
    // We report version activity as the primary metric instead.
    return {
      registry: 'ghcr',
      package: pkg,
      downloads: {
        total: versions.length,       // versionCount as primary number
        lastWeek: activity7d,         // new versions in 7d
        lastMonth: activity30d,       // new versions in 30d
      },
      extra: {
        metricType: 'versions',       // signals this is version activity, not downloads
        tags: tags.slice(0, 10),
        versionCount: versions.length,
        activity7d,
        activity30d,
        lastPublished,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
};
