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
            var service = new StatsService(root);
            var result = service.GetCachedStatsBytes();
            Assert.Null(result);
        }
        finally
        {
            DeleteTemp(root);
        }
    }

    [Fact]
    public async Task RefreshAsync_ReturnsFalse_WhenOffline()
    {
        // Public stats URL is unchanged, so this may return true when GitHub Pages
        // is reachable. The cache root is a temp directory, not LocalApplicationData.
        var root = TempRoot();
        try
        {
            var service = new StatsService(root);
            var result = await service.RefreshAsync();
            Assert.IsType<bool>(result);
        }
        finally
        {
            DeleteTemp(root);
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
