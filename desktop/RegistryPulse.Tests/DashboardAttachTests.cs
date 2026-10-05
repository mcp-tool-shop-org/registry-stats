using RegistryPulse.Desktop;
using Xunit;

namespace RegistryPulse.Tests;

public class DashboardAttachTests
{
    [Fact]
    public void MissingHandler_WaitsOnce()
    {
        Assert.Equal(DashboardAttach.Step.WaitForHandler, DashboardAttach.Next(false, false, false));
    }

    [Fact]
    public void MissingHandler_AfterTheRetry_Alerts()
    {
        Assert.Equal(DashboardAttach.Step.Alert, DashboardAttach.Next(false, false, true));
    }

    [Fact]
    public void WrongPlatformView_Alerts()
    {
        Assert.Equal(DashboardAttach.Step.Alert, DashboardAttach.Next(true, false, false));
    }

    [Fact]
    public void WebView2Handler_Attaches()
    {
        Assert.Equal(DashboardAttach.Step.Attach, DashboardAttach.Next(true, true, true));
    }
}

public class BundledDashboardTests
{
    [Fact]
    public void Dashboard_ListensForStartupRefreshFailure()
    {
        var html = File.ReadAllText(FindBundledDashboard());
        Assert.Contains("refreshFailed", html);
        Assert.Contains("rp-stale-banner", html);
        Assert.Contains("chrome.webview", html);
    }

    [Fact]
    public void Leaderboard_ShowsAllTimeTotal_AndCsvExportsIt()
    {
        var html = File.ReadAllText(FindBundledDashboard());
        Assert.Contains(">Total</th>", html);
        Assert.Contains("fmt.format(Number(row.total || 0))", html);
        Assert.Contains("Total is all-time for NuGet, VS Code, Docker Hub, and GitHub.", html);
        Assert.DoesNotContain("Updated 3h ago", html);
        Assert.DoesNotContain("3h ago", html);
        Assert.Contains("existing.textContent = 'Updated ' + relTime(data.fetchedAt)", html);
        Assert.Contains("freshness.textContent = 'Freshness: updated ' + relTime(data.fetchedAt)", html);
        Assert.Contains("The assistant sends the injected snapshot through the local Ollama daemon, which can proxy a cloud model.", html);
        Assert.DoesNotContain("no cloud storage", html);
        Assert.Contains("Monthly downloads, npm and PyPI", html);

        DirectoryInfo? dir = new FileInfo(FindBundledDashboard()).Directory;
        while (dir is not null && dir.Name != "RegistryPulse.Desktop") dir = dir.Parent;
        Assert.NotNull(dir);
        var mainPage = File.ReadAllText(Path.Combine(dir!.FullName, "MainPage.xaml.cs"));
        Assert.Contains("'Rank','Package','Registry','Week','Month','Total','Trend'", mainPage);
        Assert.Contains("cells.length < 8", mainPage);
        Assert.Contains("var total = cells[5]", mainPage);
        Assert.Contains("var trend = cells[7]", mainPage);
    }

    private static string FindBundledDashboard()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null)
        {
            var candidate = Path.Combine(
                dir.FullName,
                "RegistryPulse.Desktop",
                "Resources", "Raw", "wwwroot", "registry-stats", "dashboard", "index.html");
            if (File.Exists(candidate)) return candidate;
            dir = dir.Parent;
        }
        throw new FileNotFoundException("Bundled dashboard index.html was not found above the test output.");
    }
}
