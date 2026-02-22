import type { RegistryName } from './types.js';
import { RegistryError } from './types.js';

const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second

export async function fetchWithRetry<T>(
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
    const retryAfterMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : undefined;

    lastError = new RegistryError(
      registry,
      res.status,
      `${res.statusText}: ${url}`,
      retryAfter ? parseInt(retryAfter, 10) : undefined,
    );

    if (!RETRYABLE.has(res.status) || attempt === MAX_RETRIES) break;

    const delay = retryAfterMs ?? BASE_DELAY * Math.pow(2, attempt);
    await new Promise((r) => setTimeout(r, delay));
  }

  throw lastError!;
}
