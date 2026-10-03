import { describe, it, expect, afterEach } from 'vitest';
import { createServer } from 'node:http';
import { createHandler } from '../src/server.js';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('HTTP registry spacing', () => {
  it('keeps the registry gap after a successful response', async () => {
    const stamps: number[] = [];
    globalThis.fetch = async (input, init) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (url.startsWith('http://127.0.0.1') || url.startsWith('http://localhost')) {
        return originalFetch(input, init);
      }
      stamps.push(Date.now());
      return new Response(JSON.stringify({
        data: [{ id: 'Newtonsoft.Json', totalDownloads: 5, version: '13.0.3' }],
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    };

    const server = createServer(createHandler({ cache: false }));
    const port = await new Promise<number>((resolve) => {
      server.listen(0, '127.0.0.1', () => {
        resolve((server.address() as { port: number }).port);
      });
    });

    try {
      const first = await fetch(`http://127.0.0.1:${port}/stats/nuget/Newtonsoft.Json`);
      const second = await fetch(`http://127.0.0.1:${port}/stats/nuget/Newtonsoft.Json`);
      expect(first.status).toBe(200);
      expect(second.status).toBe(200);
      expect(stamps.length).toBe(2);
      // nuget uses the 100ms default gap. A success must not cancel that timer.
      expect(stamps[1] - stamps[0]).toBeGreaterThanOrEqual(90);
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => err ? reject(err) : resolve());
      });
    }
  }, 10000);
});
