import type { RegistryProvider, PackageStats, DailyDownloads } from '../types.js';
import { fetchWithRetry, fetchDirect } from '../fetch.js';

const API = 'https://api.npmjs.org/downloads';

interface PointResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

interface BulkPointResponse {
  [pkg: string]: PointResponse | null;
}

interface RangeResponse {
  downloads: { day: string; downloads: number }[];
  start: string;
  end: string;
  package: string;
}

export const npm: RegistryProvider = {
  name: 'npm',

  async getStats(pkg: string): Promise<PackageStats | null> {
    // Single range call for last-month daily data — then derive day/week/month
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 30);

    const data = await fetchWithRetry<RangeResponse>(
      `${API}/range/${fmt(start)}:${fmt(end)}/${pkg}`, 'npm',
    );

    if (!data || !data.downloads || data.downloads.length === 0) return null;

    const days = data.downloads;
    const lastDay = days[days.length - 1]?.downloads ?? 0;
    const lastWeek = days.slice(-7).reduce((s, d) => s + d.downloads, 0);
    const lastMonth = days.reduce((s, d) => s + d.downloads, 0);

    return {
      registry: 'npm',
      package: pkg,
      downloads: { lastDay, lastWeek, lastMonth },
      fetchedAt: new Date().toISOString(),
    };
  },

  async getRange(pkg: string, start: string, end: string): Promise<DailyDownloads[]> {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const maxDays = 549;
    const chunks: DailyDownloads[] = [];

    let cursor = startDate;
    while (cursor < endDate) {
      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + maxDays - 1);
      const actualEnd = chunkEnd > endDate ? endDate : chunkEnd;

      const s = fmt(cursor);
      const e = fmt(actualEnd);
      const data = await fetchWithRetry<RangeResponse>(`${API}/range/${s}:${e}/${pkg}`, 'npm');

      if (data) {
        for (const d of data.downloads) {
          chunks.push({ date: d.day, downloads: d.downloads });
        }
      }

      cursor = new Date(actualEnd);
      cursor.setDate(cursor.getDate() + 1);
    }

    return chunks;
  },
};

/**
 * Bulk-fetch last-month stats for multiple unscoped packages in a single API call.
 * npm's bulk endpoint doesn't support scoped packages, so this only works for
 * packages without an @ prefix.
 */
export async function npmBulkPoint(
  packages: string[],
  period: 'last-day' | 'last-week' | 'last-month' = 'last-month',
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  if (packages.length === 0) return result;

  // npm bulk API supports up to 128 comma-separated package names
  const BATCH_SIZE = 128;
  for (let i = 0; i < packages.length; i += BATCH_SIZE) {
    const batch = packages.slice(i, i + BATCH_SIZE);
    const joined = batch.join(',');

    const data = await fetchDirect<BulkPointResponse>(
      `${API}/point/${period}/${joined}`, 'npm',
    );

    if (data) {
      for (const [name, entry] of Object.entries(data)) {
        if (entry && typeof entry.downloads === 'number') {
          result.set(name, entry.downloads);
        }
      }
    }
  }

  return result;
}

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
