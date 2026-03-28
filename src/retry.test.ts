import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchWithRetry, fetchDirect } from './fetch.js';
import { RegistryError } from './types.js';

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

function mockFetchError(error: Error, afterAttempts = 0) {
  let callIndex = 0;
  globalThis.fetch = vi.fn(async () => {
    callIndex++;
    if (callIndex <= afterAttempts) {
      return {
        ok: false,
        status: 500,
        statusText: 'Status 500',
        headers: { get: () => null },
        json: async () => ({}),
      } as unknown as Response;
    }
    throw error;
  });
  return globalThis.fetch as ReturnType<typeof vi.fn>;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('fetchWithRetry — network errors', () => {
  it('wraps DNS/network errors in RegistryError with statusCode 0', async () => {
    mockFetchError(new TypeError('fetch failed'));
    await expect(fetchWithRetry('https://example.com', 'npm')).rejects.toThrow(RegistryError);
    try {
      await fetchWithRetry('https://example.com', 'npm');
    } catch (e) {
      expect(e).toBeInstanceOf(RegistryError);
      const re = e as RegistryError;
      expect(re.statusCode).toBe(0);
      expect(re.registry).toBe('npm');
      expect(re.message).toContain('Network error');
      expect(re.message).toContain('fetch failed');
    }
  }, 30000);

  it('retries network errors before giving up', async () => {
    const mock = mockFetchError(new TypeError('connection refused'));
    await expect(fetchWithRetry('https://example.com', 'npm')).rejects.toThrow(RegistryError);
    // 1 initial + 3 retries = 4 calls
    expect(mock).toHaveBeenCalledTimes(4);
  }, 30000);

  it('wraps AbortError (timeout) in RegistryError', async () => {
    const abort = new DOMException('signal timed out', 'AbortError');
    mockFetchError(abort);
    try {
      await fetchWithRetry('https://example.com', 'pypi');
    } catch (e) {
      expect(e).toBeInstanceOf(RegistryError);
      const re = e as RegistryError;
      expect(re.statusCode).toBe(0);
      expect(re.message).toContain('Network error');
    }
  }, 30000);
});

describe('fetchDirect', () => {
  it('returns data on 200', async () => {
    const mock = mockFetch([{ status: 200, body: { value: 42 } }]);
    const result = await fetchDirect<{ value: number }>('https://example.com', 'npm');
    expect(result).toEqual({ value: 42 });
    expect(mock).toHaveBeenCalledTimes(1);
  });

  it('returns null on 404', async () => {
    mockFetch([{ status: 404 }]);
    const result = await fetchDirect('https://example.com', 'npm');
    expect(result).toBeNull();
  });

  it('retries on 500 and succeeds', async () => {
    const mock = mockFetch([
      { status: 500 },
      { status: 200, body: { ok: true } },
    ]);
    const result = await fetchDirect<{ ok: boolean }>('https://example.com', 'npm');
    expect(result).toEqual({ ok: true });
    expect(mock).toHaveBeenCalledTimes(2);
  }, 15000);

  it('throws RegistryError after max retries', async () => {
    mockFetch([{ status: 500 }, { status: 500 }, { status: 500 }, { status: 500 }]);
    await expect(fetchDirect('https://example.com', 'npm')).rejects.toThrow(RegistryError);
  }, 30000);

  it('wraps network errors in RegistryError', async () => {
    mockFetchError(new TypeError('network error'));
    await expect(fetchDirect('https://example.com', 'docker')).rejects.toThrow(RegistryError);
    try {
      await fetchDirect('https://example.com', 'docker');
    } catch (e) {
      expect(e).toBeInstanceOf(RegistryError);
      expect((e as RegistryError).statusCode).toBe(0);
    }
  }, 30000);

  it('does not throttle (no acquireSlot)', async () => {
    // fetchDirect should be faster than fetchWithRetry for same number of calls
    const mock = mockFetch([{ status: 200, body: {} }]);
    const start = Date.now();
    await fetchDirect('https://example.com', 'npm');
    const elapsed = Date.now() - start;
    expect(mock).toHaveBeenCalledTimes(1);
    // Should be very fast without throttle delay
    expect(elapsed).toBeLessThan(500);
  });
});
