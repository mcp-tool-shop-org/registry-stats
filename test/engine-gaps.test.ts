import { afterEach, describe, expect, it, vi } from 'vitest';
import { createCache, registerProvider, stats } from '../src/index.js';
import type { PackageStats } from '../src/types.js';

const originalFetch = globalThis.fetch;

function json(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: String(status),
    headers: { get: () => null },
    json: async () => body,
  } as unknown as Response;
}

const point = {
  registry: 'npm' as const,
  package: 'pkg',
  downloads: { total: 1 },
  fetchedAt: '2026-01-01T00:00:00.000Z',
};

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('stats.mine', () => {
  it('discovers pages, fetches bulk stats, and sorts by month', async () => {
    const seen: number[] = [];
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/-/v1/search')) {
        if (url.includes('from=0')) {
          return json(200, {
            objects: [{ package: { name: 'low' } }, { package: { name: 'high' } }],
            total: 2,
          });
        }
        return json(200, { objects: [], total: 2 });
      }
      return json(200, {
        high: { downloads: url.includes('last-month') ? 50 : 4 },
        low: { downloads: url.includes('last-month') ? 10 : 1 },
      });
    });

    const results = await stats.mine('someone', {
      onProgress(done) {
        seen.push(done);
      },
    });
    expect(results.map((r) => r.package)).toEqual(['high', 'low']);
    expect(results[0].downloads.lastMonth).toBe(50);
    expect(seen).toEqual([1, 2]);
  });

  it('returns nothing when the search is empty or missing', async () => {
    globalThis.fetch = vi.fn(async () => json(200, { objects: [], total: 0 }));
    await expect(stats.mine('nobody')).resolves.toEqual([]);

    globalThis.fetch = vi.fn(async () => json(404, {}));
    await expect(stats.mine('missing')).resolves.toEqual([]);
  });
});

describe('npm bulk paths', () => {
  it('returns null when the bulk point has no row for the package', async () => {
    globalThis.fetch = vi.fn(async () => json(200, {}));
    await expect(stats.bulk('npm', ['ghost'])).resolves.toEqual([null]);
  });

  it('keeps unscoped bulk rows and scoped package rows in request order', async () => {
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/point/')) {
        return json(200, {
          plain: { downloads: url.includes('last-month') ? 8 : 1 },
        });
      }
      return json(200, {
        downloads: [{ day: '2025-01-01', downloads: 3 }],
        start: '2025-01-01',
        end: '2025-01-01',
        package: '@scope/pkg',
      });
    });

    const results = await stats.bulk('npm', ['plain', '@scope/pkg']);
    expect(results[0]?.package).toBe('plain');
    expect(results[0]?.downloads.lastMonth).toBe(8);
    expect(results[1]?.package).toBe('@scope/pkg');
    expect(results[1]?.downloads.lastDay).toBe(3);
  });
});

describe('stats.range without a cache', () => {
  it('returns the provider rows directly', async () => {
    globalThis.fetch = vi.fn(async () => json(200, {
      downloads: [{ day: '2025-01-01', downloads: 4 }],
      start: '2025-01-01',
      end: '2025-01-01',
      package: 'left-pad',
    }));
    await expect(stats.range('npm', 'left-pad', '2025-01-01', '2025-01-01')).resolves.toEqual([
      { date: '2025-01-01', downloads: 4 },
    ]);
  });
});

describe('createCache limits', () => {
  it('sweeps expired entries on write and drops the oldest past 1000', () => {
    const cache = createCache();
    cache.set('old', point, -1);
    cache.set('fresh', point, 60_000);
    expect(cache.get('old')).toBeUndefined();
    expect(cache.get('fresh')).toEqual(point);

    for (let i = 0; i < 1001; i++) {
      cache.set(`k${i}`, { ...point, package: `p${i}` } as PackageStats, 60_000);
    }
    expect(cache.get('fresh')).toBeUndefined();
    expect(cache.get('k1000')?.package).toBe('p1000');
  });
});

describe('stats.all failure reasons', () => {
  it('stringifies a rejection that is not an Error', async () => {
    registerProvider({
      name: 'cover-string-throw',
      async getStats() {
        throw 'boom';
      },
    });
    const result = await stats.all('left-pad', { registries: ['cover-string-throw'] });
    expect(result.errors?.[0]).toMatchObject({ registry: 'cover-string-throw', message: 'boom' });
  });
});
