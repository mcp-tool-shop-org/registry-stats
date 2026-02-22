import { createServer as httpCreateServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { stats, createCache, calc } from './index.js';
import type { StatsOptions } from './types.js';

export interface ServerOptions {
  port?: number;
  cache?: boolean;
  corsOrigin?: string;
}

type Handler = (req: IncomingMessage, res: ServerResponse) => void | Promise<void>;

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

/** Creates a request handler suitable for Node http.createServer or serverless adapters. */
export function createHandler(opts?: StatsOptions): Handler {
  const options = { ...opts };
  if (!options.cache) {
    options.cache = createCache();
  }

  return async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
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
          const results = await stats.all(pkg, options);
          json(res, results);
          return;
        }
        if (path.length >= 3) {
          const registry = path[1];
          const pkg = path.slice(2).join('/');
          const result = await stats(registry, pkg, options);
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
        const result = await stats.compare(pkg, registries, options);
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

        const data = await stats.range(registry, pkg, start, end, options);

        if (format === 'csv') {
          res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${pkg}-${start}-${end}.csv"`,
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
      error(res, e.message, 500);
    }
  };
}

/** Starts an HTTP server. Returns the server instance. */
export function serve(opts?: ServerOptions) {
  const port = opts?.port ?? 3000;
  const handler = createHandler({
    cache: opts?.cache !== false ? createCache() : undefined,
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
