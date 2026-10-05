import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { npm, npmBulkPoint } from '../src/providers/npm.js';
import { RegistryError } from '../src/types.js';

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
    let captured = '';
    const days = Array.from({ length: 30 }, (_, i) => ({
      day: `2025-01-${String(i + 1).padStart(2, '0')}`,
      downloads: 1000 + i,
    }));
    mockFetch(async (url) => {
      captured = url;
      return {
        status: 200,
        body: {
          downloads: days,
          start: '2025-01-01',
          end: '2025-01-30',
          package: 'express',
        },
      };
    });

    const now = new Date();
    const end = now.toISOString().slice(0, 10);
    const startDate = new Date(now);
    startDate.setUTCDate(startDate.getUTCDate() - 29);
    const start = startDate.toISOString().slice(0, 10);

    const result = await npm.getStats('express');
    expect(captured).toContain(`/range/${start}:${end}/express`);
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('npm');
    expect(result!.package).toBe('express');
    // Last mocked day, sum of the last 7 (1023..1029), sum of all 30 (1000..1029).
    expect(result!.downloads.lastDay).toBe(1029);
    expect(result!.downloads.lastWeek).toBe(7182);
    expect(result!.downloads.lastMonth).toBe(30435);
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

  it('getRange fetches a one-day window and rejects a non-date', async () => {
    let calls = 0;
    mockFetch(async (url) => {
      calls++;
      expect(url).toContain('/range/2025-01-01:2025-01-01/');
      return {
        status: 200,
        body: {
          downloads: [{ day: '2025-01-01', downloads: 7 }],
          start: '2025-01-01',
          end: '2025-01-01',
          package: 'express',
        },
      };
    });

    const data = await npm.getRange!('express', '2025-01-01', '2025-01-01');
    expect(calls).toBe(1);
    expect(data).toEqual([{ date: '2025-01-01', downloads: 7 }]);
    await expect(npm.getRange!('express', 'not-a-date', '2025-01-01')).rejects.toThrow(RegistryError);
    await expect(npm.getRange!('express', '2025-06-01', '2025-01-01')).rejects.toThrow(/Start is after end/);
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

  it('npmBulkPoint URL-encodes each name so traversal cannot escape the path', async () => {
    let capturedUrl = '';
    mockFetch(async (url) => {
      capturedUrl = url;
      return { status: 200, body: {} };
    });

    // A malicious "name" that, if joined raw, would break out of the
    // /point/last-month/ path. After encoding, the slashes/.. are escaped.
    await npmBulkPoint(['x/../../-/v1/search?text=foo', 'y']);

    // Raw traversal must NOT survive into the URL.
    expect(capturedUrl).not.toContain('x/../../-/v1/search');
    // The dangerous characters must appear in their encoded form.
    expect(capturedUrl).toContain(encodeURIComponent('x/../../-/v1/search?text=foo'));
  });

  it('npmBulkPoint batches at 128 names and puts only the remainder on the second call', async () => {
    const names128 = Array.from({ length: 128 }, (_, i) => `pkg-${i}`);
    const names129 = [...names128, 'pkg-128'];
    const urls: string[] = [];

    mockFetch(async (url) => {
      urls.push(url);
      const joined = new URL(url).pathname.split('/point/last-month/')[1] ?? '';
      const body: Record<string, unknown> = {};
      for (const name of joined.split(',').filter(Boolean)) {
        const decoded = decodeURIComponent(name);
        body[decoded] = { downloads: 1, start: '2025-01-01', end: '2025-01-31', package: decoded };
      }
      return { status: 200, body };
    });

    const one = await npmBulkPoint(names128);
    expect(urls).toHaveLength(1);
    expect(batchNames(urls[0])).toEqual(names128);
    expect(one.size).toBe(128);

    urls.length = 0;
    const two = await npmBulkPoint(names129);
    expect(urls).toHaveLength(2);
    expect(batchNames(urls[0])).toEqual(names129.slice(0, 128));
    expect(batchNames(urls[1])).toEqual(['pkg-128']);
    expect(two.size).toBe(129);
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

function batchNames(url: string): string[] {
  const joined = new URL(url).pathname.split('/point/last-month/')[1] ?? '';
  return joined.split(',').filter(Boolean).map((name) => decodeURIComponent(name));
}

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
