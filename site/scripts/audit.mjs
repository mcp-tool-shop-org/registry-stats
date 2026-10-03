// npm audit --audit-level=high, minus advisories listed in IGNORED.
// npm has no flag to ignore one advisory, so this reads `npm audit --json`
// and fails on any high or critical finding that is not explained entirely
// by an ignored advisory (directly, or through the packages it reaches).
import { execFileSync } from 'node:child_process';

// Each entry: advisory id → why it is ignored. Remove an entry once a
// patched release exists; the script prints a reminder when it stops matching.
const IGNORED = {
  // http-cache-semantics <= 4.2.0, no patched release (checked 2026-10-03).
  // The flaw is a shared cache disclosing one user's responses to another.
  // Astro uses it at build time only; this site is static on Pages, with no
  // shared cache and no users at build time.
  'GHSA-ch52-4w7c-c8xp': 'no fix upstream; build-time only on a static site',
};

const LEVELS = { info: 0, low: 1, moderate: 2, high: 3, critical: 4 };
const FAIL_AT = LEVELS.high;

let raw;
try {
  raw = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8', shell: process.platform === 'win32' });
} catch (err) {
  raw = err.stdout; // npm audit exits non-zero when it finds anything
}
const report = JSON.parse(raw);
const vulns = report.vulnerabilities ?? {};

const advisoryId = (via) => via.url?.split('/').pop();
const seen = new Set();
const ignoredOnly = new Map();
function onlyIgnored(name) {
  if (ignoredOnly.has(name)) return ignoredOnly.get(name);
  if (seen.has(name)) return true; // cycle: decided by the other paths
  seen.add(name);
  const v = vulns[name];
  const result = !!v && v.via.every((via) =>
    typeof via === 'string' ? onlyIgnored(via) : advisoryId(via) in IGNORED);
  ignoredOnly.set(name, result);
  return result;
}

const used = new Set();
for (const v of Object.values(vulns)) {
  for (const via of v.via) if (typeof via !== 'string' && advisoryId(via) in IGNORED) used.add(advisoryId(via));
}

const failing = Object.values(vulns)
  .filter((v) => LEVELS[v.severity] >= FAIL_AT && !onlyIgnored(v.name));

for (const id of used) console.log(`ignored ${id}: ${IGNORED[id]}`);
for (const id of Object.keys(IGNORED)) {
  if (!used.has(id)) console.log(`note: ${id} no longer matches anything; remove it from IGNORED`);
}

if (failing.length) {
  console.error(`${failing.length} high or critical finding(s) not covered by an ignored advisory:`);
  for (const v of failing) console.error(`  ${v.name} (${v.severity})`);
  process.exit(1);
}
console.log('audit: no high or critical findings outside the ignored list');
