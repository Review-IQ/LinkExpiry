using MaxMind.GeoIP2;
using MaxMind.GeoIP2.Exceptions;

namespace LinkExpiry.API.Services;

/// <summary>
/// GeoIP service using MaxMind GeoIP2 for IP geolocation lookup
/// </summary>
public class GeoIPService : IGeoIPService, IDisposable
{
    private readonly DatabaseReader? _reader;
    private readonly ILogger<GeoIPService> _logger;
    private readonly bool _isEnabled;

    public GeoIPService(IConfiguration configuration, ILogger<GeoIPService> logger)
    {
        _logger = logger;

        // Get database path from configuration
        var dbPath = configuration["GeoIP:DatabasePath"];

        if (string.IsNullOrEmpty(dbPath) || !File.Exists(dbPath))
        {
            _logger.LogWarning("GeoIP database not found at: {Path}. Geolocation features will be disabled.", dbPath ?? "null");
            _isEnabled = false;
            return;
        }

        try
        {
            _reader = new DatabaseReader(dbPath);
            _isEnabled = true;
            _logger.LogInformation("GeoIP service initialized with database: {Path}", dbPath);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to initialize GeoIP database reader");
            _isEnabled = false;
        }
    }

    /// <summary>
    /// Get geolocation information from IP address
    /// </summary>
    public async Task<GeoLocationInfo?> GetLocationAsync(string ipAddress)
    {
        if (!_isEnabled || _reader == null)
        {
            return null;
        }

        // Filter out local/private IPs
        if (string.IsNullOrEmpty(ipAddress) ||
            ipAddress == "::1" ||
            ipAddress.StartsWith("127.") ||
            ipAddress.StartsWith("192.168.") ||
            ipAddress.StartsWith("10.") ||
            ipAddress.StartsWith("172."))
        {
            return new GeoLocationInfo
            {
                CountryCode = "XX",
                CountryName = "Local/Private",
                City = "Local",
                Region = "Local"
            };
        }

        try
        {
            var response = await Task.Run(() => _reader.City(ipAddress));

            return new GeoLocationInfo
            {
                CountryCode = response.Country?.IsoCode,
                CountryName = response.Country?.Name,
                City = response.City?.Name,
                Region = response.MostSpecificSubdivision?.Name ?? response.MostSpecificSubdivision?.IsoCode
            };
        }
        catch (AddressNotFoundException)
        {
            _logger.LogDebug("IP address not found in GeoIP database: {IpAddress}", ipAddress);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error looking up IP address: {IpAddress}", ipAddress);
            return null;
        }
    }

    public void Dispose()
    {
        _reader?.Dispose();
    }
}
