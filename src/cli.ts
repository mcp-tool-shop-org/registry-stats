import { stats, calc } from './index.js';
import type { PackageStats } from './types.js';

const REGISTRIES = ['npm', 'pypi', 'nuget', 'vscode', 'docker'] as const;

function usage() {
  console.log(`
Usage: registry-stats <package> [options]

Options:
  --registry, -r  Registry to query (npm, pypi, nuget, vscode, docker)
                  Omit to query all registries
  --range         Date range for time series (e.g. 2025-01-01:2025-06-30)
                  Only npm and pypi support this
  --json          Output raw JSON
  --help, -h      Show this help

Examples:
  registry-stats express
  registry-stats express -r npm
  registry-stats requests -r pypi --range 2025-01-01:2025-06-30
  registry-stats esbenp.prettier-vscode -r vscode
  registry-stats library/node -r docker
  registry-stats Newtonsoft.Json -r nuget --json
`);
}

function formatNumber(n: number | undefined): string {
  if (n === undefined) return '-';
  return n.toLocaleString('en-US');
}

function printStats(s: PackageStats) {
  const d = s.downloads;
  const parts = [
    `  ${s.registry.padEnd(7)} │ ${s.package}`,
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

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    usage();
    process.exit(0);
  }

  const pkg = args[0];
  let registry: string | undefined;
  let range: string | undefined;
  let json = false;

  for (let i = 1; i < args.length; i++) {
    if ((args[i] === '--registry' || args[i] === '-r') && args[i + 1]) {
      registry = args[++i];
    } else if (args[i] === '--range' && args[i + 1]) {
      range = args[++i];
    } else if (args[i] === '--json') {
      json = true;
    }
  }

  try {
    if (range) {
      const reg = registry ?? 'npm';
      const [start, end] = range.split(':');
      if (!start || !end) {
        console.error('Error: --range must be start:end (e.g. 2025-01-01:2025-06-30)');
        process.exit(1);
      }

      const data = await stats.range(reg, pkg, start, end);

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
      const result = await stats(registry, pkg);
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
      const results = await stats.all(pkg);
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
