import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf-8'));

// Count actual translated READMEs at repo root: README.<lang>.md (excludes README.md itself).
const translationFiles = readdirSync(repoRoot).filter((f) => /^README\.[\w-]+\.md$/.test(f));
const translationCount = translationFiles.length;

describe('version consistency', () => {
  it('package.json version is semver', () => {
    expect(pkg.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('version is >= 1.0.0', () => {
    const major = parseInt(pkg.version.split('.')[0], 10);
    expect(major).toBeGreaterThanOrEqual(1);
  });

  it('CHANGELOG.md contains current version', () => {
    const changelog = readFileSync(resolve(repoRoot, 'CHANGELOG.md'), 'utf-8');
    expect(changelog).toContain(`[${pkg.version}]`);
  });

  it('SCORECARD.md contains current version', () => {
    const scorecard = readFileSync(resolve(repoRoot, 'SCORECARD.md'), 'utf-8');
    expect(scorecard).toContain(pkg.version);
  });

  it('CLI source contains version flag handling', () => {
    const cli = readFileSync(resolve(__dirname, '..', 'src', 'cli.ts'), 'utf-8');
    expect(cli).toContain('--version');
    expect(cli).toContain('-V');
  });

  it('usage text documents --version flag', () => {
    const cli = readFileSync(resolve(repoRoot, 'src', 'cli.ts'), 'utf-8');
    expect(cli).toContain('--version, -V');
  });
});

describe('translation count consistency', () => {
  // Derived from the actual README.<lang>.md files on disk so the docs can never
  // silently drift from reality (the 8-vs-7 bug). English is the source README.md;
  // every other language is a translation file.
  it('README nav lists exactly the translated READMEs that exist on disk', () => {
    const readme = readFileSync(resolve(repoRoot, 'README.md'), 'utf-8');
    for (const file of translationFiles) {
      expect(readme).toContain(`href="${file}"`);
    }
  });

  it('SCORECARD.md states the correct translation count', () => {
    const scorecard = readFileSync(resolve(repoRoot, 'SCORECARD.md'), 'utf-8');
    expect(scorecard).toContain(`${translationCount} languages`);
  });

  it('SHIP_GATE.md states the correct translation count', () => {
    const shipGate = readFileSync(resolve(repoRoot, 'SHIP_GATE.md'), 'utf-8');
    // "7 translations + English source" (translationCount langs translated, English is source)
    expect(shipGate).toContain(`${translationCount} translations`);
  });
});
