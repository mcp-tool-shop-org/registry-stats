import type { SiteConfig } from '@mcptoolshop/site-theme';

export const config: SiteConfig = {
  title: '@mcptoolshop/registry-stats',
  description:
    'Multi-registry download stats for npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub. Zero dependencies \u2014 native fetch() (Node 18+).',
  logoBadge: 'RS',
  brandName: 'registry-stats',
  repoUrl: 'https://github.com/mcp-tool-shop-org/registry-stats',
  npmUrl: 'https://www.npmjs.com/package/@mcptoolshop/registry-stats',
  footerText: 'MIT Licensed &bull; Built for Node 18+ (native fetch)',

  hero: {
    badge: 'Zero dependencies &bull; Native fetch() &bull; Node 18+',
    headline: 'Multi-registry download stats,',
    headlineAccent: 'in one API.',
    description:
      '<code class="rounded bg-zinc-900 px-2 py-1 text-zinc-100">@mcptoolshop/registry-stats</code> fetches package stats across npm, PyPI, NuGet, VS Code Marketplace, and Docker Hub. Includes time-series support (npm + PyPI) and helper utilities for trends and rollups.',
    primaryCta: { href: '#usage', label: 'Get started' },
    secondaryCta: { href: '#api', label: 'Read the API' },
    previews: [
      { label: 'One call, one registry', code: "await stats('npm', 'express')" },
      { label: 'Never-throw "all registries"', code: "await stats.all('express')" },
      { label: 'Time series + calculations', code: 'calc.trend(daily)' },
    ],
  },

  sections: [
    {
      kind: 'features',
      id: 'features',
      title: 'Features',
      subtitle:
        'A small library that stays out of your way: fetch stats, normalize output, do simple analytics.',
      features: [
        { title: 'Multi-registry support', desc: 'npm, PyPI, NuGet, VS Code Marketplace, Docker Hub.' },
        { title: 'Zero dependencies', desc: 'Uses native fetch() on Node 18+.' },
        { title: 'Time series (where available)', desc: 'Daily downloads via range() for npm + PyPI.' },
        { title: 'Comparison mode', desc: 'Compare the same package across registries side-by-side.' },
        { title: 'Export formats', desc: 'CSV, Chart.js-compatible JSON, or raw data \u2014 your choice.' },
        {
          title: 'REST API server',
          desc: 'Built-in HTTP server with createHandler() for microservices or serverless.',
        },
        { title: 'Bulk helpers', desc: 'Fetch multiple packages per registry with concurrency-limited bulk().' },
        {
          title: 'Never-throw all()',
          desc: "Promise.allSettled style aggregation that won't crash your pipeline.",
        },
        {
          title: 'calc utilities',
          desc: 'Totals, averages, monthly/yearly grouping, trends, moving averages, popularity scores.',
        },
      ],
    },
    {
      kind: 'data-table',
      id: 'registries',
      title: 'Supported registries',
      subtitle: 'Package formats and the kinds of data you can expect from each source.',
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
      title: 'Install & usage',
      cards: [
        { title: 'Install', code: 'npm install @mcptoolshop/registry-stats' },
        {
          title: 'Single registry',
          code: "import &#123; stats &#125; from '@mcptoolshop/registry-stats';\n\nconst npm = await stats('npm', 'express');\n// &#x2192; &#123; registry, package, downloads &#125;",
        },
        {
          title: 'All registries at once',
          code: "import &#123; stats &#125; from '@mcptoolshop/registry-stats';\n\nconst results = await stats.all('express');\n// Promise.allSettled style &#x2014; never throws",
        },
        {
          title: 'Time series + calc',
          code: "import &#123; stats, calc &#125; from '@mcptoolshop/registry-stats';\n\nconst daily = await stats.range(\n  'npm', 'express', '2025-01-01', '2025-06-30'\n);\nconst trend = calc.trend(daily);\nconst monthly = calc.groupTotals(calc.monthly(daily));",
        },
        {
          title: 'Compare across registries',
          code: "import &#123; stats &#125; from '@mcptoolshop/registry-stats';\n\nconst comparison = await stats.compare('express');\n// &#x2192; &#123; package, registries: &#123; npm, pypi, ... &#125; &#125;",
        },
        {
          title: 'CLI',
          code: 'registry-stats express -r npm\nregistry-stats express --compare\nregistry-stats serve --port 3000',
        },
      ],
    },
    {
      kind: 'api',
      id: 'api',
      title: 'API',
      apis: [
        {
          signature: 'stats(registry, package, options?)',
          description: 'Fetch stats from a single registry. Returns <code>PackageStats | null</code>.',
        },
        {
          signature: 'stats.all(package)',
          description: 'Query all registries. Returns results for any that have the package; never throws.',
        },
        {
          signature: 'stats.bulk(registry, packages)',
          description:
            'Fetch stats for multiple packages from one registry. Concurrency-limited (default: 5).',
        },
        {
          signature: 'stats.range(registry, package, start, end)',
          description:
            'Fetch daily download counts. Only <code>npm</code> and <code>pypi</code> support this.',
        },
        {
          signature: 'stats.compare(package, registries?)',
          description: 'Compare stats for the same package across multiple registries side-by-side.',
        },
        {
          signature: 'createHandler() / serve(options?)',
          description:
            'REST API server. Use <code>createHandler()</code> for serverless or <code>serve()</code> for a quick HTTP server.',
        },
        {
          signature: 'calc',
          description:
            'Utilities for <code>DailyDownloads[]</code>: total, avg, monthly/yearly grouping, group totals/avgs, trend detection, moving averages, popularity scores, toCSV, toChartData.',
        },
      ],
    },
  ],
};
