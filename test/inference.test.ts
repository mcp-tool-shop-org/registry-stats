import { describe, it, expect } from 'vitest';
import {
  forecast,
  detectAnomalies,
  segmentTrends,
  detectSeasonality,
  computeMomentum,
  generateRecommendations,
  inferPortfolio,
} from '../src/inference.js';

// ── Test data ─────────────────────────────────────────────────

// Steadily growing: ~100/day rising to ~200/day over 30 days
const growingSeries = Array.from({ length: 30 }, (_, i) => 100 + Math.round(i * 3.5 + Math.sin(i) * 10));

// Flat series: ~500/day with minor noise
const flatSeries = Array.from({ length: 30 }, (_, i) => 500 + Math.round(Math.sin(i * 0.7) * 15));

// Declining series: ~300/day falling to ~100/day
const decliningSeries = Array.from({ length: 30 }, (_, i) => 300 - Math.round(i * 7));

// Series with a spike on day 20
const spikeSeries = Array.from({ length: 30 }, (_, i) => {
  if (i === 20) return 1500; // massive spike
  return 100 + Math.round(Math.sin(i * 0.5) * 20);
});

// Very short series
const shortSeries = [10, 20, 30];

// Zero series
const zeroSeries = new Array(30).fill(0);

describe('forecast', () => {
  it('returns 7 forecast points for a valid series', () => {
    const result = forecast(growingSeries, 7);
    expect(result).toHaveLength(7);
    expect(result[0].day).toBe(1);
    expect(result[6].day).toBe(7);
  });

  it('forecast points have predicted, lower, and upper bounds', () => {
    const result = forecast(growingSeries, 7);
    for (const pt of result) {
      expect(pt.predicted).toBeGreaterThanOrEqual(0);
      expect(pt.lower).toBeLessThanOrEqual(pt.predicted);
      expect(pt.upper).toBeGreaterThanOrEqual(pt.predicted);
    }
  });

  it('predicts increasing values for a growing series', () => {
    const result = forecast(growingSeries, 7);
    // Day 7 should be higher than day 1
    expect(result[6].predicted).toBeGreaterThan(result[0].predicted);
  });

  it('returns empty array for too-short series', () => {
    expect(forecast(shortSeries, 7)).toHaveLength(0);
  });

  it('predictions are non-negative even for declining series', () => {
    const result = forecast(decliningSeries, 7);
    for (const pt of result) {
      expect(pt.predicted).toBeGreaterThanOrEqual(0);
      expect(pt.lower).toBeGreaterThanOrEqual(0);
    }
  });

  it('confidence interval widens further into the future', () => {
    const result = forecast(growingSeries, 7);
    const width1 = result[0].upper - result[0].lower;
    const width7 = result[6].upper - result[6].lower;
    expect(width7).toBeGreaterThanOrEqual(width1);
  });
});

describe('detectAnomalies', () => {
  it('detects the spike in spikeSeries', () => {
    const anomalies = detectAnomalies(spikeSeries);
    expect(anomalies.length).toBeGreaterThan(0);
    const spike = anomalies.find((a) => a.day === 20);
    expect(spike).toBeDefined();
    expect(spike!.type).toBe('spike');
    expect(spike!.zscore).toBeGreaterThan(2);
  });

  it('returns few or no anomalies for a flat series', () => {
    const anomalies = detectAnomalies(flatSeries);
    expect(anomalies.length).toBeLessThanOrEqual(1);
  });

  it('returns empty for short series', () => {
    expect(detectAnomalies(shortSeries)).toHaveLength(0);
  });

  it('anomaly values contain expected fields', () => {
    const anomalies = detectAnomalies(spikeSeries);
    for (const a of anomalies) {
      expect(a).toHaveProperty('day');
      expect(a).toHaveProperty('value');
      expect(a).toHaveProperty('expected');
      expect(a).toHaveProperty('zscore');
      expect(a).toHaveProperty('type');
      expect(['spike', 'drop']).toContain(a.type);
    }
  });
});

describe('segmentTrends', () => {
  it('identifies upward trend in growing series', () => {
    const segments = segmentTrends(growingSeries);
    expect(segments.length).toBeGreaterThan(0);
    const upSegments = segments.filter((s) => s.direction === 'up');
    expect(upSegments.length).toBeGreaterThan(0);
  });

  it('returns empty for too-short series', () => {
    expect(segmentTrends(shortSeries)).toHaveLength(0);
  });

  it('segments have valid start/end indices', () => {
    const segments = segmentTrends(growingSeries);
    for (const seg of segments) {
      expect(seg.start).toBeGreaterThanOrEqual(0);
      expect(seg.end).toBeGreaterThan(seg.start);
      expect(seg.end).toBeLessThan(growingSeries.length);
    }
  });
});

describe('detectSeasonality', () => {
  it('returns null for short series', () => {
    expect(detectSeasonality(shortSeries, 3)).toBeNull();
  });

  it('returns dayOfWeek array with 7 entries when detected', () => {
    // Create a series with strong weekly pattern
    const weeklySeries = Array.from({ length: 28 }, (_, i) => {
      const dow = i % 7;
      // Weekend dip pattern
      return dow >= 5 ? 50 : 200;
    });
    const result = detectSeasonality(weeklySeries, 28);
    if (result) {
      expect(result.dayOfWeek).toHaveLength(7);
      expect(typeof result.peakDay).toBe('string');
    }
  });

  it('returns null for zero series', () => {
    expect(detectSeasonality(zeroSeries, 30)).toBeNull();
  });
});

describe('computeMomentum', () => {
  it('returns positive momentum for growing series', () => {
    const m = computeMomentum(growingSeries);
    expect(m).toBeGreaterThan(0);
  });

  it('returns negative momentum for declining series', () => {
    const m = computeMomentum(decliningSeries);
    expect(m).toBeLessThan(0);
  });

  it('returns 0 for too-short series', () => {
    expect(computeMomentum(shortSeries)).toBe(0);
  });

  it('stays within -100 to +100 range', () => {
    const values = [
      computeMomentum(growingSeries),
      computeMomentum(decliningSeries),
      computeMomentum(flatSeries),
      computeMomentum(spikeSeries),
    ];
    for (const v of values) {
      expect(v).toBeGreaterThanOrEqual(-100);
      expect(v).toBeLessThanOrEqual(100);
    }
  });
});

describe('generateRecommendations', () => {
  it('generates concentration risk recommendation for high gini', () => {
    const packages = [
      { name: 'a', registry: 'npm', forecast7: [], anomalies: [], trendSegments: [], seasonality: null, momentum: 50 },
    ];
    const recs = generateRecommendations(packages, { gini: 0.85 });
    const concRec = recs.find((r) => r.type === 'risk' && r.title.includes('concentration'));
    expect(concRec).toBeDefined();
  });

  it('generates npm dependency recommendation when npm > 75%', () => {
    const packages = [
      { name: 'a', registry: 'npm', forecast7: [], anomalies: [], trendSegments: [], seasonality: null, momentum: 50 },
    ];
    const recs = generateRecommendations(packages, { npmPct: 90 });
    const npmRec = recs.find((r) => r.title.includes('npm'));
    expect(npmRec).toBeDefined();
  });

  it('generates attention recommendation for declining packages', () => {
    const packages = [
      { name: 'declining-pkg', registry: 'npm', forecast7: [], anomalies: [], trendSegments: [], seasonality: null, momentum: -50 },
    ];
    const recs = generateRecommendations(packages);
    const attRec = recs.find((r) => r.type === 'attention');
    expect(attRec).toBeDefined();
    expect(attRec!.detail).toContain('declining-pkg');
  });

  it('returns sorted by priority (high first)', () => {
    const packages = [
      { name: 'a', registry: 'npm', forecast7: [], anomalies: [], trendSegments: [], seasonality: null, momentum: -70 },
    ];
    const recs = generateRecommendations(packages, { gini: 0.9, npmPct: 95 });
    if (recs.length >= 2) {
      const priorities = recs.map((r) => r.priority);
      const order = { high: 0, medium: 1, low: 2 };
      for (let i = 1; i < priorities.length; i++) {
        expect(order[priorities[i]]).toBeGreaterThanOrEqual(order[priorities[i - 1]]);
      }
    }
  });
});

describe('inferPortfolio', () => {
  it('processes a leaderboard and returns portfolio inference', () => {
    const leaderboard = [
      { name: 'pkg-a', registry: 'npm', week: 1000, range30: growingSeries, trendPct: 15 },
      { name: 'pkg-b', registry: 'npm', week: 500, range30: flatSeries, trendPct: 0 },
      { name: 'pkg-c', registry: 'pypi', week: 200, range30: null, trendPct: null },
    ];

    const result = inferPortfolio(leaderboard, { gini: 0.6, npmPct: 85 });

    expect(result.packages).toHaveLength(3);
    expect(result.forecastTotal7).toHaveLength(7);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.portfolioMomentum).toBeGreaterThanOrEqual(-100);
    expect(result.portfolioMomentum).toBeLessThanOrEqual(100);
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  it('package with range30 gets forecasts and anomalies', () => {
    const leaderboard = [
      { name: 'has-data', registry: 'npm', week: 1000, range30: spikeSeries, trendPct: 5 },
    ];

    const result = inferPortfolio(leaderboard);
    const pkg = result.packages[0];
    expect(pkg.forecast7.length).toBe(7);
    expect(pkg.anomalies.length).toBeGreaterThan(0);
    expect(pkg.momentum).toBeDefined();
  });

  it('package without range30 gets empty analysis', () => {
    const leaderboard = [
      { name: 'no-data', registry: 'vscode', week: 100, range30: null, trendPct: null },
    ];

    const result = inferPortfolio(leaderboard);
    const pkg = result.packages[0];
    expect(pkg.forecast7).toHaveLength(0);
    expect(pkg.anomalies).toHaveLength(0);
    expect(pkg.momentum).toBe(0);
  });

  it('forecastTotal7 sums individual package forecasts', () => {
    const leaderboard = [
      { name: 'a', registry: 'npm', week: 500, range30: growingSeries, trendPct: 10 },
      { name: 'b', registry: 'npm', week: 300, range30: flatSeries, trendPct: 0 },
    ];

    const result = inferPortfolio(leaderboard);
    // Each day's aggregate should be > 0 since both packages have data
    for (const v of result.forecastTotal7) {
      expect(v).toBeGreaterThan(0);
    }
  });
});
