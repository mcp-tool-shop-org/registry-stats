import { describe, it, expect } from 'vitest';
import { stats } from '../src/index.js';

describe('npm provider', () => {
  it('fetches stats for a known package', async () => {
    const result = await stats('npm', 'express');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('npm');
    expect(result!.package).toBe('express');
    expect(result!.downloads.lastWeek).toBeGreaterThan(0);
    expect(result!.downloads.lastMonth).toBeGreaterThan(0);
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  it('returns null for nonexistent package', async () => {
    const result = await stats('npm', 'this-package-does-not-exist-xyz-123-abc');
    expect(result).toBeNull();
  }, 15000);

  it('fetches range data', async () => {
    const data = await stats.range('npm', 'express', '2025-01-01', '2025-01-07');
    expect(data.length).toBeGreaterThan(0);
    expect(data[0].date).toBeTruthy();
    expect(data[0].downloads).toBeGreaterThanOrEqual(0);
  }, 15000);
});
