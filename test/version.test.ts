import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const pkg = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

describe('version consistency', () => {
  it('package.json version is semver', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('version is >= 1.0.0', () => {
    const major = parseInt(pkg.version.split('.')[0], 10);
    expect(major).toBeGreaterThanOrEqual(1);
  });

  it('CHANGELOG.md contains current version', () => {
    const changelog = readFileSync(resolve(__dirname, '..', 'CHANGELOG.md'), 'utf-8');
    expect(changelog).toContain(`[${pkg.version}]`);
  });

  it('CLI source contains version flag handling', () => {
    const cli = readFileSync(resolve(__dirname, '..', 'src', 'cli.ts'), 'utf-8');
    expect(cli).toContain('--version');
    expect(cli).toContain('-V');
  });

  it('usage text documents --version flag', () => {
    const cli = readFileSync(resolve(__dirname, '..', 'src', 'cli.ts'), 'utf-8');
    expect(cli).toContain('--version, -V');
  });
});
