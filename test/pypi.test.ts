import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { pypi } from '../src/providers/pypi.js';

const LIVE = process.env.LIVE_API === '1';
const liveIt = LIVE ? it : it.skip;

const originalFetch = globalThis.fetch;

function mockFetch(handler: (url: string) => Promise<{ status: number; body?: unknown }>) {
  globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const resp = await handler(url);
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

/** The pypi gap is 2.2s. If the first of the pair rejects, the second call is still queued. */
function trackPypiFetches(): { fetches: number; drain: () => Promise<void> } {
  const gate = {
    fetches: 0,
    async drain() {
      const start = Date.now();
      while (gate.fetches < 2 && Date.now() - start < 3_000) {
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
    },
  };
  return gate;
}

describe('pypi provider (mocked)', () => {
  it('getStats returns structured result for valid package', async () => {
    mockFetch(async (url) => {
      if (url.includes('/recent')) {
        return {
          status: 200,
          body: { data: { last_day: 100, last_week: 700, last_month: 3000 }, package: 'requests', type: 'recent_downloads' },
        };
      }
      return {
        status: 200,
        body: {
          data: [
            { category: 'without_mirrors', date: '2025-01-01', downloads: 5000 },
            { category: 'without_mirrors', date: '2025-01-02', downloads: 6000 },
            { category: 'with_mirrors', date: '2025-01-01', downloads: 9000 },
          ],
          package: 'requests',
          type: 'overall_downloads',
        },
      };
    });

    const result = await pypi.getStats('requests');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('pypi');
    expect(result!.package).toBe('requests');
    expect(result!.downloads.lastDay).toBe(100);
    expect(result!.downloads.lastWeek).toBe(700);
    expect(result!.downloads.lastMonth).toBe(3000);
    expect(result!.downloads.total).toBe(11000); // 5000 + 6000 without_mirrors
    expect(result!.fetchedAt).toBeTruthy();
  });

  it('keeps a real zero all-time total', async () => {
    mockFetch(async (url: string) => {
      if (url.includes('/overall')) {
        return {
          status: 200,
          body: {
            data: [{ category: 'without_mirrors', date: '2025-01-01', downloads: 0 }],
            package: 'empty-pkg',
            type: 'overall_downloads',
          },
        };
      }
      return {
        status: 200,
        body: {
          data: { last_day: 0, last_week: 0, last_month: 0 },
          package: 'empty-pkg',
          type: 'recent_downloads',
        },
      };
    });

    const result = await pypi.getStats('empty-pkg');
    expect(result!.downloads.total).toBe(0);
  });

  it('keeps recent downloads when the overall request fails', async () => {
    const gate = trackPypiFetches();
    mockFetch(async (url) => {
      gate.fetches += 1;
      if (url.includes('/overall')) return { status: 400, body: { message: 'overall down' } };
      return {
        status: 200,
        body: { data: { last_day: 3, last_week: 9, last_month: 40 }, package: 'requests', type: 'recent_downloads' },
      };
    });

    try {
      const result = await pypi.getStats('requests');
      expect(result).not.toBeNull();
      expect(result!.downloads.lastDay).toBe(3);
      expect(result!.downloads.lastWeek).toBe(9);
      expect(result!.downloads.lastMonth).toBe(40);
      expect(result!.downloads.total).toBeUndefined();
    } finally {
      await gate.drain();
    }
  });

  it('keeps the overall total when the recent request fails', async () => {
    const gate = trackPypiFetches();
    mockFetch(async (url) => {
      gate.fetches += 1;
      if (url.includes('/recent')) return { status: 400, body: { message: 'recent down' } };
      return {
        status: 200,
        body: {
          data: [{ category: 'without_mirrors', date: '2025-01-01', downloads: 12 }],
          package: 'requests',
          type: 'overall_downloads',
        },
      };
    });

    try {
      const result = await pypi.getStats('requests');
      expect(result).not.toBeNull();
      expect(result!.downloads.total).toBe(12);
      expect(result!.downloads.lastDay).toBeUndefined();
      expect(result!.downloads.lastWeek).toBeUndefined();
      expect(result!.downloads.lastMonth).toBeUndefined();
    } finally {
      await gate.drain();
    }
  });

  it('getStats returns null when both endpoints return 404', async () => {
    mockFetch(async () => ({ status: 404 }));
    const result = await pypi.getStats('nonexistent-pkg');
    expect(result).toBeNull();
  });

  it('getRange returns filtered daily data within date range', async () => {
    mockFetch(async () => ({
      status: 200,
      body: {
        data: [
          { category: 'without_mirrors', date: '2025-01-01', downloads: 100 },
          { category: 'without_mirrors', date: '2025-01-02', downloads: 200 },
          { category: 'without_mirrors', date: '2025-01-03', downloads: 300 },
          { category: 'without_mirrors', date: '2025-01-10', downloads: 999 },
          { category: 'with_mirrors', date: '2025-01-01', downloads: 500 },
          { category: 'without_mirrors', date: null, downloads: 400 },
        ],
        package: 'requests',
        type: 'overall_downloads',
      },
    }));

    const data = await pypi.getRange!('requests', '2025-01-01', '2025-01-03');
    expect(data.length).toBe(3);
    expect(data[0]).toEqual({ date: '2025-01-01', downloads: 100 });
    expect(data[1]).toEqual({ date: '2025-01-02', downloads: 200 });
    expect(data[2]).toEqual({ date: '2025-01-03', downloads: 300 });
  });

  it('getRange rejects a range that is not a day or runs backwards', async () => {
    mockFetch(async () => ({
      status: 200,
      body: { data: [], package: 'requests', type: 'overall_downloads' },
    }));
    await expect(pypi.getRange!('requests', 'not-a-date', '2025-01-01')).rejects.toThrow(/Invalid date range/);
    await expect(pypi.getRange!('requests', '2025-02-31', '2025-03-01')).rejects.toThrow(/Invalid date range/);
    await expect(pypi.getRange!('requests', '2025-06-01', '2025-01-01')).rejects.toThrow(/Invalid date range/);
  }, 15000);

  it('getRange returns empty array when API returns 404', async () => {
    mockFetch(async () => ({ status: 404 }));
    const data = await pypi.getRange!('nonexistent', '2025-01-01', '2025-01-07');
    expect(data).toEqual([]);
  });

  it('URL-encodes package name in API path', async () => {
    mockFetch(async (url) => {
      expect(url).toContain(encodeURIComponent('../../etc/passwd'));
      return { status: 404 };
    });

    await pypi.getStats('../../etc/passwd');
  });
});

describe('pypi provider (live)', () => {
  liveIt('fetches stats for a known package', async () => {
    const result = await stats('pypi', 'requests');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('pypi');
    expect(result!.downloads.lastWeek).toBeGreaterThan(0);
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  liveIt('returns null for nonexistent package', async () => {
    const result = await stats('pypi', 'this-package-does-not-exist-xyz-123-abc');
    expect(result).toBeNull();
  }, 15000);
});
