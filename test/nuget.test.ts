import { describe, it, expect } from 'vitest';
import { stats } from '../src/index.js';

describe('nuget provider', () => {
  it('fetches stats for a known package', async () => {
    const result = await stats('nuget', 'Newtonsoft.Json');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('nuget');
    expect(result!.downloads.total).toBeGreaterThan(0);
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  it('returns null for nonexistent package', async () => {
    const result = await stats('nuget', 'ThisPackageDoesNotExistXyz123');
    expect(result).toBeNull();
  }, 15000);
});
