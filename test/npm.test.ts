import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { npm, npmBulkPoint } from '../src/providers/npm.js';

const LIVE = process.env.LIVE_API === '1';
const liveIt = LIVE ? it : it.skip;

const originalFetch = globalThis.fetch;

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

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('npm provider (mocked)', () => {
  it('getStats returns structured result for valid package', async () => {
    mockFetch(async () => ({
      status: 200,
      body: {
        downloads: Array.from({ length: 30 }, (_, i) => ({
          day: `2025-01-${String(i + 1).padStart(2, '0')}`,
          downloads: 1000 + i,
        })),
        start: '2025-01-01',
        end: '2025-01-30',
        package: 'express',
      },
    }));

    const result = await npm.getStats('express');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('npm');
    expect(result!.package).toBe('express');
    expect(result!.downloads.lastDay).toBe(1029);
    expect(result!.downloads.lastWeek).toBeGreaterThan(0);
    expect(result!.downloads.lastMonth).toBeGreaterThan(0);
    expect(result!.fetchedAt).toBeTruthy();
  });

  it('getStats returns null when API returns empty data', async () => {
    mockFetch(async () => ({ status: 404 }));
    const result = await npm.getStats('nonexistent-pkg');
    expect(result).toBeNull();
  });

  it('getRange returns daily data across chunks', async () => {
    mockFetch(async () => ({
      status: 200,
      body: {
        downloads: [
          { day: '2025-01-01', downloads: 100 },
          { day: '2025-01-02', downloads: 200 },
        ],
        start: '2025-01-01',
        end: '2025-01-02',
        package: 'express',
      },
    }));

    const data = await npm.getRange!('express', '2025-01-01', '2025-01-02');
    expect(data.length).toBe(2);
    expect(data[0]).toEqual({ date: '2025-01-01', downloads: 100 });
    expect(data[1]).toEqual({ date: '2025-01-02', downloads: 200 });
  });

  it('npmBulkPoint returns download counts for multiple packages', async () => {
    mockFetch(async () => ({
      status: 200,
      body: {
        express: { downloads: 5000, start: '2025-01-01', end: '2025-01-31', package: 'express' },
        lodash: { downloads: 8000, start: '2025-01-01', end: '2025-01-31', package: 'lodash' },
      },
    }));

    const result = await npmBulkPoint(['express', 'lodash']);
    expect(result.get('express')).toBe(5000);
    expect(result.get('lodash')).toBe(8000);
  });

  it('npmBulkPoint returns empty map for empty input', async () => {
    const result = await npmBulkPoint([]);
    expect(result.size).toBe(0);
  });

  it('npmBulkPoint batches requests when exceeding 128 packages', async () => {
    const packages = Array.from({ length: 200 }, (_, i) => `pkg-${i}`);
    const bulkBody: Record<string, unknown> = {};
    for (const p of packages) {
      bulkBody[p] = { downloads: 1, start: '2025-01-01', end: '2025-01-31', package: p };
    }

    mockFetch(async () => ({ status: 200, body: bulkBody }));

    const result = await npmBulkPoint(packages);
    // Should have called fetch twice (128 + 72)
    expect((globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(2);
    expect(result.size).toBeGreaterThan(0);
  });

  it('URL-encodes scoped package names in API path', async () => {
    mockFetch(async (url) => {
      // Verify the scoped package name is encoded in the URL
      expect(url).toContain(encodeURIComponent('@scope/name'));
      return { status: 200, body: { downloads: [{ day: '2025-01-01', downloads: 100 }], start: '2025-01-01', end: '2025-01-31', package: '@scope/name' } };
    });

    await npm.getStats('@scope/name');
  });
});

describe('npm provider (live)', () => {
  liveIt('fetches stats for a known package', async () => {
    const result = await stats('npm', 'express');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('npm');
    expect(result!.package).toBe('express');
    expect(result!.downloads.lastWeek).toBeGreaterThan(0);
    expect(result!.downloads.lastMonth).toBeGreaterThan(0);
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  liveIt('returns null for nonexistent package', async () => {
    const result = await stats('npm', 'this-package-does-not-exist-xyz-123-abc');
    expect(result).toBeNull();
  }, 15000);

  liveIt('fetches range data', async () => {
    const data = await stats.range('npm', 'express', '2025-01-01', '2025-01-07');
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].date).toBeTruthy();
    expect(data[0].downloads).toBeGreaterThanOrEqual(0);
  }, 15000);
});
