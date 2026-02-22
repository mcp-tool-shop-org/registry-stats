export type RegistryName = 'npm' | 'pypi' | 'nuget' | 'vscode' | 'docker';

export interface PackageStats {
  registry: RegistryName;
  package: string;
  downloads: {
    total?: number;
    lastDay?: number;
    lastWeek?: number;
    lastMonth?: number;
  };
  extra?: Record<string, unknown>;
  fetchedAt: string;
}

export interface DailyDownloads {
  date: string;
  downloads: number;
}

export interface RegistryProvider {
  name: RegistryName;
  getStats(pkg: string, options?: StatsOptions): Promise<PackageStats | null>;
  getRange?(pkg: string, start: string, end: string): Promise<DailyDownloads[]>;
}

export interface StatsOptions {
  dockerToken?: string;
}

export class RegistryError extends Error {
  constructor(
    public registry: RegistryName,
    public statusCode: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(`[${registry}] ${message}`);
    this.name = 'RegistryError';
  }
}
