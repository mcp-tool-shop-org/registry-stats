import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { stats, createCache, calc } from './index.js';
import { serve } from './server.js';
import { loadConfig, starterConfig } from './config.js';
import type { PackageStats, StatsOptions, Config, ComparisonResult } from './types.js';

function usage() {
  console.log(`
Usage: registry-stats [package] [options]
       registry-stats serve [--port 3000]

  If no package is given, reads from registry-stats.config.json.

Options:
  --registry, -r  Registry to query (npm, pypi, nuget, vscode, docker)
                  Omit to query all registries
  --mine          Discover and show stats for all npm packages by a maintainer
                  e.g. registry-stats --mine mikefrilot
  --range         Date range for time series (e.g. 2025-01-01:2025-06-30)
                  Only npm and pypi support this
  --compare       Compare package across registries side-by-side
  --format        Output format: table (default), json, csv, chart
  --init          Create a starter registry-stats.config.json
  --help, -h      Show this help

Subcommands:
  serve           Start a REST API server
    --port        Port to listen on (default: 3000)

Examples:
  registry-stats express
  registry-stats express -r npm
  registry-stats express --compare
  registry-stats --mine mikefrilot
  registry-stats --mine mikefrilot --format json
  registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
  registry-stats serve --port 8080
  registry-stats --init
  registry-stats                   # fetches all packages from config
`);
}

function formatNumber(n: number | undefined): string {
  if (n === undefined) return '-';
  return n.toLocaleString('en-US');
}

function printStats(s: PackageStats) {
  const d = s.downloads;
  const parts = [
    `  ${s.registry.padEnd(7)} | ${s.package}`,
  ];

  const metrics: string[] = [];
  if (d.total !== undefined) metrics.push(`total: ${formatNumber(d.total)}`);
  if (d.lastMonth !== undefined) metrics.push(`month: ${formatNumber(d.lastMonth)}`);
  if (d.lastWeek !== undefined) metrics.push(`week: ${formatNumber(d.lastWeek)}`);
  if (d.lastDay !== undefined) metrics.push(`day: ${formatNumber(d.lastDay)}`);

  if (metrics.length > 0) {
    parts.push(`           ${metrics.join('  ')}`);
  }

  if (s.extra) {
    const extras: string[] = [];
    if (s.extra.stars !== undefined) extras.push(`stars: ${formatNumber(s.extra.stars as number)}`);
    if (s.extra.rating !== undefined) extras.push(`rating: ${(s.extra.rating as number).toFixed(1)}`);
    if (s.extra.version !== undefined) extras.push(`v${s.extra.version}`);
    if (extras.length > 0) {
      parts.push(`           ${extras.join('  ')}`);
    }
  }

  console.log(parts.join('\n'));
}

function printComparison(result: ComparisonResult) {
  const regs = Object.entries(result.registries);
  if (regs.length === 0) {
    console.error(`Package "${result.package}" not found on any registry`);
    process.exit(1);
  }

  console.log(`\n  ${result.package} — comparison\n`);

  // Header
  const cols = regs.map(([r]) => r.padEnd(12));
  console.log(`  ${'Metric'.padEnd(14)}${cols.join('')}`);
  console.log(`  ${'─'.repeat(14 + cols.length * 12)}`);

  // Rows
  const metrics = ['total', 'lastMonth', 'lastWeek', 'lastDay'] as const;
  const labels: Record<string, string> = {
    total: 'Total',
    lastMonth: 'Month',
    lastWeek: 'Week',
    lastDay: 'Day',
  };

  for (const m of metrics) {
    const values = regs.map(([, s]) => {
      const v = s.downloads[m];
      return (v !== undefined ? formatNumber(v) : '-').padEnd(12);
    });
    console.log(`  ${labels[m].padEnd(14)}${values.join('')}`);
  }
  console.log();
}

function printMineTable(results: PackageStats[], maintainer: string) {
  const withDownloads = results.filter((r) => (r.downloads.lastMonth ?? 0) > 0);
  const noData = results.filter((r) => (r.downloads.lastMonth ?? 0) === 0);

  const totalMonth = results.reduce((s, r) => s + (r.downloads.lastMonth ?? 0), 0);
  const totalWeek = results.reduce((s, r) => s + (r.downloads.lastWeek ?? 0), 0);
  const totalDay = results.reduce((s, r) => s + (r.downloads.lastDay ?? 0), 0);

  // Column widths
  const nameWidth = Math.max(7, ...results.map((r) => r.package.length)) + 2;
  const numWidth = 10;

  console.log(`\n  ${maintainer} — ${results.length} npm packages\n`);

  // Header
  console.log(
    `  ${'Package'.padEnd(nameWidth)}${'Month'.padStart(numWidth)}${'Week'.padStart(numWidth)}${'Day'.padStart(numWidth)}`,
  );
  console.log(`  ${'─'.repeat(nameWidth + numWidth * 3)}`);

  // Rows with downloads
  for (const r of withDownloads) {
    console.log(
      `  ${r.package.padEnd(nameWidth)}${formatNumber(r.downloads.lastMonth).padStart(numWidth)}${formatNumber(r.downloads.lastWeek).padStart(numWidth)}${formatNumber(r.downloads.lastDay).padStart(numWidth)}`,
    );
  }

  // Summary separator
  console.log(`  ${'─'.repeat(nameWidth + numWidth * 3)}`);
  console.log(
    `  ${'TOTAL'.padEnd(nameWidth)}${formatNumber(totalMonth).padStart(numWidth)}${formatNumber(totalWeek).padStart(numWidth)}${formatNumber(totalDay).padStart(numWidth)}`,
  );

  if (noData.length > 0) {
    console.log(`\n  ${noData.length} package(s) with no download data yet:`);
    console.log(`  ${noData.map((r) => r.package).join(', ')}`);
  }
  console.log();
}

function buildOptions(config: Config | null): StatsOptions {
  const opts: StatsOptions = {};
  if (!config) return opts;

  if (config.cache !== false) {
    opts.cache = createCache();
    opts.cacheTtlMs = config.cacheTtlMs;
  }
  if (config.concurrency) opts.concurrency = config.concurrency;
  if (config.dockerToken) opts.dockerToken = config.dockerToken;
  return opts;
}

async function runConfigPackages(config: Config, format: string) {
  const packages = config.packages;
  if (!packages || Object.keys(packages).length === 0) {
    console.error('No packages defined in config. Add packages to registry-stats.config.json.');
    process.exit(1);
  }

  const opts = buildOptions(config);
  const allResults: Record<string, PackageStats[]> = {};

  for (const [displayName, registryMap] of Object.entries(packages)) {
    const results: PackageStats[] = [];

    const fetches = Object.entries(registryMap).map(async ([registry, pkgId]) => {
      try {
        const result = await stats(registry, pkgId, opts);
        if (result) results.push(result);
      } catch {
        // skip failed registries silently in config mode
      }
    });

    await Promise.all(fetches);
    if (results.length > 0) allResults[displayName] = results;
  }

  if (format === 'json') {
    console.log(JSON.stringify(allResults, null, 2));
    return;
  }

  if (Object.keys(allResults).length === 0) {
    console.error('No results found for any configured packages.');
    process.exit(1);
  }

  for (const [displayName, results] of Object.entries(allResults)) {
    console.log(`\n  ${displayName}`);
    console.log(`  ${'─'.repeat(displayName.length)}`);
    for (const r of results) {
      printStats(r);
    }
  }
  console.log();
}

async function runMine(maintainer: string, format: string, config: Config | null) {
  const opts = buildOptions(config);

  process.stderr.write(`  Discovering packages for ${maintainer}...`);

  const results = await stats.mine(maintainer, {
    ...opts,
    onProgress(done, total, pkg) {
      // Clear line and show progress
      process.stderr.write(`\r  Fetching stats... ${done}/${total} (${pkg})${''.padEnd(20)}`);
    },
  });

  // Clear progress line
  process.stderr.write('\r' + ' '.repeat(80) + '\r');

  if (results.length === 0) {
    console.error(`No packages found for maintainer "${maintainer}".`);
    process.exit(1);
  }

  if (format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printMineTable(results, maintainer);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    usage();
    process.exit(0);
  }

  // --init: create starter config
  if (args.includes('--init')) {
    const configPath = resolve(process.cwd(), 'registry-stats.config.json');
    if (existsSync(configPath)) {
      console.error('registry-stats.config.json already exists.');
      process.exit(1);
    }
    writeFileSync(configPath, starterConfig(), 'utf-8');
    console.log('Created registry-stats.config.json');
    process.exit(0);
  }

  // serve subcommand
  if (args[0] === 'serve') {
    let port = 3000;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--port' && args[i + 1]) {
        port = parseInt(args[++i], 10);
      }
    }
    serve({ port });
    return;
  }

  // Parse flags
  let pkg: string | undefined;
  let registry: string | undefined;
  let range: string | undefined;
  let format = 'table';
  let compare = false;
  let mineUser: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--registry' || args[i] === '-r') && args[i + 1]) {
      registry = args[++i];
    } else if (args[i] === '--range' && args[i + 1]) {
      range = args[++i];
    } else if (args[i] === '--format' && args[i + 1]) {
      format = args[++i];
    } else if (args[i] === '--json') {
      format = 'json';
    } else if (args[i] === '--compare') {
      compare = true;
    } else if (args[i] === '--mine' && args[i + 1]) {
      mineUser = args[++i];
    } else if (!args[i].startsWith('-') && !pkg) {
      pkg = args[i];
    }
  }

  const config = loadConfig();

  // --mine mode: discover and show all packages by maintainer
  if (mineUser) {
    await runMine(mineUser, format, config);
    return;
  }

  // No package arg — run from config
  if (!pkg) {
    if (!config) {
      usage();
      process.exit(0);
    }
    await runConfigPackages(config, format);
    return;
  }

  // Package specified — single query mode
  const opts = buildOptions(config);

  try {
    // Comparison mode
    if (compare) {
      const registries = registry ? [registry] : undefined;
      const result = await stats.compare(pkg, registries, opts);

      if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printComparison(result);
      }
      return;
    }

    // Range mode
    if (range) {
      const reg = registry ?? 'npm';
      const [start, end] = range.split(':');
      if (!start || !end) {
        console.error('Error: --range must be start:end (e.g. 2025-01-01:2025-06-30)');
        process.exit(1);
      }

      const data = await stats.range(reg, pkg, start, end, opts);

      if (format === 'json') {
        console.log(JSON.stringify(data, null, 2));
      } else if (format === 'csv') {
        console.log(calc.toCSV(data));
      } else if (format === 'chart') {
        console.log(JSON.stringify(calc.toChartData(data, `${pkg} (${reg})`), null, 2));
      } else {
        const monthly = calc.groupTotals(calc.monthly(data));
        const t = calc.trend(data);

        console.log(`\n${pkg} (${reg}) — ${start} to ${end}\n`);
        for (const [month, total] of Object.entries(monthly)) {
          console.log(`  ${month}  ${formatNumber(total)}`);
        }
        console.log(`\n  Total: ${formatNumber(calc.total(data))}  Avg/day: ${formatNumber(Math.round(calc.avg(data)))}  Trend: ${t.direction} (${t.changePercent > 0 ? '+' : ''}${t.changePercent}%)`);
      }
    } else if (registry) {
      const result = await stats(registry, pkg, opts);
      if (!result) {
        console.error(`Package "${pkg}" not found on ${registry}`);
        process.exit(1);
      }
      if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log();
        printStats(result);
      }
    } else {
      const results = await stats.all(pkg, opts);
      if (results.length === 0) {
        console.error(`Package "${pkg}" not found on any registry`);
        process.exit(1);
      }
      if (format === 'json') {
        console.log(JSON.stringify(results, null, 2));
      } else {
        console.log();
        for (const r of results) {
          printStats(r);
          console.log();
        }
      }
    }
  } catch (e: any) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

main();
