import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { docker } from '../src/providers/docker.js';
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

describe('docker provider (mocked)', () => {
  it('getStats returns structured result for valid image', async () => {
    mockFetch(async () => ({
      status: 200,
      body: {
        name: 'node',
        namespace: 'library',
        pull_count: 1000000,
        star_count: 500,
        last_updated: '2025-01-01T00:00:00Z',
      },
    }));

    const result = await docker.getStats('library/node');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('docker');
    expect(result!.package).toBe('library/node');
    expect(result!.downloads.total).toBe(1000000);
    expect(result!.extra?.stars).toBe(500);
  });

  it('getStats returns null for nonexistent image', async () => {
    mockFetch(async () => ({ status: 404 }));
    const result = await docker.getStats('nonexistent/image');
    expect(result).toBeNull();
  }, 30000);

  it('rejects path-traversal segments instead of letting them collapse the URL', async () => {
    let fetched = false;
    mockFetch(async () => {
      fetched = true;
      return { status: 404 };
    });

    // '../../etc/passwd' splits into ['..', '..', 'etc', 'passwd'].
    // encodeURIComponent('..') === '..', so the old code passed it through and
    // the path collapsed to a different hub.docker.com resource. The provider
    // must now reject traversal segments before any request is made.
    await expect(docker.getStats('../../etc/passwd')).rejects.toThrow(RegistryError);
    await expect(docker.getStats('../../etc/passwd')).rejects.toThrow(/path traversal/);
    await expect(docker.getStats('a/../../b')).rejects.toThrow(/path traversal/);
    await expect(docker.getStats('a/./b')).rejects.toThrow(/path traversal/);
    expect(fetched).toBe(false);
  }, 30000);

  it('URL-encodes special characters in image path segments', async () => {
    mockFetch(async (url) => {
      // Spaces and special chars in segment names get encoded
      expect(url).toContain('my%20namespace/my%20image');
      return {
        status: 200,
        body: { name: 'my image', namespace: 'my namespace', pull_count: 10, star_count: 0, last_updated: '2025-01-01T00:00:00Z' },
      };
    });

    const result = await docker.getStats('my namespace/my image');
    expect(result).not.toBeNull();
  }, 30000);
});

describe('docker provider (live)', () => {
  liveIt('fetches stats for a known image', async () => {
    const result = await stats('docker', 'library/node');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('docker');
    expect(result!.downloads.total).toBeGreaterThan(0);
    expect(result!.extra?.stars).toBeDefined();
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  liveIt('returns null for nonexistent image', async () => {
    const result = await stats('docker', 'nonexistent-user-xyz/nonexistent-image-123');
    expect(result).toBeNull();
  }, 15000);
});
