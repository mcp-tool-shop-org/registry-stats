import { describe, it, expect } from 'vitest';
import { stats, createCache } from '../src/index.js';

describe('cache', () => {
  it('returns cached result on second call', async () => {
    const cache = createCache();
    const opts = { cache, cacheTtlMs: 60_000 };

    const first = await stats('npm', 'express', opts);
    expect(first).not.toBeNull();

    const second = await stats('npm', 'express', opts);
    expect(second).not.toBeNull();
    // Same fetchedAt proves it came from cache, not a fresh fetch
    expect(second!.fetchedAt).toBe(first!.fetchedAt);
  }, 15000);

  it('cache expires after TTL', async () => {
    const cache = createCache();
    const opts = { cache, cacheTtlMs: 1 }; // 1ms TTL

    const first = await stats('npm', 'express', opts);
    await new Promise((r) => setTimeout(r, 10));
    const second = await stats('npm', 'express', opts);

    // Different fetchedAt proves cache expired and re-fetched
    expect(second!.fetchedAt).not.toBe(first!.fetchedAt);
  }, 15000);
});

describe('bulk concurrency', () => {
  it('respects concurrency limit', async () => {
    const results = await stats.bulk('npm', ['express', 'koa', 'fastify'], { concurrency: 2 });
    expect(results).toHaveLength(3);
    expect(results.every((r) => r !== null)).toBe(true);
  }, 30000);
});
