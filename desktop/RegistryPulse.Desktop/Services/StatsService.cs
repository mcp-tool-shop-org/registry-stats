using System.Diagnostics;

namespace RegistryPulse.Desktop.Services;

/// <summary>
/// Downloads and caches stats.json from the live GitHub Pages site.
/// Falls back to bundled data when offline.
/// </summary>
public sealed class StatsService
{
    private static readonly string CacheDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "RegistryPulse", "data");

    private static readonly string CachePath = Path.Combine(CacheDir, "stats.json");

    private const string SourceUrl =
        "https://mcp-tool-shop-org.github.io/registry-stats/data/stats.json";

    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };

    /// <summary>
    /// Download fresh stats.json from GitHub Pages and cache locally.
    /// Returns true on success.
    /// </summary>
    public async Task<bool> RefreshAsync()
    {
        try
        {
            var bytes = await _http.GetByteArrayAsync(SourceUrl);
            if (bytes.Length < 10) return false; // sanity check

            Directory.CreateDirectory(CacheDir);
            await File.WriteAllBytesAsync(CachePath, bytes);
            return true;
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[StatsService] RefreshAsync error: {ex.Message}");
            return false;
        }
    }

    /// <summary>
    /// Read cached stats.json bytes, or null if no cache exists.
    /// </summary>
    public byte[]? GetCachedStatsBytes()
    {
        try
        {
            if (File.Exists(CachePath))
                return File.ReadAllBytes(CachePath);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[StatsService] GetCachedStatsBytes error: {ex.Message}");
        }
        return null;
    }
}
