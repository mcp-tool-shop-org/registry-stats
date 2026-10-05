import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stats, createCache, calc } from './index.js';
import type { RegistryFailure } from './index.js';
import { serve, type ServerOptions } from './server.js';
import { loadConfig, starterConfig } from './config.js';
import type { PackageStats, StatsOptions, Config, ComparisonResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'));
const VERSION: string = pkg.version;

function usage() {
  console.log(`
Usage: registry-stats [package] [options]
       registry-stats serve [--port 3000]

  If no package is given, reads from registry-stats.config.json.

Options:
  --registry, -r  Registry to query (npm, pypi, nuget, vscode, docker, github)
                  Repeat -r, or pass a comma-separated list (-r npm,pypi)
                  Omit to query config registries. With no registries list,
                  GitHub is included only when the name is owner/repo
                  github: identifier is a repo slug, e.g. -r github owner/repo
  --mine          Discover and show stats for all npm packages by a maintainer
                  e.g. registry-stats --mine mikefrilot
  --range         Date range for time series (e.g. 2025-01-01:2025-06-30)
                  Only npm and pypi support this
  --compare       Compare package across registries side-by-side
  --format        Output format: table (default), json, csv, chart
  --json          Shorthand for --format json
  --github-token  GitHub token. Overrides the config file, then GITHUB_TOKEN,
                  then GH_TOKEN. Not stored in the config file or printed.
  --docker-token  Docker Hub token. Overrides the config file, then
                  DOCKER_TOKEN. Not stored in the config file or printed.
  --init          Create a starter registry-stats.config.json
  --version, -V   Show version
  --help, -h      Show this help

Subcommands:
  serve           Start a REST API server
    --port        Port to listen on (default: 3000)
    --host        Interface to bind (default: 127.0.0.1 — loopback only).
                  Use 0.0.0.0 to expose on all interfaces (only behind a
                  trusted proxy or when you intend public access).
    --cors        Access-Control-Allow-Origin value (default: * — any origin)
    --github-token  GitHub token (GITHUB_TOKEN or GH_TOKEN). Same override order.
    --docker-token  Docker Hub token (DOCKER_TOKEN). Same override order.

Examples:
  registry-stats express
  registry-stats express -r npm
  registry-stats express -r npm,pypi
  registry-stats express -r npm -r pypi
  registry-stats express --compare
  registry-stats express --compare -r npm,pypi
  registry-stats --mine mikefrilot
  registry-stats --mine mikefrilot --format json
  registry-stats express -r npm --range 2025-01-01:2025-06-30 --format csv
  registry-stats serve --port 8080
  registry-stats serve --host 0.0.0.0 --cors https://example.com
  registry-stats --init
  registry-stats                   # fetches all packages from config
`);
}

function formatNumber(n: number | undefined): string {
  if (n === undefined) return '-';
  return n.toLocaleString('en-US');
}

/** One extras-line field. Skips missing values. A real 0 is printed. */
function extraField(label: string, value: unknown): string | undefined {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return undefined;
    return `${label}: ${formatNumber(value)}`;
  }
  if (typeof value === 'string' && value.trim() !== '') return `${label}: ${value}`;
  return undefined;
}

const PAGE_CAP_NOTE = 'total stopped at the page cap and is not the full sum';

/** Wider of the header and the cells, plus one space so the next column cannot touch. */
function columnWidth(header: string, cells: readonly string[]): number {
  return Math.max(header.length, ...cells.map((cell) => cell.length)) + 1;
}

/**
 * Print a stderr warning per registry that errored during an all-registries /
 * compare fan-out, so a transient outage is not silently indistinguishable from
 * "package absent". No-op when there are no failures.
 */
function warnRegistryFailures(errors?: RegistryFailure[]): void {
  if (!errors || errors.length === 0) return;
  for (const e of errors) {
    const status = e.statusCode ? ` (HTTP ${e.statusCode})` : '';
    console.error(`Warning: failed to fetch ${e.registry}${status}: ${e.message}`);
  }
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
    for (const key of ['latestTag', 'releases', 'assets', 'lastUpdated', 'displayName', 'trending', 'trendingDaily', 'trendingWeekly', 'trendingMonthly'] as const) {
      const field = extraField(key, s.extra[key]);
      if (field) extras.push(field);
    }
    if (extras.length > 0) {
      parts.push(`           ${extras.join('  ')}`);
    }
    if (s.extra.truncated === true) {
      parts.push(`           note: ${PAGE_CAP_NOTE}`);
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

  const metrics = ['total', 'lastMonth', 'lastWeek', 'lastDay'] as const;
  const labels: Record<string, string> = {
    total: 'Total',
    lastMonth: 'Month',
    lastWeek: 'Week',
    lastDay: 'Day',
  };
  const metricWidth = 14;
  const formatted = regs.map(([, s]) =>
    metrics.map((m) => {
      const v = s.downloads[m];
      return v !== undefined ? formatNumber(v) : '-';
    }),
  );
  const colWidths = regs.map(([name], i) => columnWidth(name, formatted[i]));
  const tableWidth = metricWidth + colWidths.reduce((sum, w) => sum + w, 0);

  console.log(
    `  ${'Metric'.padEnd(metricWidth)}${regs.map(([name], i) => name.padStart(colWidths[i])).join('')}`,
  );
  console.log(`  ${'─'.repeat(tableWidth)}`);

  for (let row = 0; row < metrics.length; row++) {
    const m = metrics[row];
    const values = formatted.map((cells, i) => cells[row].padStart(colWidths[i]));
    console.log(`  ${labels[m].padEnd(metricWidth)}${values.join('')}`);
  }
  const capped = regs.filter(([, s]) => s.extra?.truncated === true).map(([name]) => name);
  if (capped.length > 0) {
    console.log(`  note: ${capped.join(', ')} ${PAGE_CAP_NOTE}`);
  }
  console.log();
}

function printMineTable(results: PackageStats[], maintainer: string) {
  const withDownloads = results.filter((r) => (r.downloads.lastMonth ?? 0) > 0);
  const noData = results.filter((r) => (r.downloads.lastMonth ?? 0) === 0);

  const totalMonth = results.reduce((s, r) => s + (r.downloads.lastMonth ?? 0), 0);
  const totalWeek = results.reduce((s, r) => s + (r.downloads.lastWeek ?? 0), 0);
  const totalDay = results.reduce((s, r) => s + (r.downloads.lastDay ?? 0), 0);

  const nameWidth = Math.max(7, ...results.map((r) => r.package.length)) + 2;
  const monthWidth = columnWidth('Month', [
    ...withDownloads.map((r) => formatNumber(r.downloads.lastMonth)),
    formatNumber(totalMonth),
  ]);
  const weekWidth = columnWidth('Week', [
    ...withDownloads.map((r) => formatNumber(r.downloads.lastWeek)),
    formatNumber(totalWeek),
  ]);
  const dayWidth = columnWidth('Day', [
    ...withDownloads.map((r) => formatNumber(r.downloads.lastDay)),
    formatNumber(totalDay),
  ]);
  const ruleWidth = nameWidth + monthWidth + weekWidth + dayWidth;

  console.log(`\n  ${maintainer} — ${results.length} npm packages\n`);

  console.log(
    `  ${'Package'.padEnd(nameWidth)}${'Month'.padStart(monthWidth)}${'Week'.padStart(weekWidth)}${'Day'.padStart(dayWidth)}`,
  );
  console.log(`  ${'─'.repeat(ruleWidth)}`);

  for (const r of withDownloads) {
    console.log(
      `  ${r.package.padEnd(nameWidth)}${formatNumber(r.downloads.lastMonth).padStart(monthWidth)}${formatNumber(r.downloads.lastWeek).padStart(weekWidth)}${formatNumber(r.downloads.lastDay).padStart(dayWidth)}`,
    );
  }

  console.log(`  ${'─'.repeat(ruleWidth)}`);
  console.log(
    `  ${'TOTAL'.padEnd(nameWidth)}${formatNumber(totalMonth).padStart(monthWidth)}${formatNumber(totalWeek).padStart(weekWidth)}${formatNumber(totalDay).padStart(dayWidth)}`,
  );

  if (noData.length > 0) {
    console.log(`\n  ${noData.length} package(s) with no download data yet:`);
    console.log(`  ${noData.map((r) => r.package).join(', ')}`);
  }
  console.log();
}

function requireValue(flag: string, args: string[], index: number, hint?: string, allowNegative = false): string {
  const value = args[index + 1];
  const looksLikeFlag = value === undefined || value.startsWith('--') || (!allowNegative && value.startsWith('-'));
  if (looksLikeFlag) {
    console.error(hint ?? `Error: ${flag} requires a value`);
    process.exit(1);
  }
  return value;
}

function parsePort(raw: string): number {
  // Reject 12abc, 1.5, and 8080foo. parseInt would accept those.
  if (!/^[0-9]+$/.test(raw)) {
    console.error('Error: --port must be a number between 1 and 65535');
    process.exit(1);
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    console.error('Error: --port must be a number between 1 and 65535');
    process.exit(1);
  }
  return port;
}

interface TokenSources {
  githubToken?: string;
  dockerToken?: string;
  /** Flag was present, so it wins even when the value is blank. */
  githubFromFlag?: boolean;
  dockerFromFlag?: boolean;
}

function blankToUnset(value: string | undefined): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function tokenFromEnv(names: readonly string[]): string | undefined {
  for (const name of names) {
    const value = blankToUnset(process.env[name]);
    if (value) return value;
  }
  return undefined;
}

/** Flag, then a non-blank config value, then the first non-blank env var. */
function pickToken(
  fromFlag: boolean | undefined,
  flagValue: string | undefined,
  configured: string | undefined,
  envNames: readonly string[],
): string | undefined {
  if (fromFlag) return blankToUnset(flagValue);
  return blankToUnset(configured) ?? tokenFromEnv(envNames);
}

function buildOptions(config: Config | null, tokens?: TokenSources): StatsOptions {
  const opts: StatsOptions = {};
  if (config) {
    if (config.cache !== false) {
      opts.cache = createCache();
      opts.cacheTtlMs = config.cacheTtlMs;
    }
    if (config.concurrency) opts.concurrency = config.concurrency;
    // A present array is the allowlist, including empty (query nothing).
    // Only a missing registries field means every provider.
    if (Array.isArray(config.registries)) opts.registries = config.registries;
  }

  const githubToken = pickToken(
    tokens?.githubFromFlag,
    tokens?.githubToken,
    config?.githubToken,
    ['GITHUB_TOKEN', 'GH_TOKEN'],
  );
  const dockerToken = pickToken(
    tokens?.dockerFromFlag,
    tokens?.dockerToken,
    config?.dockerToken,
    ['DOCKER_TOKEN'],
  );
  if (githubToken) opts.githubToken = githubToken;
  if (dockerToken) opts.dockerToken = dockerToken;
  return opts;
}

async function runConfigPackages(config: Config, format: string, tokens?: TokenSources) {
  const packages = config.packages;
  if (!packages || Object.keys(packages).length === 0) {
    console.error('No packages defined in config. Add packages to registry-stats.config.json.');
    process.exit(1);
  }

  const opts = buildOptions(config, tokens);
  const allResults: Record<string, PackageStats[]> = {};

  for (const [displayName, registryMap] of Object.entries(packages)) {
    const results: PackageStats[] = [];

    const fetches = Object.entries(registryMap).map(async ([registry, pkgId]) => {
      try {
        const result = await stats(registry, pkgId, opts);
        if (result) results.push(result);
      } catch (e: any) {
        console.error(`Warning: failed to fetch ${registry} for ${displayName}: ${e.message}`);
      }
    });

    await Promise.all(fetches);
    if (results.length > 0) allResults[displayName] = results;
  }

  if (Object.keys(allResults).length === 0) {
    console.error('No results found for any configured packages.');
    process.exit(1);
  }

  if (format === 'json') {
    console.log(JSON.stringify(allResults, null, 2));
    return;
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

async function runMine(maintainer: string, format: string, config: Config | null, tokens?: TokenSources) {
  const opts = buildOptions(config, tokens);

  process.stderr.write(`  Discovering packages for ${maintainer}...`);

  let results: PackageStats[] & { errors?: RegistryFailure[] };
  try {
    results = await stats.mine(maintainer, {
      ...opts,
      onProgress(done, total, pkg) {
        // Clear line and show progress
        process.stderr.write(`\r  Fetching stats... ${done}/${total} (${pkg})${''.padEnd(20)}`);
      },
    });
  } catch (e: unknown) {
    process.stderr.write('\r' + ' '.repeat(80) + '\r');
    const message = e instanceof Error ? e.message : String(e);
    console.error(`Error: ${message}`);
    process.exit(1);
  }

  // Clear progress line
  process.stderr.write('\r' + ' '.repeat(80) + '\r');

  // Failures stay on stderr, including --json. The document stays a package array.
  warnRegistryFailures(results.errors);

  if (results.length === 0) {
    // A registry error is not "no packages". An empty discovery still is.
    if (!results.errors || results.errors.length === 0) {
      console.error(`No packages found for maintainer "${maintainer}".`);
    }
    process.exit(1);
  }

  if (format === 'json') {
    console.log(JSON.stringify(results, null, 2));
  } else {
    printMineTable(results, maintainer);
  }
}

export async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.includes('--version') || args.includes('-V')) {
    console.log(`registry-stats ${VERSION}`);
    process.exit(0);
  }

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
    let host: string | undefined;
    let cors: string | undefined;
    let githubToken: string | undefined;
    let dockerToken: string | undefined;
    let githubFromFlag = false;
    let dockerFromFlag = false;
    for (let i = 1; i < args.length; i++) {
      if (args[i] === '--port') {
        port = parsePort(requireValue('--port', args, i, undefined, true));
        i++;
      } else if (args[i] === '--host') {
        host = requireValue('--host', args, i);
        i++;
      } else if (args[i] === '--cors') {
        cors = requireValue('--cors', args, i);
        i++;
      } else if (args[i] === '--github-token') {
        githubToken = requireValue('--github-token', args, i);
        githubFromFlag = true;
        i++;
      } else if (args[i] === '--docker-token') {
        dockerToken = requireValue('--docker-token', args, i);
        dockerFromFlag = true;
        i++;
      } else if (args[i].startsWith('-')) {
        console.error(`Error: unknown option ${args[i]}`);
        process.exit(1);
      } else {
        console.error(`Error: unexpected argument "${args[i]}"`);
        process.exit(1);
      }
    }
    const config = loadConfig();
    const fromConfig = buildOptions(config, { githubToken, dockerToken, githubFromFlag, dockerFromFlag });
    const serverOpts: ServerOptions = { port, host, corsOrigin: cors };
    if (config?.cache === false) serverOpts.cache = false;
    if (fromConfig.githubToken) serverOpts.githubToken = fromConfig.githubToken;
    if (fromConfig.dockerToken) serverOpts.dockerToken = fromConfig.dockerToken;
    if (fromConfig.registries) serverOpts.registries = fromConfig.registries;
    if (fromConfig.cacheTtlMs != null) serverOpts.cacheTtlMs = fromConfig.cacheTtlMs;
    serve(serverOpts);
    return;
  }

  // Parse flags
  let pkg: string | undefined;
  /** Set only when -r / --registry was passed. Pieces are trimmed; empties dropped. */
  let registryArgs: string[] | undefined;
  let range: string | undefined;
  let format = 'table';
  let compare = false;
  let mineUser: string | undefined;
  let githubToken: string | undefined;
  let dockerToken: string | undefined;
  let githubFromFlag = false;
  let dockerFromFlag = false;

  const unknownFlags: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--registry' || args[i] === '-r') {
      const value = requireValue(args[i], args, i);
      const parts = value.split(',').map((part) => part.trim()).filter((part) => part.length > 0);
      registryArgs = registryArgs ? registryArgs.concat(parts) : parts;
      i++;
    } else if (args[i] === '--range') {
      range = requireValue('--range', args, i);
      i++;
    } else if (args[i] === '--format') {
      format = requireValue('--format', args, i);
      i++;
    } else if (args[i] === '--json') {
      format = 'json';
    } else if (args[i] === '--compare') {
      compare = true;
    } else if (args[i] === '--mine') {
      mineUser = requireValue('--mine', args, i, 'Error: --mine requires a maintainer name (e.g. registry-stats --mine yourname)');
      i++;
    } else if (args[i] === '--github-token') {
      githubToken = requireValue('--github-token', args, i);
      githubFromFlag = true;
      i++;
    } else if (args[i] === '--docker-token') {
      dockerToken = requireValue('--docker-token', args, i);
      dockerFromFlag = true;
      i++;
    } else if (!args[i].startsWith('-') && !pkg) {
      pkg = args[i];
    } else if (args[i].startsWith('-')) {
      unknownFlags.push(args[i]);
    }
  }

  if (unknownFlags.length > 0) {
    console.error(`Warning: unknown option(s): ${unknownFlags.join(', ')}`);
  }

  const config = loadConfig();
  const tokens: TokenSources = { githubToken, dockerToken, githubFromFlag, dockerFromFlag };

  // Warn if csv/chart is used without --range
  if ((format === 'csv' || format === 'chart') && !range) {
    console.error(`Warning: --format ${format} only produces meaningful output with --range. Falling back to table.`);
    format = 'table';
  }

  // --mine mode: discover and show all packages by maintainer
  if (mineUser) {
    await runMine(mineUser, format, config, tokens);
    return;
  }

  // No package arg — run from config
  if (!pkg) {
    if (!config) {
      usage();
      process.exit(0);
    }
    await runConfigPackages(config, format, tokens);
    return;
  }

  // Package specified — single query mode
  const opts = buildOptions(config, tokens);

  try {
    // Comparison mode
    if (compare) {
      const registries = registryArgs ?? opts.registries;
      const result = await stats.compare(pkg, registries, opts);

      // Surface transient registry failures so an outage isn't mistaken for
      // "package absent" (mirrors the per-registry warning in runConfigPackages).
      warnRegistryFailures(result.errors);

      // An empty map is a total miss in table mode and in --json. Do not print
      // the object: a caller that only checks the status would treat it as success.
      // Warnings stay on stderr. A partial success still prints the object,
      // errors included. Configured-package JSON is a different path.
      if (Object.keys(result.registries).length === 0) {
        console.error(`Package "${result.package}" not found on any registry`);
        process.exit(1);
      }

      if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printComparison(result);
      }
      return;
    }

    // Range mode. One registry only; a list is an error, not a silent first name.
    if (range) {
      if (registryArgs && registryArgs.length > 1) {
        console.error('Error: --range accepts one registry');
        process.exit(1);
      }
      const reg = registryArgs?.[0] ?? 'npm';
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
    } else if (registryArgs && registryArgs.length === 1) {
      const result = await stats(registryArgs[0], pkg, opts);
      if (!result) {
        console.error(`Package "${pkg}" not found on ${registryArgs[0]}`);
        process.exit(1);
      }
      if (format === 'json') {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log();
        printStats(result);
      }
    } else {
      // More than one name, or an explicit empty list, applies to this call only.
      const allOpts = registryArgs ? { ...opts, registries: [...registryArgs] } : opts;
      const results = await stats.all(pkg, allOpts);

      // Surface transient registry failures so an outage isn't mistaken for
      // "package absent" (mirrors the per-registry warning in runConfigPackages).
      warnRegistryFailures(results.errors);

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

// Importing this module from a test must not start the CLI. The bin and the
// direct `node src/cli.ts` path still run it. Compare resolved paths so a
// Windows file URL and argv[1] refer to the same file.
function invokedDirectly(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return resolve(entry) === resolve(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (invokedDirectly()) {
  main().catch((e: any) => {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  });
}
