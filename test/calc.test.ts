import { describe, it, expect } from 'vitest';
import { calc } from '../src/calc.js';
import type { DailyDownloads } from '../src/types.js';

function makeDays(start: string, counts: number[]): DailyDownloads[] {
  const base = new Date(start);
  return counts.map((downloads, i) => {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    return { date: d.toISOString().slice(0, 10), downloads };
  });
}

describe('calc', () => {
  describe('total', () => {
    it('sums all downloads', () => {
      const data = makeDays('2025-01-01', [10, 20, 30]);
      expect(calc.total(data)).toBe(60);
    });

    it('returns 0 for empty array', () => {
      expect(calc.total([])).toBe(0);
    });
  });

  describe('avg', () => {
    it('computes average', () => {
      const data = makeDays('2025-01-01', [10, 20, 30]);
      expect(calc.avg(data)).toBe(20);
    });

    it('returns 0 for empty array', () => {
      expect(calc.avg([])).toBe(0);
    });
  });

  describe('monthly', () => {
    it('groups by month', () => {
      const data: DailyDownloads[] = [
        { date: '2025-01-15', downloads: 10 },
        { date: '2025-01-20', downloads: 20 },
        { date: '2025-02-05', downloads: 30 },
      ];
      const groups = calc.monthly(data);
      expect(Object.keys(groups)).toEqual(['2025-01', '2025-02']);
      expect(groups['2025-01']).toHaveLength(2);
      expect(groups['2025-02']).toHaveLength(1);
    });
  });

  describe('yearly', () => {
    it('groups by year', () => {
      const data: DailyDownloads[] = [
        { date: '2024-12-31', downloads: 5 },
        { date: '2025-01-01', downloads: 10 },
        { date: '2025-06-15', downloads: 20 },
      ];
      const groups = calc.yearly(data);
      expect(Object.keys(groups)).toEqual(['2024', '2025']);
      expect(groups['2025']).toHaveLength(2);
    });
  });

  describe('groupTotals', () => {
    it('sums each group', () => {
      const data: DailyDownloads[] = [
        { date: '2025-01-01', downloads: 10 },
        { date: '2025-01-02', downloads: 20 },
        { date: '2025-02-01', downloads: 30 },
      ];
      const totals = calc.groupTotals(calc.monthly(data));
      expect(totals['2025-01']).toBe(30);
      expect(totals['2025-02']).toBe(30);
    });
  });

  describe('groupAvgs', () => {
    it('averages each group', () => {
      const data: DailyDownloads[] = [
        { date: '2025-01-01', downloads: 10 },
        { date: '2025-01-02', downloads: 20 },
        { date: '2025-02-01', downloads: 30 },
      ];
      const avgs = calc.groupAvgs(calc.monthly(data));
      expect(avgs['2025-01']).toBe(15);
      expect(avgs['2025-02']).toBe(30);
    });
  });

  describe('group', () => {
    it('groups by custom function', () => {
      const data = makeDays('2025-01-01', [1, 2, 3, 4, 5, 6, 7]);
      const byWeekday = calc.group(data, (r) => {
        const day = new Date(r.date).getDay();
        return day === 0 || day === 6 ? 'weekend' : 'weekday';
      });
      expect(Object.keys(byWeekday).sort()).toEqual(['weekday', 'weekend']);
    });
  });

  describe('trend', () => {
    it('detects upward trend', () => {
      const data = makeDays('2025-01-01', [
        10, 10, 10, 10, 10, 10, 10, // week 1: avg 10
        20, 20, 20, 20, 20, 20, 20, // week 2: avg 20
      ]);
      const t = calc.trend(data, 7);
      expect(t.direction).toBe('up');
      expect(t.changePercent).toBe(100);
    });

    it('detects downward trend', () => {
      const data = makeDays('2025-01-01', [
        20, 20, 20, 20, 20, 20, 20,
        10, 10, 10, 10, 10, 10, 10,
      ]);
      const t = calc.trend(data, 7);
      expect(t.direction).toBe('down');
      expect(t.changePercent).toBe(-50);
    });

    it('returns flat for insufficient data', () => {
      const data = makeDays('2025-01-01', [10, 20, 30]);
      const t = calc.trend(data, 7);
      expect(t.direction).toBe('flat');
    });

    it('detects flat trend for stable data', () => {
      const data = makeDays('2025-01-01', [
        100, 100, 100, 100, 100, 100, 100,
        101, 100, 100, 100, 100, 100, 100,
      ]);
      const t = calc.trend(data, 7);
      expect(t.direction).toBe('flat');
    });
  });
});
