namespace LinkExpiry.API.Models.DTOs;

/// <summary>
/// Response model for link analytics
/// </summary>
public class LinkAnalyticsResponse
{
    public Guid LinkId { get; set; }
    public string ShortCode { get; set; } = string.Empty;
    public string? Title { get; set; }
    public int TotalClicks { get; set; }
    public int UniqueVisitors { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public bool IsActive { get; set; }
    public List<ClickByDate> ClicksByDate { get; set; } = new();
    public List<ClickByCountry> ClicksByCountry { get; set; } = new();
    public List<ClickByDevice> ClicksByDevice { get; set; } = new();
    public List<ClickByBrowser> ClicksByBrowser { get; set; } = new();
    public List<ClickByReferrer> ClicksByReferrer { get; set; } = new();
    public List<RecentClick> RecentClicks { get; set; } = new();
}

public class ClickByDate
{
    public DateTime Date { get; set; }
    public int Count { get; set; }
}

public class ClickByCountry
{
    public string CountryCode { get; set; } = string.Empty;
    public string CountryName { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class ClickByDevice
{
    public string DeviceType { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class ClickByBrowser
{
    public string Browser { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class ClickByReferrer
{
    public string Referrer { get; set; } = string.Empty;
    public int Count { get; set; }
    public double Percentage { get; set; }
}

public class RecentClick
{
    public DateTime ClickedAt { get; set; }
    public string? CountryCode { get; set; }
    public string? CountryName { get; set; }
    public string? City { get; set; }
    public string? Region { get; set; }
    public string? DeviceType { get; set; }
    public string? Browser { get; set; }
    public string? Referrer { get; set; }
}

/// <summary>
/// Response model for user dashboard statistics
/// </summary>
public class DashboardStatsResponse
{
    public int TotalLinks { get; set; }
    public int ActiveLinks { get; set; }
    public int ExpiredLinks { get; set; }
    public int TotalClicks { get; set; }
    public int ClicksThisMonth { get; set; }
    public int LinksCreatedThisMonth { get; set; }
    public int LinksLimitThisMonth { get; set; }
    public List<TopLink> TopLinks { get; set; } = new();
    public List<ClickByDate> ClicksByDate { get; set; } = new();
}

public class TopLink
{
    public Guid Id { get; set; }
    public string ShortCode { get; set; } = string.Empty;
    public string? Title { get; set; }
    public int TotalClicks { get; set; }
}
