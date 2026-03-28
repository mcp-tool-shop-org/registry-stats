import { describe, it, expect, vi, afterEach } from 'vitest';
import { stats } from '../src/index.js';
import { vscode } from '../src/providers/vscode.js';

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

describe('vscode provider (mocked)', () => {
  it('getStats returns structured result for valid extension', async () => {
    mockFetch(async () => ({
      status: 200,
      body: {
        results: [{
          extensions: [{
            extensionName: 'prettier-vscode',
            publisher: { publisherName: 'esbenp' },
            displayName: 'Prettier',
            statistics: [
              { statisticName: 'install', value: 30000000 },
              { statisticName: 'averagerating', value: 4.5 },
              { statisticName: 'ratingcount', value: 1000 },
            ],
          }],
        }],
      },
    }));

    const result = await vscode.getStats('esbenp.prettier-vscode');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('vscode');
    expect(result!.package).toBe('esbenp.prettier-vscode');
    expect(result!.downloads.total).toBe(30000000);
    expect(result!.extra?.rating).toBe(4.5);
  });

  it('getStats returns null for nonexistent extension', async () => {
    mockFetch(async () => ({
      status: 200,
      body: { results: [{ extensions: [] }] },
    }));

    const result = await vscode.getStats('nonexistent.extension');
    expect(result).toBeNull();
  });
});

describe('vscode provider (live)', () => {
  liveIt('fetches stats for a known extension', async () => {
    const result = await stats('vscode', 'esbenp.prettier-vscode');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('vscode');
    expect(result!.downloads.total).toBeGreaterThan(0);
    expect(result!.extra?.rating).toBeDefined();
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  liveIt('returns null for nonexistent extension', async () => {
    const result = await stats('vscode', 'nonexistent.extension-xyz-123');
    expect(result).toBeNull();
  }, 15000);
});
