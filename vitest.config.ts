import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/.swarm/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
      // Codecov project coverage for this package is the engine under src/.
      // Lines, statements, and functions are the numbers that gate stays on.
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 90,
      },
    },
  },
});
