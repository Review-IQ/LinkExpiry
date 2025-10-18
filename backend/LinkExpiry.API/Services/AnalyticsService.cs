using LinkExpiry.API.Data;
using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Entities;
using System.Security.Cryptography;
using System.Text;

namespace LinkExpiry.API.Services;

/// <summary>
/// Service for analytics and click tracking
/// </summary>
public class AnalyticsService : IAnalyticsService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IGeoIPService _geoIPService;
    private readonly ILogger<AnalyticsService> _logger;

    public AnalyticsService(
        IUnitOfWork unitOfWork,
        IGeoIPService geoIPService,
        ILogger<AnalyticsService> logger)
    {
        _unitOfWork = unitOfWork;
        _geoIPService = geoIPService;
        _logger = logger;
    }

    /// <summary>
    /// Get detailed analytics for a specific link
    /// </summary>
    public async Task<LinkAnalyticsResponse> GetLinkAnalyticsAsync(Guid linkId, Guid userId, int days = 30)
    {
        // Verify user owns the link
        var link = await _unitOfWork.Links
            .FirstOrDefaultAsync(l => l.Id == linkId && l.UserId == userId);

        if (link == null)
        {
            throw new UnauthorizedAccessException("Link not found or access denied");
        }

        // Get clicks from the last N days
        var sinceDate = DateTime.UtcNow.AddDays(-days);
        var clicks = (await _unitOfWork.Clicks
            .FindAsync(c => c.LinkId == linkId && c.ClickedAt >= sinceDate))
            .OrderByDescending(c => c.ClickedAt)
            .ToList();

        // Aggregate data
        var clicksByDate = clicks
            .GroupBy(c => c.ClickedAt.Date)
            .Select(g => new ClickByDate
            {
                Date = g.Key,
                Count = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToList();

        var clicksByCountry = clicks
            .Where(c => !string.IsNullOrEmpty(c.CountryCode))
            .GroupBy(c => c.CountryCode!)
            .Select(g => new ClickByCountry
            {
                CountryCode = g.Key,
                CountryName = GetCountryName(g.Key),
                Count = g.Count(),
                Percentage = (double)g.Count() / clicks.Count * 100
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var clicksByDevice = clicks
            .Where(c => !string.IsNullOrEmpty(c.DeviceType))
            .GroupBy(c => c.DeviceType!)
            .Select(g => new ClickByDevice
            {
                DeviceType = g.Key,
                Count = g.Count(),
                Percentage = (double)g.Count() / clicks.Count * 100
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var clicksByBrowser = clicks
            .Where(c => !string.IsNullOrEmpty(c.Browser))
            .GroupBy(c => c.Browser!)
            .Select(g => new ClickByBrowser
            {
                Browser = g.Key,
                Count = g.Count(),
                Percentage = (double)g.Count() / clicks.Count * 100
            })
            .OrderByDescending(x => x.Count)
            .ToList();

        var clicksByReferrer = clicks
            .Where(c => !string.IsNullOrEmpty(c.Referrer))
            .GroupBy(c => c.Referrer!)
            .Select(g => new ClickByReferrer
            {
                Referrer = g.Key,
                Count = g.Count(),
                Percentage = (double)g.Count() / clicks.Count * 100
            })
            .OrderByDescending(x => x.Count)
            .Take(10)
            .ToList();

        var recentClicks = clicks
            .Take(50)
            .Select(c => new RecentClick
            {
                ClickedAt = c.ClickedAt,
                CountryCode = c.CountryCode,
                CountryName = c.CountryName ?? (!string.IsNullOrEmpty(c.CountryCode) ? GetCountryName(c.CountryCode) : null),
                City = c.City,
                Region = c.Region,
                DeviceType = c.DeviceType,
                Browser = c.Browser,
                Referrer = c.Referrer
            })
            .ToList();

        // Calculate unique visitors (based on IP hash)
        var uniqueVisitors = clicks
            .Where(c => !string.IsNullOrEmpty(c.IpHash))
            .Select(c => c.IpHash)
            .Distinct()
            .Count();

        return new LinkAnalyticsResponse
        {
            LinkId = link.Id,
            ShortCode = link.ShortCode,
            Title = link.Title,
            TotalClicks = link.TotalClicks,
            UniqueVisitors = uniqueVisitors,
            CreatedAt = link.CreatedAt,
            ExpiresAt = link.ExpiresAt,
            IsActive = link.IsActive,
            ClicksByDate = clicksByDate,
            ClicksByCountry = clicksByCountry,
            ClicksByDevice = clicksByDevice,
            ClicksByBrowser = clicksByBrowser,
            ClicksByReferrer = clicksByReferrer,
            RecentClicks = recentClicks
        };
    }

    /// <summary>
    /// Get dashboard statistics for user
    /// </summary>
    public async Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId)
    {
        var links = (await _unitOfWork.Links.FindAsync(l => l.UserId == userId)).ToList();

        var totalLinks = links.Count;
        var activeLinks = links.Count(l => l.IsActive);
        var expiredLinks = links.Count(l => !l.IsActive);
        var totalClicks = links.Sum(l => l.TotalClicks);

        // Clicks this month
        var startOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var linkIds = links.Select(l => l.Id).ToList();
        var clicksThisMonth = (await _unitOfWork.Clicks
            .FindAsync(c => linkIds.Contains(c.LinkId) && c.ClickedAt >= startOfMonth))
            .Count();

        // Get user to find links created this month and limit
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        var linksCreatedThisMonth = user?.LinksCreatedThisMonth ?? 0;
        var linksLimitThisMonth = GetPlanLimit(user?.PlanType ?? "FREE", "LinksPerMonth");

        // Top links
        var topLinks = links
            .OrderByDescending(l => l.TotalClicks)
            .Take(5)
            .Select(l => new TopLink
            {
                Id = l.Id,
                ShortCode = l.ShortCode,
                Title = l.Title,
                TotalClicks = l.TotalClicks
            })
            .ToList();

        // Clicks by date (last 30 days)
        var last30Days = DateTime.UtcNow.AddDays(-30);
        var recentClicks = (await _unitOfWork.Clicks
            .FindAsync(c => linkIds.Contains(c.LinkId) && c.ClickedAt >= last30Days))
            .ToList();

        var clicksByDate = recentClicks
            .GroupBy(c => c.ClickedAt.Date)
            .Select(g => new ClickByDate
            {
                Date = g.Key,
                Count = g.Count()
            })
            .OrderBy(x => x.Date)
            .ToList();

        return new DashboardStatsResponse
        {
            TotalLinks = totalLinks,
            ActiveLinks = activeLinks,
            ExpiredLinks = expiredLinks,
            TotalClicks = totalClicks,
            ClicksThisMonth = clicksThisMonth,
            LinksCreatedThisMonth = linksCreatedThisMonth,
            LinksLimitThisMonth = linksLimitThisMonth,
            TopLinks = topLinks,
            ClicksByDate = clicksByDate
        };
    }

    /// <summary>
    /// Log a click asynchronously (fire-and-forget pattern)
    /// </summary>
    public async Task LogClickAsync(Guid linkId, string ipAddress, string userAgent, string? referrer)
    {
        try
        {
            // Get geolocation from IP address
            var geoInfo = await _geoIPService.GetLocationAsync(ipAddress);

            var click = new Click
            {
                LinkId = linkId,
                ClickedAt = DateTime.UtcNow,
                IpHash = HashIpAddress(ipAddress),
                UserAgent = userAgent,
                Referrer = referrer,
                DeviceType = ParseDeviceType(userAgent),
                Browser = ParseBrowser(userAgent),
                CountryCode = geoInfo?.CountryCode,
                CountryName = geoInfo?.CountryName,
                City = geoInfo?.City,
                Region = geoInfo?.Region
            };

            await _unitOfWork.Clicks.AddAsync(click);
            await _unitOfWork.SaveChangesAsync();

            _logger.LogDebug("Click logged for link {LinkId} from {City}, {Region}, {Country}",
                linkId, geoInfo?.City, geoInfo?.Region, geoInfo?.CountryName);
        }
        catch (Exception ex)
        {
            // Don't throw - logging clicks should never break the redirect
            _logger.LogError(ex, "Error logging click for link {LinkId}", linkId);
        }
    }

    /// <summary>
    /// Hash IP address for privacy (GDPR compliance)
    /// </summary>
    private string HashIpAddress(string ipAddress)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(ipAddress);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }

    /// <summary>
    /// Parse device type from User-Agent
    /// </summary>
    private string ParseDeviceType(string? userAgent)
    {
        if (string.IsNullOrEmpty(userAgent))
            return "OTHER";

        var ua = userAgent.ToLower();

        if (ua.Contains("mobile") || ua.Contains("android") || ua.Contains("iphone") || ua.Contains("ipad"))
            return "MOBILE";

        if (ua.Contains("tablet"))
            return "TABLET";

        return "DESKTOP";
    }

    /// <summary>
    /// Parse browser from User-Agent
    /// </summary>
    private string ParseBrowser(string? userAgent)
    {
        if (string.IsNullOrEmpty(userAgent))
            return "Unknown";

        var ua = userAgent.ToLower();

        if (ua.Contains("edg/"))
            return "Edge";
        if (ua.Contains("chrome/") && !ua.Contains("edg/"))
            return "Chrome";
        if (ua.Contains("firefox/"))
            return "Firefox";
        if (ua.Contains("safari/") && !ua.Contains("chrome/"))
            return "Safari";
        if (ua.Contains("opera/") || ua.Contains("opr/"))
            return "Opera";

        return "Other";
    }

    /// <summary>
    /// Get country name from code (simple mapping - expand as needed)
    /// </summary>
    private string GetCountryName(string countryCode)
    {
        var countries = new Dictionary<string, string>
        {
            { "US", "United States" },
            { "GB", "United Kingdom" },
            { "CA", "Canada" },
            { "AU", "Australia" },
            { "DE", "Germany" },
            { "FR", "France" },
            { "IN", "India" },
            { "BR", "Brazil" },
            { "JP", "Japan" },
            { "CN", "China" }
        };

        return countries.TryGetValue(countryCode, out var name) ? name : countryCode;
    }

    /// <summary>
    /// Get plan limit from configuration
    /// </summary>
    private int GetPlanLimit(string planType, string limitKey)
    {
        // This would be injected from configuration in real implementation
        var limits = new Dictionary<string, int>
        {
            { "FREE", 10 },
            { "STARTER", 100 },
            { "PRO", 1000 },
            { "ENTERPRISE", -1 }
        };

        return limits.TryGetValue(planType, out var limit) ? limit : 10;
    }
}
