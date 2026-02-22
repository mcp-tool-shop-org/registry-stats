import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithRetry } from '../src/fetch.js';

const originalFetch = globalThis.fetch;

function mockFetch(responses: { status: number; body?: unknown; headers?: Record<string, string> }[]) {
  let callIndex = 0;
  globalThis.fetch = vi.fn(async () => {
    const resp = responses[callIndex++] ?? responses[responses.length - 1];
    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      statusText: `Status ${resp.status}`,
      headers: {
        get: (name: string) => resp.headers?.[name.toLowerCase()] ?? null,
      },
      json: async () => resp.body,
    } as unknown as Response;
  });
  return globalThis.fetch as ReturnType<typeof vi.fn>;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchWithRetry', () => {
  it('returns data on 200', async () => {
    const mock = mockFetch([{ status: 200, body: { ok: true } }]);
    const result = await fetchWithRetry<{ ok: boolean }>('https://example.com', 'npm');
    expect(result).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('returns null on 404 without retry', async () => {
    const mock = mockFetch([{ status: 404 }]);
    const result = await fetchWithRetry('https://example.com', 'npm');
    expect(result).toBeNull();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('retries on 429 and succeeds', async () => {
    const mock = mockFetch([
      { status: 429, headers: { 'retry-after': '0' } },
      { status: 200, body: { retried: true } },
    ]);
    const result = await fetchWithRetry<{ retried: boolean }>('https://example.com', 'npm');
    expect(result).toEqual({ retried: true });
    expect(mock).toHaveBeenCalledTimes(2);
  }, 15000);

  it('retries on 500 and succeeds', async () => {
    const mock = mockFetch([
      { status: 500 },
      { status: 200, body: { recovered: true } },
    ]);
    const result = await fetchWithRetry<{ recovered: boolean }>('https://example.com', 'pypi');
    expect(result).toEqual({ recovered: true });
    expect(mock).toHaveBeenCalledTimes(2);
  }, 15000);

  it('retries on 502, 503, 504', async () => {
    const mock = mockFetch([
      { status: 502 },
      { status: 503 },
      { status: 504 },
      { status: 200, body: { ok: true } },
    ]);
    const result = await fetchWithRetry<{ ok: boolean }>('https://example.com', 'npm');
    expect(result).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledTimes(4);
  }, 30000);

  it('throws after max retries exhausted', async () => {
    mockFetch([
      { status: 500 },
      { status: 500 },
      { status: 500 },
      { status: 500 },
    ]);
    await expect(fetchWithRetry('https://example.com', 'docker')).rejects.toThrow('[docker]');
  }, 30000);

  it('does not retry on 400 (non-retryable)', async () => {
    const mock = mockFetch([{ status: 400 }]);
    await expect(fetchWithRetry('https://example.com', 'npm')).rejects.toThrow('[npm]');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('does not retry on 403 (non-retryable)', async () => {
    const mock = mockFetch([{ status: 403 }]);
    await expect(fetchWithRetry('https://example.com', 'pypi')).rejects.toThrow('[pypi]');
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('includes retryAfter in error when present', async () => {
    mockFetch([{ status: 429, headers: { 'retry-after': '0' } }]);
    try {
      await fetchWithRetry('https://example.com', 'docker');
    } catch (e: any) {
      expect(e.retryAfter).toBe(0);
      expect(e.statusCode).toBe(429);
      expect(e.registry).toBe('docker');
    }
  }, 30000);

  it('passes RequestInit through to fetch', async () => {
    const mock = mockFetch([{ status: 200, body: {} }]);
    await fetchWithRetry('https://example.com', 'vscode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(mock).toHaveBeenCalledWith('https://example.com', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
  });
});
