using System.Diagnostics;
using System.Net;

namespace RegistryPulse.Desktop.Services;

/// <summary>
/// Lightweight HTTP server that serves static files from a local directory.
/// Used to feed Astro-built assets to the WebView2 control.
/// </summary>
public sealed class LocalFileServer : IDisposable
{
    private readonly HttpListener _listener = new();
    private readonly string _rootPath;
    private readonly CancellationTokenSource _cts = new();
    private readonly Func<byte[]?> _statsProvider;
    private bool _disposed;

    public int Port { get; }
    public string BaseUrl => $"http://127.0.0.1:{Port}";

    public LocalFileServer(string rootPath, Func<byte[]?> statsProvider)
    {
        _rootPath = rootPath;
        _statsProvider = statsProvider;

        // Find an available port
        using var temp = new System.Net.Sockets.TcpListener(IPAddress.Loopback, 0);
        temp.Start();
        Port = ((IPEndPoint)temp.LocalEndpoint).Port;
        temp.Stop();

        _listener.Prefixes.Add($"http://127.0.0.1:{Port}/");
    }

    public void Start()
    {
        _listener.Start();
        _ = Task.Run(() => ListenLoop(_cts.Token));
    }

    private async Task ListenLoop(CancellationToken ct)
    {
        while (!ct.IsCancellationRequested && _listener.IsListening)
        {
            try
            {
                var ctx = await _listener.GetContextAsync();
                _ = Task.Run(() => HandleRequest(ctx), ct);
            }
            catch (ObjectDisposedException) { break; }
            catch (HttpListenerException) { break; }
        }
    }

    private void HandleRequest(HttpListenerContext ctx)
    {
        try
        {
            var path = Uri.UnescapeDataString(ctx.Request.Url?.AbsolutePath ?? "/").TrimStart('/');

            // Serve cached stats.json if available
            if (path.EndsWith("data/stats.json", StringComparison.OrdinalIgnoreCase))
            {
                var cached = _statsProvider();
                if (cached is not null)
                {
                    ctx.Response.StatusCode = 200;
                    ctx.Response.ContentType = "application/json";
                    ctx.Response.ContentLength64 = cached.Length;
                    ctx.Response.OutputStream.Write(cached, 0, cached.Length);
                    ctx.Response.Close();
                    return;
                }
            }

            var filePath = Path.Combine(_rootPath, path.Replace('/', Path.DirectorySeparatorChar));

            // Path traversal protection: resolved path must stay within wwwroot.
            // Allow the root directory itself (directory-index case) as well as any
            // descendant; reject anything that escapes the root.
            var rootFull = Path.GetFullPath(_rootPath).TrimEnd(Path.DirectorySeparatorChar);
            var fullRoot = rootFull + Path.DirectorySeparatorChar;
            var fullFile = Path.GetFullPath(filePath).TrimEnd(Path.DirectorySeparatorChar);
            if (!string.Equals(fullFile, rootFull, StringComparison.OrdinalIgnoreCase)
                && !fullFile.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
            {
                ctx.Response.StatusCode = 403;
                ctx.Response.Close();
                return;
            }

            // Directory → index.html
            if (Directory.Exists(filePath))
                filePath = Path.Combine(filePath, "index.html");

            if (!File.Exists(filePath))
            {
                ctx.Response.StatusCode = 404;
                ctx.Response.Close();
                return;
            }

            var bytes = File.ReadAllBytes(filePath);
            ctx.Response.StatusCode = 200;
            ctx.Response.ContentType = GetContentType(filePath);
            ctx.Response.ContentLength64 = bytes.Length;
            AddSecurityHeaders(ctx.Response, filePath);
            ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
            ctx.Response.Close();
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[LocalFileServer] Request error: {ex.Message}");
            try { ctx.Response.StatusCode = 500; ctx.Response.Close(); } catch { }
        }
    }

    private static void AddSecurityHeaders(HttpListenerResponse response, string filePath)
    {
        // Only add CSP to HTML responses
        if (filePath.EndsWith(".html", StringComparison.OrdinalIgnoreCase))
        {
            // connect-src enumerates exactly the origins the bundled dashboard's
            // Pulse co-pilot (site/src/pages/dashboard.astro) actually fetches.
            // Only connect-src is widened here — script-src/default-src/img-src/etc.
            // stay locked down. Each source maps to one co-pilot capability:
            //   'self'                              — same-origin assets + cached stats.json
            //   https://mcp-tool-shop-org.github.io — live stats snapshot fallback (existing)
            //   http://localhost:*  http://127.0.0.1:* — local Ollama (chat, model list;
            //                                         OLLAMA_BASE localhost:11434) and the
            //                                         voice synthesis server (VOICE_BASE
            //                                         localhost:11435). Both run on a
            //                                         user-chosen loopback port, so the
            //                                         whole loopback range is allowed.
            //                                         The default SearXNG base (localhost:8888)
            //                                         is also covered here. No ws:/wss: —
            //                                         every co-pilot call is plain fetch.
            //   https://en.wikipedia.org           — Wikipedia web-search (always-on knowledge)
            //   https://api.github.com             — GitHub data connector (org repo listing)
            //   https:                             — the user-configurable SearXNG base can be
            //                                         ANY https URL the user types into Settings;
            //                                         we cannot know it ahead of time. Allowing
            //                                         https: in connect-src ONLY is acceptable for
            //                                         a local-first desktop app the user controls,
            //                                         and is required for an arbitrary user-supplied
            //                                         search host. script-src/default-src are NOT
            //                                         broadened, so this cannot load remote code.
            response.Headers.Set("Content-Security-Policy",
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline'; " +
                "style-src 'self' 'unsafe-inline'; " +
                "connect-src 'self' https://mcp-tool-shop-org.github.io " +
                "http://localhost:* http://127.0.0.1:* " +
                "https://en.wikipedia.org https://api.github.com https:; " +
                "img-src 'self' data:; " +
                "font-src 'self';");
        }
    }

    private static string GetContentType(string path) => Path.GetExtension(path).ToLowerInvariant() switch
    {
        ".html" => "text/html; charset=utf-8",
        ".css" => "text/css; charset=utf-8",
        ".js" => "application/javascript; charset=utf-8",
        ".json" => "application/json",
        ".png" => "image/png",
        ".jpg" or ".jpeg" => "image/jpeg",
        ".svg" => "image/svg+xml",
        ".ico" => "image/x-icon",
        ".woff" => "font/woff",
        ".woff2" => "font/woff2",
        ".ttf" => "font/ttf",
        _ => "application/octet-stream",
    };

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;

        _cts.Cancel();
        _listener.Stop();
        _listener.Close();
        _cts.Dispose();
    }
}
