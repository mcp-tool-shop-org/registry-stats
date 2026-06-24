import type { RegistryProvider, PackageStats, StatsOptions } from '../types.js';
import { RegistryError } from '../types.js';
import { fetchWithRetry } from '../fetch.js';

const API = 'https://api.github.com/repos';
const PER_PAGE = 100;
// Defensive cap: 10 pages × 100 = 1000 releases, far beyond any real repo.
// Stops a malformed paging loop from issuing unbounded requests.
const MAX_PAGES = 10;

interface GitHubAsset {
  name: string;
  download_count: number;
}

interface GitHubRelease {
  tag_name: string;
  published_at: string | null;
  assets: GitHubAsset[];
}

/**
 * GitHub Releases provider. The package identifier is a repository slug
 * ("owner/repo"). Reports the cumulative download count of all uploaded release
 * assets (binaries, checksums, SBOMs, etc.) summed across every release.
 *
 * GitHub only counts manually-uploaded assets — it does NOT report downloads of
 * the auto-generated source zipball/tarball — so a source-only repo reports 0.
 * download_count is all-time cumulative (no weekly/monthly breakdown), so the
 * dashboard derives weekly deltas via snapshot diffing, same as NuGet/VS Code.
 */
export const github: RegistryProvider = {
  name: 'github',
  // Unauthenticated GitHub is 60 req/hr; a token raises it to 5000/hr.
  rateLimit: { maxRequests: 60, windowSeconds: 3600, authRaisesLimit: true },

  async getStats(pkg: string, options?: StatsOptions): Promise<PackageStats | null> {
    // The identifier must be exactly "owner/repo". Reject empty or traversal
    // segments outright (encodeURIComponent would let '..' survive), then encode
    // the rest to neutralize injection characters.
    const segments = pkg.split('/');
    if (segments.length !== 2 || segments.some((s) => s === '' || s === '.' || s === '..')) {
      throw new RegistryError('github', 0, `Invalid repository "${pkg}": expected "owner/repo"`);
    }
    const safe = segments.map((s) => encodeURIComponent(s)).join('/');

    const headers: Record<string, string> = {
      // GitHub rejects requests without a User-Agent with a 403.
      'User-Agent': 'registry-stats',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
    if (options?.githubToken) {
      headers['Authorization'] = `Bearer ${options.githubToken}`;
    }

    let totalDownloads = 0;
    let assetCount = 0;
    let releaseCount = 0;
    let latestTag: string | undefined;
    let found = false;

    for (let page = 1; page <= MAX_PAGES; page++) {
      const url = `${API}/${safe}/releases?per_page=${PER_PAGE}&page=${page}`;
      const releases = await fetchWithRetry<GitHubRelease[]>(url, 'github', { headers });

      // 404 on the first page means the repo doesn't exist (vs. an existing repo
      // with zero releases, which returns an empty array and a valid total of 0).
      if (releases === null) {
        if (page === 1) return null;
        break;
      }
      found = true;
      if (releases.length === 0) break;

      for (const rel of releases) {
        releaseCount++;
        if (latestTag === undefined && rel.tag_name) latestTag = rel.tag_name;
        for (const asset of rel.assets ?? []) {
          assetCount++;
          totalDownloads += typeof asset.download_count === 'number' ? asset.download_count : 0;
        }
      }

      if (releases.length < PER_PAGE) break;
    }

    if (!found) return null;

    return {
      registry: 'github',
      package: pkg,
      downloads: {
        total: totalDownloads,
      },
      extra: {
        releases: releaseCount,
        assets: assetCount,
        latestTag,
      },
      fetchedAt: new Date().toISOString(),
    };
  },
};
