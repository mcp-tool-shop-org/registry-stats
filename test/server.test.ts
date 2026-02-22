import { describe, it, expect, afterAll } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHandler } from '../src/server.js';

function startTestServer() {
  const handler = createHandler();
  const server = createServer(handler);
  return new Promise<{ server: typeof server; port: number }>((resolve) => {
    server.listen(0, () => {
      const addr = server.address() as { port: number };
      resolve({ server, port: addr.port });
    });
  });
}

let testServer: Awaited<ReturnType<typeof startTestServer>>;

afterAll(() => {
  testServer?.server.close();
});

describe('REST API server', () => {
  it('returns endpoint list at /', async () => {
    testServer = await startTestServer();
    const res = await fetch(`http://localhost:${testServer.port}/`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('@mcptoolshop/registry-stats');
    expect(body.endpoints).toBeInstanceOf(Array);
  });

  it('returns 404 for unknown routes', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/api/unknown`);
    expect(res.status).toBe(404);
  });

  it('returns 405 for non-GET methods', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/stats/express`, {
      method: 'POST',
    });
    expect(res.status).toBe(405);
  });

  it('handles CORS preflight', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/stats/express`, {
      method: 'OPTIONS',
    });
    expect(res.status).toBe(204);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('fetches stats for a known npm package', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/stats/npm/express`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.registry).toBe('npm');
    expect(body.package).toBe('express');
    expect(body.downloads).toBeDefined();
  }, 15000);

  it('returns 404 for nonexistent package', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/stats/npm/this-package-does-not-exist-xyz-999`);
    expect(res.status).toBe(404);
  }, 15000);

  it('compares a package across registries', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/compare/express?registries=npm`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.package).toBe('express');
    expect(body.registries).toBeDefined();
  }, 15000);

  it('returns error for range without start/end', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/range/npm/express`);
    expect(res.status).toBe(400);
  });
});
