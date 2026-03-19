import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: '@mcptoolshop/registry-stats',
  description: 'Multi-registry download stats — AI-powered dashboard, engine, and desktop app for npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub',
  logoBadge: 'RS',
  brandName: 'registry-stats',
  repoUrl: 'https://github.com/mcp-tool-shop-org/registry-stats',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/registry-stats',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Zero dependencies · Node 18+',
    headline: 'Five registries,',
    headlineAccent: 'one AI-powered platform.',
    description: 'Engine, Pulse AI co-pilot with voice output, seven interactive charts with zoom/pan, AI inference (health scores, forecasts, actionable advice), smart growth engine, and desktop app — all from one repo. Query npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub through a single CLI, API, or live dashboard.',
    primaryCta: { href: '/registry-stats/dashboard/', label: 'Open dashboard' },
    secondaryCta: { href: 'handbook/', label: 'Read the Handbook' },
    previews: [
      { label: 'Install', code: 'npm install @mcptoolshop/registry-stats' },
      { label: 'Query', code: "await stats('npm', 'express')" },
      { label: 'Dashboard', code: 'https://...github.io/registry-stats/dashboard/' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'platform',
      title: 'The platform',
      subtitle: 'Three layers, one repo.',
      features: [
        { title: 'Engine', desc: 'TypeScript library + CLI + REST server. Published to npm. Zero dependencies, native fetch().' },
        { title: 'Pulse AI Co-pilot', desc: 'Conversational AI with voice output (4 voices, auto-speak), fullscreen mode, GitHub org data connector, streaming responses, and model selector. Powered by Ollama.' },
        { title: 'Dashboard', desc: 'Tabbed Astro app with seven interactive Chart.js visualizations (zoom/pan, click-to-drill-down), AI inference panel, export reports (PDF / JSONL / Markdown), and built-in help guide.' },
        { title: 'Desktop', desc: 'WinUI 3 + WebView2 native Windows app. Offline-capable, live stats refresh, CSV export.' },
        { title: 'Five registries', desc: 'npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub — all through one interface.' },
        { title: 'Smart Growth', desc: 'Baseline threshold, percentage cap, and damped velocity formula eliminate misleading percentages from small-denominator distortion.' },
        { title: 'AI Inference', desc: 'Zero-dependency, pure-math pipeline: 7-day forecasts, anomaly detection, momentum scoring, package health grades (A-F), actionable advice with severity/urgency, and yearly progress tracking.' },
        { title: 'Velocity Tracker', desc: 'Damped growth metric with sparkline visualizations and spike detection (>2σ) on a 30-day heatmap.' },
        { title: 'Bulk & comparison', desc: 'Fetch multiple packages at once or compare the same package across registries.' },
        { title: 'Export formats', desc: 'Output as CSV, Chart.js-compatible JSON, or raw data for your own dashboards.' },
        { title: 'Retry & caching', desc: 'Automatic retry with exponential backoff. 5-minute TTL cache, pluggable for Redis.' },
      ],
    },
    {
      kind: 'data-table',
      id: 'registries',
      title: 'Supported registries',
      subtitle: 'Package formats and available data from each source.',
      columns: ['Registry', 'Package format', 'Time series', 'Data available'],
      rows: [
        ['npm', 'express, @scope/pkg', 'Yes (549 days)', 'lastDay, lastWeek, lastMonth'],
        ['pypi', 'requests', 'Yes (180 days)', 'lastDay, lastWeek, lastMonth, total'],
        ['nuget', 'Newtonsoft.Json', 'No', 'total'],
        ['vscode', 'publisher.extension', 'No', 'total (installs), rating, trends'],
        ['docker', 'namespace/repo', 'No', 'total (pulls), stars'],
      ],
    },
    {
      kind: 'code-cards',
      id: 'usage',
      title: 'Usage',
      cards: [
        { title: 'Install', code: 'npm install @mcptoolshop/registry-stats' },
        {
          title: 'Single registry',
          code: `import { stats } from '@mcptoolshop/registry-stats';

const npm = await stats('npm', 'express');
// → { registry, package, downloads }`,
        },
        {
          title: 'All registries at once',
          code: `const results = await stats.all('express');
// Promise.allSettled style — never throws`,
        },
        {
          title: 'Time series + trend',
          code: `import { stats, calc } from '@mcptoolshop/registry-stats';

const daily = await stats.range(
  'npm', 'express', '2025-01-01', '2025-06-30'
);
const trend = calc.trend(daily);
// → { direction: 'up', changePercent: 8.3 }`,
        },
        {
          title: 'Compare across registries',
          code: `const cmp = await stats.compare('express');
// → { package, registries: { npm, pypi, ... } }`,
        },
        {
          title: 'CLI',
          code: `registry-stats express -r npm
registry-stats express --compare
registry-stats serve --port 3000`,
        },
      ],
    },
    {
      kind: 'api',
      id: 'api',
      title: 'API reference',
      subtitle: 'Core functions and utilities.',
      apis: [
        { signature: 'stats(registry, package, options?)', description: 'Fetch stats from a single registry. Returns PackageStats | null.' },
        { signature: 'stats.all(package)', description: 'Query all registries at once. Uses Promise.allSettled — never throws.' },
        { signature: 'stats.bulk(registry, packages)', description: 'Fetch stats for multiple packages from one registry, concurrency-limited.' },
        { signature: 'stats.range(registry, package, start, end)', description: 'Fetch daily download counts (npm + PyPI only).' },
        { signature: 'stats.compare(package, registries?)', description: 'Compare the same package across multiple registries side-by-side.' },
        { signature: 'calc.trend(daily)', description: 'Detect trend direction and percent change from daily download data.' },
        { signature: 'calc.monthly(daily) / calc.yearly(daily)', description: 'Group daily data into monthly or yearly buckets.' },
        { signature: 'calc.toCSV(daily) / calc.toChartData(daily)', description: 'Export time-series data as CSV or Chart.js-compatible JSON.' },
        { signature: 'forecast(series, days)', description: 'Weighted linear regression with 80% confidence intervals that widen over time.' },
        { signature: 'detectAnomalies(series)', description: 'Adaptive rolling z-score (14-day window). Detects spikes and drops.' },
        { signature: 'computeHealthScore(name, reg, series, momentum)', description: 'Composite 0-100 score with A-F grade (activity + consistency + growth + stability).' },
        { signature: 'generateActionableAdvice(healthScores, portfolio)', description: 'Severity-tagged advice cards with urgency levels and specific action steps.' },
        { signature: 'inferPortfolio(leaderboard, metrics)', description: 'Full portfolio analysis: forecasts, risk, momentum, health scores, and advice.' },
        { signature: 'createHandler() / serve(options?)', description: 'REST API server — use createHandler() for serverless or serve() for standalone.' },
      ],
    },
  ],
};
