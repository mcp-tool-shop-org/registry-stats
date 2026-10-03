import { describe, it, expect, afterEach } from 'vitest';
import { stats, createCache } from '../src/index.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('StatsOptions.signal', () => {
  it('rejects without a request once the signal has aborted', async () => {
    let calls = 0;
    globalThis.fetch = async () => {
      calls++;
      return new Response('{}', { status: 200 });
    };
    const ac = new AbortController();
    ac.abort();
    await expect(stats('nuget', 'Newtonsoft.Json', { signal: ac.signal })).rejects.toThrow(/aborted/);
    expect(calls).toBe(0);
  });

  it('stops a 429 retry wait instead of sitting out Retry-After', async () => {
    globalThis.fetch = async () =>
      new Response('', { status: 429, statusText: 'Too Many Requests', headers: { 'retry-after': '60' } });
    const ac = new AbortController();
    const started = Date.now();
    setTimeout(() => ac.abort(), 50);
    await expect(stats('nuget', 'Newtonsoft.Json', { signal: ac.signal })).rejects.toThrow(/aborted/);
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it('stops a bulk pass, and a cached result still comes back after the abort', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [{ id: 'Newtonsoft.Json', totalDownloads: 5, version: '13.0.3' }] }),
        { status: 200, headers: { 'content-type': 'application/json' } });
    const cache = createCache();
    const first = await stats('nuget', 'Newtonsoft.Json', { cache });
    expect(first?.downloads.total).toBe(5);

    globalThis.fetch = async () =>
      new Response('', { status: 429, statusText: 'Too Many Requests', headers: { 'retry-after': '60' } });
    const ac = new AbortController();
    setTimeout(() => ac.abort(), 50);
    await expect(stats.bulk('nuget', ['Newtonsoft.Json', 'Serilog'], { cache, signal: ac.signal }))
      .rejects.toThrow(/aborted/);
    expect(await stats('nuget', 'Newtonsoft.Json', { cache, signal: ac.signal })).toEqual(first);
  });

  it('does not hold queued tokenless GitHub calls for 60s after an abort', async () => {
    globalThis.fetch = async () =>
      new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } });
    const ac = new AbortController();
    const started = Date.now();
    // The first call takes the lane; the next two queue behind the 60s tokenless gap.
    const calls = ['o/a', 'o/b', 'o/c'].map((repo) =>
      stats('github', repo, { signal: ac.signal }).then(() => 'ok', () => 'aborted'));
    setTimeout(() => ac.abort(), 50);
    const outcomes = await Promise.all(calls);
    expect(outcomes[0]).toBe('ok');
    expect(outcomes.slice(1)).toEqual(['aborted', 'aborted']);
    expect(Date.now() - started).toBeLessThan(5_000);
  });

  it('leaves calls without a signal unchanged', async () => {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ data: [{ id: 'Serilog', totalDownloads: 7, version: '4.0.0' }] }),
        { status: 200, headers: { 'content-type': 'application/json' } });
    const r = await stats('nuget', 'Serilog');
    expect(r?.downloads.total).toBe(7);
  });
});
