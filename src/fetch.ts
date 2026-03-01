import type { RegistryName } from './types.js';
import { RegistryError } from './types.js';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

// --- Per-registry throttle (serialized via mutex) ---
// Ensures minimum delay between actual requests to the same registry.
// Uses a mutex pattern: each caller awaits the previous, then schedules the next slot.

const registryLocks = new Map<string, Promise<void>>();

const REGISTRY_DELAYS: Partial<Record<RegistryName, number>> = {
  npm: 400,    // ~2.5 req/s — safe for 54+ scoped packages
  pypi: 2200,  // 30 req/60s = 1 per 2s, with headroom
  docker: 4000, // 10 req/3600s — very tight
  ghcr: 200,    // 5000 req/hr authenticated, 60/hr unauth
};

const DEFAULT_DELAY = 100;

function acquireSlot(registry: RegistryName): Promise<void> {
  const minDelay = REGISTRY_DELAYS[registry] ?? DEFAULT_DELAY;
  const prev = registryLocks.get(registry) ?? Promise.resolve();

  // Each caller waits for the previous to finish, then holds the slot for minDelay
  const slot = prev.then(() => new Promise<void>((r) => setTimeout(r, minDelay)));
  registryLocks.set(registry, slot);
  return prev; // caller proceeds as soon as the PREVIOUS slot's delay has passed
}

export async function fetchWithRetry<T>(
  url: string,
  registry: RegistryName,
  init?: RequestInit,
): Promise<T | null> {
  let lastError: RegistryError | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await acquireSlot(registry);

    const res = await fetch(url, init);

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

  throw lastError!;
}

/**
 * Unthrottled fetch — for endpoints where we do our own batching
 * (e.g. npm bulk API, npm search). Still retries on transient errors.
 */
export async function fetchDirect<T>(
  url: string,
  registry: RegistryName,
  init?: RequestInit,
): Promise<T | null> {
  let lastError: RegistryError | undefined;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, init);

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

    const backoff = BASE_DELAY * Math.pow(2, attempt);
    const retryAfterMs = retryAfterSeconds ? retryAfterSeconds * 1000 : 0;
    const delay = Math.max(backoff, retryAfterMs);
    await new Promise((r) => setTimeout(r, delay));
  }

  throw lastError!;
}
