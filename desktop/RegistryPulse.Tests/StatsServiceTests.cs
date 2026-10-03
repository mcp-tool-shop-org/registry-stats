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
