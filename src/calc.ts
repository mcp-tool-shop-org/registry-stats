import type { DailyDownloads } from './types.js';

export const calc = {
  total(records: DailyDownloads[]): number {
    return records.reduce((sum, r) => sum + r.downloads, 0);
  },

  avg(records: DailyDownloads[]): number {
    if (records.length === 0) return 0;
    return calc.total(records) / records.length;
  },

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

  monthly(records: DailyDownloads[]): Record<string, DailyDownloads[]> {
    return calc.group(records, (r) => r.date.slice(0, 7));
  },

  yearly(records: DailyDownloads[]): Record<string, DailyDownloads[]> {
    return calc.group(records, (r) => r.date.slice(0, 4));
  },

  groupTotals(grouped: Record<string, DailyDownloads[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, records] of Object.entries(grouped)) {
      result[key] = calc.total(records);
    }
    return result;
  },

  groupAvgs(grouped: Record<string, DailyDownloads[]>): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, records] of Object.entries(grouped)) {
      result[key] = calc.avg(records);
    }
    return result;
  },

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
};
