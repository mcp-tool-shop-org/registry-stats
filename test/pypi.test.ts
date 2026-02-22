import { describe, it, expect } from 'vitest';
import { stats } from '../src/index.js';

describe('pypi provider', () => {
  it('fetches stats for a known package', async () => {
    const result = await stats('pypi', 'requests');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('pypi');
    expect(result!.downloads.lastWeek).toBeGreaterThan(0);
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  it('returns null for nonexistent package', async () => {
    const result = await stats('pypi', 'this-package-does-not-exist-xyz-123-abc');
    expect(result).toBeNull();
  }, 15000);
});
