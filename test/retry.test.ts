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
    // Four 429s exhaust the retry budget. A trailing 200 must not be reached:
    // repeating the 429 forever would hide a success-on-an-extra-retry bug,
    // and a 429 that returns null (like 404) must fail expect.assertions.
    const mock = mockFetch([
      { status: 429, headers: { 'retry-after': '0' } },
      { status: 429, headers: { 'retry-after': '0' } },
      { status: 429, headers: { 'retry-after': '0' } },
      { status: 429, headers: { 'retry-after': '0' } },
      { status: 200, body: { leaked: true } },
    ]);
    expect.assertions(2);
    await expect(fetchWithRetry('https://example.com', 'docker')).rejects.toMatchObject({
      retryAfter: 0,
      statusCode: 429,
      registry: 'docker',
    });
    expect(mock).toHaveBeenCalledTimes(4);
  }, 30000);

  it('passes RequestInit through to fetch', async () => {
    const mock = mockFetch([{ status: 200, body: {} }]);
    await fetchWithRetry('https://example.com', 'vscode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(mock).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    }));
  });

  it('aborts the fetch signal from the caller signal and from the 30s timeout', async () => {
    const mock = mockFetch([{ status: 200, body: {} }]);
    const timeout = new AbortController();
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout').mockImplementation((ms: number) => {
      expect(ms).toBe(30_000);
      return timeout.signal;
    });
    try {
      const caller = new AbortController();
      await fetchWithRetry('https://example.com', 'npm', { signal: caller.signal });
      const fetchSignal = (mock.mock.calls[0][1] as RequestInit).signal as AbortSignal;
      expect(fetchSignal.aborted).toBe(false);
      expect(caller.signal.aborted).toBe(false);
      caller.abort();
      expect(fetchSignal.aborted).toBe(true);

      timeoutSpy.mockClear();
      mock.mockClear();
      const callerLive = new AbortController();
      const timeoutFired = new AbortController();
      timeoutSpy.mockImplementation((ms: number) => {
        expect(ms).toBe(30_000);
        return timeoutFired.signal;
      });
      await fetchWithRetry('https://example.com', 'npm', { signal: callerLive.signal });
      const merged = (mock.mock.calls[0][1] as RequestInit).signal as AbortSignal;
      expect(callerLive.signal.aborted).toBe(false);
      expect(merged.aborted).toBe(false);
      timeoutFired.abort();
      expect(merged.aborted).toBe(true);
      expect(callerLive.signal.aborted).toBe(false);
    } finally {
      timeoutSpy.mockRestore();
    }
  });
});
