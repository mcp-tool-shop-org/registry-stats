import { describe, it, expect } from 'vitest';
import { npm } from '../src/providers/npm.js';
import { pypi } from '../src/providers/pypi.js';
import { nuget } from '../src/providers/nuget.js';
import { vscode } from '../src/providers/vscode.js';
import { docker } from '../src/providers/docker.js';
import type { RegistryProvider, PackageStats } from '../src/types.js';

const testCases: { provider: RegistryProvider; pkg: string; hasRange: boolean }[] = [
  { provider: npm, pkg: 'express', hasRange: true },
  { provider: pypi, pkg: 'requests', hasRange: true },
  { provider: nuget, pkg: 'Newtonsoft.Json', hasRange: false },
  { provider: vscode, pkg: 'esbenp.prettier-vscode', hasRange: false },
  { provider: docker, pkg: 'library/node', hasRange: false },
];

describe('provider contract', () => {
  for (const { provider, pkg, hasRange } of testCases) {
    describe(provider.name, () => {
      it('has a name', () => {
        expect(typeof provider.name).toBe('string');
        expect(provider.name.length).toBeGreaterThan(0);
      });

      it('has getStats method', () => {
        expect(typeof provider.getStats).toBe('function');
      });

      it(`${hasRange ? 'has' : 'does not have'} getRange method`, () => {
        if (hasRange) {
          expect(typeof provider.getRange).toBe('function');
        } else {
          expect(provider.getRange).toBeUndefined();
        }
      });

      it('getStats returns correct shape', async () => {
        const result = await provider.getStats(pkg);
        expect(result).not.toBeNull();

        const s = result as PackageStats;
        expect(s.registry).toBe(provider.name);
        expect(typeof s.package).toBe('string');
        expect(typeof s.downloads).toBe('object');
        expect(typeof s.fetchedAt).toBe('string');
        // fetchedAt should be valid ISO date
        expect(new Date(s.fetchedAt).toISOString()).toBe(s.fetchedAt);
      }, 15000);

      it('getStats returns null for nonexistent package', async () => {
        const result = await provider.getStats('this-package-absolutely-does-not-exist-xyz-999');
        expect(result).toBeNull();
      }, 15000);
    });
  }
});
