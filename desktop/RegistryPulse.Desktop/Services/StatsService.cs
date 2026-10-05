using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.Json;
using System.Linq;

namespace RegistryPulse.Desktop.Services;

/// <summary>
/// Refreshes stats.json for the dashboard.
/// A saved portfolio is fetched from the registries the user named.
/// With no portfolio, the app downloads the published GitHub Pages snapshot.
/// </summary>
public sealed class StatsService
{
    private readonly string _cacheDir;
    private readonly HttpClient _http;

    private const string SourceUrl =
        "https://mcp-tool-shop-org.github.io/registry-stats/data/stats.json";

    private const int MaxSnapshotBytes = 8 * 1024 * 1024;
    private const int MaxResponseBytes = 2 * 1024 * 1024;
    private const int MaxPackages = 80;

    /// <summary>
    /// <paramref name="rootDirectory"/> replaces LocalApplicationData as the
    /// parent of RegistryPulse. Null keeps the production paths under
    /// %LOCALAPPDATA%\RegistryPulse. <paramref name="handler"/> is for tests.
    /// </summary>
    public StatsService(string? rootDirectory = null, HttpMessageHandler? handler = null)
    {
        var root = string.IsNullOrWhiteSpace(rootDirectory)
            ? Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData)
            : rootDirectory;
        _cacheDir = Path.Combine(root, "RegistryPulse", "data");
        CachePath = Path.Combine(_cacheDir, "stats.json");
        PackagesPath = Path.Combine(root, "RegistryPulse", "config", "packages.json");
        _http = handler is null ? new HttpClient() : new HttpClient(handler, disposeHandler: false);
        _http.Timeout = TimeSpan.FromSeconds(20);
        _http.DefaultRequestHeaders.UserAgent.ParseAdd("RegistryPulse");
    }

    public string CachePath { get; }

    public string PackagesPath { get; }

    /// <summary>Set when <see cref="RefreshAsync"/> returns false.</summary>
    public string? LastError { get; private set; }

    /// <summary>
    /// Refresh the local snapshot. Returns true when a valid stats document was written.
    /// </summary>
    public async Task<bool> RefreshAsync()
    {
        LastError = null;
        try
        {
            if (File.Exists(PackagesPath))
            {
                var portfolio = LoadPortfolio(await File.ReadAllTextAsync(PackagesPath));
                if (portfolio.Error is not null)
                {
                    LastError = portfolio.Error;
                    return false;
                }
                if (portfolio.Packages.Count > 0)
                    return await RefreshPortfolioResolvedAsync(portfolio.Packages);
            }

            return await RefreshPublishedAsync();
        }
        catch (Exception ex)
        {
            LastError = ex.Message;
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

    private async Task<bool> RefreshPublishedAsync()
    {
        using var response = await _http.GetAsync(SourceUrl, HttpCompletionOption.ResponseHeadersRead);
        if (!response.IsSuccessStatusCode)
        {
            LastError = $"Published snapshot returned HTTP {(int)response.StatusCode}.";
            return false;
        }

        var bytes = await ReadCapped(response, MaxSnapshotBytes);
        if (bytes is null)
        {
            LastError ??= "Published snapshot was empty or larger than 8 MB.";
            return false;
        }

        if (!IsDashboardDocument(bytes, out var problem))
        {
            LastError = problem;
            return false;
        }

        await WriteAtomicAsync(CachePath, bytes);
        return true;
    }

    private async Task<bool> RefreshPortfolioAsync(List<PortfolioPackage> packages)
    {
        var errors = new List<string>();
        var rows = new List<LeaderboardRow>();
        if (packages.Count > MaxPackages)
        {
            errors.Add($"Stopped after {MaxPackages} packages.");
            packages = packages.Take(MaxPackages).ToList();
        }

        for (var i = 0; i < packages.Count; i += 4)
        {
            var slice = packages.Skip(i).Take(4);
            var fetched = await Task.WhenAll(slice.Select(item => FetchOne(item, errors)));
            foreach (var row in fetched)
            {
                if (row is not null) rows.Add(row);
            }
        }

        if (rows.Count == 0)
        {
            LastError = errors.Count > 0
                ? string.Join("; ", errors)
                : "No package stats were returned.";
            return false;
        }

        var document = BuildDocument(packages, rows, errors);
        var json = JsonSerializer.Serialize(document, JsonOptions);
        await WriteAtomicAsync(CachePath, Encoding.UTF8.GetBytes(json));
        return true;
    }

    private async Task<LeaderboardRow?> FetchOne(PortfolioPackage item, List<string> errors)
    {
        try
        {
            return item.Registry switch
            {
                "npm" => await FetchNpm(item.Name),
                "pypi" => await FetchPypi(item.Name),
                "nuget" => await FetchNuget(item.Name),
                "vscode" => await FetchVscode(item.Name),
                "docker" => await FetchDocker(item.Name),
                "github" => await FetchGithub(item.Name),
                _ => null,
            };
        }
        catch (Exception ex)
        {
            errors.Add($"{item.Registry}:{item.Name}: {ex.Message}");
            return null;
        }
    }

    private async Task<LeaderboardRow?> FetchNpm(string name)
    {
        var end = DateTime.UtcNow.Date;
        var start = end.AddDays(-29);
        var url = $"https://api.npmjs.org/downloads/range/{start:yyyy-MM-dd}:{end:yyyy-MM-dd}/{Uri.EscapeDataString(name)}";
        using var doc = await GetJson(url);
        if (doc is null || !doc.RootElement.TryGetProperty("downloads", out var days) || days.ValueKind != JsonValueKind.Array)
            return null;

        var counts = new List<int>();
        foreach (var day in days.EnumerateArray())
        {
            counts.Add(day.TryGetProperty("downloads", out var n) && n.TryGetInt32(out var value) ? value : 0);
        }

        var range = counts.Count == 30 ? counts.ToArray() : null;
        var month = counts.Sum();
        return new LeaderboardRow(name, "npm", counts.TakeLast(7).Sum(), month, month, range);
    }

    private async Task<LeaderboardRow?> FetchPypi(string name)
    {
        var url = $"https://pypistats.org/api/packages/{Uri.EscapeDataString(name)}/recent";
        using var doc = await GetJson(url);
        if (doc is null || !doc.RootElement.TryGetProperty("data", out var data)) return null;
        var week = ReadLong(data, "last_week");
        var month = ReadLong(data, "last_month");
        return new LeaderboardRow(name, "pypi", week, month, month, null);
    }

    private async Task<LeaderboardRow?> FetchNuget(string name)
    {
        var url = $"https://azuresearch-usnc.nuget.org/query?q=packageid:{Uri.EscapeDataString(name)}&take=1";
        using var doc = await GetJson(url);
        if (doc is null || !doc.RootElement.TryGetProperty("data", out var data) || data.ValueKind != JsonValueKind.Array)
            return null;

        foreach (var entry in data.EnumerateArray())
        {
            var id = entry.TryGetProperty("id", out var idEl) ? idEl.GetString() : null;
            if (!string.Equals(id, name, StringComparison.OrdinalIgnoreCase)) continue;
            var total = ReadLong(entry, "totalDownloads");
            return new LeaderboardRow(id ?? name, "nuget", 0, 0, total, null);
        }
        return null;
    }

    private async Task<LeaderboardRow?> FetchVscode(string name)
    {
        var body = JsonSerializer.Serialize(new
        {
            filters = new[]
            {
                new { criteria = new[] { new { filterType = 7, value = name } } },
            },
            flags = 0x100,
        });
        using var doc = await GetJson(
            "https://marketplace.visualstudio.com/_apis/public/gallery/extensionquery",
            HttpMethod.Post,
            body,
            accept: "application/json;api-version=3.0-preview.1");
        if (doc is null) return null;
        if (!doc.RootElement.TryGetProperty("results", out var results) || results.GetArrayLength() == 0) return null;
        var extensions = results[0].GetProperty("extensions");
        if (extensions.GetArrayLength() == 0) return null;
        var ext = extensions[0];
        var publisher = ext.GetProperty("publisher").GetProperty("publisherName").GetString() ?? "";
        var extensionName = ext.GetProperty("extensionName").GetString() ?? name;
        long installs = 0;
        if (ext.TryGetProperty("statistics", out var stats))
        {
            foreach (var stat in stats.EnumerateArray())
            {
                if (stat.TryGetProperty("statisticName", out var statName) && statName.GetString() == "install")
                    installs = ReadLong(stat, "value");
            }
        }
        return new LeaderboardRow($"{publisher}.{extensionName}", "vscode", 0, 0, installs, null);
    }

    private async Task<LeaderboardRow?> FetchDocker(string name)
    {
        var image = name.Contains('/') ? name : "library/" + name;
        var parts = image.Split('/');
        if (parts.Length != 2 || parts.Any(part => part is "" or "." or ".."))
            throw new InvalidOperationException($"Invalid image name \"{name}\".");

        var url = $"https://hub.docker.com/v2/repositories/{Uri.EscapeDataString(parts[0])}/{Uri.EscapeDataString(parts[1])}";
        using var doc = await GetJson(url);
        if (doc is null) return null;
        var pulls = ReadLong(doc.RootElement, "pull_count");
        var repoName = doc.RootElement.TryGetProperty("name", out var n) ? n.GetString() : parts[1];
        var ns = doc.RootElement.TryGetProperty("namespace", out var nsEl) ? nsEl.GetString() : parts[0];
        return new LeaderboardRow($"{ns}/{repoName}", "docker", 0, 0, pulls, null);
    }

    private async Task<LeaderboardRow?> FetchGithub(string name)
    {
        var parts = name.Split('/');
        if (parts.Length != 2 || parts.Any(part => part is "" or "." or ".."))
            throw new InvalidOperationException($"Invalid repository \"{name}\". Expected owner/repo.");

        var url = $"https://api.github.com/repos/{Uri.EscapeDataString(parts[0])}/{Uri.EscapeDataString(parts[1])}/releases?per_page=100";
        using var doc = await GetJson(url, accept: "application/vnd.github+json");
        if (doc is null || doc.RootElement.ValueKind != JsonValueKind.Array) return null;

        long total = 0;
        foreach (var release in doc.RootElement.EnumerateArray())
        {
            if (!release.TryGetProperty("assets", out var assets)) continue;
            foreach (var asset in assets.EnumerateArray())
                total += ReadLong(asset, "download_count");
        }
        return new LeaderboardRow(name, "github", 0, 0, total, null);
    }

    private async Task<JsonDocument?> GetJson(string url, HttpMethod? method = null, string? body = null, string? accept = null)
    {
        using var request = new HttpRequestMessage(method ?? HttpMethod.Get, url);
        if (accept is not null) request.Headers.TryAddWithoutValidation("Accept", accept);
        if (body is not null)
        {
            request.Content = new StringContent(body, Encoding.UTF8, "application/json");
        }

        using var response = await _http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
        if (response.StatusCode == HttpStatusCode.NotFound) return null;
        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException($"HTTP {(int)response.StatusCode} from {url}");

        var bytes = await ReadCapped(response, MaxResponseBytes);
        if (bytes is null) throw new InvalidOperationException($"Response from {url} was empty or too large.");
        return JsonDocument.Parse(bytes);
    }

    private async Task<byte[]?> ReadCapped(HttpResponseMessage response, int maxBytes)
    {
        if (response.Content.Headers.ContentLength is long length && length > maxBytes)
        {
            LastError = $"Response was {length} bytes, over the {maxBytes} byte cap.";
            return null;
        }

        await using var stream = await response.Content.ReadAsStreamAsync();
        using var buffer = new MemoryStream();
        var chunk = new byte[8192];
        while (true)
        {
            var read = await stream.ReadAsync(chunk);
            if (read == 0) break;
            if (buffer.Length + read > maxBytes)
            {
                LastError = $"Response exceeded the {maxBytes} byte cap.";
                return null;
            }
            buffer.Write(chunk, 0, read);
        }
        return buffer.Length == 0 ? null : buffer.ToArray();
    }

    private static bool IsDashboardDocument(byte[] bytes, out string problem)
    {
        try
        {
            using var doc = JsonDocument.Parse(bytes);
            if (doc.RootElement.ValueKind != JsonValueKind.Object
                || !doc.RootElement.TryGetProperty("fetchedAt", out var fetched)
                || fetched.ValueKind != JsonValueKind.String
                || !doc.RootElement.TryGetProperty("totals", out var totals)
                || totals.ValueKind != JsonValueKind.Object)
            {
                problem = "Snapshot is not a stats document (needs fetchedAt and totals).";
                return false;
            }
        }
        catch (JsonException)
        {
            problem = "Snapshot was not valid JSON.";
            return false;
        }

        problem = "";
        return true;
    }

    private static async Task WriteAtomicAsync(string path, byte[] bytes)
    {
        var dir = Path.GetDirectoryName(path)!;
        Directory.CreateDirectory(dir);
        var tmp = path + ".tmp";
        await File.WriteAllBytesAsync(tmp, bytes);
        File.Move(tmp, path, overwrite: true);
    }

    private static (List<PortfolioPackage> Packages, string? Error) LoadPortfolio(string text)
    {
        JsonDocument doc;
        try
        {
            doc = JsonDocument.Parse(text);
        }
        catch (JsonException ex)
        {
            return ([], $"Portfolio is not valid JSON: {ex.Message}");
        }

        using (doc)
        {
            if (doc.RootElement.ValueKind != JsonValueKind.Object)
                return ([], "Portfolio root must be a JSON object.");

            var packages = new List<PortfolioPackage>();
            foreach (var registry in new[] { "npm", "pypi", "vscode", "nuget", "docker", "github" })
            {
                if (!doc.RootElement.TryGetProperty(registry, out var list)) continue;
                if (list.ValueKind != JsonValueKind.Array)
                    return ([], $"Portfolio \"{registry}\" must be an array of strings.");
                foreach (var entry in list.EnumerateArray())
                {
                    if (entry.ValueKind != JsonValueKind.String || string.IsNullOrWhiteSpace(entry.GetString()))
                        return ([], $"Portfolio \"{registry}\" contains a non-string entry.");
                    packages.Add(new PortfolioPackage(registry, entry.GetString()!.Trim()));
                }
            }

            if (!packages.Any(item => item.Registry == "npm")
                && doc.RootElement.TryGetProperty("npmMaintainer", out var maintainer)
                && maintainer.ValueKind == JsonValueKind.String
                && !string.IsNullOrWhiteSpace(maintainer.GetString()))
            {
                packages.Add(new PortfolioPackage("npm-maintainer", maintainer.GetString()!.Trim()));
            }

            return (packages, null);
        }
    }

    private async Task<bool> RefreshPortfolioResolvedAsync(List<PortfolioPackage> packages)
    {
        var resolved = new List<PortfolioPackage>();
        foreach (var item in packages)
        {
            if (item.Registry != "npm-maintainer")
            {
                resolved.Add(item);
                continue;
            }

            var url = $"https://registry.npmjs.org/-/v1/search?text=maintainer:{Uri.EscapeDataString(item.Name)}&size=250";
            using var doc = await GetJson(url);
            if (doc is null || !doc.RootElement.TryGetProperty("objects", out var objects))
            {
                LastError = $"Could not list packages for maintainer {item.Name}.";
                return false;
            }
            foreach (var obj in objects.EnumerateArray())
            {
                if (obj.TryGetProperty("package", out var pkg) && pkg.TryGetProperty("name", out var nameEl))
                {
                    var found = nameEl.GetString();
                    if (!string.IsNullOrWhiteSpace(found))
                        resolved.Add(new PortfolioPackage("npm", found));
                }
            }
        }

        if (resolved.Count == 0)
        {
            LastError = "The saved portfolio has no packages.";
            return false;
        }

        return await RefreshPortfolioAsync(resolved);
    }

    private object BuildDocument(List<PortfolioPackage> requested, List<LeaderboardRow> rows, List<string> errors)
    {
        var registries = new[] { "npm", "pypi", "vscode", "nuget", "docker", "github" };
        var manifest = registries.ToDictionary(reg => reg, reg => requested.Count(item => item.Registry == reg));
        var fetched = registries.ToDictionary(reg => reg, reg => rows.Count(row => row.Registry == reg));
        var active = rows.Select(row => row.Registry).Distinct().Count();
        var week = rows.Sum(row => row.Week);
        var month = rows.Sum(row => row.Month);
        var ordered = rows.OrderByDescending(row => row.Week).ThenByDescending(row => row.Month).ThenByDescending(row => row.Total).ToList();
        var topWeek = ordered.Sum(row => row.Week);
        var top5 = ordered.Take(5).Sum(row => row.Week);
        var concentration = topWeek > 0 ? Math.Round(100.0 * top5 / topWeek, 1) : 0;
        var spark = new long[30];
        var haveSpark = false;
        foreach (var row in rows)
        {
            if (row.Range30 is not { Length: 30 }) continue;
            haveSpark = true;
            for (var i = 0; i < 30; i++) spark[i] += row.Range30[i];
        }

        var narrative = ordered.Count == 0
            ? "No package data came back from the saved portfolio."
            : $"{ordered[0].Name} leads the saved portfolio. Week {week:N0}, month {month:N0}. The month figure is npm and PyPI only. NuGet, VS Code, Docker Hub, and GitHub stay in the all-time total.";

        var registryTotals = registries.ToDictionary(reg => reg, reg =>
        {
            var mine = rows.Where(row => row.Registry == reg).ToList();
            return new
            {
                packages = mine.Count,
                week = mine.Sum(row => row.Week),
                month = mine.Sum(row => row.Month),
                total = mine.Sum(row => row.Total),
            };
        });
        var errorsByRegistry = new Dictionary<string, int>();
        foreach (var error in errors)
        {
            var colon = error.IndexOf(':');
            if (colon <= 0) continue;
            var reg = error[..colon];
            if (!registries.Contains(reg)) continue;
            errorsByRegistry[reg] = errorsByRegistry.GetValueOrDefault(reg) + 1;
        }

        return new
        {
            fetchedAt = DateTime.UtcNow.ToString("o"),
            totals = new { packages = ordered.Count, week, month, activeRegistries = active },
            registryTotals,
            errorsByRegistry,
            manifestCounts = manifest,
            fetchedCounts = fetched,
            confidence = registries.ToDictionary(reg => reg, reg => manifest[reg] == 0 ? "missing" : fetched[reg] == manifest[reg] ? "ok" : "partial"),
            narrative,
            narrativeLines = new[]
            {
                new { icon = "📊", label = "Portfolio", text = narrative },
            },
            movers = new { concentrationTop5Pct = concentration, topGainers = Array.Empty<object>(), topDecliners = Array.Empty<object>(), newlyActive = Array.Empty<object>() },
            leaderboard = ordered.Select(row => new
            {
                name = row.Name,
                registry = row.Registry,
                week = row.Week,
                month = row.Month,
                total = row.Total,
                range30 = row.Range30,
                trendPct = (double?)null,
            }),
            sparkline30 = haveSpark ? spark : Array.Empty<long>(),
            errors,
            inference = new
            {
                recommendations = Array.Empty<object>(),
                forecastTotal7 = Array.Empty<long>(),
                healthScores = Array.Empty<object>(),
                packages = Array.Empty<object>(),
            },
        };
    }

    private static long ReadLong(JsonElement element, string name)
    {
        if (!element.TryGetProperty(name, out var value)) return 0;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetInt64(out var n)) return n;
        if (value.ValueKind == JsonValueKind.Number && value.TryGetDouble(out var d)) return (long)d;
        return 0;
    }

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        WriteIndented = true,
    };

    private sealed record PortfolioPackage(string Registry, string Name);

    private sealed record LeaderboardRow(string Name, string Registry, long Week, long Month, long Total, int[]? Range30);
}
