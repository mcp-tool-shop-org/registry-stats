import { describe, it, expect } from 'vitest';
import { calc } from './calc.js';
import type { DailyDownloads } from './types.js';

function makeDays(start: string, counts: number[]): DailyDownloads[] {
  const base = new Date(start);
  return counts.map((downloads, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0, 10), downloads };
  });
}

describe('calc (supplementary)', () => {
  describe('group', () => {
    it('returns empty object for empty input', () => {
      expect(calc.group([], () => 'all')).toEqual({});
    });
  });

  describe('groupTotals', () => {
    it('returns empty for empty grouped input', () => {
      expect(calc.groupTotals({})).toEqual({});
    });
  });

  describe('groupAvgs', () => {
    it('returns empty for empty grouped input', () => {
      expect(calc.groupAvgs({})).toEqual({});
    });
  });

  describe('trend', () => {
    it('handles changePercent with zero previous average', () => {
      const data = makeDays('2025-01-01', [
        0, 0, 0, 0, 0, 0, 0,
        10, 10, 10, 10, 10, 10, 10,
      ]);
      const t = calc.trend(data, 7);
      // previousAvg is 0, so changePercent should be 0 (not Infinity)
      expect(Number.isFinite(t.changePercent)).toBe(true);
    });
  });

  describe('movingAvg', () => {
    it('handles window equal to data length', () => {
      const data = makeDays('2025-01-01', [10, 20, 30]);
      const ma = calc.movingAvg(data, 3);
      expect(ma).toHaveLength(1);
      expect(ma[0].downloads).toBe(20);
    });
  });

  describe('toChartData', () => {
    it('returns empty labels and data for empty input', () => {
      const chart = calc.toChartData([]);
      expect(chart.labels).toEqual([]);
      expect(chart.datasets[0].data).toEqual([]);
    });
  });

  describe('toCSV', () => {
    it('handles single-day data', () => {
      const csv = calc.toCSV([{ date: '2025-03-01', downloads: 42 }]);
      expect(csv).toBe('date,downloads\n2025-03-01,42');
    });
  });
});
