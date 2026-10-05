import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerProvider, stats, RegistryError } from './index.js';
import type { MineStatsResult } from './index.js';
import type { RegistryProvider } from './types.js';

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

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function settleProvider(): RegistryProvider {
  return {
    name: 'bulk-settle',
    async getStats(pkg: string) {
      if (pkg === 'bad') throw new RegistryError('bulk-settle', 429, 'slow down');
      if (pkg === 'late') throw new Error('nope');
      if (pkg === 'gone') return null;
      return {
        registry: 'bulk-settle' as 'npm',
        package: pkg,
        downloads: { total: 5 },
        fetchedAt: '2026-01-01T00:00:00.000Z',
      };
    },
  };
}

describe('stats.bulk settles each name', () => {
  it('keeps successes and a legitimate null, and records only thrown names', async () => {
    registerProvider(settleProvider());
    const rows = await stats.bulk('bulk-settle', ['bad', 'ok', 'gone', 'late']);
    expect(rows.map((row) => row?.package ?? null)).toEqual([null, 'ok', null, null]);
    expect(rows[1]).toEqual({
      registry: 'bulk-settle',
      package: 'ok',
      downloads: { total: 5 },
      fetchedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(rows.errors).toEqual([
      { registry: 'bulk-settle', statusCode: 429, message: '[bulk-settle] slow down' },
      { registry: 'bulk-settle', message: 'nope' },
    ]);
    expect(JSON.stringify(rows)).not.toContain('slow down');
  });

  it('does not attach an errors entry for a package that is simply absent', async () => {
    registerProvider(settleProvider());
    const rows = await stats.bulk('bulk-settle', ['ok', 'gone']);
    expect(rows[0]?.package).toBe('ok');
    expect(rows[1]).toBeNull();
    expect(rows.errors).toBeUndefined();

    const missing = await stats.bulk('bulk-settle', ['gone']);
    expect(missing).toEqual([null]);
    expect(missing.errors).toBeUndefined();
  });

  it('rejects only when every name threw', async () => {
    registerProvider({
      name: 'bulk-settle-all',
      async getStats(pkg: string) {
        throw new RegistryError('bulk-settle-all', pkg === 'a' ? 429 : 500, `fail ${pkg}`);
      },
    });
    await expect(stats.bulk('bulk-settle-all', ['a', 'b'])).rejects.toMatchObject({ statusCode: 429 });
    await expect(stats.bulk('bulk-settle', ['bad'])).rejects.toMatchObject({ statusCode: 429 });
  });
});

describe('npm bulk keeps rows the other half already has', () => {
  it('keeps an unscoped point-API row when a scoped lookup throws', async () => {
    mockFetch((url) => {
      if (url.includes('/point/')) {
        return {
          status: 200,
          body: { plain: { downloads: url.includes('last-month') ? 8 : 1, package: 'plain' } },
        };
      }
      return { status: 400 };
    });

    const rows = await stats.bulk('npm', ['plain', '@scope/pkg']);
    expect(rows[0]?.package).toBe('plain');
    expect(rows[0]?.downloads.lastMonth).toBe(8);
    expect(rows[0]?.downloads.lastDay).toBe(1);
    expect(rows[1]).toBeNull();
    expect(rows.errors).toHaveLength(1);
    expect(rows.errors?.[0]).toMatchObject({ registry: 'npm', statusCode: 400 });
    expect(rows[0]).not.toHaveProperty('errors');
  });

  it('keeps a scoped row when every unscoped period throws', async () => {
    mockFetch((url) => {
      if (url.includes('/point/')) return { status: 400 };
      return {
        status: 200,
        body: {
          downloads: [{ day: '2025-01-01', downloads: 3 }],
          start: '2025-01-01',
          end: '2025-01-01',
          package: '@scope/pkg',
        },
      };
    });

    const rows = await stats.bulk('npm', ['plain', '@scope/pkg']);
    expect(rows[0]).toBeNull();
    expect(rows[1]?.package).toBe('@scope/pkg');
    expect(rows[1]?.downloads.lastDay).toBe(3);
    expect(rows.errors).toHaveLength(3);
    expect(rows.errors?.map((failure) => failure.message).join('\n')).toContain('last-month');
    expect(rows.errors?.map((failure) => failure.message).join('\n')).toContain('last-day');
  });

  it('rejects when every scoped name throws and there is no unscoped row', async () => {
    mockFetch(() => ({ status: 400 }));
    await expect(stats.bulk('npm', ['@scope/a', '@scope/b'])).rejects.toBeInstanceOf(RegistryError);
  });
});

describe('stats.mine keeps the bulk failure channel', () => {
  it('copies period and scoped failures without changing the package object', async () => {
    mockFetch((url) => {
      if (url.includes('/-/v1/search')) {
        return {
          status: 200,
          body: {
            total: 2,
            objects: [{ package: { name: 'plain' } }, { package: { name: '@scope/pkg' } }],
          },
        };
      }
      if (url.includes('/point/last-month/')) return { status: 400 };
      if (url.includes('/point/')) {
        return { status: 200, body: { plain: { downloads: 4, package: 'plain' } } };
      }
      return { status: 400 };
    });

    const results = await stats.mine('someone') as MineStatsResult;
    expect(results.map((row) => row.package)).toEqual(['plain']);
    expect(results[0].downloads.lastWeek).toBe(4);
    expect(results[0].downloads.lastMonth).toBeUndefined();
    expect(Object.keys(results[0]).sort()).toEqual(['downloads', 'fetchedAt', 'package', 'registry']);
    expect(results.errors).toHaveLength(2);
    expect(results.errors?.[0].message).toContain('last-month');
    expect(results.errors?.[1]).toMatchObject({ registry: 'npm', statusCode: 400 });
    expect(JSON.stringify(results)).not.toContain('"errors"');
  });

  it('returns an empty array with errors when a miss is paired with a throw', async () => {
    mockFetch((url) => {
      if (url.includes('/-/v1/search')) {
        return {
          status: 200,
          body: {
            total: 2,
            objects: [{ package: { name: 'ghost' } }, { package: { name: '@scope/pkg' } }],
          },
        };
      }
      if (url.includes('/point/')) return { status: 200, body: {} };
      return { status: 400 };
    });

    const results = await stats.mine('someone') as MineStatsResult;
    expect(results).toHaveLength(0);
    expect(results.errors).toHaveLength(1);
    expect(results.errors?.[0].statusCode).toBe(400);
  });

  it('rejects when every period throws and nothing usable came back', async () => {
    mockFetch((url) => {
      if (url.includes('/-/v1/search')) {
        return {
          status: 200,
          body: {
            total: 2,
            objects: [{ package: { name: 'plain' } }, { package: { name: 'other' } }],
          },
        };
      }
      return { status: 400 };
    });
    await expect(stats.mine('someone')).rejects.toBeInstanceOf(RegistryError);
  });
});
