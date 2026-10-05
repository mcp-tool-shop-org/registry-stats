import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats, createCache, registerProvider } from '../src/index.js';

const originalFetch = globalThis.fetch;

/**
 * Mock globalThis.fetch the same way src/contract.test.ts / test/npm.test.ts do.
 * The handler routes by URL so a single mock serves both the npm range endpoint
 * (used by getStats → stats()) and the bulk point endpoint (used by stats.bulk).
 */
function mockFetch(handler: (url: string, init?: RequestInit) => Promise<{ status: number; body?: unknown }>) {
  globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const resp = await handler(url, init);
    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      statusText: `Status ${resp.status}`,
      headers: { get: () => null },
      json: async () => resp.body,
    } as unknown as Response;
  });
}

/** A 30-day range body so npm.getStats() derives non-null day/week/month figures. */
function rangeBody(pkg: string) {
  return {
    downloads: Array.from({ length: 30 }, (_, i) => ({
      day: `2025-01-${String(i + 1).padStart(2, '0')}`,
      downloads: 1000 + i,
    })),
    start: '2025-01-01',
    end: '2025-01-30',
    package: pkg,
  };
}

const fetchCalls = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length;

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('cache', () => {
  it('returns cached result on second call without re-fetching', async () => {
    mockFetch(async () => ({ status: 200, body: rangeBody('express') }));

    const cache = createCache();
    const opts = { cache, cacheTtlMs: 60_000 };

    const first = await stats('npm', 'express', opts);
    expect(first).not.toBeNull();
    const afterFirst = fetchCalls();
    expect(afterFirst).toBeGreaterThan(0);

    const second = await stats('npm', 'express', opts);
    expect(second).not.toBeNull();

    // Cache hit: the second call must NOT trigger any additional fetch.
    expect(fetchCalls()).toBe(afterFirst);
    // Same object returned from cache, so fetchedAt is identical.
    expect(second!.fetchedAt).toBe(first!.fetchedAt);
  });

  it('cache expires after TTL and re-fetches', async () => {
    mockFetch(async () => ({ status: 200, body: rangeBody('express') }));

    const cache = createCache();
    const opts = { cache, cacheTtlMs: 1 }; // 1ms TTL

    const first = await stats('npm', 'express', opts);
    expect(first).not.toBeNull();
    const afterFirst = fetchCalls();

    // Real wall-clock wait > TTL guarantees the cached entry is expired
    // (the cache compares Date.now() > expiresAt). No network either way.
    await new Promise((r) => setTimeout(r, 10));

    const second = await stats('npm', 'express', opts);
    expect(second).not.toBeNull();

    // Cache expired: the second call must trigger a fresh fetch.
    expect(fetchCalls()).toBeGreaterThan(afterFirst);
  });
});

describe('bulk concurrency', () => {
  it('caps in-flight getStats calls on a provider that is not the npm bulk path', async () => {
    async function maxInFlight(concurrency: number, count: number): Promise<number> {
      let inFlight = 0;
      let peak = 0;
      registerProvider({
        name: 'bulk-lane',
        async getStats(pkg: string) {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          await new Promise((resolve) => setTimeout(resolve, 30));
          inFlight -= 1;
          return {
            registry: 'npm',
            package: pkg,
            downloads: { total: 1 },
            fetchedAt: '2026-01-01T00:00:00.000Z',
          };
        },
      });
      const names = Array.from({ length: count }, (_, i) => `pkg-${i}`);
      const results = await stats.bulk('bulk-lane', names, { concurrency });
      expect(results).toHaveLength(count);
      expect(results.every((row) => row !== null)).toBe(true);
      return peak;
    }

    expect(await maxInFlight(2, 3)).toBe(2);
    expect(await maxInFlight(1, 3)).toBe(1);
    expect(await maxInFlight(8, 3)).toBe(3);
  });
});
