import type { RegistryProvider, PackageStats, DailyDownloads } from '../types.js';
import { RegistryError } from '../types.js';
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
    const safePkg = encodeURIComponent(pkg);
    const [recentSettled, overallSettled] = await Promise.allSettled([
      fetchWithRetry<RecentResponse>(`${API}/packages/${safePkg}/recent`, 'pypi'),
      fetchWithRetry<OverallResponse>(`${API}/packages/${safePkg}/overall?mirrors=false`, 'pypi'),
    ]);

    // Keep a side that succeeded when the other throws. Throw only when both fail.
    if (recentSettled.status === 'rejected' && overallSettled.status === 'rejected') {
      throw recentSettled.reason;
    }

    const recent = recentSettled.status === 'fulfilled' ? recentSettled.value : null;
    const overall = overallSettled.status === 'fulfilled' ? overallSettled.value : null;
    // A 200 of { data: null } is not a usable payload. Do not read through it.
    const recentData = recent?.data && typeof recent.data === 'object' ? recent.data : null;
    const overallRows = overall && Array.isArray(overall.data) ? overall.data : null;

    if (!recentData && !overallRows) return null;

    const total = overallRows
      ?.filter((d) => d != null && d.category === 'without_mirrors')
      ?.reduce((sum, d) => sum + (typeof d.downloads === 'number' ? d.downloads : 0), 0);

    return {
      registry: 'pypi',
      package: pkg,
      downloads: {
        total: total ?? undefined,
        lastDay: recentData?.last_day,
        lastWeek: recentData?.last_week,
        lastMonth: recentData?.last_month,
      },
      fetchedAt: new Date().toISOString(),
    };
  },

  async getRange(pkg: string, start: string, end: string): Promise<DailyDownloads[]> {
    const safePkg = encodeURIComponent(pkg);
    const data = await fetchWithRetry<OverallResponse>(
      `${API}/packages/${safePkg}/overall?mirrors=false`, 'pypi',
    );

    if (!data) return [];

    const startDate = parseUtcDay(start);
    const endDate = parseUtcDay(end);
    if (!startDate || !endDate || startDate.getTime() > endDate.getTime()) {
      throw new RegistryError('pypi', 400, `Invalid date range "${start}:${end}". Use YYYY-MM-DD.`);
    }
    // A 200 whose data is not an array is an empty series, not a TypeError.
    // A missing chunk (404) already returned [] above. Invalid dates still throw.
    if (!Array.isArray(data.data)) return [];

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

function parseUtcDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}
