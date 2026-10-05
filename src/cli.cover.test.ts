import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * In-process coverage for src/cli.ts. The spawn tests in cli.test.ts run a
 * second Node process, which vitest's v8 collector never sees, so cli.ts
 * stayed at 0%. These tests call the exported main() in this process.
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
      toCSV: vi.fn(() => 'date,downloads\n2025-01-01,3\n'),
      toChartData: vi.fn((_data: unknown, label: string) => ({ label })),
      groupTotals: vi.fn((months: Record<string, number>) => months),
      monthly: vi.fn(() => ({ '2025-01': 10 })),
      trend: vi.fn(() => ({ direction: 'up', changePercent: 12 })),
      total: vi.fn(() => 100),
      avg: vi.fn(() => 3.4),
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

vi.mock('node:fs', async () => {
  const actual = await vi.importActual<typeof import('node:fs')>('node:fs');
  return {
    ...actual,
    existsSync: vi.fn((p: Parameters<typeof actual.existsSync>[0]) => actual.existsSync(p)),
    writeFileSync: vi.fn(),
  };
});

import { existsSync, writeFileSync } from 'node:fs';
import { main } from './cli.js';

class ExitSignal extends Error {
  constructor(readonly code: number) {
    super(`exit ${code}`);
  }
}

const full = {
  registry: 'npm',
  package: 'left-pad',
  downloads: { total: 10, lastMonth: 5, lastWeek: 2, lastDay: 1 },
  extra: { stars: 3, rating: 4.25, version: '1.2.3' },
  fetchedAt: '2026-01-01T00:00:00.000Z',
};

const bare = {
  registry: 'pypi',
  package: 'left-pad',
  downloads: {},
  fetchedAt: '2026-01-01T00:00:00.000Z',
};

function allOf(rows: unknown[], errors?: unknown[]) {
  const out = [...rows] as unknown[] & { errors?: unknown[] };
  if (errors) out.errors = errors;
  return out;
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
  const stderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
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
    stderr.mockRestore();
  }
  const code = thrown instanceof ExitSignal ? thrown.code : thrown ? 1 : 0;
  return { code, stdout: logs.join('\n'), stderr: errors.join('\n'), thrown };
}

beforeEach(() => {
  vi.clearAllMocks();
  h.loadConfig.mockReturnValue(null);
  h.stats.mockResolvedValue(full);
  h.stats.all.mockResolvedValue(allOf([full]));
  h.stats.compare.mockResolvedValue({
    package: 'left-pad',
    registries: { npm: full },
    fetchedAt: full.fetchedAt,
    errors: [],
  });
  h.stats.range.mockResolvedValue([{ date: '2025-01-01', downloads: 3 }]);
  h.stats.mine.mockResolvedValue([full]);
  h.starterConfig.mockReturnValue('{}\n');
  h.createCache.mockImplementation(() => ({ get: vi.fn(), set: vi.fn() }));
  vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith('package.json') ? true : false);
  vi.mocked(writeFileSync).mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('CLI main (in process)', () => {
  it('prints the version and the help text', async () => {
    const version = await invoke(['--version']);
    expect(version.code).toBe(0);
    expect(version.stdout).toContain('registry-stats');

    const short = await invoke(['-V']);
    expect(short.code).toBe(0);

    const help = await invoke(['--help']);
    expect(help.code).toBe(0);
    expect(help.stdout).toContain('Usage: registry-stats');
    expect(help.stdout).toContain('--mine');

    const hShort = await invoke(['-h']);
    expect(hShort.code).toBe(0);
    expect(hShort.stdout).toContain('serve');
  });

  it('refuses to overwrite an existing starter config and writes one when absent', async () => {
    vi.mocked(existsSync).mockImplementation((p) => String(p).endsWith('registry-stats.config.json'));
    const exists = await invoke(['--init']);
    expect(exists.code).toBe(1);
    expect(exists.stderr).toContain('already exists');
    expect(writeFileSync).not.toHaveBeenCalled();

    vi.mocked(existsSync).mockReturnValue(false);
    const created = await invoke(['--init']);
    expect(created.code).toBe(0);
    expect(created.stdout).toContain('Created registry-stats.config.json');
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.stringMatching(/registry-stats\.config\.json$/),
      '{}\n',
      'utf-8',
    );
  });

  it('parses serve flags and rejects a bad port or a trailing flag', async () => {
    const ok = await invoke(['serve', '--port', '8080', '--host', '0.0.0.0', '--cors', 'https://example.com']);
    expect(ok.code).toBe(0);
    expect(h.serve).toHaveBeenCalledWith({
      port: 8080,
      host: '0.0.0.0',
      corsOrigin: 'https://example.com',
    });

    const defaults = await invoke(['serve']);
    expect(defaults.code).toBe(0);
    expect(h.serve).toHaveBeenCalledWith({ port: 3000, host: undefined, corsOrigin: undefined });

    for (const args of [
      ['serve', '--port', '0'],
      ['serve', '--port', '65536'],
      ['serve', '--port', '12abc'],
      ['serve', '--port', '1.5'],
      ['serve', '--port', '-1'],
    ]) {
      const bad = await invoke(args);
      expect(bad.code).toBe(1);
      expect(bad.stderr).toContain('--port must be a number between 1 and 65535');
    }

    const trailingPort = await invoke(['serve', '--port']);
    expect(trailingPort.code).toBe(1);
    expect(trailingPort.stderr).toContain('--port requires a value');

    const trailingHost = await invoke(['serve', '--host']);
    expect(trailingHost.code).toBe(1);
    expect(trailingHost.stderr).toContain('--host requires a value');

    const unknown = await invoke(['serve', '--nope']);
    expect(unknown.code).toBe(1);
    expect(unknown.stderr).toContain('unknown option');

    const extra = await invoke(['serve', 'nope']);
    expect(extra.code).toBe(1);
    expect(extra.stderr).toContain('unexpected argument');
  });

  it('shows usage when there is no package and no config', async () => {
    const r = await invoke([]);
    expect(r.code).toBe(0);
    expect(r.stdout).toContain('Usage: registry-stats');
  });

  it('warns on unknown flags and falls back when csv or chart has no range', async () => {
    const r = await invoke(['left-pad', '--bogus', '--format', 'csv']);
    expect(r.code).toBe(0);
    expect(r.stderr).toContain('unknown option');
    expect(r.stderr).toContain('--format csv');
    expect(h.stats.all).toHaveBeenCalled();

    const chart = await invoke(['left-pad', '--format', 'chart']);
    expect(chart.stderr).toContain('--format chart');
  });

  it('requires a value for registry, range, format, and mine', async () => {
    for (const [flag, needle] of [
      ['--registry', '--registry requires a value'],
      ['-r', '-r requires a value'],
      ['--range', '--range requires a value'],
      ['--format', '--format requires a value'],
    ] as const) {
      const r = await invoke(['left-pad', flag]);
      expect(r.code).toBe(1);
      expect(r.stderr).toContain(needle);
    }
    const mine = await invoke(['--mine']);
    expect(mine.code).toBe(1);
    expect(mine.stderr).toContain('--mine requires a maintainer name');
  });

  it('copies cache, tokens, and registries from config, and skips cache when disabled', async () => {
    h.loadConfig.mockReturnValue({
      cache: true,
      cacheTtlMs: 1234,
      concurrency: 4,
      dockerToken: 'dock',
      githubToken: 'gh',
      registries: ['npm'],
    });
    const r = await invoke(['left-pad']);
    expect(r.code).toBe(0);
    expect(h.createCache).toHaveBeenCalled();
    expect(h.stats.all).toHaveBeenCalledWith('left-pad', expect.objectContaining({
      cacheTtlMs: 1234,
      concurrency: 4,
      dockerToken: 'dock',
      githubToken: 'gh',
      registries: ['npm'],
    }));

    vi.clearAllMocks();
    h.loadConfig.mockReturnValue({ cache: false, registries: [], githubToken: '', dockerToken: '' });
    h.stats.all.mockResolvedValue(allOf([full]));
    await invoke(['left-pad', '-r', 'pypi']);
    expect(h.createCache).not.toHaveBeenCalled();
    const opts = h.stats.mock.calls[0][2] as Record<string, unknown>;
    expect(opts.cache).toBeUndefined();
    expect(opts.registries).toBeUndefined();
    expect(opts.githubToken).toBeUndefined();
    expect(h.stats).toHaveBeenCalledWith('pypi', 'left-pad', opts);
  });

  it('prints a single registry as a table or json, and exits when it is missing', async () => {
    const table = await invoke(['left-pad', '-r', 'npm']);
    expect(table.code).toBe(0);
    expect(table.stdout).toContain('left-pad');
    expect(table.stdout).toContain('stars:');
    expect(table.stdout).toContain('4.3');
    expect(table.stdout).toContain('v1.2.3');

    h.stats.mockResolvedValue({ ...bare, extra: {} });
    const empty = await invoke(['left-pad', '--registry', 'pypi']);
    expect(empty.code).toBe(0);
    expect(empty.stdout).toContain('pypi');

    h.stats.mockResolvedValue(null);
    const missing = await invoke(['left-pad', '-r', 'npm']);
    expect(missing.code).toBe(1);
    expect(missing.stderr).toContain('not found on npm');

    h.stats.mockResolvedValue(full);
    const json = await invoke(['left-pad', '-r', 'npm', '--json']);
    expect(json.stdout).toContain('"package": "left-pad"');
  });

  it('prints every registry, warns on failures, and exits when none return', async () => {
    h.stats.all.mockResolvedValue(allOf(
      [full, bare, { ...bare, registry: 'nuget', extra: {} }],
      [
        { registry: 'docker', statusCode: 503, message: 'down' },
        { registry: 'github', message: 'nope' },
      ],
    ));
    const table = await invoke(['left-pad']);
    expect(table.code).toBe(0);
    expect(table.stdout).toContain('npm');
    expect(table.stderr).toContain('HTTP 503');
    expect(table.stderr).toContain('failed to fetch github');

    h.stats.all.mockResolvedValue(allOf([full]));
    const json = await invoke(['left-pad', '--format', 'json']);
    expect(json.stdout).toContain('"registry": "npm"');

    h.stats.all.mockResolvedValue(allOf([]));
    const none = await invoke(['left-pad']);
    expect(none.code).toBe(1);
    expect(none.stderr).toContain('not found on any registry');
  });

  it('compares across registries, including an empty result and json output', async () => {
    h.loadConfig.mockReturnValue({ registries: ['npm', 'pypi'], cache: false });
    const table = await invoke(['left-pad', '--compare']);
    expect(table.code).toBe(0);
    expect(table.stdout).toContain('comparison');
    expect(h.stats.compare).toHaveBeenCalledWith('left-pad', ['npm', 'pypi'], expect.anything());

    h.stats.compare.mockResolvedValue({
      package: 'left-pad',
      registries: {
        npm: full,
        pypi: { ...bare, downloads: { total: undefined, lastMonth: 2 } },
      },
      fetchedAt: full.fetchedAt,
      errors: [{ registry: 'nuget', statusCode: 0, message: 'x' }],
    });
    const warned = await invoke(['left-pad', '--compare', '--json']);
    expect(warned.stdout).toContain('"registries"');
    expect(warned.stderr).toContain('failed to fetch nuget');

    h.stats.compare.mockResolvedValue({
      package: 'left-pad',
      registries: {},
      fetchedAt: full.fetchedAt,
    });
    const empty = await invoke(['left-pad', '--compare', '-r', 'npm']);
    expect(empty.code).toBe(1);
    expect(empty.stderr).toContain('not found on any registry');
    expect(h.stats.compare).toHaveBeenCalledWith('left-pad', ['npm'], expect.anything());
  });

  it('prints a range as a table, csv, chart, or json, and rejects a bad range', async () => {
    const table = await invoke(['left-pad', '--range', '2025-01-01:2025-06-30']);
    expect(table.code).toBe(0);
    expect(table.stdout).toContain('2025-01');
    expect(table.stdout).toContain('Trend: up');
    expect(h.stats.range).toHaveBeenCalledWith('npm', 'left-pad', '2025-01-01', '2025-06-30', expect.anything());

    const csv = await invoke(['left-pad', '-r', 'pypi', '--range', '2025-01-01:2025-01-02', '--format', 'csv']);
    expect(csv.stdout).toContain('date,downloads');

    const chart = await invoke(['left-pad', '--range', '2025-01-01:2025-01-02', '--format', 'chart']);
    expect(chart.stdout).toContain('left-pad (npm)');

    const json = await invoke(['left-pad', '--range', '2025-01-01:2025-01-02', '--format', 'json']);
    expect(json.stdout).toContain('2025-01-01');

    const bad = await invoke(['left-pad', '--range', '2025-01-01']);
    expect(bad.code).toBe(1);
    expect(bad.stderr).toContain('--range must be start:end');
  });

  it('runs configured packages as a table or json, and reports fetch failures', async () => {
    h.loadConfig.mockReturnValue({
      cache: false,
      packages: { Left: { npm: 'left-pad', pypi: 'left-pad' } },
    });
    h.stats.mockImplementation(async (registry: string) => {
      if (registry === 'pypi') throw new Error('down');
      return full;
    });
    const table = await invoke([]);
    expect(table.code).toBe(0);
    expect(table.stdout).toContain('Left');
    expect(table.stderr).toContain('failed to fetch pypi');

    h.stats.mockResolvedValue(full);
    const json = await invoke(['--json']);
    expect(json.stdout).toContain('"Left"');

    h.stats.mockResolvedValue(null);
    const noneJson = await invoke(['--json']);
    expect(noneJson.code).toBe(1);
    expect(noneJson.stderr).toContain('No results found');
    expect(noneJson.stdout.trim()).toBe('');

    const none = await invoke([]);
    expect(none.code).toBe(1);
    expect(none.stderr).toContain('No results found');

    h.loadConfig.mockReturnValue({ packages: {} });
    const empty = await invoke([]);
    expect(empty.code).toBe(1);
    expect(empty.stderr).toContain('No packages defined');
  });

  it('prints a maintainer table, json, and the empty result', async () => {
    const progress: string[] = [];
    h.stats.mine.mockImplementation(async (_name: string, opts: { onProgress?: (d: number, t: number, p: string) => void }) => {
      opts.onProgress?.(1, 2, 'left-pad');
      progress.push('called');
      return [
        full,
        { ...bare, package: 'quiet', downloads: { lastMonth: 0, lastWeek: 0, lastDay: 0 } },
      ];
    });
    const table = await invoke(['--mine', 'someone']);
    expect(table.code).toBe(0);
    expect(table.stdout).toContain('someone');
    expect(table.stdout).toContain('TOTAL');
    expect(table.stdout).toContain('no download data');
    expect(progress).toEqual(['called']);

    h.stats.mine.mockResolvedValue([full]);
    const json = await invoke(['--mine', 'someone', '--format', 'json']);
    expect(json.stdout).toContain('left-pad');
    expect(json.stdout).not.toContain('no download data');

    h.stats.mine.mockResolvedValue([]);
    const none = await invoke(['--mine', 'nobody']);
    expect(none.code).toBe(1);
    expect(none.stderr).toContain('No packages found');
  });

  it('prints the registry error when a query throws', async () => {
    h.stats.all.mockRejectedValue(new Error('boom'));
    const r = await invoke(['left-pad']);
    expect(r.code).toBe(1);
    expect(r.stderr).toContain('Error: boom');
  });
});
