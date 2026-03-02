using System.Text.Json;
using RegistryPulse.Desktop.Services;
#if WINDOWS
using Microsoft.Web.WebView2.Core;
#endif

namespace RegistryPulse.Desktop;

public partial class MainPage : ContentPage
{
    private readonly StatsService _stats;
    private LocalFileServer? _server;

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
            _server?.Dispose();
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
        var handler = DashboardWebView.Handler;
        if (handler?.PlatformView is not Microsoft.UI.Xaml.Controls.WebView2 webView2)
            return;

        await webView2.EnsureCoreWebView2Async();
        var core = webView2.CoreWebView2;
        if (core is null) return;

        // Start local file server
        var wwwroot = ResolveWwwrootPath();
        _server = new LocalFileServer(wwwroot, () => _stats.GetCachedStatsBytes());
        _server.Start();

        // Bridge: handle messages from the setup page
        core.WebMessageReceived += OnWebMessage;

        // First-run: if no cached stats, navigate to setup
        var hasStats = _stats.GetCachedStatsBytes() is not null;
        var startPage = hasStats ? "/registry-stats/dashboard/" : "/registry-stats/setup/";
        core.Navigate($"{_server.BaseUrl}{startPage}");

        // Background: fetch fresh stats then reload (only if on dashboard)
        if (hasStats)
            _ = RefreshStatsAsync(core);
    }

    private async Task RefreshStatsAsync(CoreWebView2 core)
    {
        var success = await _stats.RefreshAsync();
        if (success)
        {
            core.Reload();
        }
    }

    private async void OnWebMessage(CoreWebView2 sender, CoreWebView2WebMessageReceivedEventArgs args)
    {
        try
        {
            var json = args.TryGetWebMessageAsString();
            if (json is null) return;
            var msg = JsonDocument.Parse(json).RootElement;
            var action = msg.GetProperty("action").GetString();

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
                        Directory.CreateDirectory(ConfigDir);
                        await File.WriteAllTextAsync(PackagesPath, content);
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "saveResult", ok = true }));
                    }
                    catch (Exception ex)
                    {
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "saveResult", ok = false, error = ex.Message }));
                    }
                    break;

                case "fetchNow":
                    sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "fetchProgress", line = "Downloading stats from GitHub Pages..." }));
                    var ok = await _stats.RefreshAsync();
                    sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "fetchComplete", ok }));
                    if (ok) SendStatus(sender);
                    break;

                case "getBranding":
                    var brandingPath = Path.Combine(ConfigDir, "branding.json");
                    if (File.Exists(brandingPath))
                    {
                        var brandingText = await File.ReadAllTextAsync(brandingPath);
                        var brandingData = JsonSerializer.Deserialize<JsonElement>(brandingText);
                        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new { action = "brandingJson", data = brandingData }));
                    }
                    break;
            }
        }
        catch
        {
            // Ignore malformed messages
        }
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
            catch { }
        }

        sender.PostWebMessageAsJson(JsonSerializer.Serialize(new
        {
            action = "status",
            hasStats = cached is not null,
            hasPackages = File.Exists(PackagesPath),
            lastFetch,
            dataPath = ConfigDir
        }));
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
                var success = await _stats.RefreshAsync();
                if (success)
                    core.Reload();
                else
                    await DisplayAlertAsync("Refresh Failed",
                        "Could not fetch fresh stats. Showing cached data.", "OK");
            }
        }
#endif
    }

    private async void OnExportCsvClicked(object? sender, EventArgs e)
    {
#if WINDOWS
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
                    var csv = 'Rank,Package,Registry,Week,Month,Trend\n';
                    rows.forEach(function(tr) {
                        var cells = tr.querySelectorAll('td');
                        if (cells.length < 7) return;
                        var rank = cells[0].textContent.trim();
                        var name = cells[1].textContent.trim();
                        var reg = cells[2].textContent.trim();
                        var week = cells[3].textContent.trim();
                        var month = cells[4].textContent.trim();
                        var trend = cells[6].textContent.trim();
                        csv += rank + ',"' + name + '",' + reg + ',"' + week + '","' + month + '","' + trend + '"\n';
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

    private async void OnAboutClicked(object? sender, EventArgs e)
    {
        await DisplayAlertAsync("Registry Pulse Desktop",
            "Version 1.0.0\n\nOne dashboard. Five registries.\nAll your download stats.\n\nBuilt by MCP Tool Shop",
            "OK");
    }
}
