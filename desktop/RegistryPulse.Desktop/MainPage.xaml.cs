using System.Diagnostics;
using System.Text;
using System.Text.Json;
using RegistryPulse.Desktop.Services;
#if WINDOWS
using Microsoft.Web.WebView2.Core;
#endif

namespace RegistryPulse.Desktop;

public partial class MainPage : ContentPage, IDisposable
{
    private readonly StatsService _stats;
    private LocalFileServer? _server;
    private bool _disposed;
    private bool _handlerRetryArmed;
    private bool _webViewReady;
    private bool _navigationHooked;
    private bool _startupRefreshFailed;

    private static readonly string ConfigDir = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "RegistryPulse", "config");
    private static readonly string PackagesPath = Path.Combine(ConfigDir, "packages.json");

    public MainPage(StatsService stats)
    {
        InitializeComponent();
        _stats = stats;

        BuildMenuBar();
        Loaded += OnLoaded;
    }

    private void BuildMenuBar()
    {
        MenuBarItems.Clear();

        // File menu
        var fileMenu = new MenuBarItem { Text = "File" };

        var refreshItem = new MenuFlyoutItem { Text = "Refresh Stats" };
        refreshItem.Clicked += OnRefreshClicked;
        fileMenu.Add(refreshItem);

        var exportItem = new MenuFlyoutItem { Text = "Export CSV" };
        exportItem.Clicked += OnExportCsvClicked;
        fileMenu.Add(exportItem);

        var setupItem = new MenuFlyoutItem { Text = "Setup" };
        setupItem.Clicked += OnSetupClicked;
        fileMenu.Add(setupItem);

        fileMenu.Add(new MenuFlyoutSeparator());

        var exitItem = new MenuFlyoutItem { Text = "Exit" };
        exitItem.Clicked += (_, _) =>
        {
            Dispose();
            Application.Current?.Quit();
        };
        fileMenu.Add(exitItem);

        MenuBarItems.Add(fileMenu);

        // Help menu
        var helpMenu = new MenuBarItem { Text = "Help" };

        var githubItem = new MenuFlyoutItem { Text = "Open GitHub" };
        githubItem.Clicked += async (_, _) =>
            await Launcher.OpenAsync("https://github.com/mcp-tool-shop-org/registry-stats");
        helpMenu.Add(githubItem);

        var privacyItem = new MenuFlyoutItem { Text = "Privacy" };
        privacyItem.Clicked += OnPrivacyClicked;
        helpMenu.Add(privacyItem);

        var aboutItem = new MenuFlyoutItem { Text = "About" };
        aboutItem.Clicked += OnAboutClicked;
        helpMenu.Add(aboutItem);

        MenuBarItems.Add(helpMenu);
    }

    private async void OnLoaded(object? sender, EventArgs e)
    {
#if WINDOWS
        await SetupWebView();
#endif
    }

#if WINDOWS
    private async Task SetupWebView()
    {
        // SetupWebView runs as fire-and-forget from OnLoaded (async void). Any throw
        // here — WebView2 runtime missing, web assets not found — would otherwise leave
        // a blank window with no explanation. Catch and surface the concrete cause.
        try
        {
            if (_webViewReady) return;

            var handler = DashboardWebView.Handler;
            var platformIsWebView2 = handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2;
            var step = DashboardAttach.Next(handler is not null, platformIsWebView2, _handlerRetryArmed);
            if (step == DashboardAttach.Step.WaitForHandler)
            {
                // Loaded can run before the platform view exists. Retry once when it appears.
                _handlerRetryArmed = true;
                DashboardWebView.HandlerChanged -= OnDashboardHandlerChanged;
                DashboardWebView.HandlerChanged += OnDashboardHandlerChanged;
                return;
            }
            if (step == DashboardAttach.Step.Alert)
            {
                await DisplayAlertAsync("Dashboard unavailable",
                    "Registry Pulse couldn't attach its dashboard view. Close other copies of the app and relaunch.",
                    "OK");
                return;
            }
            if (handler?.PlatformView is not Microsoft.UI.Xaml.Controls.WebView2 webView2)
            {
                await DisplayAlertAsync("Dashboard unavailable",
                    "Registry Pulse couldn't attach its dashboard view. Close other copies of the app and relaunch.",
                    "OK");
                return;
            }

            await webView2.EnsureCoreWebView2Async();
            var core = webView2.CoreWebView2;
            if (core is null)
            {
                await DisplayAlertAsync("Dashboard unavailable",
                    "Registry Pulse couldn't attach its dashboard view. Close other copies of the app and relaunch.",
                    "OK");
                return;
            }

            // Start local file server once. A second SetupWebView must not bind the port again.
            if (_server is null)
            {
                var wwwroot = ResolveWwwrootPath();
                _server = new LocalFileServer(wwwroot, () => _stats.GetCachedStatsBytes());
                _server.Start();
            }

            if (!_navigationHooked)
            {
                _navigationHooked = true;

                // Security: block navigation to external URLs
                core.NavigationStarting += (s, navArgs) =>
                {
                    var uri = navArgs.Uri;
                    if (uri is null || IsInAppNavigation(uri, _server!.BaseUrl)) return;

                    navArgs.Cancel = true;
                    // Only http(s) leaves the app. file:, shell:, and other schemes stay cancelled.
                    if (Uri.TryCreate(uri, UriKind.Absolute, out var target)
                        && (target.Scheme == Uri.UriSchemeHttps || target.Scheme == Uri.UriSchemeHttp))
                    {
                        _ = Launcher.OpenAsync(target);
                    }
                };

                // Bridge: handle messages from the setup page
                core.WebMessageReceived += OnWebMessage;

                // The failure post can land before this document's script runs. Send it
                // again once the page has parsed, so the banner listener is attached.
                core.DOMContentLoaded += (_, _) =>
                {
                    if (_startupRefreshFailed)
                        PostStartupRefreshFailed(core);
                };
            }

            _webViewReady = true;

            // First-run: if no cached stats, navigate to setup
            var hasStats = _stats.GetCachedStatsBytes() is not null;
            var startPage = hasStats ? "/registry-stats/dashboard/" : "/registry-stats/setup/";
            core.Navigate($"{_server.BaseUrl}{startPage}");

            // Background: fetch fresh stats then reload (only if on dashboard)
            if (hasStats)
                _ = RefreshStatsAsync(core);
        }
        catch (DirectoryNotFoundException ex)
        {
            // Web assets weren't copied next to the executable (build/packaging issue).
            Debug.WriteLine($"[MainPage] SetupWebView assets error: {ex.Message}");
            await DisplayAlertAsync("Dashboard unavailable",
                "Registry Pulse couldn't find its dashboard files.\n\n" +
                $"{ex.Message}\n\n" +
                "This usually means the app wasn't packaged correctly. Reinstalling the latest release should fix it.",
                "OK");
        }
        catch (Exception ex) when (IsWebView2Failure(ex))
        {
            Debug.WriteLine($"[MainPage] SetupWebView WebView2 error: {ex.Message}");
            await DisplayAlertAsync("WebView2 required",
                "Registry Pulse needs the Microsoft Edge WebView2 runtime to display its dashboard, " +
                "and it couldn't be started.\n\n" +
                $"Details: {ex.Message}\n\n" +
                "Install the Evergreen WebView2 runtime, then relaunch:\n" +
                "https://developer.microsoft.com/microsoft-edge/webview2/",
                "OK");
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[MainPage] SetupWebView error: {ex.Message}");
            await DisplayAlertAsync("Dashboard unavailable",
                "Registry Pulse couldn't start its dashboard.\n\n" +
                $"{ex.Message}",
                "OK");
        }
    }

    private void OnDashboardHandlerChanged(object? sender, EventArgs e)
    {
        DashboardWebView.HandlerChanged -= OnDashboardHandlerChanged;
        _ = SetupWebView();
    }

    private async Task RefreshStatsAsync(CoreWebView2 core)
    {
        var success = await _stats.RefreshAsync();
        if (success)
        {
            _startupRefreshFailed = false;
            core.Reload();
            return;
        }

        // Don't interrupt startup with a modal. The dashboard draws a banner.
        _startupRefreshFailed = true;
        PostStartupRefreshFailed(core);
    }

    private void PostStartupRefreshFailed(CoreWebView2 core)
    {
        try
        {
            core.PostWebMessageAsJson(JsonSerializer.Serialize(new
            {
                action = "status",
                refreshFailed = true,
                message = string.IsNullOrWhiteSpace(_stats.LastError)
                    ? "Showing cached data — couldn't reach live source."
                    : "Showing cached data — " + _stats.LastError
            }));
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[MainPage] RefreshStatsAsync notify error: {ex.Message}");
        }
    }

    private async void OnWebMessage(CoreWebView2 sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        // Tracked across the try so the outer catch can tag its error reply with the
        // action the web UI was waiting on — otherwise a failed handler leaves the page
        // hanging on a reply that never arrives.
        string? action = null;
        try
        {
            var json = args.TryGetWebMessageAsString();
            if (json is null) return;
            var msg = JsonDocument.Parse(json).RootElement;
            action = msg.GetProperty("action").GetString();

            switch (action)
            {
                case "getPackagesJson":
                    var text = File.Exists(PackagesPath) ? await File.ReadAllTextAsync(PackagesPath) : null;
                    sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "packagesJson", text }));
                    // Also send status
                    SendStatus(sender);
                    break;

                case "savePackagesJson":
                    try
                    {
                        var content = msg.GetProperty("text").GetString()!;

                        // Validate: must be valid JSON and within 1 MB
                        const int maxContentLength = 1_048_576;
                        if (content.Length > maxContentLength)
                            throw new InvalidOperationException($"Content exceeds maximum allowed size ({maxContentLength} bytes).");
                        using (JsonDocument.Parse(content)) { } // Throws if not valid JSON

                        Directory.CreateDirectory(ConfigDir);
                        await StatsService.WriteAtomicAsync(PackagesPath, Encoding.UTF8.GetBytes(content));
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "saveResult", ok = true }));
                    }
                    catch (Exception ex)
                    {
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "saveResult", ok = false, error = ex.Message }));
                    }
                    break;

                case "clearPackagesJson":
                    try
                    {
                        _stats.DeleteSavedPortfolio();
                    }
                    catch (Exception ex)
                    {
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new
                        {
                            action = "fetchComplete",
                            ok = false,
                            error = ex.Message,
                        }));
                        break;
                    }

                    await RunFetchNowAsync(sender);
                    break;

                case "fetchNow":
                    await RunFetchNowAsync(sender);
                    break;

                case "getBranding":
                    var brandingPath = Path.Combine(ConfigDir, "branding.json");
                    if (File.Exists(brandingPath))
                    {
                        var brandingText = await File.ReadAllTextAsync(brandingPath);
                        var brandingData = JsonSerializer.Deserialize<JsonElement>(brandingText);
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "brandingJson", data = brandingData }));
                    }
                    else
                    {
                        // Always reply, even when there's no branding file, so the web UI
                        // can resolve its pending request instead of hanging.
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "brandingJson", data = (object?)null }));
                    }
                    break;
            }
        }
        catch (Exception ex)
        {
            Debug.WriteLine($"[MainPage] WebMessage error (action={action ?? "unknown"}): {ex.Message}");
            // Surface a generic error reply tagged with the originating action so the
            // web UI can stop waiting and show its own error state.
            try
            {
                sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "error", forAction = action, error = ex.Message }));
            }
            catch (Exception postEx)
            {
                Debug.WriteLine($"[MainPage] WebMessage error-reply failed: {postEx.Message}");
            }
        }
    }

    private async Task RunFetchNowAsync(CoreWebView2 sender)
    {
        var refreshLine = _stats.HasSavedPortfolio()
            ? "Fetching the saved portfolio from the registries..."
            : "Downloading stats from GitHub Pages...";
        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "fetchProgress", line = refreshLine }));
        var ok = await _stats.RefreshAsync();
        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new
        {
            action = "fetchComplete",
            ok,
            error = ok ? null : _stats.LastError,
        }));
        if (ok) SendStatus(sender);
    }

    private void SendStatus(CoreWebView2 sender)
    {
        var cached = _stats.GetCachedStatsBytes();
        string? lastFetch = null;
        if (cached is not null)
        {
            try
            {
                var doc = JsonDocument.Parse(cached);
                if (doc.RootElement.TryGetProperty("fetchedAt", out var f))
                    lastFetch = f.GetString();
            }
            catch (Exception ex) { Debug.WriteLine($"[MainPage] Status parse error: {ex.Message}"); }
        }

        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new
        {
            action = "status",
            hasStats = cached is not null,
            hasPackages = File.Exists(PackagesPath),
            lastFetch,
            dataPath = ConfigDir,
            packagesPath = PackagesPath,
            statsPath = _stats.CachePath
        }));
    }

    private static bool IsInAppNavigation(string uri, string baseUrl)
    {
        if (uri.Equals("about:blank", StringComparison.OrdinalIgnoreCase)) return true;
        if (!uri.StartsWith(baseUrl, StringComparison.OrdinalIgnoreCase)) return false;
        if (uri.Length == baseUrl.Length) return true;
        var next = uri[baseUrl.Length];
        return next is '/' or '?' or '#';
    }

    private static bool IsWebView2Failure(Exception ex)
    {
        for (Exception? current = ex; current is not null; current = current.InnerException)
        {
            if (current.GetType().Name.Contains("WebView2", StringComparison.OrdinalIgnoreCase))
                return true;
        }
        return ex.ToString().Contains("WebView2", StringComparison.OrdinalIgnoreCase);
    }

    private static string ResolveWwwrootPath()
    {
        var baseDir = AppContext.BaseDirectory;

        // MAUI copies MauiAsset items to wwwroot/ alongside the executable
        var candidate = Path.Combine(baseDir, "wwwroot");
        if (Directory.Exists(candidate)) return candidate;

        // Fallback: source tree layout (Resources/Raw/wwwroot)
        candidate = Path.Combine(baseDir, "Resources", "Raw", "wwwroot");
        if (Directory.Exists(candidate)) return candidate;

        // Walk up to find project source layout (dev inner-loop)
        var dir = new DirectoryInfo(baseDir);
        while (dir is not null)
        {
            candidate = Path.Combine(dir.FullName, "Resources", "Raw", "wwwroot");
            if (Directory.Exists(candidate)) return candidate;
            dir = dir.Parent;
        }

        throw new DirectoryNotFoundException(
            $"Could not find wwwroot directory. Base: {baseDir}");
    }

    private void OnSetupClicked(object? sender, EventArgs e)
    {
        var handler = DashboardWebView.Handler;
        if (_server is not null && handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
        {
            webView2.CoreWebView2?.Navigate($"{_server.BaseUrl}/registry-stats/setup/");
        }
    }

    private void OnPrivacyClicked(object? sender, EventArgs e)
    {
        var handler = DashboardWebView.Handler;
        if (_server is not null && handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
        {
            webView2.CoreWebView2?.Navigate($"{_server.BaseUrl}/registry-stats/privacy/");
        }
    }
#endif

    private async void OnRefreshClicked(object? sender, EventArgs e)
    {
#if WINDOWS
        var handler = DashboardWebView.Handler;
        if (handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
        {
            await webView2.EnsureCoreWebView2Async();
            var core = webView2.CoreWebView2;
            if (core is not null)
            {
                // Show transient in-flight feedback — the fetch can take up to 15s.
                // Reuse the same channel the setup page already listens on.
                core.PostWebMessageAsJson(JsonSerializer.Serialize(
                    new { action = "fetchProgress", line = "Refreshing…" }));

                var success = await _stats.RefreshAsync();
                var failure = success ? null : _stats.LastError;

                core.PostWebMessageAsJson(JsonSerializer.Serialize(
                    new { action = "fetchComplete", ok = success, error = failure }));

                if (success)
                    core.Reload();
                else
                    await DisplayAlertAsync("Refresh Failed",
                        string.IsNullOrWhiteSpace(failure)
                            ? "Could not fetch fresh stats. Showing cached data."
                            : "Could not fetch fresh stats. Showing cached data. " + failure,
                        "OK");
            }
        }
#endif
    }

    private async void OnExportCsvClicked(object? sender, EventArgs e)
    {
#if WINDOWS
        if (File.Exists(_stats.CachePath))
        {
            var csv = LeaderboardCsv.FromStatsJson(_stats.GetCachedStatsBytes());
            if (csv is null)
            {
                await DisplayAlertAsync("Export", "No leaderboard data to export.", "OK");
                return;
            }

            try
            {
                await SaveLeaderboardCsvAsync(csv);
            }
            catch (Exception ex)
            {
                Debug.WriteLine($"[MainPage] Export CSV error: {ex.Message}");
                await DisplayAlertAsync("Export", "Couldn't save the CSV.", "OK");
            }
            return;
        }

        var handler = DashboardWebView.Handler;
        if (handler?.PlatformView is Microsoft.UI.Xaml.Controls.WebView2 webView2)
        {
            await webView2.EnsureCoreWebView2Async();
            var core = webView2.CoreWebView2;
            if (core is null) return;

            var script = """
                (function() {
                    var rows = document.querySelectorAll('#leaderboard-body tr');
                    if (!rows.length) return 'NO_DATA';
                    // RFC4180 + CSV/formula-injection hardening: double embedded quotes and
                    // neutralize cells that a spreadsheet would treat as a formula by
                    // prefixing a single quote. Applied to every field, including headers.
                    function escapeCsv(value) {
                        var s = value == null ? '' : String(value);
                        if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
                        return '"' + s.replace(/"/g, '""') + '"';
                    }
                    var csv = ['Rank','Package','Registry','Downloads','Month','Trend'].map(escapeCsv).join(',') + '\n';
                    rows.forEach(function(tr) {
                        var cells = tr.querySelectorAll('td');
                        if (cells.length < 7) return;
                        var rank = cells[0].textContent.trim();
                        var name = cells[1].textContent.trim();
                        var reg = cells[2].textContent.trim();
                        var downloads = cells[3].textContent.trim();
                        var month = cells[4].textContent.trim();
                        var trend = cells[6].textContent.trim();
                        csv += [rank, name, reg, downloads, month, trend].map(escapeCsv).join(',') + '\n';
                    });
                    var blob = new Blob([csv], { type: 'text/csv' });
                    var a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = 'registry-stats-' + new Date().toISOString().slice(0,10) + '.csv';
                    a.click();
                    return 'OK';
                })()
                """;

            var result = await core.ExecuteScriptAsync(script);
            if (result.Contains("NO_DATA"))
                await DisplayAlertAsync("Export", "No leaderboard data to export.", "OK");
        }
#endif
    }

#if WINDOWS
    private async Task SaveLeaderboardCsvAsync(string csv)
    {
        var picker = new Windows.Storage.Pickers.FileSavePicker();
        if (Application.Current?.Windows.FirstOrDefault()?.Handler?.PlatformView is not Microsoft.UI.Xaml.Window window)
        {
            await DisplayAlertAsync("Export", "Couldn't open a save dialog.", "OK");
            return;
        }

        var hwnd = WinRT.Interop.WindowNative.GetWindowHandle(window);
        WinRT.Interop.InitializeWithWindow.Initialize(picker, hwnd);
        picker.SuggestedFileName = "registry-stats-" + DateTime.UtcNow.ToString("yyyy-MM-dd", System.Globalization.CultureInfo.InvariantCulture);
        picker.FileTypeChoices.Add("CSV", new List<string> { ".csv" });

        var file = await picker.PickSaveFileAsync();
        if (file is null) return;

        await Windows.Storage.FileIO.WriteBytesAsync(file, Encoding.UTF8.GetBytes(csv));
    }
#endif

    private async void OnAboutClicked(object? sender, EventArgs e)
    {
        var version = typeof(App).Assembly.GetName().Version?.ToString(3) ?? "3.4.0";
        await DisplayAlertAsync("Registry Pulse Desktop",
            $"Version {version}\n\nOne dashboard. Six registries.\nAll your download stats.\n\nBuilt by MCP Tool Shop",
            "OK");
    }

    public void Dispose()
    {
        if (_disposed) return;
        _disposed = true;
        _server?.Dispose();
    }
}

/// <summary>
/// How SetupWebView should treat the platform handler. The first miss waits
/// for HandlerChanged. A miss after that, or a handler that is not WebView2,
/// is the alert. A WebView2 handler attaches.
/// </summary>
internal static class DashboardAttach
{
    internal enum Step
    {
        Attach,
        WaitForHandler,
        Alert,
    }

    internal static Step Next(bool handlerPresent, bool platformIsWebView2, bool retryArmed)
    {
        if (!handlerPresent)
            return retryArmed ? Step.Alert : Step.WaitForHandler;
        return platformIsWebView2 ? Step.Attach : Step.Alert;
    }
}
