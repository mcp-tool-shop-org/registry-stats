import type { RegistryProvider, PackageStats } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const API = 'https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery';

interface ExtensionQueryResponse {
  results: {
    extensions: {
      extensionName: string;
      publisher: { publisherName: string };
      displayName: string;
      statistics: { statisticName: string; value: number }[];
    }[];
  }[];
}

function getStat(
  stats: { statisticName: string; value: number }[],
  name: string,
): number | undefined {
  return stats.find((s) => s.statisticName === name)?.value;
}

export const vscode: RegistryProvider = {
  name: 'vscode',

  async getStats(pkg: string): Promise<PackageStats | null> {
    const json = await fetchWithRetry<ExtensionQueryResponse>(API, 'vscode', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json;api-version=3.0-preview.1',
      },
      body: JSON.stringify({
        filters: [
          {
            criteria: [{ filterType: 7, value: pkg }],
          },
        ],
        flags: 0x100, // IncludeStatistics
      }),
    });

    if (!json) return null;

    const ext = json.results?.[0]?.extensions?.[0];
    if (!ext) return null;

    const stats = ext.statistics || [];

    return {
      registry: 'vscode',
      package: `${ext.publisher.publisherName}.${ext.extensionName}`,
      downloads: {
        total: getStat(stats, 'install'),
      },
      extra: {
        displayName: ext.displayName,
        rating: getStat(stats, 'averagerating'),
        ratingCount: getStat(stats, 'ratingcount'),
        trendingDaily: getStat(stats, 'trendingdaily'),
        trendingWeekly: getStat(stats, 'trendingweekly'),
        trendingMonthly: getStat(stats, 'trendingmonthly'),
      },
      fetchedAt: new Date().toISOString(),
    };
  },
};
