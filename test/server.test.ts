import { describe, it, expect, afterAll, vi, beforeEach } from 'vitest';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { createHandler, createRateLimiter } from '../src/server.js';

// --- Mock upstream modules so tests don't hit real registries ---

vi.mock('../src/index.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/index.js')>();

  // Lightweight mock stats function
  const mockStats: any = async (registry: string, pkg: string) => {
    if (registry === 'timeout-registry') {
      // Simulate a hang — never resolves
      return new Promise(() => {});
    }
    if (pkg === 'nonexistent') return null;
    return {
      registry,
      package: pkg,
      downloads: { lastDay: 100, lastWeek: 700, lastMonth: 3000 },
      fetchedAt: new Date().toISOString(),
    };
  };

  mockStats.all = async (pkg: string) => {
    if (pkg === 'timeout-pkg') return new Promise(() => {});
    return [
      { registry: 'npm', package: pkg, downloads: { lastMonth: 3000 }, fetchedAt: new Date().toISOString() },
      { registry: 'pypi', package: pkg, downloads: { lastMonth: 1500 }, fetchedAt: new Date().toISOString() },
    ];
  };

  mockStats.compare = async (pkg: string, registries?: string[]) => ({
    package: pkg,
    registries: {
      npm: { registry: 'npm', package: pkg, downloads: { lastMonth: 3000 }, fetchedAt: new Date().toISOString() },
    },
    fetchedAt: new Date().toISOString(),
  });

  mockStats.range = async (registry: string, pkg: string, start: string, end: string) => {
    if (registry === 'timeout-registry') return new Promise(() => {});
    return [
      { date: start, downloads: 100 },
      { date: end, downloads: 200 },
    ];
  };

  return {
    ...actual,
    stats: mockStats,
  };
});

// Re-import RegistryError so we can throw it in tests
import { RegistryError } from '../src/types.js';
import { stats } from '../src/index.js';

function startTestServer(handlerOpts?: Parameters<typeof createHandler>[0]) {
  const handler = createHandler(handlerOpts);
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

  it('fetches stats for a single registry package', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/stats/npm/express`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.registry).toBe('npm');
    expect(body.package).toBe('express');
    expect(body.downloads).toBeDefined();
  });

  it('returns 404 for nonexistent package', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/stats/npm/nonexistent`);
    expect(res.status).toBe(404);
  });

  it('compares a package across registries', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/compare/express?registries=npm`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.package).toBe('express');
    expect(body.registries).toBeDefined();
  });

  it('returns error for range without start/end', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/range/npm/express`);
    expect(res.status).toBe(400);
  });
});

// --- F-007: All-registries stats endpoint ---
describe('GET /stats/:package (all registries)', () => {
  it('returns stats from all registries', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/stats/express`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0].registry).toBeDefined();
    expect(body[0].downloads).toBeDefined();
  });
});

// --- F-008: Range endpoint success paths ---
describe('GET /range success paths', () => {
  it('returns JSON by default', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/range/npm/express?start=2025-01-01&end=2025-01-07`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toHaveProperty('date');
    expect(body[0]).toHaveProperty('downloads');
  });

  it('returns CSV with correct headers', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/range/npm/express?start=2025-01-01&end=2025-01-07&format=csv`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toBe('text/csv');
    const disposition = res.headers.get('content-disposition');
    expect(disposition).toContain('attachment');
    expect(disposition).toContain('.csv');
    const text = await res.text();
    expect(text).toContain('date,downloads');
  });

  it('returns chart data', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/range/npm/express?start=2025-01-01&end=2025-01-07&format=chart`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.labels).toBeInstanceOf(Array);
    expect(body.datasets).toBeInstanceOf(Array);
    expect(body.datasets[0].data).toBeInstanceOf(Array);
  });
});

// --- F-009: Upstream RegistryError propagation ---
describe('RegistryError propagation', () => {
  it('maps 429 to 429', async () => {
    // Temporarily override stats to throw RegistryError
    const original = (stats as any).__proto__;
    vi.spyOn(stats as any, 'all').mockRejectedValueOnce(
      new RegistryError('npm', 429, 'Rate limited', 60),
    );
    const res = await fetch(`http://localhost:${testServer.port}/stats/test-pkg-429`);
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.error).toContain('Rate limited');
  });

  it('maps 404 to 404', async () => {
    vi.spyOn(stats as any, 'all').mockRejectedValueOnce(
      new RegistryError('npm', 404, 'Not found'),
    );
    const res = await fetch(`http://localhost:${testServer.port}/stats/test-pkg-404`);
    expect(res.status).toBe(404);
  });

  it('maps 5xx to 502', async () => {
    vi.spyOn(stats as any, 'all').mockRejectedValueOnce(
      new RegistryError('npm', 503, 'Service unavailable'),
    );
    const res = await fetch(`http://localhost:${testServer.port}/stats/test-pkg-502`);
    expect(res.status).toBe(502);
  });

  it('maps unknown status to 500', async () => {
    vi.spyOn(stats as any, 'all').mockRejectedValueOnce(
      new RegistryError('npm', 0, 'Unknown error'),
    );
    const res = await fetch(`http://localhost:${testServer.port}/stats/test-pkg-500`);
    expect(res.status).toBe(500);
  });

  it('returns generic message for non-RegistryError', async () => {
    vi.spyOn(stats as any, 'all').mockRejectedValueOnce(
      new Error('ENOENT: no such file /internal/path'),
    );
    const res = await fetch(`http://localhost:${testServer.port}/stats/test-pkg-internal`);
    expect(res.status).toBe(500);
    const body = await res.json();
    // Must NOT leak internal error details
    expect(body.error).toBe('Internal server error');
    expect(body.error).not.toContain('ENOENT');
  });
});

// --- F-001: Rate limiting ---
describe('rate limiting', () => {
  it('createRateLimiter allows requests within limit', () => {
    const limiter = createRateLimiter(3, 60);
    expect(limiter.allow('1.2.3.4')).toBe(true);
    expect(limiter.allow('1.2.3.4')).toBe(true);
    expect(limiter.allow('1.2.3.4')).toBe(true);
  });

  it('createRateLimiter blocks after limit exceeded', () => {
    const limiter = createRateLimiter(2, 60);
    expect(limiter.allow('1.2.3.4')).toBe(true);
    expect(limiter.allow('1.2.3.4')).toBe(true);
    expect(limiter.allow('1.2.3.4')).toBe(false);
  });

  it('createRateLimiter tracks IPs independently', () => {
    const limiter = createRateLimiter(1, 60);
    expect(limiter.allow('1.1.1.1')).toBe(true);
    expect(limiter.allow('2.2.2.2')).toBe(true);
    expect(limiter.allow('1.1.1.1')).toBe(false);
    expect(limiter.allow('2.2.2.2')).toBe(false);
  });

  it('server returns 429 when rate limit exceeded', async () => {
    // Create a server with very low limit
    const limited = await startTestServer({ rateLimitMax: 2, rateLimitWindowSeconds: 60 });
    try {
      const res1 = await fetch(`http://localhost:${limited.port}/`);
      expect(res1.status).toBe(200);
      const res2 = await fetch(`http://localhost:${limited.port}/`);
      expect(res2.status).toBe(200);
      const res3 = await fetch(`http://localhost:${limited.port}/`);
      expect(res3.status).toBe(429);
      const body = await res3.json();
      expect(body.error).toContain('Too many requests');
    } finally {
      limited.server.close();
    }
  });
});

// --- F-005: Security headers ---
describe('security headers', () => {
  it('sets X-Content-Type-Options: nosniff', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/`);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('sets X-Frame-Options: DENY', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/`);
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });

  it('sets X-XSS-Protection', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/`);
    expect(res.headers.get('x-xss-protection')).toBe('1; mode=block');
  });

  it('sets Cache-Control: no-store', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/`);
    expect(res.headers.get('cache-control')).toBe('no-store');
  });

  it('security headers present on error responses too', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/nonexistent`);
    expect(res.status).toBe(404);
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });
});

// --- F-003: corsOrigin wired ---
describe('CORS origin configuration', () => {
  it('uses configured corsOrigin', async () => {
    const srv = await startTestServer({ corsOrigin: 'https://example.com' });
    try {
      const res = await fetch(`http://localhost:${srv.port}/`);
      expect(res.headers.get('access-control-allow-origin')).toBe('https://example.com');
    } finally {
      srv.server.close();
    }
  });

  it('defaults to * when no corsOrigin set', async () => {
    const res = await fetch(`http://localhost:${testServer.port}/`);
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
  });
});

// --- F-004: Content-Disposition sanitization ---
describe('Content-Disposition sanitization', () => {
  it('sanitizes special characters in CSV filename', async () => {
    // Package name with injection attempt
    const res = await fetch(`http://localhost:${testServer.port}/range/npm/%22%3B%20injected/express?start=2025-01-01&end=2025-01-07&format=csv`);
    expect(res.status).toBe(200);
    const disposition = res.headers.get('content-disposition');
    // Should not contain raw quotes or semicolons
    expect(disposition).not.toContain('"; injected');
  });
});

// --- F-002: Request timeout ---
describe('request timeout', () => {
  it('returns 504 on timeout', async () => {
    // Create a server with a very short timeout
    const srv = await startTestServer({ requestTimeoutMs: 50 });
    try {
      // The mock for 'timeout-registry' never resolves
      const res = await fetch(`http://localhost:${srv.port}/stats/timeout-registry/some-pkg`);
      expect(res.status).toBe(504);
      const body = await res.json();
      expect(body.error).toBe('Gateway timeout');
    } finally {
      srv.server.close();
    }
  });
});
