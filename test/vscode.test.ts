import { describe, it, expect } from 'vitest';
import { stats } from '../src/index.js';

describe('vscode provider', () => {
  it('fetches stats for a known extension', async () => {
    const result = await stats('vscode', 'esbenp.prettier-vscode');
    expect(result).not.toBeNull();
    expect(result!.registry).toBe('vscode');
    expect(result!.downloads.total).toBeGreaterThan(0);
    expect(result!.extra?.rating).toBeDefined();
    expect(result!.fetchedAt).toBeTruthy();
  }, 15000);

  it('returns null for nonexistent extension', async () => {
    const result = await stats('vscode', 'nonexistent.extension-xyz-123');
    expect(result).toBeNull();
  }, 15000);
});
