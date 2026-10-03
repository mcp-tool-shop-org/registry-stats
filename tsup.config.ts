import * as fs from 'node:fs';
import { defineConfig } from 'tsup';

// tsup 8 runs an exported config array with Promise.all. Clean once here
// so the library build cannot delete dist/cli.js while the CLI build writes it.
fs.rmSync('dist', { recursive: true, force: true });

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: false,
    target: 'node18',
  },
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    clean: false,
    target: 'node18',
    banner: { js: '#!/usr/bin/env node' },
  },
]);
