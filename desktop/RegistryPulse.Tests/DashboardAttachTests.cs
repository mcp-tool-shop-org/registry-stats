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
