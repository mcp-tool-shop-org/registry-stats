import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { stats, createCache, calc } from './index.js';
import { loadConfig, starterConfig } from './config.js';
import type { PackageStats, StatsOptions, Config } from './types.js';

function usage() {
  console.log(`
Usage: registry-stats [package] [options]

  If no package is given, reads from registry-stats.config.json.

Options:
  --registry, -r  Registry to query (npm, pypi, nuget, vscode, docker)
                  Omit to query all registries
  --range         Date range for time series (e.g. 2025-01-01:2025-06-30)
                  Only npm and pypi support this
  --json          Output raw JSON
  --init          Create a starter registry-stats.config.json
  --help, -h      Show this help

Examples:
  registry-stats express
  registry-stats express -r npm
  registry-stats requests -r pypi --range 2025-01-01:2025-06-30
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

async function runConfigPackages(config: Config, json: boolean) {
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

  if (json) {
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

  // Parse flags
  let pkg: string | undefined;
  let registry: string | undefined;
  let range: string | undefined;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    if ((args[i] === '--registry' || args[i] === '-r') && args[i + 1]) {
      registry = args[++i];
    } else if (args[i] === '--range' && args[i + 1]) {
      range = args[++i];
    } else if (args[i] === '--json') {
      json = true;
    } else if (!args[i].startsWith('-') && !pkg) {
      pkg = args[i];
    }
  }

  const config = loadConfig();

  // No package arg — run from config
  if (!pkg) {
    if (!config) {
      usage();
      process.exit(0);
    }
    await runConfigPackages(config, json);
    return;
  }

  // Package specified — single query mode
  const opts = buildOptions(config);

  try {
    if (range) {
      const reg = registry ?? 'npm';
      const [start, end] = range.split(':');
      if (!start || !end) {
        console.error('Error: --range must be start:end (e.g. 2025-01-01:2025-06-30)');
        process.exit(1);
      }

      const data = await stats.range(reg, pkg, start, end, opts);

      if (json) {
        console.log(JSON.stringify(data, null, 2));
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
      if (json) {
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
      if (json) {
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
