import { describe, it, expect } from 'vitest';
import { loadConfig, defaultConfig, starterConfig } from './config.js';
import { createCache } from './index.js';
import type { Config } from './types.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('createCache', () => {
  it('stores and retrieves values', () => {
    const cache = createCache();
    const value = { registry: 'npm' as const, package: 'test', downloads: { total: 100 }, fetchedAt: '2025-01-01T00:00:00Z' };
    cache.set('key1', value, 60000);
    expect(cache.get('key1')).toEqual(value);
  });

  it('returns undefined for missing keys', () => {
    const cache = createCache();
    expect(cache.get('nonexistent')).toBeUndefined();
  });

  it('expires entries after TTL', async () => {
    const cache = createCache();
    const value = { registry: 'npm' as const, package: 'test', downloads: { total: 100 }, fetchedAt: '2025-01-01T00:00:00Z' };
    cache.set('key1', value, 1); // 1ms TTL
    await new Promise((r) => setTimeout(r, 10));
    expect(cache.get('key1')).toBeUndefined();
  });
});

describe('loadConfig', () => {
  const testDir = join(tmpdir(), `registry-stats-test-${Date.now()}`);
  const configPath = join(testDir, 'registry-stats.config.json');

  function setup(content: string) {
    if (!existsSync(testDir)) mkdirSync(testDir, { recursive: true });
    writeFileSync(configPath, content, 'utf-8');
  }

  function cleanup() {
    if (existsSync(testDir)) rmSync(testDir, { recursive: true, force: true });
  }

  it('returns null when no config file found', () => {
    const result = loadConfig(join(tmpdir(), 'nonexistent-dir-xyz'));
    expect(result).toBeNull();
  });

  it('loads valid config from directory', () => {
    setup('{ "registries": ["npm"], "concurrency": 3 }');
    try {
      const result = loadConfig(testDir);
      expect(result).not.toBeNull();
      expect(result!.registries).toEqual(['npm']);
      expect(result!.concurrency).toBe(3);
    } finally {
      cleanup();
    }
  });

  it('throws on malformed JSON', () => {
    setup('{ not valid json }');
    try {
      expect(() => loadConfig(testDir)).toThrow(/Invalid JSON/);
    } finally {
      cleanup();
    }
  });

  it('throws on invalid registries type', () => {
    setup('{ "registries": "npm" }');
    try {
      expect(() => loadConfig(testDir)).toThrow(/must be an array of strings/);
    } finally {
      cleanup();
    }
  });

  it('throws on negative concurrency', () => {
    setup('{ "concurrency": -1 }');
    try {
      expect(() => loadConfig(testDir)).toThrow(/must be a positive integer/);
    } finally {
      cleanup();
    }
  });

  it('throws on non-integer concurrency', () => {
    setup('{ "concurrency": 2.5 }');
    try {
      expect(() => loadConfig(testDir)).toThrow(/must be a positive integer/);
    } finally {
      cleanup();
    }
  });

  it('throws on negative cacheTtlMs', () => {
    setup('{ "cacheTtlMs": -100 }');
    try {
      expect(() => loadConfig(testDir)).toThrow(/must be a positive number/);
    } finally {
      cleanup();
    }
  });

  it('throws on non-boolean cache', () => {
    setup('{ "cache": "yes" }');
    try {
      expect(() => loadConfig(testDir)).toThrow(/must be a boolean/);
    } finally {
      cleanup();
    }
  });

  it('throws when config is an array', () => {
    setup('[]');
    try {
      expect(() => loadConfig(testDir)).toThrow(/must be a JSON object/);
    } finally {
      cleanup();
    }
  });
});

describe('defaultConfig', () => {
  it('returns all five registries', () => {
    const config = defaultConfig();
    expect(config.registries).toEqual(['npm', 'pypi', 'nuget', 'vscode', 'docker']);
  });

  it('has sensible defaults', () => {
    const config = defaultConfig();
    expect(config.cache).toBe(true);
    expect(config.cacheTtlMs).toBe(300_000);
    expect(config.concurrency).toBe(5);
    expect(config.packages).toEqual({});
  });
});

describe('starterConfig', () => {
  it('returns valid JSON string', () => {
    const str = starterConfig();
    const parsed = JSON.parse(str) as Config;
    expect(parsed.registries).toContain('npm');
    expect(parsed.concurrency).toBe(5);
  });

  it('includes a sample package', () => {
    const parsed = JSON.parse(starterConfig()) as Config;
    expect(parsed.packages).toBeDefined();
    expect(Object.keys(parsed.packages!)).toHaveLength(1);
  });
});
