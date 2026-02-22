import type { DailyDownloads, ChartData } from './types.js';

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

  toCSV(records: DailyDownloads[]): string {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    const lines = ['date,downloads'];
    for (const r of sorted) {
      lines.push(`${r.date},${r.downloads}`);
    }
    return lines.join('\n');
  },

  toChartData(records: DailyDownloads[], label = 'downloads'): ChartData {
    const sorted = [...records].sort((a, b) => a.date.localeCompare(b.date));
    return {
      labels: sorted.map((r) => r.date),
      datasets: [{ label, data: sorted.map((r) => r.downloads) }],
    };
  },
};
