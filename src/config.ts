import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import type { Config } from './types.js';

const CONFIG_NAME = 'registry-stats.config.json';

export function loadConfig(startDir?: string): Config | null {
  let dir = startDir ?? process.cwd();

  // Walk up from cwd looking for config
  while (true) {
    const configPath = resolve(dir, CONFIG_NAME);
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8');
      return JSON.parse(raw) as Config;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

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

export function starterConfig(): string {
  return STARTER;
}
