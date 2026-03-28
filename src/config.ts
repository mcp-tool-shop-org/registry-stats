import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Config } from './types.js';

const CONFIG_NAME = 'registry-stats.config.json';

/**
 * Load and validate a registry-stats config file by walking up from startDir.
 * Returns null if no config file is found.
 * Throws a descriptive error if the config is malformed or invalid.
 */
export function loadConfig(startDir?: string): Config | null {
  let dir = startDir ?? process.cwd();

  // Walk up from cwd looking for config
  while (true) {
    const configPath = resolve(dir, CONFIG_NAME);
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8');

      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`Invalid JSON in ${configPath}: ${message}`);
      }

      return validateConfig(parsed, configPath);
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

/**
 * Validate a parsed config object and return a typed Config.
 * Throws descriptive errors for invalid values.
 */
function validateConfig(raw: unknown, source: string): Config {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new Error(`Config in ${source} must be a JSON object, got ${Array.isArray(raw) ? 'array' : typeof raw}`);
  }

  const obj = raw as Record<string, unknown>;
  const config: Config = {};

  if (obj.registries !== undefined) {
    if (!Array.isArray(obj.registries) || !obj.registries.every((r: unknown) => typeof r === 'string')) {
      throw new Error(`Config "registries" must be an array of strings in ${source}`);
    }
    config.registries = obj.registries as string[];
  }

  if (obj.packages !== undefined) {
    if (typeof obj.packages !== 'object' || obj.packages === null || Array.isArray(obj.packages)) {
      throw new Error(`Config "packages" must be an object in ${source}`);
    }
    config.packages = obj.packages as Record<string, Record<string, string>>;
  }

  if (obj.cache !== undefined) {
    if (typeof obj.cache !== 'boolean') {
      throw new Error(`Config "cache" must be a boolean in ${source}`);
    }
    config.cache = obj.cache;
  }

  if (obj.cacheTtlMs !== undefined) {
    if (typeof obj.cacheTtlMs !== 'number' || obj.cacheTtlMs <= 0 || !Number.isFinite(obj.cacheTtlMs)) {
      throw new Error(`Config "cacheTtlMs" must be a positive number in ${source}`);
    }
    config.cacheTtlMs = obj.cacheTtlMs;
  }

  if (obj.concurrency !== undefined) {
    if (typeof obj.concurrency !== 'number' || obj.concurrency < 1 || !Number.isInteger(obj.concurrency)) {
      throw new Error(`Config "concurrency" must be a positive integer in ${source}`);
    }
    config.concurrency = obj.concurrency;
  }

  if (obj.dockerToken !== undefined) {
    if (typeof obj.dockerToken !== 'string') {
      throw new Error(`Config "dockerToken" must be a string in ${source}`);
    }
    config.dockerToken = obj.dockerToken;
  }

  return config;
}

/** Returns sensible default config with all registries enabled. */
export function defaultConfig(): Config {
  return {
    registries: ['npm', 'pypi', 'nuget', 'vscode', 'docker'],
    packages: {},
    cache: true,
    cacheTtlMs: 300_000,
    concurrency: 5,
  };
}

const STARTER = `{
  "registries": ["npm", "pypi", "nuget", "vscode", "docker"],
  "packages": {
    "my-package": {
      "npm": "my-package",
      "pypi": "my-package"
    }
  },
  "cache": true,
  "cacheTtlMs": 300000,
  "concurrency": 5
}
`;

/** Returns a starter config JSON string for `registry-stats init`. */
export function starterConfig(): string {
  return STARTER;
}
