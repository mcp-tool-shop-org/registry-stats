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
            ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
            ctx.Response.Close();
        }
        catch
        {
            try { ctx.Response.StatusCode = 500; ctx.Response.Close(); } catch { }
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
        _cts.Cancel();
        _listener.Stop();
        _listener.Close();
        _cts.Dispose();
    }
}
