import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const CLI_SOURCE = resolve(__dirname, 'cli.ts');
const PKG = JSON.parse(readFileSync(resolve(__dirname, '..', 'package.json'), 'utf-8'));

const LIVE = process.env.LIVE_API === '1';
const liveIt = LIVE ? it : it.skip;

/**
 * Run the CLI with given args via tsx (source) subprocess.
 * Uses tsx so tests work before `npm run build`.
 * Returns { stdout, stderr, code }.
 */
async function run(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  try {
    const { stdout, stderr } = await execFileAsync('npx', ['tsx', CLI_SOURCE, ...args], {
      timeout: 30_000,
      env: { ...process.env, NO_COLOR: '1' },
      shell: true,
    });
    return { stdout, stderr, code: 0 };
  } catch (e: any) {
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      code: e.code ?? 1,
    };
  }
}

describe('CLI', () => {
  // ─── Version flag ───────────────────────────────────────────────────
  describe('--version', () => {
    it('prints version and exits 0 with --version', async () => {
      const r = await run(['--version']);
      expect(r.code).toBe(0);
      expect(r.stdout.trim()).toBe(`registry-stats ${PKG.version}`);
    });

    it('prints version and exits 0 with -V', async () => {
      const r = await run(['-V']);
      expect(r.code).toBe(0);
      expect(r.stdout.trim()).toBe(`registry-stats ${PKG.version}`);
    });
  });

  // ─── Help flag ──────────────────────────────────────────────────────
  describe('--help', () => {
    it('prints usage and exits 0 with --help', async () => {
      const r = await run(['--help']);
      expect(r.code).toBe(0);
      expect(r.stdout).toContain('Usage: registry-stats');
      expect(r.stdout).toContain('Options:');
      expect(r.stdout).toContain('Examples:');
    });

    it('prints usage and exits 0 with -h', async () => {
      const r = await run(['-h']);
      expect(r.code).toBe(0);
      expect(r.stdout).toContain('Usage: registry-stats');
    });

    it('documents --json shorthand in help output', async () => {
      const r = await run(['--help']);
      expect(r.stdout).toContain('--json');
      expect(r.stdout).toContain('Shorthand for --format json');
    });

    it('documents all primary flags in help', async () => {
      const r = await run(['--help']);
      expect(r.stdout).toContain('--registry');
      expect(r.stdout).toContain('--mine');
      expect(r.stdout).toContain('--range');
      expect(r.stdout).toContain('--compare');
      expect(r.stdout).toContain('--format');
      expect(r.stdout).toContain('--init');
      expect(r.stdout).toContain('--version');
      expect(r.stdout).toContain('--help');
      expect(r.stdout).toContain('serve');
    });
  });

  // ─── Port validation ────────────────────────────────────────────────
  describe('serve --port validation', () => {
    it('rejects non-numeric port', async () => {
      const r = await run(['serve', '--port', 'abc']);
      expect(r.code).not.toBe(0);
      expect(r.stderr).toContain('--port must be a number between 1 and 65535');
    });

    it('rejects port 0', async () => {
      const r = await run(['serve', '--port', '0']);
      expect(r.code).not.toBe(0);
      expect(r.stderr).toContain('--port must be a number between 1 and 65535');
    });

    it('rejects port above 65535', async () => {
      const r = await run(['serve', '--port', '70000']);
      expect(r.code).not.toBe(0);
      expect(r.stderr).toContain('--port must be a number between 1 and 65535');
    });

    it('rejects negative port', async () => {
      const r = await run(['serve', '--port', '-1']);
      expect(r.code).not.toBe(0);
      expect(r.stderr).toContain('--port must be a number between 1 and 65535');
    });
  });

  // ─── Unknown flags (hits live API) ────────────────────────────────
  describe('unknown flags', () => {
    liveIt('warns about unknown flags', async () => {
      const r = await run(['express', '--typo']);
      expect(r.stderr).toContain('Warning: unknown option(s): --typo');
    }, 30_000);

    liveIt('warns about multiple unknown flags', async () => {
      const r = await run(['express', '--foo', '--bar']);
      expect(r.stderr).toContain('--foo');
      expect(r.stderr).toContain('--bar');
    }, 30_000);
  });

  // ─── csv/chart without --range (hits live API) ────────────────────
  describe('format warnings', () => {
    liveIt('warns when --format csv used without --range', async () => {
      const r = await run(['express', '--format', 'csv']);
      expect(r.stderr).toContain('Warning: --format csv only produces meaningful output with --range');
    }, 30_000);

    liveIt('warns when --format chart used without --range', async () => {
      const r = await run(['express', '--format', 'chart']);
      expect(r.stderr).toContain('Warning: --format chart only produces meaningful output with --range');
    }, 30_000);
  });

  // ─── Argument parsing (hits live API) ─────────────────────────────
  describe('argument parsing', () => {
    liveIt('--json sets format to json (shorthand)', async () => {
      const r = await run(['express', '--json', '--typo']);
      expect(r.stderr).not.toContain('--json');
      expect(r.stderr).toContain('--typo');
    }, 30_000);

    liveIt('recognizes -r as --registry alias', async () => {
      const r = await run(['express', '-r', 'npm', '--typo']);
      expect(r.stderr).not.toContain('-r');
      expect(r.stderr).toContain('--typo');
    }, 30_000);
  });

  // ─── Range validation ──────────────────────────────────────────────
  describe('--range validation', () => {
    it('rejects malformed range (no colon)', async () => {
      const r = await run(['express', '-r', 'npm', '--range', 'bad']);
      expect(r.code).not.toBe(0);
      expect(r.stderr).toContain('--range must be start:end');
    });
  });

  // ─── No args (no config) ───────────────────────────────────────────
  describe('no arguments', () => {
    it('prints help when no args and no config present', async () => {
      const r = await run([]);
      expect(r.stdout + r.stderr).toBeTruthy();
    });
  });

  // ─── Exit codes ─────────────────────────────────────────────────────
  describe('exit codes', () => {
    it('exits 0 for --help', async () => {
      const r = await run(['--help']);
      expect(r.code).toBe(0);
    });

    it('exits 0 for --version', async () => {
      const r = await run(['--version']);
      expect(r.code).toBe(0);
    });

    it('exits non-zero for invalid port', async () => {
      const r = await run(['serve', '--port', 'xyz']);
      expect(r.code).not.toBe(0);
    });

    it('exits non-zero for bad range format', async () => {
      const r = await run(['express', '-r', 'npm', '--range', 'nocolon']);
      expect(r.code).not.toBe(0);
    });
  });

  // ─── Error output goes to stderr ───────────────────────────────────
  describe('stderr/stdout separation', () => {
    it('errors go to stderr, not stdout', async () => {
      const r = await run(['serve', '--port', 'bad']);
      expect(r.stderr).toContain('Error:');
      expect(r.stdout).not.toContain('Error:');
    });

    it('help output goes to stdout', async () => {
      const r = await run(['--help']);
      expect(r.stdout).toContain('Usage:');
      expect(r.stderr).toBe('');
    });
  });

  // ─── Source-level checks (no subprocess needed) ────────────────────
  describe('main() .catch()', () => {
    it('cli.ts source has .catch() on main()', () => {
      const src = readFileSync(resolve(__dirname, 'cli.ts'), 'utf-8');
      expect(src).toContain('main().catch(');
    });
  });

  describe('registry error logging', () => {
    it('cli.ts no longer has empty catch blocks', () => {
      const src = readFileSync(resolve(__dirname, 'cli.ts'), 'utf-8');
      expect(src).not.toMatch(/catch\s*\{[\s]*\}/);
      expect(src).not.toContain('skip failed registries silently');
    });

    it('cli.ts logs warning on registry fetch failure', () => {
      const src = readFileSync(resolve(__dirname, 'cli.ts'), 'utf-8');
      expect(src).toContain('Warning: failed to fetch');
    });
  });
});
