import type { RegistryProvider, PackageStats } from '../types.js';
import { RegistryError } from '../types.js';

const SEARCH_API = 'https://azuresearch-usnc.nuget.org/query';

export const nuget: RegistryProvider = {
  name: 'nuget',

  async getStats(pkg: string): Promise<PackageStats | null> {
    const url = `${SEARCH_API}?q=packageid:${encodeURIComponent(pkg)}&take=1`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new RegistryError('nuget', res.status, `${res.statusText}: ${url}`);
    }

    const json = (await res.json()) as {
      data: {
        id: string;
        totalDownloads: number;
        version: string;
        description?: string;
        authors?: string[];
      }[];
    };

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
