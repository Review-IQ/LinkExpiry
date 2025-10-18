using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Responses;
using LinkExpiry.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LinkExpiry.API.Controllers;

/// <summary>
/// Controller for analytics and statistics
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AnalyticsController : ControllerBase
{
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<AnalyticsController> _logger;

    public AnalyticsController(IAnalyticsService analyticsService, ILogger<AnalyticsController> logger)
    {
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Get detailed analytics for a specific link
    /// </summary>
    /// <param name="linkId">Link ID</param>
    /// <param name="days">Number of days to include (default 30)</param>
    /// <returns>Link analytics data</returns>
    [HttpGet("links/{linkId}")]
    [ProducesResponseType(typeof(ApiResponse<LinkAnalyticsResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetLinkAnalytics(Guid linkId, [FromQuery] int days = 30)
    {
        try
        {
            if (days < 1 || days > 365)
            {
                return BadRequest(ApiResponse.ErrorResponse("Days must be between 1 and 365"));
            }

            var userId = GetUserId();
            var analytics = await _analyticsService.GetLinkAnalyticsAsync(linkId, userId, days);

            return Ok(ApiResponse<LinkAnalyticsResponse>.SuccessResponse(analytics));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning(ex, "Unauthorized access to link analytics: {LinkId}", linkId);
            return Forbid();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving link analytics for {LinkId}", linkId);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving analytics"));
        }
    }

    /// <summary>
    /// Get dashboard statistics for the authenticated user
    /// </summary>
    /// <returns>Dashboard statistics</returns>
    [HttpGet("dashboard")]
    [ProducesResponseType(typeof(ApiResponse<DashboardStatsResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboardStats()
    {
        try
        {
            var userId = GetUserId();
            var stats = await _analyticsService.GetDashboardStatsAsync(userId);

            return Ok(ApiResponse<DashboardStatsResponse>.SuccessResponse(stats));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving dashboard stats");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving dashboard stats"));
        }
    }

    /// <summary>
    /// Extract user ID from JWT claims
    /// </summary>
    private Guid GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            throw new UnauthorizedAccessException("Invalid user ID in token");
        }
        return userId;
    }
}
