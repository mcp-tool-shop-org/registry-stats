import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: '@mcptoolshop/registry-stats',
  description: 'Multi-registry download stats for npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub',
  logoBadge: 'RS',
  brandName: 'registry-stats',
  repoUrl: 'https://github.com/mcp-tool-shop-org/registry-stats',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/registry-stats',
  footerText: 'MIT Licensed — built by <a href="https://mcp-tool-shop.github.io/" style="color:var(--color-muted);text-decoration:underline">MCP Tool Shop</a>',

  hero: {
    badge: 'Zero dependencies · Node 18+',
    headline: 'Five registries,',
    headlineAccent: 'one API.',
    description: 'Fetch download stats from npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub with a single interface. CLI, programmatic API, and REST server included.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: '#api', label: 'API reference' },
    previews: [
      { label: 'Install', code: 'npm install @mcptoolshop/registry-stats' },
      { label: 'Query', code: "await stats('npm', 'express')" },
      { label: 'Compare', code: "await stats.compare('express')" },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle: 'Everything you need to track downloads across registries.',
      features: [
        { title: 'Five registries', desc: 'npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub — all through one interface.' },
        { title: 'Time series', desc: 'Daily download history for npm (549 days) and PyPI (180 days) with trend detection.' },
        { title: 'Zero dependencies', desc: 'Uses native fetch() on Node 18+. No bloat, no supply-chain risk.' },
        { title: 'CLI + API + REST', desc: 'Use as a command-line tool, import as a library, or run as an HTTP microservice.' },
        { title: 'Calc utilities', desc: 'Built-in totals, averages, monthly grouping, trends, moving averages, and popularity scores.' },
        { title: 'Bulk & comparison', desc: 'Fetch multiple packages at once or compare the same package across registries.' },
        { title: 'Export formats', desc: 'Output as CSV, Chart.js-compatible JSON, or raw data for your dashboards.' },
        { title: 'Built-in caching', desc: '5-minute TTL cache out of the box. Pluggable interface for Redis or file backends.' },
        { title: 'Retry & backoff', desc: 'Automatic retry with exponential backoff on 429/5xx. Respects Retry-After headers.' },
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
        { signature: 'createHandler() / serve(options?)', description: 'REST API server — use createHandler() for serverless or serve() for standalone.' },
      ],
    },
  ],
};
