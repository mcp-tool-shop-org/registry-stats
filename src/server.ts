import { createServer as httpCreateServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { stats, createCache, calc } from './index.js';
import type { StatsOptions } from './types.js';
import { RegistryError } from './types.js';

export interface ServerOptions {
  port?: number;
  cache?: boolean;
  corsOrigin?: string;
  /** Max requests per IP per window (default: 60) */
  rateLimitMax?: number;
  /** Rate limit window in seconds (default: 60) */
  rateLimitWindowSeconds?: number;
  /** Upstream fetch timeout in ms (default: 30000) */
  requestTimeoutMs?: number;
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

// --- In-memory per-IP rate limiter ---

interface RateBucket {
  count: number;
  resetAt: number;
}

function createRateLimiter(maxRequests: number, windowSeconds: number) {
  const buckets = new Map<string, RateBucket>();

  // Periodic cleanup every 60s to avoid memory leaks
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(ip);
    }
  }, 60_000);
  cleanup.unref();

  return {
    /** Returns true if the request is allowed, false if rate-limited. */
    allow(ip: string): boolean {
      const now = Date.now();
      const bucket = buckets.get(ip);
      if (!bucket || now > bucket.resetAt) {
        buckets.set(ip, { count: 1, resetAt: now + windowSeconds * 1000 });
        return true;
      }
      bucket.count++;
      return bucket.count <= maxRequests;
    },
    /** Exposed for testing — clear all buckets. */
    reset() {
      buckets.clear();
    },
  };
}

export { createRateLimiter };

// --- Helpers ---

/** Sanitize a value for use in a Content-Disposition filename. */
function sanitizeFilename(value: string): string {
  // Strip anything that isn't alphanumeric, dash, dot, underscore, or @/
  return value.replace(/[^a-zA-Z0-9._@/-]/g, '_').slice(0, 200);
}

function json(res: ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function error(res: ServerResponse, message: string, status = 400) {
  json(res, { error: message }, status);
}

function parseUrl(url: string): { path: string[]; query: Record<string, string> } {
  const [pathname, search] = url.split('?');
  const path = pathname.replace(/^\/api\//, '/').split('/').filter(Boolean);
  const query: Record<string, string> = {};
  if (search) {
    for (const pair of search.split('&')) {
      const [k, v] = pair.split('=');
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  }
  return { path, query };
}

/** Wrap a promise with a timeout. Rejects with a timeout error after `ms` milliseconds. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('__TIMEOUT__')), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

/** Get client IP from request (supports X-Forwarded-For). */
function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return req.socket.remoteAddress ?? '0.0.0.0';
}

/** Creates a request handler suitable for Node http.createServer or serverless adapters. */
export function createHandler(opts?: StatsOptions & Pick<ServerOptions, 'corsOrigin' | 'rateLimitMax' | 'rateLimitWindowSeconds' | 'requestTimeoutMs'>): Handler {
  const options = { ...opts };
  if (!options.cache) {
    options.cache = createCache();
  }

  const corsOrigin = opts?.corsOrigin ?? '*';
  const timeoutMs = opts?.requestTimeoutMs ?? 30_000;
  const limiter = createRateLimiter(
    opts?.rateLimitMax ?? 60,
    opts?.rateLimitWindowSeconds ?? 60,
  );

  return async (req, res) => {
    // Security headers on every response
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Cache-Control', 'no-store');

    // CORS — honor corsOrigin config
    res.setHeader('Access-Control-Allow-Origin', corsOrigin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Rate limiting
    const clientIp = getClientIp(req);
    if (!limiter.allow(clientIp)) {
      error(res, 'Too many requests', 429);
      return;
    }

    if (req.method !== 'GET') {
      error(res, 'Method not allowed', 405);
      return;
    }

    const { path, query } = parseUrl(req.url ?? '/');

    try {
      // GET /stats/:package — all registries
      // GET /stats/:registry/:package — single registry
      if (path[0] === 'stats') {
        if (path.length === 2) {
          const pkg = decodeURIComponent(path[1]);
          const results = await withTimeout(stats.all(pkg, options), timeoutMs);
          json(res, results);
          return;
        }
        if (path.length >= 3) {
          const registry = path[1];
          const pkg = path.slice(2).join('/');
          const result = await withTimeout(stats(registry, pkg, options), timeoutMs);
          if (!result) {
            error(res, `Package "${pkg}" not found on ${registry}`, 404);
            return;
          }
          json(res, result);
          return;
        }
      }

      // GET /compare/:package?registries=npm,pypi
      if (path[0] === 'compare' && path.length >= 2) {
        const pkg = decodeURIComponent(path[1]);
        const registries = query.registries ? query.registries.split(',') : undefined;
        const result = await withTimeout(stats.compare(pkg, registries, options), timeoutMs);
        json(res, result);
        return;
      }

      // GET /range/:registry/:package?start=...&end=...&format=json|csv|chart
      if (path[0] === 'range' && path.length >= 3) {
        const registry = path[1];
        const pkg = path.slice(2).join('/');
        const { start, end, format } = query;
        if (!start || !end) {
          error(res, 'Missing start and end query parameters');
          return;
        }

        const data = await withTimeout(stats.range(registry, pkg, start, end, options), timeoutMs);

        if (format === 'csv') {
          const safePkg = sanitizeFilename(pkg);
          const safeStart = sanitizeFilename(start);
          const safeEnd = sanitizeFilename(end);
          res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${safePkg}-${safeStart}-${safeEnd}.csv"`,
          });
          res.end(calc.toCSV(data));
          return;
        }

        if (format === 'chart') {
          json(res, calc.toChartData(data, `${pkg} (${registry})`));
          return;
        }

        json(res, data);
        return;
      }

      // GET / — health check
      if (path.length === 0) {
        json(res, {
          name: '@mcptoolshop/registry-stats',
          endpoints: [
            'GET /stats/:package',
            'GET /stats/:registry/:package',
            'GET /compare/:package?registries=npm,pypi',
            'GET /range/:registry/:package?start=YYYY-MM-DD&end=YYYY-MM-DD&format=json|csv|chart',
          ],
        });
        return;
      }

      error(res, 'Not found', 404);
    } catch (e: any) {
      if (e?.message === '__TIMEOUT__') {
        error(res, 'Gateway timeout', 504);
      } else if (e instanceof RegistryError) {
        // Map registry errors: 429 → 429, 404 → 404, others → 502 (bad gateway)
        const status = e.statusCode === 429 ? 429
          : e.statusCode === 404 ? 404
          : e.statusCode >= 500 ? 502
          : 500;
        error(res, e.message, status);
      } else {
        // Don't leak internal error details to the client
        error(res, 'Internal server error', 500);
      }
    }
  };
}

/** Starts an HTTP server. Returns the server instance. */
export function serve(opts?: ServerOptions) {
  const port = opts?.port ?? 3000;
  const handler = createHandler({
    cache: opts?.cache !== false ? createCache() : undefined,
    corsOrigin: opts?.corsOrigin,
    rateLimitMax: opts?.rateLimitMax,
    rateLimitWindowSeconds: opts?.rateLimitWindowSeconds,
    requestTimeoutMs: opts?.requestTimeoutMs,
  });

  const server = httpCreateServer(handler);
  server.listen(port, () => {
    console.log(`registry-stats server listening on http://localhost:${port}`);
    console.log(`\nEndpoints:`);
    console.log(`  GET /stats/:package`);
    console.log(`  GET /stats/:registry/:package`);
    console.log(`  GET /compare/:package?registries=npm,pypi`);
    console.log(`  GET /range/:registry/:package?start=...&end=...&format=json|csv|chart`);
  });

  return server;
}
