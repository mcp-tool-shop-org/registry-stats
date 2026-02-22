import type { RegistryProvider, PackageStats, DailyDownloads } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const API = 'https://api.npmjs.org/downloads';

interface PointResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
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
    const [day, week, month] = await Promise.all([
      fetchWithRetry<PointResponse>(`${API}/point/last-day/${pkg}`, 'npm'),
      fetchWithRetry<PointResponse>(`${API}/point/last-week/${pkg}`, 'npm'),
      fetchWithRetry<PointResponse>(`${API}/point/last-month/${pkg}`, 'npm'),
    ]);

    if (!day && !week && !month) return null;

    return {
      registry: 'npm',
      package: pkg,
      downloads: {
        lastDay: day?.downloads,
        lastWeek: week?.downloads,
        lastMonth: month?.downloads,
      },
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

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10);
}
