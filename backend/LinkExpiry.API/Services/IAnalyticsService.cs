using LinkExpiry.API.Models.DTOs;

namespace LinkExpiry.API.Services;

/// <summary>
/// Service interface for analytics operations
/// </summary>
public interface IAnalyticsService
{
    Task<LinkAnalyticsResponse> GetLinkAnalyticsAsync(Guid linkId, Guid userId, int days = 30);
    Task<DashboardStatsResponse> GetDashboardStatsAsync(Guid userId);
    Task LogClickAsync(Guid linkId, string ipAddress, string userAgent, string? referrer);
}
