import type { RegistryProvider, PackageStats, DailyDownloads } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const API = 'https://pypistats.org/api';

interface RecentResponse {
  data: {
    last_day: number;
    last_week: number;
    last_month: number;
  };
  package: string;
  type: string;
}

interface OverallResponse {
  data: {
    category: string;
    date: string | null;
    downloads: number;
  }[];
  package: string;
  type: string;
}

export const pypi: RegistryProvider = {
  name: 'pypi',
  rateLimit: { maxRequests: 30, windowSeconds: 60, authRaisesLimit: false },

  async getStats(pkg: string): Promise<PackageStats | null> {
    const [recent, overall] = await Promise.all([
      fetchWithRetry<RecentResponse>(`${API}/packages/${pkg}/recent`, 'pypi'),
      fetchWithRetry<OverallResponse>(`${API}/packages/${pkg}/overall?mirrors=false`, 'pypi'),
    ]);

    if (!recent && !overall) return null;

    const total = overall?.data
      ?.filter((d) => d.category === 'without_mirrors')
      ?.reduce((sum, d) => sum + d.downloads, 0);

    return {
      registry: 'pypi',
      package: pkg,
      downloads: {
        total: total || undefined,
        lastDay: recent?.data.last_day,
        lastWeek: recent?.data.last_week,
        lastMonth: recent?.data.last_month,
      },
      fetchedAt: new Date().toISOString(),
    };
  },

  async getRange(pkg: string, start: string, end: string): Promise<DailyDownloads[]> {
    const data = await fetchWithRetry<OverallResponse>(
      `${API}/packages/${pkg}/overall?mirrors=false`, 'pypi',
    );

    if (!data) return [];

    const startDate = new Date(start);
    const endDate = new Date(end);

    return data.data
      .filter((d) => {
        if (!d.date || d.category !== 'without_mirrors') return false;
        const date = new Date(d.date);
        return date >= startDate && date <= endDate;
      })
      .map((d) => ({ date: d.date!, downloads: d.downloads }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
};
