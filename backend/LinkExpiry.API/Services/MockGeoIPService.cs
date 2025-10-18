namespace LinkExpiry.API.Services;

/// <summary>
/// Mock GeoIP service for development when GeoLite2 database is not available
/// Provides basic fallback geolocation data
/// </summary>
public class MockGeoIPService : IGeoIPService
{
    private readonly ILogger<MockGeoIPService> _logger;
    private readonly Random _random = new();

    // Sample cities for realistic mock data
    private readonly List<(string City, string Region, string CountryCode, string CountryName)> _locations = new()
    {
        ("New York", "New York", "US", "United States"),
        ("Los Angeles", "California", "US", "United States"),
        ("Chicago", "Illinois", "US", "United States"),
        ("London", "England", "GB", "United Kingdom"),
        ("Paris", "Île-de-France", "FR", "France"),
        ("Tokyo", "Tokyo", "JP", "Japan"),
        ("Sydney", "New South Wales", "AU", "Australia"),
        ("Toronto", "Ontario", "CA", "Canada"),
        ("Berlin", "Berlin", "DE", "Germany"),
        ("Mumbai", "Maharashtra", "IN", "India"),
        ("São Paulo", "São Paulo", "BR", "Brazil"),
        ("Singapore", "Singapore", "SG", "Singapore"),
        ("Dubai", "Dubai", "AE", "United Arab Emirates"),
        ("Moscow", "Moscow", "RU", "Russia"),
        ("Mexico City", "Mexico City", "MX", "Mexico")
    };

    public MockGeoIPService(ILogger<MockGeoIPService> logger)
    {
        _logger = logger;
        _logger.LogWarning("Using MockGeoIPService - for development only! Real GeoIP database not available.");
    }

    public Task<GeoLocationInfo?> GetLocationAsync(string ipAddress)
    {
        // Handle localhost/private IPs
        if (string.IsNullOrEmpty(ipAddress) ||
            ipAddress == "::1" ||
            ipAddress == "127.0.0.1" ||
            ipAddress.StartsWith("192.168.") ||
            ipAddress.StartsWith("10.") ||
            ipAddress.StartsWith("172."))
        {
            return Task.FromResult<GeoLocationInfo?>(new GeoLocationInfo
            {
                CountryCode = "US",
                CountryName = "United States",
                City = "Local Development",
                Region = "Local"
            });
        }

        // Return a consistent location based on IP hash
        // This ensures the same IP always gets the same location
        var hash = Math.Abs(ipAddress.GetHashCode());
        var location = _locations[hash % _locations.Count];

        _logger.LogDebug("Mock GeoIP lookup for {IpAddress}: {City}, {Region}, {Country}",
            ipAddress, location.City, location.Region, location.CountryName);

        return Task.FromResult<GeoLocationInfo?>(new GeoLocationInfo
        {
            CountryCode = location.CountryCode,
            CountryName = location.CountryName,
            City = location.City,
            Region = location.Region
        });
    }

    public void Dispose()
    {
        // Nothing to dispose
    }
}
