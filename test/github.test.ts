import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { github } from '../src/providers/github.js';
import { RegistryError } from '../src/types.js';

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
  return globalThis.fetch as ReturnType<typeof vi.fn>;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
});

/** Flush GitHub's inter-request gap (60s when unauthenticated) without sleeping. */
async function settleGithub<T>(work: () => Promise<T>): Promise<T> {
  vi.useFakeTimers();
  try {
    const pending = work();
    let settled = false;
    const tracked = pending.finally(() => {
      settled = true;
    });
    for (let i = 0; i < 8 && !settled; i++) {
      await vi.advanceTimersByTimeAsync(60_000);
    }
    return await tracked;
  } finally {
    vi.useRealTimers();
  }
}

describe('github provider (mocked)', () => {
  it('sums asset download_count across all releases', async () => {
    mockFetch(async (url) => {
      // page 1 returns two releases, page 2 returns empty (end)
      if (url.includes('page=1')) {
        return {
          status: 200,
          body: [
            { tag_name: 'v2.0.0', published_at: '2026-01-01', assets: [{ name: 'bin-linux', download_count: 27 }, { name: 'checksums.txt', download_count: 5 }] },
            { tag_name: 'v1.0.0', published_at: '2025-06-01', assets: [{ name: 'bin-linux', download_count: 10 }] },
          ],
        };
      }
      return { status: 200, body: [] };
    });

    const result = await settleGithub(() => github.getStats('owner/repo'));
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('github');
    expect(result!.package).toBe('owner/repo');
    expect(result!.downloads.total).toBe(42);
    expect(result!.extra).toMatchObject({ releases: 2, assets: 3, latestTag: 'v2.0.0' });
  });

  it('returns total 0 for an existing repo with no releases', async () => {
    mockFetch(async () => ({ status: 200, body: [] }));
    const result = await settleGithub(() => github.getStats('owner/empty'));
    expect(result).not.toBeNull();
    expect(result!.downloads.total).toBe(0);
  });

  it('returns null for a nonexistent repo (404 on first page)', async () => {
    mockFetch(async () => ({ status: 404 }));
    const result = await settleGithub(() => github.getStats('owner/missing'));
    expect(result).toBeNull();
  });

  it('rejects identifiers that are not owner/repo', async () => {
    const fetchMock = mockFetch(async () => ({ status: 200, body: [] }));
    await expect(github.getStats('not-a-slug')).rejects.toMatchObject({ statusCode: 400 });
    await expect(github.getStats('not-a-slug')).rejects.toThrow(/expected "owner\/repo"/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // 'owner/../etc' is three segments, so a length check rejects it before the
  // '.' / '..' check. These names are exactly two segments.
  it('rejects a two-segment name containing . or .. before fetching', async () => {
    for (const name of ['owner/..', '../repo', 'owner/.', './repo', 'owner/']) {
      const fetchMock = mockFetch(async () => ({ status: 200, body: [] }));
      await expect(github.getStats(name)).rejects.toBeInstanceOf(RegistryError);
      await expect(github.getStats(name)).rejects.toThrow(`Invalid repository "${name}"`);
      expect(fetchMock).not.toHaveBeenCalled();
    }
  });

  it('sends a token, ignores a bad asset count, and stops when a later page is 404', async () => {
    const page = Array.from({ length: 100 }, (_, i) => ({
      tag_name: i === 0 ? '' : `v${i}`,
      published_at: null,
      assets: i === 1 ? undefined : [{ name: 'a', download_count: i === 2 ? 'nope' : 1 }],
    }));
    let auth: string | undefined;
    const urls: string[] = [];
    globalThis.fetch = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      urls.push(url);
      const headers = init?.headers as Record<string, string> | undefined;
      auth = headers?.Authorization;
      const status = url.includes('page=2') ? 404 : 200;
      const body = url.includes('page=2') ? { message: 'missing' } : page;
      return {
        ok: status >= 200 && status < 300,
        status,
        statusText: String(status),
        headers: { get: () => null },
        json: async () => body,
      } as unknown as Response;
    });

    const result = await settleGithub(() => github.getStats('owner/repo', { githubToken: 'gh-token' }));
    expect(auth).toBe('Bearer gh-token');
    expect(urls.some((url) => url.includes('page=1'))).toBe(true);
    expect(urls.some((url) => url.includes('page=2'))).toBe(true);
    expect(result).not.toBeNull();
    expect(result!.downloads.total).toBe(98);
    expect(result!.extra).toMatchObject({ releases: 100, latestTag: 'v1' });
  });

  it('is registered and reachable via stats()', async () => {
    mockFetch(async () => ({ status: 200, body: [{ tag_name: 'v1', published_at: null, assets: [{ name: 'a', download_count: 3 }] }] }));
    const result = await settleGithub(() => stats('github', 'owner/repo'));
    expect(result!.registry).toBe('github');
    expect(result!.downloads.total).toBe(3);
  });
});

describe('github provider (live)', () => {
  liveIt('fetches release stats for a known repo', async () => {
    const result = await stats('github', 'mcp-tool-shop-org/prism-verify');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('github');
    expect(result!.downloads.total).toBeGreaterThanOrEqual(0);
  }, 20000);
});
