import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { nuget } from '../src/providers/nuget.js';

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

describe('nuget provider (mocked)', () => {
  it('getStats returns structured result for valid package', async () => {
    mockFetch(async () => ({
      status: 200,
      body: {
        data: [
          {
            id: 'Newtonsoft.Json',
            totalDownloads: 500000,
            version: '13.0.3',
          },
        ],
      },
    }));

    const result = await nuget.getStats('Newtonsoft.Json');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('nuget');
    expect(result!.package).toBe('Newtonsoft.Json');
    expect(result!.downloads.total).toBe(500000);
  });

  it('getStats returns null for nonexistent package', async () => {
    mockFetch(async () => ({ status: 404 }));
    const result = await nuget.getStats('NonexistentPackage');
    expect(result).toBeNull();
  });
});

describe('nuget provider (live)', () => {
  liveIt('fetches stats for a known package', async () => {
    const result = await stats('nuget', 'Newtonsoft.Json');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('nuget');
    expect(result!.downloads.total).toBeGreaterThan(0);
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  liveIt('returns null for nonexistent package', async () => {
    const result = await stats('nuget', 'ThisPackageDoesNotExistXyz123');
    expect(result).toBeNull();
  }, 15000);
});
