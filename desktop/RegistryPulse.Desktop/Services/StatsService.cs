using System.Diagnostics;

namespace RegistryPulse.Desktop.Services;

/// <summary>
/// Downloads and caches stats.json from the live GitHub Pages site.
/// Falls back to bundled data when offline.
/// </summary>
public sealed class StatsService
{
    private readonly string _cacheDir;
    private readonly string _cachePath;

    private const string SourceUrl =
        "https://mcp-tool-shop-org.github.io/registry-stats/data/stats.json";

    private readonly HttpClient _http = new() { Timeout = TimeSpan.FromSeconds(15) };

    /// <summary>
    /// <paramref name="rootDirectory"/> replaces LocalApplicationData as the
    /// parent of RegistryPulse\data. Null keeps the production cache path
    /// %LOCALAPPDATA%\RegistryPulse\data\stats.json.
    /// </summary>
    public StatsService(string? rootDirectory = null)
    {
        var root = string.IsNullOrWhiteSpace(rootDirectory)
            ? Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)
            : rootDirectory;
        _cacheDir = Path.Combine(root, "RegistryPulse", "data");
        _cachePath = Path.Combine(_cacheDir, "stats.json");
    }

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

            Directory.CreateDirectory(_cacheDir);
            await File.WriteAllBytesAsync(_cachePath, bytes);
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
            if (File.Exists(_cachePath))
                return File.ReadAllBytes(_cachePath);
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[StatsService] GetCachedStatsBytes error: {ex.Message}");
        }
        return null;
    }
}
