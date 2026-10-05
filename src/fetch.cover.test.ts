import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindRequestSignal, fetchDirect, fetchWithRetry } from './fetch.js';
import { RegistryError } from './types.js';
import type { RegistryName } from './types.js';

const originalFetch = globalThis.fetch;
const originalAny = AbortSignal.any;

function response(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: `Status ${status}`,
    headers: { get: (name: string) => headers[name.toLowerCase()] ?? null },
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
  Object.defineProperty(AbortSignal, 'any', { configurable: true, writable: true, value: originalAny });
});

describe('fetch edges', () => {
  it('stops before the request when the handler already aborted', async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    const ac = new AbortController();
    ac.abort();
    await expect(
      bindRequestSignal(ac.signal, () => fetchDirect('https://example.test/x', 'npm')),
    ).rejects.toThrow(/Request aborted/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aborts a retry sleep instead of starting another attempt', async () => {
    vi.useFakeTimers();
    let calls = 0;
    globalThis.fetch = vi.fn(async () => {
      calls += 1;
      throw new TypeError('fetch failed');
    });
    const ac = new AbortController();
    const pending = bindRequestSignal(ac.signal, () => fetchDirect('https://example.test/sleep', 'npm'));
    const assertion = expect(pending).rejects.toThrow(/Request aborted/);
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toBe(1);
    ac.abort();
    await vi.advanceTimersByTimeAsync(10_000);
    await assertion;
    expect(calls).toBe(1);
  });

  it('caps a numeric Retry-After at 60s and ignores a date or junk', async () => {
    vi.useFakeTimers();
    const seen: string[] = [];
    globalThis.fetch = vi.fn(async () => {
      seen.push('call');
      if (seen.length === 1) return response(429, {}, { 'retry-after': '99999' });
      if (seen.length === 2) return response(503, {}, { 'retry-after': 'Wed, 21 Oct 2015 07:28:00 GMT' });
      if (seen.length === 3) return response(500, {}, { 'retry-after': '12abc' });
      return response(200, { ok: true });
    });

    const pending = fetchDirect('https://example.test/retry', 'npm');
    await vi.advanceTimersByTimeAsync(60_000);
    await vi.advanceTimersByTimeAsync(8_000);
    await expect(pending).resolves.toEqual({ ok: true });
    expect(seen.length).toBe(4);
  });

  it('rejects a 200 that is not JSON, including a non-Error throw', async () => {
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => {
        throw new SyntaxError('Unexpected token');
      },
    }) as unknown as Response);
    await expect(fetchDirect('https://example.test/json', 'npm')).rejects.toThrow(/Response was not valid JSON/);

    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: { get: () => null },
      json: async () => {
        throw 'bad';
      },
    }) as unknown as Response);
    await expect(fetchDirect('https://example.test/json2', 'pypi')).rejects.toThrow(/Response was not valid JSON/);
  });

  it('reads Authorization from a Headers object, a tuple list, and a blank header', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn(async () => response(200, { ok: true }));
    // A blank header is the unauthenticated lane. It has to run before a token
    // call only if nothing has armed the 60s gap yet; advance past that gap
    // so the later shapes are not a real minute.
    const blank = fetchWithRetry('https://example.test/gh', 'github', {
      headers: { Authorization: '   ' },
    });
    await vi.advanceTimersByTimeAsync(0);
    await blank;

    const asHeaders = fetchWithRetry('https://example.test/gh', 'github', {
      headers: new Headers({ Authorization: 'Bearer tok' }),
    });
    await vi.advanceTimersByTimeAsync(60_000);
    await asHeaders;

    const asTuples = fetchWithRetry('https://example.test/gh', 'github', {
      headers: [['Authorization', 'Bearer tok']],
    });
    await vi.advanceTimersByTimeAsync(60_000);
    await asTuples;
    expect(globalThis.fetch).toHaveBeenCalledTimes(3);
  });

  it('releases a registry slot when the handler aborts during the wait', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn(async () => response(200, { ok: true }));
    await fetchWithRetry('https://example.test/slot', 'nuget');

    const ac = new AbortController();
    const waiting = bindRequestSignal(ac.signal, () => fetchWithRetry('https://example.test/slot', 'nuget'));
    const settled = waiting.then(
      () => 'resolved',
      (err: unknown) => (err instanceof RegistryError ? err.message : 'other'),
    );
    await vi.advanceTimersByTimeAsync(10);
    ac.abort();
    await vi.advanceTimersByTimeAsync(500);
    const message = await settled;
    expect(message).toMatch(/Request aborted/);
  });

  it('drops the oldest registry lock once more than 50 names have been seen', async () => {
    globalThis.fetch = vi.fn(async () => response(200, { ok: true }));
    for (let i = 0; i < 52; i++) {
      await fetchWithRetry('https://example.test/lock', `custom-${i}` as RegistryName);
    }
    expect(globalThis.fetch).toHaveBeenCalledTimes(52);
  });

  it('merges an extra abort signal when AbortSignal.any is missing', async () => {
    Object.defineProperty(AbortSignal, 'any', { configurable: true, writable: true, value: undefined });
    const user = new AbortController();
    globalThis.fetch = vi.fn(async (_input: unknown, init?: RequestInit) => {
      expect(init?.signal?.aborted).toBe(false);
      return response(200, { ok: true });
    });
    await expect(fetchDirect('https://example.test/merge', 'npm', { signal: user.signal })).resolves.toEqual({ ok: true });

    user.abort();
    const fetchMock = vi.fn(async () => response(200, { ok: true }));
    globalThis.fetch = fetchMock;
    await expect(fetchDirect('https://example.test/merge-aborted', 'npm', { signal: user.signal })).rejects.toBeInstanceOf(RegistryError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('wraps a non-Error fetch failure as a network error', async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn(async () => {
      throw 'nope';
    });
    const pending = fetchDirect('https://example.test/str', 'docker');
    const assertion = expect(pending).rejects.toThrow(/Network error: nope/);
    await vi.advanceTimersByTimeAsync(20_000);
    await assertion;
  });
});
