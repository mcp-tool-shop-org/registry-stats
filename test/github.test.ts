import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { github } from '../src/providers/github.js';

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

    const result = await github.getStats('owner/repo');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('github');
    expect(result!.package).toBe('owner/repo');
    expect(result!.downloads.total).toBe(42);
    expect(result!.extra).toMatchObject({ releases: 2, assets: 3, latestTag: 'v2.0.0' });
  });

  it('returns total 0 for an existing repo with no releases', async () => {
    mockFetch(async () => ({ status: 200, body: [] }));
    const result = await github.getStats('owner/empty');
    expect(result).not.toBeNull();
    expect(result!.downloads.total).toBe(0);
  });

  it('returns null for a nonexistent repo (404 on first page)', async () => {
    mockFetch(async () => ({ status: 404 }));
    const result = await github.getStats('owner/missing');
    expect(result).toBeNull();
  });

  it('rejects identifiers that are not owner/repo', async () => {
    await expect(github.getStats('not-a-slug')).rejects.toThrow(/owner\/repo/);
    await expect(github.getStats('owner/../etc')).rejects.toThrow(/traversal|owner\/repo/);
  });

  it('is registered and reachable via stats()', async () => {
    mockFetch(async () => ({ status: 200, body: [{ tag_name: 'v1', published_at: null, assets: [{ name: 'a', download_count: 3 }] }] }));
    const result = await stats('github', 'owner/repo');
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
