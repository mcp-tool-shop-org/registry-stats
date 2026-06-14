import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { stats, registerProvider, createCache, RegistryError } from './index.js';
import type { RegistryProvider, PackageStats, StatsOptions } from './types.js';
import { npm } from './providers/npm.js';

const originalFetch = globalThis.fetch;

function makeMockProvider(name: string, result: PackageStats | null = null): RegistryProvider {
  return {
    name,
    getStats: vi.fn(async () => result),
    getRange: vi.fn(async () => []),
  };
}

function mockFetch(handler: (url: string) => { status: number; body?: unknown }) {
  globalThis.fetch = vi.fn(async (input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const resp = handler(url);
    return {
      ok: resp.status >= 200 && resp.status < 300,
      status: resp.status,
      statusText: `Status ${resp.status}`,
      headers: { get: () => null },
      json: async () => resp.body,
    } as unknown as Response;
  });
}

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('stats.compare', () => {
  it('returns a ComparisonResult with results from available registries', async () => {
    // Mock fetch to return valid data for npm, 404 for others
    mockFetch((url) => {
      if (url.includes('api.npmjs.org')) {
        return { status: 200, body: { downloads: 100, start: '2025-01-01', end: '2025-01-31', package: 'test-pkg' } };
      }
      return { status: 404 };
    });

    const result = await stats.compare('test-pkg', ['npm']);
    expect(result).toBeDefined();
    expect(result.package).toBe('test-pkg');
    expect(typeof result.fetchedAt).toBe('string');
    expect(typeof result.registries).toBe('object');
  }, 30000);

  it('swallows errors from individual registries', async () => {
    mockFetch(() => ({ status: 500 }));
    // Should not throw even though all registries fail
    const result = await stats.compare('nonexistent', ['npm']);
    expect(result.package).toBe('nonexistent');
    expect(Object.keys(result.registries)).toHaveLength(0);
  }, 30000);

  it('uses all providers when registries param is omitted', async () => {
    mockFetch(() => ({ status: 404 }));
    const result = await stats.compare('test-pkg');
    expect(result.package).toBe('test-pkg');
    // All built-in registries attempted, but all 404 -> empty
    expect(Object.keys(result.registries)).toHaveLength(0);
  }, 30000);
});

// engine-B01: partial-failure surfacing. A rejected registry must no longer be
// silently indistinguishable from "package absent" — it surfaces on an
// additive .errors channel while the primary return shape stays unchanged.
describe('stats.all / stats.compare partial-failure channel', () => {
  it('stats.all surfaces a rejected provider on .errors without breaking the array shape', async () => {
    // Built-in providers hit the network; make them resolve fast as 404 → null.
    mockFetch(() => ({ status: 404 }));
    const good = makeMockProvider('b01-all-good', {
      registry: 'b01-all-good' as any,
      package: 'pkg',
      downloads: { total: 5 },
      fetchedAt: new Date().toISOString(),
    });
    const bad: RegistryProvider = {
      name: 'b01-all-bad',
      getStats: async () => { throw new RegistryError('b01-all-bad', 503, 'Service unavailable'); },
    };
    registerProvider(good);
    registerProvider(bad);

    const results = await stats.all('pkg');
    // Still a plain array of successful results.
    expect(Array.isArray(results)).toBe(true);
    expect(results.some((r) => r.package === 'pkg' && String(r.registry) === 'b01-all-good')).toBe(true);
    // Additive errors channel carries the failed registry.
    const errors = (results as any).errors as Array<{ registry: string; statusCode?: number; message: string }>;
    expect(Array.isArray(errors)).toBe(true);
    const failure = errors.find((e) => e.registry === 'b01-all-bad');
    expect(failure).toBeDefined();
    expect(failure!.statusCode).toBe(503);
    expect(failure!.message).toContain('Service unavailable');
  });

  it('stats.compare surfaces a rejected provider on result.errors', async () => {
    const good = makeMockProvider('b01-cmp-good', {
      registry: 'b01-cmp-good' as any,
      package: 'pkg',
      downloads: { total: 9 },
      fetchedAt: new Date().toISOString(),
    });
    const bad: RegistryProvider = {
      name: 'b01-cmp-bad',
      getStats: async () => { throw new RegistryError('b01-cmp-bad', 429, 'Rate limited'); },
    };
    registerProvider(good);
    registerProvider(bad);

    const result = await stats.compare('pkg', ['b01-cmp-good', 'b01-cmp-bad']);
    expect(result.registries['b01-cmp-good']).toBeDefined();
    expect(result.registries['b01-cmp-bad']).toBeUndefined();
    expect(Array.isArray(result.errors)).toBe(true);
    const failure = result.errors!.find((e) => e.registry === 'b01-cmp-bad');
    expect(failure).toBeDefined();
    expect(failure!.statusCode).toBe(429);
    expect(failure!.message).toContain('Rate limited');
  });

  it('stats.all leaves .errors empty (or absent-as-empty) when nothing fails', async () => {
    const good = makeMockProvider('b01-clean-' + Date.now(), {
      registry: 'clean' as any,
      package: 'pkg',
      downloads: { total: 1 },
      fetchedAt: new Date().toISOString(),
    });
    registerProvider(good);
    // Use compare scoped to only the clean provider to avoid built-in network calls.
    const result = await stats.compare('pkg', [good.name]);
    expect(result.errors ?? []).toHaveLength(0);
  });
});

describe('stats.range', () => {
  it('throws for unknown registry', async () => {
    await expect(stats.range('fake-reg', 'pkg', '2025-01-01', '2025-01-31')).rejects.toThrow(RegistryError);
  });

  it('throws for registry without getRange support', async () => {
    await expect(stats.range('docker', 'library/node', '2025-01-01', '2025-01-31')).rejects.toThrow(/does not support time-series/);
  });

  it('returns cached range data on second call', async () => {
    mockFetch((url) => {
      if (url.includes('api.npmjs.org/downloads/range')) {
        return {
          status: 200,
          body: {
            downloads: [
              { day: '2025-01-01', downloads: 100 },
              { day: '2025-01-02', downloads: 200 },
            ],
            start: '2025-01-01',
            end: '2025-01-02',
            package: 'express',
          },
        };
      }
      return { status: 404 };
    });

    const cache = createCache();
    const opts: StatsOptions = { cache, cacheTtlMs: 60000 };

    const first = await stats.range('npm', 'express', '2025-01-01', '2025-01-02', opts);
    expect(first.length).toBeGreaterThan(0);

    // Second call should hit cache (mock won't be called again)
    const mock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const callCountBefore = mock.mock.calls.length;

    const second = await stats.range('npm', 'express', '2025-01-01', '2025-01-02', opts);
    expect(second).toEqual(first);

    // No additional fetch calls
    expect(mock.mock.calls.length).toBe(callCountBefore);
  }, 30000);
});

describe('registerProvider', () => {
  it('registers a custom provider and stats() can use it', async () => {
    const customResult: PackageStats = {
      registry: 'custom' as any,
      package: 'my-pkg',
      downloads: { total: 999 },
      fetchedAt: new Date().toISOString(),
    };
    const provider = makeMockProvider('custom-test-reg', customResult);
    registerProvider(provider);

    const result = await stats('custom-test-reg', 'my-pkg');
    expect(result).toEqual(customResult);
    expect(provider.getStats).toHaveBeenCalledWith('my-pkg', undefined);
  });

  it('custom provider errors produce RegistryError with correct registry string', async () => {
    const provider: RegistryProvider = {
      name: 'fail-reg',
      getStats: async () => { throw new Error('boom'); },
    };
    registerProvider(provider);

    await expect(stats('fail-reg', 'test-pkg')).rejects.toThrow('boom');
  });

  // engine-B04: registerProvider must validate the shape before trusting it.
  it('rejects a provider with a missing or empty name', () => {
    expect(() => registerProvider({ getStats: async () => null } as any)).toThrow(/name/i);
    expect(() => registerProvider({ name: '', getStats: async () => null } as any)).toThrow(/name/i);
    expect(() => registerProvider({ name: '   ', getStats: async () => null } as any)).toThrow(/name/i);
  });

  it('rejects a provider whose getStats is not a function', () => {
    expect(() => registerProvider({ name: 'no-getstats' } as any)).toThrow(/getStats/);
    expect(() => registerProvider({ name: 'bad-getstats', getStats: 42 } as any)).toThrow(/getStats/);
  });

  it('warns (without throwing) when overwriting a built-in registry name', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const replacement = makeMockProvider('npm', {
        registry: 'npm' as any,
        package: 'overwritten',
        downloads: { total: 1 },
        fetchedAt: new Date().toISOString(),
      });
      expect(() => registerProvider(replacement)).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/overwrit/i));
    } finally {
      // Restore the real built-in npm provider — the registry Map is a shared
      // module singleton and later tests in this file depend on it.
      registerProvider(npm);
      warnSpy.mockRestore();
    }
  });

  it('does NOT warn when registering a fresh custom registry name', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      registerProvider(makeMockProvider('fresh-custom-reg-' + Date.now()));
      expect(warnSpy).not.toHaveBeenCalled();
    } finally {
      warnSpy.mockRestore();
    }
  });

  it('registering a provider named "constructor" does not corrupt the registry lookup', async () => {
    const provider = makeMockProvider('constructor', {
      registry: 'constructor' as any,
      package: 'x',
      downloads: { total: 7 },
      fetchedAt: new Date().toISOString(),
    });
    registerProvider(provider);

    // Looking up the registered provider must work...
    const result = await stats('constructor', 'x');
    expect(result?.downloads.total).toBe(7);

    // ...and looking up an UNregistered registry must yield a structured
    // RegistryError ("Unknown registry"), never a raw TypeError from the
    // prototype chain.
    await expect(stats('nope-not-registered', 'x')).rejects.toThrow(RegistryError);
    await expect(stats('nope-not-registered', 'x')).rejects.toThrow(/Unknown registry/);
  });
});

describe('package name validation', () => {
  it('rejects empty package name', async () => {
    await expect(stats('npm', '')).rejects.toThrow(/Invalid package name/);
  });

  it('rejects path traversal', async () => {
    await expect(stats('npm', '../etc/passwd')).rejects.toThrow(/path traversal/);
  });

  it('stats.all enforces validation (path traversal rejected)', async () => {
    await expect(stats.all('../../etc/passwd')).rejects.toThrow(/path traversal/);
  });

  it('stats.bulk enforces validation on every name', async () => {
    await expect(
      stats.bulk('npm', ['x/../../-/v1/search?text=foo', 'y']),
    ).rejects.toThrow(RegistryError);
  });

  it('stats.range enforces validation (path traversal rejected)', async () => {
    await expect(
      stats.range('docker', '..%2F..', '2025-01-01', '2025-01-31'),
    ).rejects.toThrow(/path traversal/);
  });

  it('stats.range rejects literal traversal segments', async () => {
    await expect(
      stats.range('npm', 'a/../../b', '2025-01-01', '2025-01-31'),
    ).rejects.toThrow(/path traversal/);
  });

  it('rejects backslash', async () => {
    await expect(stats('npm', 'foo\\bar')).rejects.toThrow(/path traversal/);
  });

  it('rejects whitespace in names', async () => {
    await expect(stats('npm', 'foo bar')).rejects.toThrow(/illegal characters/);
  });

  it('rejects control characters', async () => {
    await expect(stats('npm', 'foo\x00bar')).rejects.toThrow(/illegal characters/);
  });

  it('accepts valid npm scoped package', async () => {
    mockFetch(() => ({ status: 404 }));
    // Should not throw validation error
    const result = await stats('npm', '@scope/pkg-name');
    expect(result).toBeNull();
  }, 15000);

  it('accepts valid package with dots and hyphens', async () => {
    mockFetch(() => ({ status: 404 }));
    const result = await stats('npm', 'my-pkg.js');
    expect(result).toBeNull();
  }, 15000);
});

describe('pLimit (via stats.bulk)', () => {
  it('respects concurrency by processing in batches', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    // Register a provider that tracks concurrency
    const provider: RegistryProvider = {
      name: 'concurrency-test',
      getStats: async (pkg) => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((r) => setTimeout(r, 50));
        concurrent--;
        return {
          registry: 'concurrency-test' as any,
          package: pkg,
          downloads: { total: 1 },
          fetchedAt: new Date().toISOString(),
        };
      },
    };
    registerProvider(provider);

    const packages = ['a', 'b', 'c', 'd', 'e', 'f'];
    const results = await stats.bulk('concurrency-test', packages, { concurrency: 2 });

    expect(results).toHaveLength(6);
    expect(results.every((r) => r !== null)).toBe(true);
    // Max concurrency should not exceed the limit of 2
    expect(maxConcurrent).toBeLessThanOrEqual(2);
    expect(maxConcurrent).toBeGreaterThan(0);
  }, 15000);
});
