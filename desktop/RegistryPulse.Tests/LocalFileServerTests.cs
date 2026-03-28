using System.Net;
using RegistryPulse.Desktop.Services;

namespace RegistryPulse.Tests;

public class LocalFileServerTests : IDisposable
{
    private readonly string _wwwroot;
    private readonly LocalFileServer _server;
    private readonly HttpClient _http = new();

    public LocalFileServerTests()
    {
        // Create a temp wwwroot with a test HTML file
        _wwwroot = Path.Combine(Path.GetTempPath(), "RegistryPulseTests_" + Guid.NewGuid().ToString("N"));
        Directory.CreateDirectory(_wwwroot);
        File.WriteAllText(Path.Combine(_wwwroot, "index.html"), "<html><body>test</body></html>");

        var subDir = Path.Combine(_wwwroot, "sub");
        Directory.CreateDirectory(subDir);
        File.WriteAllText(Path.Combine(subDir, "page.html"), "<html><body>sub</body></html>");
        File.WriteAllText(Path.Combine(subDir, "data.json"), """{"ok":true}""");

        _server = new LocalFileServer(_wwwroot, () => null);
        _server.Start();
    }

    [Fact]
    public async Task PathTraversal_DotDotSlash_Returns403()
    {
        var response = await _http.GetAsync($"{_server.BaseUrl}/../../../etc/passwd");
        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task PathTraversal_EncodedDotDot_Returns403()
    {
        var response = await _http.GetAsync($"{_server.BaseUrl}/sub/..%2F..%2F..%2Fetc%2Fpasswd");
        // Should be either 403 (traversal caught) or 404 (file not found) — never 200
        Assert.NotEqual(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task ValidFile_Returns200()
    {
        var response = await _http.GetAsync($"{_server.BaseUrl}/index.html");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("test", body);
    }

    [Fact]
    public async Task DirectoryIndex_ServesIndexHtml()
    {
        var response = await _http.GetAsync($"{_server.BaseUrl}/");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("test", body);
    }

    [Fact]
    public async Task NonExistentFile_Returns404()
    {
        var response = await _http.GetAsync($"{_server.BaseUrl}/nope.html");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CspHeader_PresentOnHtmlResponses()
    {
        var response = await _http.GetAsync($"{_server.BaseUrl}/index.html");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        Assert.True(response.Headers.Contains("Content-Security-Policy"),
            "HTML responses must include a Content-Security-Policy header");

        var csp = string.Join("; ", response.Headers.GetValues("Content-Security-Policy"));
        Assert.Contains("default-src", csp);
        Assert.Contains("script-src", csp);
    }

    [Fact]
    public async Task CspHeader_AbsentOnJsonResponses()
    {
        var response = await _http.GetAsync($"{_server.BaseUrl}/sub/data.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(response.Headers.Contains("Content-Security-Policy"),
            "Non-HTML responses should not include a CSP header");
    }

    [Fact]
    public async Task StatsProvider_InjectsOverride()
    {
        var statsJson = """{"fetchedAt":"2026-01-01T00:00:00Z"}"""u8.ToArray();
        using var server2 = new LocalFileServer(_wwwroot, () => statsJson);
        server2.Start();

        var response = await _http.GetAsync($"{server2.BaseUrl}/data/stats.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Contains("fetchedAt", body);
    }

    public void Dispose()
    {
        _server.Dispose();
        _http.Dispose();
        try { Directory.Delete(_wwwroot, true); } catch { }
    }
}
