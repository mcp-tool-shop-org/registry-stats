using System.Net;
using System.Net.Sockets;
using System.Text;
using RegistryPulse.Desktop.Services;
using Xunit;

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
    public async Task PathTraversal_RawDotDot_Returns403AndDoesNotReadTheSibling()
    {
        var secretName = "rp-secret-" + Guid.NewGuid().ToString("N") + ".txt";
        var secretPath = Path.Combine(Directory.GetParent(_wwwroot)!.FullName, secretName);
        await File.WriteAllTextAsync(secretPath, "TOP-SECRET-MARKER");
        try
        {
            // HttpClient collapses ".." before the request leaves. A raw request
            // with encoded dots reaches GetFullPath, which must refuse the sibling.
            var raw = await RawGet("/%2E%2E/" + secretName);
            Assert.StartsWith("HTTP/1.1 403", raw);
            Assert.DoesNotContain("TOP-SECRET-MARKER", raw);

            var nested = await RawGet("/sub/%2E%2E/%2E%2E/" + secretName);
            Assert.StartsWith("HTTP/1.1 403", nested);
            Assert.DoesNotContain("TOP-SECRET-MARKER", nested);
        }
        finally
        {
            if (File.Exists(secretPath)) File.Delete(secretPath);
        }
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
    public async Task CspHeader_AllowsCoPilotConnectSources()
    {
        // DP01: the bundled dashboard's Pulse co-pilot must be reachable from the
        // desktop build. The CSP connect-src has to allow the local Ollama/voice
        // loopback endpoints while preserving the existing 'self' + github.io allowances.
        var response = await _http.GetAsync($"{_server.BaseUrl}/index.html");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var csp = string.Join("; ", response.Headers.GetValues("Content-Security-Policy"));

        // New: local Ollama / voice loopback allowance (user-chosen localhost port).
        Assert.Contains("http://localhost", csp);

        // Regression guard: existing allowances must remain.
        Assert.Contains("'self'", csp);
        Assert.Contains("https://mcp-tool-shop-org.github.io", csp);
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

    [Fact]
    public async Task PathTraversal_EncodedBackslash_Returns403()
    {
        // %5C is an encoded backslash. On Windows that is a directory separator,
        // so a raw request must reach GetFullPath and come back 403.
        var secretName = "rp-secret-" + Guid.NewGuid().ToString("N") + ".txt";
        var secretPath = Path.Combine(Directory.GetParent(_wwwroot)!.FullName, secretName);
        await File.WriteAllTextAsync(secretPath, "TOP-SECRET-MARKER");
        try
        {
            var raw = await RawGet("/sub/..%5C..%5C" + secretName);
            Assert.StartsWith("HTTP/1.1 403", raw);
            Assert.DoesNotContain("TOP-SECRET-MARKER", raw);
        }
        finally
        {
            if (File.Exists(secretPath)) File.Delete(secretPath);
        }
    }

    [Fact]
    public void Dispose_CalledTwice_DoesNotThrow()
    {
        using var server2 = new LocalFileServer(_wwwroot, () => null);
        server2.Start();

        // Disposing twice must be a no-op the second time, not a throw.
        var ex = Record.Exception(() =>
        {
            server2.Dispose();
            server2.Dispose();
        });
        Assert.Null(ex);
    }

    private async Task<string> RawGet(string path)
    {
        var uri = new Uri(_server.BaseUrl);
        using var tcp = new TcpClient();
        await tcp.ConnectAsync(uri.Host, uri.Port);
        await using var stream = tcp.GetStream();
        var request = $"GET {path} HTTP/1.1\r\nHost: {uri.Host}:{uri.Port}\r\nConnection: close\r\n\r\n";
        await stream.WriteAsync(Encoding.ASCII.GetBytes(request));
        using var reader = new StreamReader(stream, Encoding.UTF8);
        return await reader.ReadToEndAsync();
    }

    public void Dispose()
    {
        _server.Dispose();
        _http.Dispose();
        try { Directory.Delete(_wwwroot, true); } catch { }
    }
}
