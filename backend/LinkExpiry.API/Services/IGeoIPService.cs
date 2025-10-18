namespace LinkExpiry.API.Services;

/// <summary>
/// Interface for GeoIP lookup service
/// </summary>
public interface IGeoIPService
{
    /// <summary>
    /// Get geolocation information from IP address
    /// </summary>
    Task<GeoLocationInfo?> GetLocationAsync(string ipAddress);
}

/// <summary>
/// Geolocation information
/// </summary>
public class GeoLocationInfo
{
    public string? CountryCode { get; set; }
    public string? CountryName { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
}
