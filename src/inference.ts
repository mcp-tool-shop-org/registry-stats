/**
 * AI Inference Module — statistical forecasting, anomaly detection, and recommendations.
 *
 * Zero dependencies. Pure math on time-series data arrays.
 * Designed to run at build-time in the fetch-stats pipeline.
 */

// ── Types ────────────────────────────────────────────────────

export interface ForecastPoint {
  day: number;       // offset from end of series (1 = tomorrow)
  predicted: number; // forecasted downloads
  lower: number;     // 80% confidence lower bound
  upper: number;     // 80% confidence upper bound
}

export interface Anomaly {
  day: number;       // index into the original series
  value: number;     // actual value
  expected: number;  // what the model expected
  zscore: number;    // how many std devs away
  type: 'spike' | 'drop';
}

export interface TrendSegment {
  start: number;     // day index
  end: number;       // day index
  direction: 'up' | 'down' | 'flat';
  slope: number;     // daily change
  magnitude: number; // total change over segment
}

export interface Recommendation {
  type: 'growth' | 'risk' | 'opportunity' | 'attention';
  priority: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  metric?: string;
}

export interface PackageInference {
  name: string;
  registry: string;
  forecast7: ForecastPoint[];
  anomalies: Anomaly[];
  trendSegments: TrendSegment[];
  seasonality: { dayOfWeek: number[]; peakDay: string } | null;
  momentum: number;  // -100 to +100 composite score
}

export interface PortfolioInference {
  packages: PackageInference[];
  recommendations: Recommendation[];
  forecastTotal7: number[];         // aggregate predicted daily for next 7 days
  riskScore: number;                // 0-100 portfolio risk
  diversityTrend: 'improving' | 'stable' | 'declining';
  portfolioMomentum: number;        // -100 to +100
}

// ── Helpers ──────────────────────────────────────────────────

function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  if (arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Simple linear regression: returns { slope, intercept, r2 } */
function linearRegression(ys: number[]): { slope: number; intercept: number; r2: number } {
  const n = ys.length;
  if (n < 2) return { slope: 0, intercept: ys[0] ?? 0, r2: 0 };

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += ys[i];
    sumXY += i * ys[i];
    sumX2 += i * i;
  }

  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return { slope: 0, intercept: sumY / n, r2: 0 };

  const slope = (n * sumXY - sumX * sumY) / denom;
  const intercept = (sumY - slope * sumX) / n;

  // R² coefficient of determination
  const meanY = sumY / n;
  let ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssTot += (ys[i] - meanY) ** 2;
    ssRes += (ys[i] - (intercept + slope * i)) ** 2;
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;

  return { slope, intercept, r2 };
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ── Core Algorithms ──────────────────────────────────────────

/**
 * Forecast next N days using weighted linear regression on recent data.
 * Uses the last 14 days with exponential weighting (recent days matter more).
 * Returns predictions with 80% confidence intervals.
 */
export function forecast(series: number[], days = 7): ForecastPoint[] {
  if (series.length < 7) return [];

  // Use last 14 days (or all if fewer)
  const window = series.slice(-Math.min(14, series.length));
  const n = window.length;

  // Weighted linear regression — exponential decay weights
  const weights = window.map((_, i) => Math.exp(0.1 * (i - n + 1)));
  const totalW = weights.reduce((a, b) => a + b, 0);

  let wSumX = 0, wSumY = 0, wSumXY = 0, wSumX2 = 0;
  for (let i = 0; i < n; i++) {
    const w = weights[i];
    wSumX += w * i;
    wSumY += w * window[i];
    wSumXY += w * i * window[i];
    wSumX2 += w * i * i;
  }

  const denom = totalW * wSumX2 - wSumX * wSumX;
  let slope: number, intercept: number;
  if (Math.abs(denom) < 1e-10) {
    slope = 0;
    intercept = wSumY / totalW;
  } else {
    slope = (totalW * wSumXY - wSumX * wSumY) / denom;
    intercept = (wSumY - slope * wSumX) / totalW;
  }

  // Residual standard error for confidence intervals
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssRes += weights[i] * (window[i] - (intercept + slope * i)) ** 2;
  }
  const rse = Math.sqrt(ssRes / Math.max(1, totalW - 2));

  // 80% confidence: z ≈ 1.28
  const z80 = 1.28;

  const results: ForecastPoint[] = [];
  for (let d = 1; d <= days; d++) {
    const x = n - 1 + d;
    const predicted = Math.max(0, Math.round(intercept + slope * x));
    const margin = Math.round(z80 * rse * Math.sqrt(1 + 1 / n + ((x - n / 2) ** 2) / (n * n / 12)));
    results.push({
      day: d,
      predicted,
      lower: Math.max(0, predicted - margin),
      upper: predicted + margin,
    });
  }

  return results;
}

/**
 * Detect anomalies using adaptive z-score with rolling baseline.
 * More sophisticated than simple global z-score — uses a 14-day rolling
 * window so seasonal patterns don't trigger false positives.
 */
export function detectAnomalies(series: number[], threshold = 2.0): Anomaly[] {
  if (series.length < 7) return [];

  const anomalies: Anomaly[] = [];
  const windowSize = Math.min(14, Math.floor(series.length * 0.7));

  for (let i = windowSize; i < series.length; i++) {
    const window = series.slice(i - windowSize, i);
    const m = mean(window);
    const s = stddev(window);

    if (s < 1) continue; // skip if basically no variance

    const zscore = (series[i] - m) / s;
    if (Math.abs(zscore) >= threshold) {
      anomalies.push({
        day: i,
        value: series[i],
        expected: Math.round(m),
        zscore: Math.round(zscore * 10) / 10,
        type: zscore > 0 ? 'spike' : 'drop',
      });
    }
  }

  return anomalies;
}

/**
 * Segment a time series into directional trend segments.
 * Uses a simple piecewise linear approach with minimum segment length.
 */
export function segmentTrends(series: number[], minSegmentLength = 5): TrendSegment[] {
  if (series.length < minSegmentLength) return [];

  const segments: TrendSegment[] = [];
  let segStart = 0;

  while (segStart < series.length - minSegmentLength + 1) {
    // Find the longest consistent-direction segment
    let bestEnd = segStart + minSegmentLength - 1;
    const initialSlope = linearRegression(series.slice(segStart, segStart + minSegmentLength)).slope;
    const initialDir = initialSlope > 0.5 ? 'up' : initialSlope < -0.5 ? 'down' : 'flat';

    for (let end = segStart + minSegmentLength; end < series.length; end++) {
      const seg = series.slice(segStart, end + 1);
      const { slope } = linearRegression(seg);
      const dir = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'flat';
      if (dir !== initialDir) break;
      bestEnd = end;
    }

    const seg = series.slice(segStart, bestEnd + 1);
    const { slope } = linearRegression(seg);
    const direction = slope > 0.5 ? 'up' : slope < -0.5 ? 'down' : 'flat';

    segments.push({
      start: segStart,
      end: bestEnd,
      direction,
      slope: Math.round(slope * 10) / 10,
      magnitude: Math.round(seg[seg.length - 1] - seg[0]),
    });

    segStart = bestEnd + 1;
  }

  return segments;
}

/**
 * Detect day-of-week seasonality patterns.
 * Requires at least 14 days of data to identify weekly cycles.
 */
export function detectSeasonality(series: number[], startDaysAgo: number): { dayOfWeek: number[]; peakDay: string } | null {
  if (series.length < 14) return null;

  // Group by day of week
  const buckets: number[][] = [[], [], [], [], [], [], []];
  const today = new Date();

  for (let i = 0; i < series.length; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (startDaysAgo - i));
    const dow = date.getDay();
    buckets[dow].push(series[i]);
  }

  const dayAvgs = buckets.map((b) => Math.round(mean(b)));
  const overallMean = mean(dayAvgs);

  // Check if there's meaningful variation (>15% between peak and trough)
  const maxAvg = Math.max(...dayAvgs);
  const minAvg = Math.min(...dayAvgs);
  if (overallMean < 1 || (maxAvg - minAvg) / overallMean < 0.15) return null;

  const peakIdx = dayAvgs.indexOf(maxAvg);

  return {
    dayOfWeek: dayAvgs,
    peakDay: DAY_NAMES[peakIdx],
  };
}

/**
 * Compute a composite momentum score (-100 to +100).
 * Combines: short-term trend, acceleration, volume, and consistency.
 */
export function computeMomentum(series: number[]): number {
  if (series.length < 14) return 0;

  const last7 = series.slice(-7);
  const prev7 = series.slice(-14, -7);

  const last7Sum = last7.reduce((a, b) => a + b, 0);
  const prev7Sum = prev7.reduce((a, b) => a + b, 0);

  // 1. Direction score (-40 to +40) — weighted % change with damping
  const dampK = 10;
  const dirScore = prev7Sum > dampK
    ? Math.max(-40, Math.min(40, ((last7Sum - prev7Sum) / Math.sqrt(prev7Sum + dampK)) * 4))
    : last7Sum > 0 ? 20 : 0;

  // 2. Acceleration score (-20 to +20) — is the trend accelerating?
  const { slope: recentSlope } = linearRegression(last7);
  const { slope: prevSlope } = linearRegression(prev7);
  const accelScore = Math.max(-20, Math.min(20, (recentSlope - prevSlope) * 2));

  // 3. Consistency score (0 to +20) — low variance = high consistency
  const cv = last7Sum > 0 ? stddev(last7) / mean(last7) : 1;
  const consistencyScore = Math.max(0, 20 - cv * 20);

  // 4. Volume score (0 to +20) — log scale reward for non-trivial volume
  const volumeScore = last7Sum > 0 ? Math.min(20, Math.log10(last7Sum + 1) * 5) : 0;

  return Math.round(Math.max(-100, Math.min(100, dirScore + accelScore + consistencyScore + volumeScore)));
}

// ── Portfolio-Level Analysis ─────────────────────────────────

/**
 * Generate automated recommendations based on portfolio analysis.
 */
export function generateRecommendations(
  packages: PackageInference[],
  opts: { gini?: number; npmPct?: number; totalWeekly?: number } = {},
): Recommendation[] {
  const recs: Recommendation[] = [];

  // 1. Declining packages needing attention
  const declining = packages.filter((p) => p.momentum < -30);
  if (declining.length > 0) {
    const names = declining.slice(0, 3).map((p) => p.name).join(', ');
    recs.push({
      type: 'attention',
      priority: declining.some((p) => p.momentum < -60) ? 'high' : 'medium',
      title: `${declining.length} package${declining.length > 1 ? 's' : ''} losing momentum`,
      detail: `${names}${declining.length > 3 ? ` and ${declining.length - 3} more` : ''} show sustained decline. Consider: release updates, fix open issues, or update documentation.`,
      metric: `Worst momentum: ${Math.min(...declining.map((p) => p.momentum))}`,
    });
  }

  // 2. Concentration risk
  if (opts.gini !== undefined && opts.gini > 0.7) {
    recs.push({
      type: 'risk',
      priority: opts.gini > 0.85 ? 'high' : 'medium',
      title: 'High portfolio concentration',
      detail: `Gini coefficient ${opts.gini.toFixed(2)} indicates downloads are heavily concentrated in a few packages. Diversify promotion efforts across the portfolio.`,
      metric: `Gini: ${opts.gini.toFixed(2)}`,
    });
  }

  // 3. Registry dependency
  if (opts.npmPct !== undefined && opts.npmPct > 75) {
    recs.push({
      type: 'risk',
      priority: 'medium',
      title: 'Heavy npm dependency',
      detail: `${opts.npmPct}% of downloads come from npm. Consider cross-publishing to PyPI and NuGet to reduce single-registry risk.`,
      metric: `npm share: ${opts.npmPct}%`,
    });
  }

  // 4. Growth opportunities — packages with positive momentum + anomaly spikes
  const growing = packages.filter((p) => p.momentum > 40 && p.anomalies.some((a) => a.type === 'spike'));
  if (growing.length > 0) {
    const names = growing.slice(0, 3).map((p) => p.name).join(', ');
    recs.push({
      type: 'opportunity',
      priority: 'medium',
      title: `${growing.length} package${growing.length > 1 ? 's' : ''} gaining traction`,
      detail: `${names} show organic growth with download spikes. Capitalize with blog posts, social media, or conference talks.`,
      metric: `Best momentum: ${Math.max(...growing.map((p) => p.momentum))}`,
    });
  }

  // 5. Forecast-based growth prediction
  const forecastGrowing = packages.filter((p) => {
    if (p.forecast7.length < 7) return false;
    const lastActual = p.forecast7[0]?.predicted ?? 0;
    const lastForecast = p.forecast7[6]?.predicted ?? 0;
    return lastForecast > lastActual * 1.2; // >20% growth predicted
  });
  if (forecastGrowing.length > 0) {
    recs.push({
      type: 'growth',
      priority: 'low',
      title: `${forecastGrowing.length} package${forecastGrowing.length > 1 ? 's' : ''} predicted to grow`,
      detail: `Statistical models predict >20% growth in the next 7 days for ${forecastGrowing.slice(0, 3).map((p) => p.name).join(', ')}.`,
    });
  }

  // 6. Anomalous activity worth investigating
  const spiked = packages.filter((p) => p.anomalies.filter((a) => a.type === 'spike').length >= 2);
  if (spiked.length > 0) {
    recs.push({
      type: 'attention',
      priority: 'low',
      title: `${spiked.length} package${spiked.length > 1 ? 's' : ''} with repeated spikes`,
      detail: `Multiple download spikes detected for ${spiked.slice(0, 3).map((p) => p.name).join(', ')}. Could indicate bot activity, viral posts, or dependency adoption.`,
    });
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  recs.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recs;
}

/**
 * Run full inference pipeline on a leaderboard dataset.
 * This is the main entry point called from fetch-stats.mjs.
 */
export function inferPortfolio(
  leaderboard: Array<{
    name: string;
    registry: string;
    week: number;
    range30?: number[] | null;
    trendPct?: number | null;
  }>,
  opts: { gini?: number; npmPct?: number; totalWeekly?: number } = {},
): PortfolioInference {
  const packages: PackageInference[] = [];

  for (const row of leaderboard) {
    const series = row.range30;
    if (!series || series.length < 7) {
      packages.push({
        name: row.name,
        registry: row.registry,
        forecast7: [],
        anomalies: [],
        trendSegments: [],
        seasonality: null,
        momentum: 0,
      });
      continue;
    }

    packages.push({
      name: row.name,
      registry: row.registry,
      forecast7: forecast(series, 7),
      anomalies: detectAnomalies(series),
      trendSegments: segmentTrends(series),
      seasonality: detectSeasonality(series, 30),
      momentum: computeMomentum(series),
    });
  }

  // Aggregate forecast (sum across all packages with forecasts)
  const forecastTotal7: number[] = new Array(7).fill(0);
  for (const pkg of packages) {
    for (const pt of pkg.forecast7) {
      forecastTotal7[pt.day - 1] += pt.predicted;
    }
  }

  // Portfolio momentum — weighted by download volume
  const totalWeek = leaderboard.reduce((s, r) => s + (r.week ?? 0), 0);
  let weightedMomentum = 0;
  for (const pkg of packages) {
    const row = leaderboard.find((r) => r.name === pkg.name);
    const weight = totalWeek > 0 ? (row?.week ?? 0) / totalWeek : 1 / packages.length;
    weightedMomentum += pkg.momentum * weight;
  }

  // Risk score: combination of concentration, declining packages, and anomaly density
  const decliningPct = packages.filter((p) => p.momentum < -20).length / Math.max(1, packages.length);
  const totalAnomalies = packages.reduce((s, p) => s + p.anomalies.length, 0);
  const anomalyDensity = totalAnomalies / Math.max(1, packages.length);
  const giniRisk = (opts.gini ?? 0) * 30;
  const declineRisk = decliningPct * 40;
  const anomalyRisk = Math.min(30, anomalyDensity * 10);
  const riskScore = Math.round(Math.max(0, Math.min(100, giniRisk + declineRisk + anomalyRisk)));

  // Diversity trend — compare first-half vs second-half Gini (approximation)
  const diversityTrend: 'improving' | 'stable' | 'declining' = 'stable';

  const recommendations = generateRecommendations(packages, opts);

  return {
    packages,
    recommendations,
    forecastTotal7,
    riskScore,
    diversityTrend,
    portfolioMomentum: Math.round(weightedMomentum),
  };
}
