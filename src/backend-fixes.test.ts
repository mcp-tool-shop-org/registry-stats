import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { npm, dailyToRange30 } from './providers/npm.js';
import { inferPortfolio } from './inference.js';

/**
 * In-process checks for the npm daily series, the stats table, and -r lists.
 * Spawned CLI tests never cover src/cli.ts under v8, same as cli.cover.test.ts.
 */

const h = vi.hoisted(() => {
  const stats = Object.assign(vi.fn(), {
    all: vi.fn(),
    compare: vi.fn(),
    range: vi.fn(),
    mine: vi.fn(),
    bulk: vi.fn(),
  });
  return {
    stats,
    serve: vi.fn(),
    loadConfig: vi.fn(),
    starterConfig: vi.fn(() => '{}\n'),
    createCache: vi.fn(() => ({ get: vi.fn(), set: vi.fn() })),
    calc: {
      toCSV: vi.fn(() => 'date,downloads\n'),
      toChartData: vi.fn((_data: unknown, label: string) => ({ label })),
      groupTotals: vi.fn((months: Record<string, number>) => months),
      monthly: vi.fn(() => ({ '2025-01': 1 })),
      trend: vi.fn(() => ({ direction: 'up', changePercent: 1 })),
      total: vi.fn(() => 1),
      avg: vi.fn(() => 1),
    },
  };
});

vi.mock('./index.js', () => ({
  stats: h.stats,
  createCache: h.createCache,
  calc: h.calc,
}));

vi.mock('./server.js', () => ({ serve: h.serve }));

vi.mock('./config.js', () => ({
  loadConfig: h.loadConfig,
  starterConfig: h.starterConfig,
}));

import { main } from './cli.js';

class ExitSignal extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
  }
}

const fetchedAt = '2026-01-01T00:00:00.000Z';

function row(registry: string, extra: Record<string, unknown> | undefined, downloads: Record<string, number> = { total: 10 }) {
  return { registry, package: 'left-pad', downloads, extra, fetchedAt };
}

async function invoke(args: string[]) {
  const prev = process.argv;
  process.argv = ['node', 'registry-stats', ...args];
  const exit = vi.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new ExitSignal(code ?? 0);
  }) as typeof process.exit);
  const logs: string[] = [];
  const errors: string[] = [];
  const log = vi.spyOn(console, 'log').mockImplementation((...parts) => {
    logs.push(parts.map(String).join(' '));
  });
  const err = vi.spyOn(console, 'error').mockImplementation((...parts) => {
    errors.push(parts.map(String).join(' '));
  });
  let thrown: unknown;
  try {
    await main();
  } catch (e) {
    thrown = e;
  } finally {
    process.argv = prev;
    exit.mockRestore();
    log.mockRestore();
    err.mockRestore();
  }
  const code = thrown instanceof ExitSignal ? thrown.code : thrown ? 1 : 0;
  return { code, stdout: logs.join('\n'), stderr: errors.join('\n'), thrown };
}

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string) => { status: number; body?: unknown }) {
  globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const resp = handler(url);
    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      statusText: `Status ${resp.status}`,
      headers: { get: () => null },
      json: async () => resp.body,
    } as unknown as Response;
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  h.loadConfig.mockReturnValue(null);
  h.stats.mockResolvedValue(row('npm', { stars: 3, rating: 4.25, version: '1.2.3' }));
  h.stats.all.mockResolvedValue([row('npm', { stars: 1 })]);
  h.stats.compare.mockResolvedValue({
    package: 'left-pad',
    registries: { npm: row('npm', { stars: 1 }, { total: 4, lastMonth: 3, lastWeek: 2, lastDay: 1 }) },
    fetchedAt,
  });
  h.stats.range.mockResolvedValue([{ date: '2025-01-01', downloads: 3 }]);
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('npm extra.daily', () => {
  it('keeps the three sums, attaches each day, and leaves a real 0', async () => {
    let captured = '';
    const days = [
      { day: '2025-01-01', downloads: 0 },
      { day: '2025-01-02', downloads: 2 },
      { day: '2025-01-03', downloads: 3 },
    ];
    mockFetch((url) => {
      captured = url;
      return { status: 200, body: { downloads: days, start: '2025-01-01', end: '2025-01-03', package: 'express' } };
    });

    const result = await npm.getStats('express');
    expect(captured).toContain('/downloads/range/');
    expect(captured).not.toContain('/point/');
    expect(result).not.toBeNull();
    expect(result!.downloads).toEqual({ lastDay: 3, lastWeek: 5, lastMonth: 5 });
    expect(result!.downloads.total).toBeUndefined();
    expect(result!.extra).toEqual({
      daily: [
        { date: '2025-01-01', downloads: 0 },
        { date: '2025-01-02', downloads: 2 },
        { date: '2025-01-03', downloads: 3 },
      ],
    });
  });

  it('feeds extra.daily to inferPortfolio as range30', () => {
    const daily = Array.from({ length: 14 }, (_, i) => ({
      date: `2025-01-${String(i + 1).padStart(2, '0')}`,
      downloads: i === 0 ? 0 : 10 + i,
    }));
    const range30 = dailyToRange30({ daily });
    expect(range30?.[0]).toBe(0);
    expect(range30).toHaveLength(14);

    const portfolio = inferPortfolio([{ name: 'express', registry: 'npm', week: 100, range30 }]);
    expect(portfolio.packages[0].forecast7.length).toBe(7);

    const missing = inferPortfolio([{
      name: 'express',
      registry: 'npm',
      week: 1,
      range30: dailyToRange30(undefined),
    }]);
    expect(missing.packages[0].forecast7).toEqual([]);
    expect(missing.packages[0].momentum).toBe(0);
  });

  it('keeps a real 0 and drops non-numbers', () => {
    expect(dailyToRange30({
      daily: [
        { date: '2025-01-01', downloads: 0 },
        { date: '2025-01-02', downloads: Number.NaN },
        { downloads: 4 },
        null,
        { downloads: '5' },
      ],
    })).toEqual([0, 4]);
    expect(dailyToRange30(undefined)).toBeNull();
    expect(dailyToRange30({})).toBeNull();
    expect(dailyToRange30({ daily: 'nope' })).toBeNull();
  });
});

describe('stats table extras', () => {
  it('prints github, docker, and vscode extra fields and the page-cap note', async () => {
    h.stats.mockResolvedValue(row('github', {
      latestTag: 'v1.2.3',
      releases: 0,
      assets: 8,
      lastUpdated: '2026-01-02T00:00:00Z',
      displayName: 'Left Pad',
      trending: 12,
      trendingDaily: 1,
      trendingWeekly: 2,
      trendingMonthly: 3,
      truncated: true,
      stars: 9,
    }, { total: 40 }));

    const table = await invoke(['owner/repo', '-r', 'github', '--github-token', 'super-secret-token']);
    expect(table.code).toBe(0);
    expect(table.stdout).toContain('latestTag: v1.2.3');
    expect(table.stdout).toContain('releases: 0');
    expect(table.stdout).toContain('assets: 8');
    expect(table.stdout).toContain('lastUpdated: 2026-01-02T00:00:00Z');
    expect(table.stdout).toContain('displayName: Left Pad');
    expect(table.stdout).toContain('trending: 12');
    expect(table.stdout).toContain('trendingDaily: 1');
    expect(table.stdout).toContain('trendingWeekly: 2');
    expect(table.stdout).toContain('trendingMonthly: 3');
    expect(table.stdout).toContain('note: total stopped at the page cap and is not the full sum');
    expect(table.stdout).not.toContain('super-secret-token');
    expect(table.stderr).not.toContain('super-secret-token');

    const json = await invoke(['owner/repo', '-r', 'github', '--json']);
    expect(json.stdout).toContain('"latestTag": "v1.2.3"');
    expect(json.stdout).not.toContain('page cap');
  });

  it('stays silent when truncated is missing or false', async () => {
    h.stats.mockResolvedValue(row('github', { latestTag: 'v9', releases: 1, truncated: false }));
    const off = await invoke(['owner/repo', '-r', 'github']);
    expect(off.stdout).toContain('latestTag: v9');
    expect(off.stdout).not.toContain('page cap');

    h.stats.mockResolvedValue(row('npm', { stars: 3, rating: 4.25, version: '1.2.3' }));
    const bare = await invoke(['left-pad', '-r', 'npm']);
    expect(bare.stdout).toContain('stars:');
    expect(bare.stdout).toContain('4.3');
    expect(bare.stdout).toContain('v1.2.3');
    expect(bare.stdout).not.toContain('page cap');
  });

  it('puts one page-cap note under the comparison table, not in a numeric column', async () => {
    h.stats.compare.mockResolvedValue({
      package: 'left-pad',
      registries: {
        github: row('github', { truncated: true, releases: 4 }, {
          total: 12_345_678_901,
          lastMonth: 10,
          lastWeek: 2,
          lastDay: 1,
        }),
        pypi: row('pypi', { truncated: false }, {
          total: 1_234_567_890,
          lastMonth: 3,
          lastWeek: 2,
          lastDay: 1,
        }),
      },
      fetchedAt,
    });

    const compared = await invoke(['left-pad', '--compare']);
    expect(compared.code).toBe(0);
    const lines = compared.stdout.split('\n');
    const totalLine = lines.find((line) => line.includes('Total'));
    const dayLine = lines.find((line) => line.trimStart().startsWith('Day'));
    const noteLines = lines.filter((line) => line.includes('page cap'));
    expect(totalLine).toBeTruthy();
    expect(dayLine).toBeTruthy();
    expect(totalLine).toContain('12,345,678,901');
    expect(totalLine).toContain('1,234,567,890');
    expect(totalLine).not.toContain('12,345,678,9011,234,567,890');
    expect(totalLine).not.toContain('page cap');
    expect(totalLine).not.toContain('releases');
    expect(noteLines).toEqual(['  note: github total stopped at the page cap and is not the full sum']);
    expect(lines.indexOf(noteLines[0])).toBeGreaterThan(lines.indexOf(dayLine!));
    expect(compared.stdout).toContain('Month');
    expect(compared.stdout).toContain('Week');
  });
});

describe('registry list flags', () => {
  it('treats commas and repeated -r as a list, and one name as one query', async () => {
    const config = { registries: ['docker'], cache: false };
    h.loadConfig.mockReturnValue(config);

    const listed = await invoke(['left-pad', '-r', ' npm, ,pypi , ']);
    expect(listed.code).toBe(0);
    expect(h.stats.all).toHaveBeenCalledWith('left-pad', expect.objectContaining({
      registries: ['npm', 'pypi'],
    }));
    expect(h.stats).not.toHaveBeenCalled();
    expect(config.registries).toEqual(['docker']);

    vi.clearAllMocks();
    h.loadConfig.mockReturnValue(config);
    h.stats.all.mockResolvedValue([row('npm', {})]);
    await invoke(['left-pad', '-r', 'npm', '-r', 'pypi']);
    expect(h.stats.all).toHaveBeenCalledWith('left-pad', expect.objectContaining({
      registries: ['npm', 'pypi'],
    }));

    vi.clearAllMocks();
    h.loadConfig.mockReturnValue(config);
    h.stats.mockResolvedValue(row('npm', { stars: 1 }));
    await invoke(['left-pad', '--registry', 'npm']);
    expect(h.stats).toHaveBeenCalledWith('npm', 'left-pad', expect.objectContaining({
      registries: ['docker'],
    }));
    expect(h.stats.all).not.toHaveBeenCalled();

    vi.clearAllMocks();
    h.loadConfig.mockReturnValue(config);
    h.stats.compare.mockResolvedValue({
      package: 'left-pad',
      registries: { npm: row('npm', {}, { total: 1, lastMonth: 1, lastWeek: 1, lastDay: 1 }) },
      fetchedAt,
    });
    await invoke(['left-pad', '--compare', '-r', 'npm,pypi']);
    expect(h.stats.compare).toHaveBeenCalledWith('left-pad', ['npm', 'pypi'], expect.anything());

    vi.clearAllMocks();
    h.loadConfig.mockReturnValue(null);
    h.stats.all.mockResolvedValue([row('npm', {})]);
    const plain = await invoke(['left-pad']);
    expect(plain.code).toBe(0);
    expect(plain.stderr).not.toMatch(/github/i);
    expect(h.stats.all.mock.calls[0][1].registries).toBeUndefined();

    vi.clearAllMocks();
    h.loadConfig.mockReturnValue(null);
    h.stats.all.mockResolvedValue([row('github', {})]);
    const slug = await invoke(['acme/widget']);
    expect(slug.code).toBe(0);
    expect(slug.stderr).not.toMatch(/github/i);
    expect(h.stats.all).toHaveBeenCalledWith('acme/widget', expect.any(Object));

    vi.clearAllMocks();
    h.loadConfig.mockReturnValue(null);
    h.stats.all.mockResolvedValue([row('github', { latestTag: 'v1' })]);
    await invoke(['left-pad', '-r', 'github,npm']);
    expect(h.stats.all).toHaveBeenCalledWith('left-pad', expect.objectContaining({
      registries: ['github', 'npm'],
    }));
  });

  it('rejects more than one registry with --range and keeps a single name', async () => {
    const bad = await invoke(['left-pad', '-r', 'npm', '-r', 'pypi', '--range', '2025-01-01:2025-06-30']);
    expect(bad.code).toBe(1);
    expect(bad.stderr.split('\n')[0]).toBe('Error: --range accepts one registry');
    expect(h.stats.range).not.toHaveBeenCalled();

    const ok = await invoke(['left-pad', '-r', 'pypi', '--range', '2025-01-01:2025-01-02']);
    expect(ok.code).toBe(0);
    expect(h.stats.range).toHaveBeenCalledWith('pypi', 'left-pad', '2025-01-01', '2025-01-02', expect.anything());
  });

  it('documents repeated and comma-separated -r, and still misses a compare with nothing', async () => {
    const help = await invoke(['--help']);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain('Repeat -r');
    expect(help.stdout).toContain('-r npm,pypi');
    expect(help.stdout).toContain('-r npm -r pypi');

    h.stats.compare.mockResolvedValue({ package: 'left-pad', registries: {}, fetchedAt });
    const missed = await invoke(['left-pad', '--compare', '-r', 'npm,pypi']);
    expect(missed.code).toBe(1);
    expect(missed.stderr).toContain('not found on any registry');
    expect(missed.stdout.trim()).toBe('');
    expect(h.stats.compare).toHaveBeenCalledWith('left-pad', ['npm', 'pypi'], expect.anything());
  });
});
