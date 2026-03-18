import { describe, it, expect, vi } from 'vitest';
import { stats } from '../src/index.js';
import { docker } from '../src/providers/docker.js';

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

  it('URL-encodes package name segments to prevent injection', async () => {
    // A malicious package name with special characters should be safely encoded
    const result = await docker.getStats('../../etc/passwd');
    // Should return null (not found), not throw or traverse paths
    expect(result).toBeNull();
  }, 15000);
});
