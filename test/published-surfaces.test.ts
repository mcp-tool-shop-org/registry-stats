import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('reader-facing highs from the confirming audit', () => {
  it('first paint counts GitHub with the other all-time registries', () => {
    const src = readFileSync('site/src/pages/dashboard.astro', 'utf8');
    expect(src).toContain("github: 'GitHub'");
    expect(src).toContain("['vscode','nuget','docker','github']");
    expect(src).not.toContain("['vscode','nuget','docker'].includes");
    expect(src).toContain('VS Code/NuGet/Docker/GitHub = all-time');
    expect(src).toContain('function regWindow');
    expect(src).toContain('fi(regDisplayVal(reg, r))');
    expect(src).toContain('isNew: r.isNew === true');
    expect(src).toContain("if (r.isNew === true)");
    expect(src).toContain("doc.text('n/a', lc[5], y)");
    expect(src).not.toContain('isNew: r.trendPct === null || r.trendPct === undefined');
    expect(src).not.toContain(") : 'New'");
    expect(src).not.toContain("doc.text('--', lc[6], y)");
  });

  it('the handbook says serve stays on loopback and listen(port) does not', () => {
    const src = readFileSync('site/src/content/docs/handbook/api.md', 'utf8');
    expect(src).toContain("serve({ port: 3000, host: '127.0.0.1' })");
    expect(src).toContain('binds every interface');
    expect(src).toContain('Access-Control-Allow-Origin: *');
    expect(src).not.toContain('createServer(handler).listen(3000);');
    expect(src).toContain('X-Registry-Errors');
    expect(src).toContain('An empty array plus the `X-Registry-Errors` header is an outage.');
    expect(src).toContain('An empty array without that header means no registry returned the package.');
  });

  it('the security writeup says a githubToken in the config file stays there', () => {
    const security = readFileSync('SECURITY.md', 'utf8');
    const readme = readFileSync('README.md', 'utf8');
    for (const text of [security, readme]) {
      expect(text).toContain('githubToken');
      expect(text).not.toContain('is not stored');
      expect(text).not.toContain('is not written to disk');
      expect(text).toContain('stays in the file');
    }
  });
});
