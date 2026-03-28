import type { DailyDownloads, ChartData } from './types.js';

/** Download stats calculation utilities for DailyDownloads time-series data. */
export const calc = {
  /** Sum all downloads in the given records. */
  total(records: DailyDownloads[]): number {
    return records.reduce((sum, r) => sum + r.downloads, 0);
  },

  /** Compute average daily downloads. Returns 0 for empty input. */
  avg(records: DailyDownloads[]): number {
    if (records.length === 0) return 0;
    return calc.total(records) / records.length;
  },

  /** Group records by a custom key function. */
  group(
    records: DailyDownloads[],
    fn: (r: DailyDownloads) => string,
  ): Record<string, DailyDownloads[]> {
    const groups: Record<string, DailyDownloads[]> = {};
    for (const r of records) {
      const key = fn(r);
      (groups[key] ??= []).push(r);
    }
    return groups;
  },

  /** Group records by month (YYYY-MM keys). */
  monthly(records: DailyDownloads[]): Record<string, DailyDownloads[]> {
    return calc.group(records, (r) => r.date.slice(0, 7));
  },

  /** Group records by year (YYYY keys). */
  yearly(records: DailyDownloads[]): Record<string, DailyDownloads[]> {
    return calc.group(records, (r) => r.date.slice(0, 4));
  },

  /** Sum downloads within each group. */
  groupTotals(grouped: Record<string, DailyDownloads[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, records] of Object.entries(grouped)) {
      result[key] = calc.total(records);
    }
    return result;
  },

  /** Average downloads within each group. */
  groupAvgs(grouped: Record<string, DailyDownloads[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, records] of Object.entries(grouped)) {
      result[key] = calc.avg(records);
    }
    return result;
  },

  /** Detect trend direction (up/down/flat) by comparing recent vs previous window averages. */
  trend(
    records: DailyDownloads[],
    windowDays = 7,
  ): { slope: number; direction: 'up' | 'down' | 'flat'; changePercent: number } {
    if (records.length < windowDays * 2) {
      return { slope: 0, direction: 'flat', changePercent: 0 };
    }

    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const recent = sorted.slice(-windowDays);
    const previous = sorted.slice(-windowDays * 2, -windowDays);

    const recentAvg = calc.avg(recent);
    const previousAvg = calc.avg(previous);

    const slope = recentAvg - previousAvg;
    const changePercent = previousAvg === 0 ? 0 : ((recentAvg - previousAvg) / previousAvg) * 100;

    const threshold = previousAvg * 0.05;
    const direction: 'up' | 'down' | 'flat' =
      slope > threshold ? 'up' : slope < -threshold ? 'down' : 'flat';

    return { slope: Math.round(slope * 100) / 100, direction, changePercent: Math.round(changePercent * 100) / 100 };
  },

  /** Compute a simple moving average over a sliding window. */
  movingAvg(records: DailyDownloads[], windowDays = 7): DailyDownloads[] {
    if (records.length < windowDays) return [];
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const result: DailyDownloads[] = [];

    for (let i = windowDays - 1; i < sorted.length; i++) {
      let sum = 0;
      for (let j = i - windowDays + 1; j <= i; j++) {
        sum += sorted[j].downloads;
      }
      result.push({
        date: sorted[i].date,
        downloads: Math.round((sum / windowDays) * 100) / 100,
      });
    }

    return result;
  },

  /** Compute a 0-100 popularity score based on log-scaled recent daily downloads. */
  popularity(records: DailyDownloads[]): number {
    if (records.length === 0) return 0;

    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const recentDays = Math.min(30, sorted.length);
    const recent = sorted.slice(-recentDays);

    const avgDaily = calc.avg(recent);
    // Log scale: 0 at 1 download/day, 100 at 1M downloads/day
    const score = Math.max(0, Math.min(100, (Math.log10(Math.max(1, avgDaily)) / 6) * 100));
    return Math.round(score * 10) / 10;
  },

  /** Convert records to CSV string with date,downloads columns. */
  toCSV(records: DailyDownloads[]): string {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const lines = ['date,downloads'];
    for (const r of sorted) {
      lines.push(`${r.date},${r.downloads}`);
    }
    return lines.join('\n');
  },

  /** Convert records to a ChartData object suitable for chart libraries. */
  toChartData(records: DailyDownloads[], label = 'downloads'): ChartData {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    return {
      labels: sorted.map((r) => r.date),
      datasets: [{ label, data: sorted.map((r) => r.downloads) }],
    };
  },
};
