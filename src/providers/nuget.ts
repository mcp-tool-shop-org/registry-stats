import type { RegistryProvider, PackageStats } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const SEARCH_API = 'https://azuresearch-usnc.nuget.org/query';

export const nuget: RegistryProvider = {
  name: 'nuget',

  async getStats(pkg: string): Promise<PackageStats | null> {
    const url = `${SEARCH_API}?q=packageid:${encodeURIComponent(pkg)}&take=1`;
    const json = await fetchWithRetry<{
      data: {
        id: string;
        totalDownloads: number;
        version: string;
      }[];
    }>(url, 'nuget');

    if (!json) return null;

    const match = json.data.find(
      (d) => d.id.toLowerCase() === pkg.toLowerCase(),
    );

    if (!match) return null;

    return {
      registry: 'nuget',
      package: match.id,
      downloads: {
        total: match.totalDownloads,
      },
      extra: {
        version: match.version,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
};
