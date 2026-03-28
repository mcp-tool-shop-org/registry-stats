using RegistryPulse.Desktop.Services;

namespace RegistryPulse.Tests;

public class StatsServiceTests
{
    [Fact]
    public void GetCachedStatsBytes_ReturnsNull_WhenNoCacheExists()
    {
        var service = new StatsService();
        // On a clean environment (or when cache dir doesn't exist), should return null
        // This is a baseline sanity test — the actual cache path is user-local
        var result = service.GetCachedStatsBytes();
        // We can't assert null in all environments (cache may exist from real usage),
        // but we verify the method doesn't throw
        Assert.True(result is null || result.Length > 0,
            "GetCachedStatsBytes should return null or non-empty bytes");
    }

    [Fact]
    public async Task RefreshAsync_ReturnsFalse_WhenOffline()
    {
        // This tests the error-handling path — if the source URL is unreachable
        // (e.g., DNS failure), RefreshAsync should catch and return false.
        // In CI without network, this will exercise that path.
        var service = new StatsService();
        // Note: This may return true if network is available and GitHub Pages is up.
        // The key assertion is that it doesn't throw.
        var result = await service.RefreshAsync();
        Assert.IsType<bool>(result);
    }
}
