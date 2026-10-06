import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const setup = readFileSync(
  'desktop/RegistryPulse.Desktop/Resources/Raw/wwwroot/registry-stats/setup/index.html',
  'utf8',
);
const dashboard = readFileSync(
  'desktop/RegistryPulse.Desktop/Resources/Raw/wwwroot/registry-stats/dashboard/index.html',
  'utf8',
);
const host = readFileSync('desktop/RegistryPulse.Desktop/MainPage.xaml.cs', 'utf8');
const manifest = readFileSync(
  'desktop/RegistryPulse.Desktop/Platforms/Windows/Package.appxmanifest',
  'utf8',
);

describe('packaged desktop bridge', () => {
  it('handles every action the packaged setup page sends', () => {
    const sent = [...setup.matchAll(/postBridge\('([^']+)'/g)].map((m) => m[1]);
    expect([...sent].sort()).toEqual([
      'clearPackagesJson',
      'fetchNow',
      'getBranding',
      'getPackagesJson',
      'savePackagesJson',
    ]);
    for (const action of sent) {
      expect(host).toContain(`case "${action}":`);
    }
  });

  it('wires the menu handlers and the dashboard stale banner', () => {
    for (const handler of [
      'OnRefreshClicked',
      'OnExportCsvClicked',
      'OnSetupClicked',
      'OnPrivacyClicked',
      'OnAboutClicked',
    ]) {
      expect(host).toContain(handler);
    }
    expect(host).toContain('Application.Current?.Quit()');
    expect(host).toContain('refreshFailed');
    expect(dashboard).toContain('refreshFailed');
    expect(dashboard).toContain("msg.action !== 'status'");
  });

  it('restores the refresh button when the host reports an error', () => {
    expect(setup).toContain("msg.forAction === 'savePackagesJson'");
    expect(setup).toContain('updateButtonEmphasis(true)');
    expect(host).toContain('forAction = action');
  });

  it('keeps Home, Analytics, Leaderboard, and Help as separate tabs', () => {
    expect(dashboard).toContain('id="tab-bar"');
    for (const name of ['home', 'analytics', 'leaderboard', 'help']) {
      expect(dashboard).toContain(`data-tab="${name}"`);
      expect(dashboard).toContain(`id="tab-${name}"`);
    }
    expect(dashboard).toContain('id="chat-section"');
    expect(dashboard).toContain('id="chart-heatmap"');
    expect(dashboard).toContain('id="chart-top10"');
    expect(dashboard).toContain('chartPayloadFromStats');
    expect(dashboard).not.toContain('data.fetchedAt === buildTime');
    expect(dashboard).not.toContain('defaulting to cloud models');
    expect(dashboard).not.toContain('Cloud models by default');
    expect(dashboard).toContain('Local model on this machine');
    expect(dashboard).toContain('/registry-stats/vendor/chart.umd.min.js');
    expect(dashboard).not.toContain('cdn.jsdelivr.net/npm/chart.js');
    expect(dashboard.indexOf('id="tab-home"')).toBeLessThan(dashboard.indexOf('id="chat-section"'));
    expect(dashboard.indexOf('id="chat-section"')).toBeLessThan(dashboard.indexOf('id="summary"'));
    expect(dashboard.indexOf('id="tab-analytics"')).toBeLessThan(dashboard.indexOf('id="exec-snapshot"'));
    expect(dashboard.indexOf('id="tab-leaderboard"')).toBeLessThan(dashboard.indexOf('id="leaderboard"'));
  });

  it('ships package 3.4.0.0 with the six-registry setup page', () => {
    expect(manifest).toContain('Name="mcp-tool-shop.RegistryPulse"');
    expect(manifest).toContain('Publisher="CN=5305D976-6952-4F00-9C21-3A5DB090359F"');
    expect(manifest).toContain('<PublisherDisplayName>mcp-tool-shop</PublisherDisplayName>');
    expect(manifest).toContain('Version="3.4.0.0"');
    expect(manifest).not.toContain('Five registries');
    expect(manifest).toContain('Six registries');
    expect(setup).toContain('>0 / 6<');
    expect(setup).not.toContain('0 / 5');
  });
});
