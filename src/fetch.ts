import type { RegistryName } from './types.js';
import { RegistryError } from './types.js';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

// --- Per-registry throttle (serialized via mutex) ---
// Ensures minimum delay between actual requests to the same registry.
// Uses a mutex pattern: each caller awaits the previous, then schedules the next slot.

const registryLocks = new Map<string, Promise<void>>();
const MAX_LOCK_ENTRIES = 50;

const REGISTRY_DELAYS: Partial<Record<RegistryName, number>> = {
  npm: 800,    // ~1.25 req/s — safe for 91+ scoped packages (429s at 400ms)
  pypi: 2200,  // 30 req/60s = 1 per 2s, with headroom
  docker: 4000, // 10 req/3600s — very tight
  // github is not listed: its gap depends on whether the request carries a token.
};

const DEFAULT_DELAY = 100;

// Unauthenticated GitHub REST is 60/hour. 300ms was ~12,000 starts/hour.
// A non-empty Authorization header is the authenticated lane (5000/hour);
// 800ms stays under that. The token value is never read or stored here.
const GITHUB_UNAUTH_DELAY_MS = 60_000;
const GITHUB_AUTH_DELAY_MS = 800;

interface GithubLaneMark {
  start: number;
  delay: number;
}

let githubLane: Promise<void> = Promise.resolve();
let githubMark: GithubLaneMark | null = null;

function hasAuthorizationHeader(init?: RequestInit): boolean {
  const headers = init?.headers;
  if (!headers) return false;

  if (typeof Headers !== 'undefined' && headers instanceof Headers) {
    const value = headers.get('authorization');
    return typeof value === 'string' && value.trim() !== '';
  }

  if (Array.isArray(headers)) {
    return headers.some(([name, value]) =>
      String(name).toLowerCase() === 'authorization' && String(value).trim() !== '');
  }

  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase() === 'authorization' && typeof value === 'string' && value.trim() !== '') {
      return true;
    }
  }
  return false;
}

function githubDelayMs(init?: RequestInit): number {
  return hasAuthorizationHeader(init) ? GITHUB_AUTH_DELAY_MS : GITHUB_UNAUTH_DELAY_MS;
}

/**
 * Space GitHub starts. The wait is the larger of the previous request's gap
 * and this request's own floor, so a tokenless call is never closer than 60s
 * to the previous start, and a call that carries Authorization is never
 * closer than 800ms. No timer is armed after the last start (a one-shot CLI
 * must not sit on a 60s hold).
 */
function acquireGithubSlot(init?: RequestInit): Promise<void> {
  const minDelay = githubDelayMs(init);
  const ticket = githubLane.then(() => new Promise<void>((resolve) => {
    const now = Date.now();
    const mark = githubMark;
    const earliest = mark ? mark.start + Math.max(mark.delay, minDelay) : now;
    const wait = Math.max(0, earliest - now);
    const release = () => {
      githubMark = { start: Date.now(), delay: minDelay };
      resolve();
    };
    if (wait === 0) release();
    else setTimeout(release, wait);
  }));
  githubLane = ticket;
  return ticket;
}

function acquireSlot(registry: RegistryName, init?: RequestInit): Promise<void> {
  if (registry === 'github') return acquireGithubSlot(init);

  const minDelay = REGISTRY_DELAYS[registry] ?? DEFAULT_DELAY;
  const prev = registryLocks.get(registry) ?? Promise.resolve();

  // Each caller waits for the previous to finish, then holds the slot for minDelay
  const slot = prev.then(() => new Promise<void>((r) => setTimeout(r, minDelay)));
  registryLocks.set(registry, slot);

  // Guard against unbounded growth from custom providers
  if (registryLocks.size > MAX_LOCK_ENTRIES) {
    const oldest = registryLocks.keys().next().value;
    if (oldest !== undefined) registryLocks.delete(oldest);
  }

  return prev; // caller proceeds as soon as the PREVIOUS slot's delay has passed
}

/**
 * Shared retry loop used by both throttled and unthrottled fetch paths.
 * Wraps network errors (DNS, timeout, connection refused) in RegistryError
 * so callers always receive structured errors.
 */
async function fetchRetryCore<T>(
  url: string,
  registry: RegistryName,
  init: RequestInit | undefined,
  preRequest?: () => Promise<void>,
): Promise<T | null> {
  let lastError: RegistryError | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (preRequest) await preRequest();

    let res: Response;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(30_000), ...init });
    } catch (err) {
      // Network-level failures: DNS, connection refused, abort/timeout
      const message = err instanceof Error ? err.message : String(err);
      lastError = new RegistryError(registry, 0, `Network error: ${message} — ${url}`);

      // Network errors are transient — retry unless exhausted
      if (attempt === MAX_RETRIES) break;

      const backoff = BASE_DELAY * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, backoff));
      continue;
    }

    if (res.status === 404) return null;

    if (res.ok) return res.json() as Promise<T>;

    const retryAfter = res.headers.get('retry-after');
    const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : undefined;

    lastError = new RegistryError(
      registry,
      res.status,
      `${res.statusText}: ${url}`,
      retryAfterSeconds,
    );

    if (!RETRYABLE.has(res.status) || attempt === MAX_RETRIES) break;

    // Use exponential backoff as minimum, even if Retry-After says 0
    const backoff = BASE_DELAY * Math.pow(2, attempt);
    const retryAfterMs = retryAfterSeconds ? retryAfterSeconds * 1000 : 0;
    const delay = Math.max(backoff, retryAfterMs);
    await new Promise((r) => setTimeout(r, delay));
  }

  throw lastError ?? new RegistryError(registry, 0, `Fetch failed after ${MAX_RETRIES} retries: ${url}`);
}

/**
 * Fetch with per-registry throttling and retry.
 * Serializes requests per registry to respect rate limits.
 * Returns null for 404, throws RegistryError for all other failures.
 */
export async function fetchWithRetry<T>(
  url: string,
  registry: RegistryName,
  init?: RequestInit,
): Promise<T | null> {
  return fetchRetryCore<T>(url, registry, init, () => acquireSlot(registry, init));
}

/**
 * Unthrottled fetch -- for endpoints where we do our own batching
 * (e.g. npm bulk API, npm search). Still retries on transient errors.
 * Returns null for 404, throws RegistryError for all other failures.
 */
export async function fetchDirect<T>(
  url: string,
  registry: RegistryName,
  init?: RequestInit,
): Promise<T | null> {
  return fetchRetryCore<T>(url, registry, init);
}
