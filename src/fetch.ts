import { AsyncLocalStorage } from 'node:async_hooks';
import type { RegistryName } from './types.js';
import { RegistryError } from './types.js';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
/** A hostile or mistaken Retry-After cannot stall a caller for hours. */
const MAX_RETRY_AFTER_MS = 60_000;

const requestSignals = new AsyncLocalStorage<AbortSignal>();

/**
 * Bind an abort signal to every fetchWithRetry / fetchDirect call made by fn,
 * including retry sleeps and registry slot waits. The HTTP handler uses this
 * so a gateway timeout actually stops the upstream work.
 */
export function bindRequestSignal<T>(signal: AbortSignal, fn: () => Promise<T>): Promise<T> {
  return requestSignals.run(signal, fn);
}

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
    else {
      const timer = setTimeout(release, wait);
      const signal = requestSignals.getStore();
      signal?.addEventListener('abort', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    }
  }));
  githubLane = ticket;
  return ticket;
}

function acquireSlot(registry: RegistryName, init?: RequestInit): Promise<void> {
  if (registry === 'github') return acquireGithubSlot(init);

  const minDelay = REGISTRY_DELAYS[registry] ?? DEFAULT_DELAY;
  const prev = registryLocks.get(registry) ?? Promise.resolve();

  // Each caller waits for the previous to finish, then holds the slot for minDelay.
  // An aborted request releases the timer so a timed-out handler does not keep waiting.
  const slot = prev.then(() => new Promise<void>((r) => {
    const signal = requestSignals.getStore();
    if (signal?.aborted) {
      r();
      return;
    }
    const timer = setTimeout(r, minDelay);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      r();
    }, { once: true });
  }));
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
    const external = requestSignals.getStore();
    if (external?.aborted) throw abortedError(registry, url);

    if (preRequest) await preRequest();
    if (external?.aborted) throw abortedError(registry, url);

    let res: Response;
    try {
      // init.signal must not replace the timeout. Merge it with the 30s cap
      // and the handler signal so any one of them aborts the socket.
      res = await fetch(url, {
        ...init,
        signal: mergeSignals(30_000, [init?.signal, external]),
      });
    } catch (err) {
      // Only a handler-bound abort stops the retry loop. The fetch's own
      // AbortSignal.timeout is a network timeout and stays retryable.
      if (external?.aborted) {
        throw abortedError(registry, url);
      }
      // Network-level failures: DNS, connection refused, abort/timeout
      const message = err instanceof Error ? err.message : String(err);
      lastError = new RegistryError(registry, 0, `Network error: ${message} — ${url}`);

      // Network errors are transient — retry unless exhausted
      if (attempt === MAX_RETRIES) break;

      const backoff = BASE_DELAY * Math.pow(2, attempt);
      await sleepOrStop(backoff, external, registry, url);
      continue;
    }

    if (res.status === 404) return null;

    if (res.ok) {
      try {
        return await res.json() as T;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new RegistryError(registry, res.status, `Response was not valid JSON: ${message} — ${url}`);
      }
    }

    const retryAfter = cappedRetryAfter(res.headers.get('retry-after'));
    const retryAfterSeconds = retryAfter.seconds;

    lastError = new RegistryError(
      registry,
      res.status,
      `${res.statusText}: ${url}`,
      retryAfterSeconds,
    );

    if (!RETRYABLE.has(res.status) || attempt === MAX_RETRIES) break;

    // Exponential backoff is the floor. Retry-After can raise it, never past the cap.
    const backoff = BASE_DELAY * Math.pow(2, attempt);
    const delay = Math.max(backoff, retryAfter.delayMs);
    await sleepOrStop(delay, external, registry, url);
  }

  throw lastError ?? new RegistryError(registry, 0, `Fetch failed after ${MAX_RETRIES} retries: ${url}`);
}

function abortedError(registry: RegistryName, url: string): RegistryError {
  return new RegistryError(registry, 0, `Request aborted — ${url}`);
}

/** Whole seconds only. HTTP-date values and junk like "12abc" are ignored. Capped at 60s. */
function cappedRetryAfter(header: string | null): { seconds?: number; delayMs: number } {
  if (!header) return { delayMs: 0 };
  const trimmed = header.trim();
  if (!/^[0-9]+$/.test(trimmed)) return { delayMs: 0 };
  const delayMs = Math.min(Number(trimmed) * 1000, MAX_RETRY_AFTER_MS);
  return { seconds: Math.round(delayMs / 1000), delayMs };
}

function mergeSignals(timeoutMs: number, extra: Array<AbortSignal | undefined>): AbortSignal {
  const signals = [AbortSignal.timeout(timeoutMs), ...extra.filter((s): s is AbortSignal => s != null)];
  if (signals.length === 1) return signals[0];
  if (typeof AbortSignal.any === 'function') return AbortSignal.any(signals);

  const controller = new AbortController();
  const abort = () => controller.abort();
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      return controller.signal;
    }
    signal.addEventListener('abort', abort, { once: true });
  }
  return controller.signal;
}

async function sleepOrStop(ms: number, signal: AbortSignal | undefined, registry: RegistryName, url: string): Promise<void> {
  try {
    await sleep(ms, signal);
  } catch (err) {
    if (signal?.aborted || (err instanceof Error && err.name === 'AbortError')) {
      throw abortedError(registry, url);
    }
    throw err;
  }
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function abortError(): Error {
  const err = new Error('This operation was aborted');
  err.name = 'AbortError';
  return err;
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
