import type { RegistryProvider, PackageStats, DailyDownloads } from '../types.js';
import { RegistryError } from '../types.js';
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
    // 30 inclusive dates, ending today. -30 was 31 dates.
    start.setDate(start.getDate() - 29);

    const data = await fetchWithRetry<RangeResponse>(
      `${API}/range/${fmt(start)}:${fmt(end)}/${encodeNpmPackage(pkg)}`, 'npm',
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
    const startDate = parseUtcDay(start);
    const endDate = parseUtcDay(end);
    if (!startDate || !endDate) {
      throw new RegistryError('npm', 400, `Invalid date range "${start}:${end}". Use YYYY-MM-DD.`);
    }
    if (startDate.getTime() > endDate.getTime()) {
      throw new RegistryError('npm', 400, `Invalid date range "${start}:${end}". Start is after end.`);
    }
    const maxDays = 549;
    const chunks: DailyDownloads[] = [];

    let cursor = startDate;
    // <= so a one-day range (start === end) still fetches that day.
    while (cursor.getTime() <= endDate.getTime()) {
      const chunkEnd = new Date(cursor);
      chunkEnd.setDate(chunkEnd.getDate() + maxDays - 1);
      const actualEnd = chunkEnd > endDate ? endDate : chunkEnd;

      const s = fmt(cursor);
      const e = fmt(actualEnd);
      const data = await fetchWithRetry<RangeResponse>(`${API}/range/${s}:${e}/${encodeNpmPackage(pkg)}`, 'npm');

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
    // Defense-in-depth: encode each name so '/' or '..' segments can never
    // collapse the URL path even if validation upstream is bypassed.
    const joined = batch.map(encodeURIComponent).join(',');

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

/** Real UTC calendar day. Rejects "not-a-date", "2025-02-31", and "12abc". */
function parseUtcDay(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== value) return null;
  return date;
}

/**
 * Encode an npm package name for use in URL paths.
 * Scoped packages like @scope/name become %40scope%2Fname.
 * Unscoped packages are encoded as-is to prevent path manipulation.
 */
function encodeNpmPackage(pkg: string): string {
  return encodeURIComponent(pkg);
}
