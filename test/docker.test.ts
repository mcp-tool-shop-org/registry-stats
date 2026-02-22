import { describe, it, expect } from 'vitest';
import { stats } from '../src/index.js';

describe('docker provider', () => {
  it('fetches stats for a known image', async () => {
    const result = await stats('docker', 'library/node');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('docker');
    expect(result!.downloads.total).toBeGreaterThan(0);
    expect(result!.extra?.stars).toBeDefined();
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  it('returns null for nonexistent image', async () => {
    const result = await stats('docker', 'nonexistent-user-xyz/nonexistent-image-123');
    expect(result).toBeNull();
  }, 15000);
});
