using System.Net;
using System.Text;
using System.Text.Json;
using RegistryPulse.Desktop.Services;
using Xunit;

namespace RegistryPulse.Tests;

public class StatsServiceTests
{
    [Fact]
    public void GetCachedStatsBytes_ReturnsNull_WhenNoCacheExists()
    {
        var root = TempRoot();
        try
        {
            var service = new StatsService(root, new StubHandler());
            Assert.Null(service.GetCachedStatsBytes());
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public void HasSavedPortfolio_IsTrueOnlyWhenTheFileListsAPackage()
    {
        var root = TempRoot();
        try
        {
            var service = new StatsService(root, new StubHandler());
            Assert.False(service.HasSavedPortfolio());
            Directory.CreateDirectory(Path.GetDirectoryName(service.PackagesPath)!);
            File.WriteAllText(service.PackagesPath, "{\"npm\":[\"left-pad\"]}");
            Assert.True(service.HasSavedPortfolio());
            File.WriteAllText(service.PackagesPath, "{\"npm\":[]}");
            Assert.False(service.HasSavedPortfolio());
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_ReturnsFalse_WhenOffline()
    {
        var root = TempRoot();
        try
        {
            var handler = new StubHandler
            {
                Respond = _ => throw new HttpRequestException("offline"),
            };
            var service = new StatsService(root, handler);
            var result = await service.RefreshAsync();
            Assert.False(result);
            Assert.False(File.Exists(service.CachePath));
            Assert.False(string.IsNullOrWhiteSpace(service.LastError));
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_RejectsAShortOrNonJsonBody()
    {
        var root = TempRoot();
        try
        {
            var handler = new StubHandler
            {
                Respond = _ => Text(HttpStatusCode.OK, "not-json"),
            };
            var service = new StatsService(root, handler);
            Assert.False(await service.RefreshAsync());
            Assert.False(File.Exists(service.CachePath));
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_UsesTheSavedPortfolio_NotThePublishedSnapshot()
    {
        var root = TempRoot();
        try
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.Combine(root, "RegistryPulse", "config", "packages.json"))!);
            await File.WriteAllTextAsync(
                Path.Combine(root, "RegistryPulse", "config", "packages.json"),
                """{"npm":["left-pad"]}""");

            var requested = new List<string>();
            var handler = new StubHandler
            {
                Respond = request =>
                {
                    var url = request.RequestUri!.ToString();
                    requested.Add(url);
                    Assert.DoesNotContain("github.io", url, StringComparison.OrdinalIgnoreCase);
                    return Json(HttpStatusCode.OK, new
                    {
                        downloads = Enumerable.Range(0, 30).Select(i => new { day = $"2026-01-{(i + 1):00}", downloads = 2 }).ToArray(),
                        start = "2026-01-01",
                        end = "2026-01-30",
                        package = "left-pad",
                    });
                },
            };

            var service = new StatsService(root, handler);
            Assert.True(await service.RefreshAsync());
            Assert.Contains(requested, url => url.Contains("api.npmjs.org", StringComparison.Ordinal) && url.Contains("left-pad", StringComparison.Ordinal));

            using var doc = JsonDocument.Parse(File.ReadAllBytes(service.CachePath));
            var names = doc.RootElement.GetProperty("leaderboard").EnumerateArray().Select(row => row.GetProperty("name").GetString()).ToArray();
            Assert.Contains("left-pad", names);
            Assert.Contains("left-pad", doc.RootElement.GetProperty("narrative").GetString());
            var trend = doc.RootElement.GetProperty("leaderboard").EnumerateArray().Single().GetProperty("trendPct");
            Assert.Equal(JsonValueKind.Number, trend.ValueKind);
            Assert.Equal(0, trend.GetDouble());
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_KeepsTheCache_WhenEveryPackageMisses()
    {
        var root = TempRoot();
        try
        {
            Directory.CreateDirectory(Path.Combine(root, "RegistryPulse", "config"));
            await File.WriteAllTextAsync(
                Path.Combine(root, "RegistryPulse", "config", "packages.json"),
                """{"npm":["missing-pkg"]}""");

            var service = new StatsService(root, new StubHandler
            {
                Respond = _ => new HttpResponseMessage(HttpStatusCode.NotFound),
            });
            Directory.CreateDirectory(Path.GetDirectoryName(service.CachePath)!);
            await File.WriteAllTextAsync(service.CachePath, """{"kept":true}""");

            Assert.False(await service.RefreshAsync());
            Assert.Equal("No package stats were returned.", service.LastError);
            Assert.Equal("""{"kept":true}""", await File.ReadAllTextAsync(service.CachePath));
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_RecordsBothThrownFetchesInOneBatch()
    {
        var root = TempRoot();
        try
        {
            Directory.CreateDirectory(Path.Combine(root, "RegistryPulse", "config"));
            await File.WriteAllTextAsync(
                Path.Combine(root, "RegistryPulse", "config", "packages.json"),
                """{"npm":["alpha-pkg","beta-pkg"]}""");

            var service = new StatsService(root, new OverlapThrowHandler());
            Directory.CreateDirectory(Path.GetDirectoryName(service.CachePath)!);
            await File.WriteAllTextAsync(service.CachePath, """{"kept":true}""");

            var result = await service.RefreshAsync();

            Assert.False(result);
            Assert.NotNull(service.LastError);
            Assert.Contains("npm:alpha-pkg:", service.LastError, StringComparison.Ordinal);
            Assert.Contains("npm:beta-pkg:", service.LastError, StringComparison.Ordinal);
            Assert.Equal("""{"kept":true}""", await File.ReadAllTextAsync(service.CachePath));
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_SumsGithubReleasesPastTheFirstPage()
    {
        var root = TempRoot();
        try
        {
            Directory.CreateDirectory(Path.Combine(root, "RegistryPulse", "config"));
            await File.WriteAllTextAsync(
                Path.Combine(root, "RegistryPulse", "config", "packages.json"),
                """{"github":["mcp-tool-shop-org/registry-stats"]}""");

            var service = new StatsService(root, new StubHandler
            {
                Respond = request =>
                {
                    var page2 = request.RequestUri!.Query.Contains("page=2", StringComparison.Ordinal);
                    if (page2)
                    {
                        return Json(HttpStatusCode.OK, new[]
                        {
                            new { assets = new[] { new { download_count = 7 } } },
                        });
                    }

                    return Json(HttpStatusCode.OK, Enumerable.Range(0, 100).Select(_ => new
                    {
                        assets = new[] { new { download_count = 1 } },
                    }));
                },
            });

            Assert.True(await service.RefreshAsync());
            using var doc = JsonDocument.Parse(File.ReadAllBytes(service.CachePath));
            var total = doc.RootElement.GetProperty("leaderboard").EnumerateArray().Single().GetProperty("total").GetInt64();
            Assert.Equal(107, total);
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_KeepsAVscodeExtensionOnlyWhenTheIdMatches()
    {
        var root = TempRoot();
        try
        {
            Directory.CreateDirectory(Path.Combine(root, "RegistryPulse", "config"));
            await File.WriteAllTextAsync(
                Path.Combine(root, "RegistryPulse", "config", "packages.json"),
                """{"vscode":["ms-dotnettools.csharp","other.not-csharp"]}""");

            var service = new StatsService(root, new StubHandler
            {
                Respond = _ => Json(HttpStatusCode.OK, new
                {
                    results = new[]
                    {
                        new
                        {
                            extensions = new[]
                            {
                                new
                                {
                                    publisher = new { publisherName = "ms-dotnettools" },
                                    extensionName = "csharp",
                                    statistics = new[] { new { statisticName = "install", value = 999 } },
                                },
                            },
                        },
                    },
                }),
            });

            Assert.True(await service.RefreshAsync());
            using var doc = JsonDocument.Parse(File.ReadAllBytes(service.CachePath));
            var row = doc.RootElement.GetProperty("leaderboard").EnumerateArray().Single();
            Assert.Equal("ms-dotnettools.csharp", row.GetProperty("name").GetString());
            Assert.Equal(999, row.GetProperty("total").GetInt64());
            Assert.Equal(0, doc.RootElement.GetProperty("totals").GetProperty("month").GetInt64());
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_KeepsAllTimeTotalsOutOfTheMonthFigure()
    {
        var root = TempRoot();
        try
        {
            Directory.CreateDirectory(Path.Combine(root, "RegistryPulse", "config"));
            await File.WriteAllTextAsync(
                Path.Combine(root, "RegistryPulse", "config", "packages.json"),
                """{"nuget":["Newtonsoft.Json"]}""");

            var service = new StatsService(root, new StubHandler
            {
                Respond = _ => Json(HttpStatusCode.OK, new
                {
                    data = new[]
                    {
                        new { id = "Newtonsoft.Json", totalDownloads = 1_000_000, version = "13.0.3" },
                    },
                }),
            });

            Assert.True(await service.RefreshAsync());
            using var doc = JsonDocument.Parse(File.ReadAllBytes(service.CachePath));
            Assert.Equal(0, doc.RootElement.GetProperty("totals").GetProperty("month").GetInt64());
            var row = doc.RootElement.GetProperty("leaderboard").EnumerateArray().Single();
            Assert.Equal(0, row.GetProperty("month").GetInt64());
            Assert.Equal(1_000_000, row.GetProperty("total").GetInt64());
            Assert.Equal(1_000_000, doc.RootElement.GetProperty("registryTotals").GetProperty("nuget").GetProperty("total").GetInt64());
            Assert.True(doc.RootElement.TryGetProperty("errorsByRegistry", out _));
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_FetchesEverySavedName_IncludingPastEighty()
    {
        var root = TempRoot();
        try
        {
            var npm = Enumerable.Range(0, 80).Select(i => $"pkg-{i:00}");
            var portfolio = "{\"npm\":[" + string.Join(",", npm.Select(name => $"\"{name}\"")) + "],\"github\":[\"octo/demo\"]}";
            Directory.CreateDirectory(Path.Combine(root, "RegistryPulse", "config"));
            await File.WriteAllTextAsync(Path.Combine(root, "RegistryPulse", "config", "packages.json"), portfolio);

            var requested = new List<string>();
            var service = new StatsService(root, new StubHandler
            {
                Respond = request =>
                {
                    var url = request.RequestUri!.ToString();
                    lock (requested) requested.Add(url);
                    if (url.Contains("api.github.com", StringComparison.Ordinal))
                    {
                        return Json(HttpStatusCode.OK, new[]
                        {
                            new { assets = new[] { new { download_count = 4 } } },
                        });
                    }

                    return Json(HttpStatusCode.OK, new
                    {
                        downloads = Enumerable.Range(0, 30).Select(i => new { day = $"2026-01-{(i + 1):00}", downloads = 1 }).ToArray(),
                    });
                },
            });

            Assert.True(await service.RefreshAsync());
            Assert.Equal(81, requested.Count);
            Assert.Contains(requested, url => url.Contains("octo/demo", StringComparison.Ordinal));

            using var doc = JsonDocument.Parse(File.ReadAllBytes(service.CachePath));
            Assert.Equal("Saved portfolio", doc.RootElement.GetProperty("source").GetString());
            var lines = doc.RootElement.GetProperty("narrativeLines").EnumerateArray().ToArray();
            Assert.True(lines.Length > 1);
            var health = lines.Single(line => line.GetProperty("label").GetString() == "Data Health").GetProperty("text").GetString();
            Assert.Equal("There were no fetch errors.", health);
            var names = doc.RootElement.GetProperty("leaderboard").EnumerateArray().Select(row => row.GetProperty("name").GetString()).ToArray();
            Assert.Equal(81, names.Length);
            Assert.Contains("pkg-00", names);
            Assert.Contains("pkg-79", names);
            Assert.Contains("octo/demo", names);
            Assert.Empty(doc.RootElement.GetProperty("errors").EnumerateArray().Select(item => item.GetString()).ToArray());
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_StampsSavedPortfolioSource_AndNarrativeLines()
    {
        var root = TempRoot();
        try
        {
            Directory.CreateDirectory(Path.Combine(root, "RegistryPulse", "config"));
            await File.WriteAllTextAsync(
                Path.Combine(root, "RegistryPulse", "config", "packages.json"),
                """{"npm":["left-pad"],"pypi":["requests"],"nuget":["Missing.Package"]}""");

            var service = new StatsService(root, new StubHandler
            {
                Respond = request =>
                {
                    var url = request.RequestUri!.ToString();
                    if (url.Contains("pypistats.org", StringComparison.Ordinal))
                    {
                        return Json(HttpStatusCode.OK, new { data = new { last_week = 50, last_month = 80 } });
                    }

                    if (url.Contains("nuget.org", StringComparison.Ordinal))
                        return new HttpResponseMessage(HttpStatusCode.InternalServerError);

                    return Json(HttpStatusCode.OK, new
                    {
                        downloads = Enumerable.Range(0, 30).Select(i => new { day = $"2026-01-{(i + 1):00}", downloads = 2 }).ToArray(),
                    });
                },
            });

            Assert.True(await service.RefreshAsync());
            using var doc = JsonDocument.Parse(File.ReadAllBytes(service.CachePath));
            Assert.Equal("Saved portfolio", doc.RootElement.GetProperty("source").GetString());
            var lines = doc.RootElement.GetProperty("narrativeLines").EnumerateArray().ToArray();
            Assert.Equal(4, lines.Length);
            Assert.Equal(
                new[] { "Registry Lead", "Top Package", "Concentration", "Data Health" },
                lines.Select(line => line.GetProperty("label").GetString()).ToArray());
            Assert.Equal("PyPI had the largest week, 50. Week and month are npm and PyPI. NuGet, VS Code, Docker, and GitHub stay all-time.", lines[0].GetProperty("text").GetString());
            Assert.Equal("requests is the top package, with 50 weekly downloads and 80 this month. Week and month are npm and PyPI. NuGet, VS Code, Docker, and GitHub stay all-time.", lines[1].GetProperty("text").GetString());
            Assert.Contains("100.0%", lines[2].GetProperty("text").GetString());
            Assert.Contains("Week and month are npm and PyPI.", lines[2].GetProperty("text").GetString());
            Assert.Equal("1 fetch error.", lines[3].GetProperty("text").GetString());
            foreach (var line in lines)
            {
                var text = line.GetProperty("text").GetString() ?? "";
                Assert.DoesNotContain("declin", text, StringComparison.OrdinalIgnoreCase);
            }

            var names = doc.RootElement.GetProperty("leaderboard").EnumerateArray().Select(row => row.GetProperty("name").GetString()).ToArray();
            Assert.Equal(new[] { "requests", "left-pad" }, names);
            Assert.Contains("requests", doc.RootElement.GetProperty("narrative").GetString());
            Assert.Single(doc.RootElement.GetProperty("errors").EnumerateArray().ToArray());
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_WritesThePublishedSnapshotUnchanged()
    {
        var root = TempRoot();
        try
        {
            var body = """{"fetchedAt":"2026-03-01T11:15:30.138Z","totals":{"packages":1,"week":2,"month":3}}""";
            var service = new StatsService(root, new StubHandler
            {
                Respond = request =>
                {
                    Assert.Contains("github.io", request.RequestUri!.ToString(), StringComparison.OrdinalIgnoreCase);
                    return Text(HttpStatusCode.OK, body);
                },
            });

            Assert.True(await service.RefreshAsync());
            Assert.Equal(body, await File.ReadAllTextAsync(service.CachePath));
            Assert.DoesNotContain("Saved portfolio", await File.ReadAllTextAsync(service.CachePath));
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    private static HttpResponseMessage Json(HttpStatusCode status, object body)
    {
        var json = JsonSerializer.Serialize(body);
        return new HttpResponseMessage(status)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json"),
        };
    }

    private static HttpResponseMessage Text(HttpStatusCode status, string body)
    {
        return new HttpResponseMessage(status)
        {
            Content = new StringContent(body, Encoding.UTF8, "text/plain"),
        };
    }

    private sealed class OverlapThrowHandler : HttpMessageHandler
    {
        private int _started;
        private readonly TaskCompletionSource _both = new(TaskCreationOptions.RunContinuationsAsynchronously);

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            if (Interlocked.Increment(ref _started) >= 2)
                _both.TrySetResult();
            await _both.Task.WaitAsync(TimeSpan.FromSeconds(5), cancellationToken);
            throw new HttpRequestException("down " + request.RequestUri);
        }
    }

    private sealed class StubHandler : HttpMessageHandler
    {
        public Func<HttpRequestMessage, HttpResponseMessage> Respond { get; set; } =
            _ => new HttpResponseMessage(HttpStatusCode.ServiceUnavailable);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(Respond(request));
        }
    }

    private static string TempRoot()
    {
        var root = Path.Combine(Path.GetTempPath(), "registrypulse-tests-" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(root);
        return root;
    }

    private static void DeleteTemp(string root)
    {
        if (Directory.Exists(root))
            Directory.Delete(root, recursive: true);
    }
}
