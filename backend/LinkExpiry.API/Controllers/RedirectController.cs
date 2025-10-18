using LinkExpiry.API.Data;
using LinkExpiry.API.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace LinkExpiry.API.Controllers;

/// <summary>
/// CRITICAL CONTROLLER - Handles link redirects with < 50ms target response time
/// This is the core functionality of the entire platform
/// </summary>
[ApiController]
public class RedirectController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAnalyticsService _analyticsService;
    private readonly ILogger<RedirectController> _logger;

    public RedirectController(
        AppDbContext context,
        IAnalyticsService analyticsService,
        ILogger<RedirectController> logger)
    {
        _context = context;
        _analyticsService = analyticsService;
        _logger = logger;
    }

    /// <summary>
    /// Check link status without incrementing views (HEAD request)
    /// </summary>
    [HttpHead("/{shortCode}")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public async Task<IActionResult> CheckLinkStatus(string shortCode)
    {
        var link = await _context.Links
            .AsNoTracking()
            .Where(l => l.ShortCode == shortCode)
            .Select(l => new
            {
                l.IsActive,
                l.ExpiryType,
                l.ExpiresAt,
                l.MaxViews,
                l.CurrentViews,
                l.PasswordHash
            })
            .FirstOrDefaultAsync();

        if (link == null)
            return NotFound();

        if (!link.IsActive)
            return StatusCode(410);

        if ((link.ExpiryType == "TIME" || link.ExpiryType == "BOTH") &&
            link.ExpiresAt.HasValue &&
            link.ExpiresAt.Value < DateTime.UtcNow)
            return StatusCode(410);

        if ((link.ExpiryType == "VIEWS" || link.ExpiryType == "BOTH") &&
            link.MaxViews.HasValue &&
            link.CurrentViews >= link.MaxViews.Value)
            return StatusCode(410);

        if (!string.IsNullOrEmpty(link.PasswordHash))
            return StatusCode(401);

        return Ok();
    }

    /// <summary>
    /// Redirect to original URL using short code
    /// PERFORMANCE TARGET: < 50ms response time
    /// </summary>
    /// <param name="shortCode">Short code from URL</param>
    /// <returns>Redirect to original URL or error page</returns>
    [HttpGet("/{shortCode}")]
    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public async Task<IActionResult> RedirectToUrl(string shortCode)
    {
        try
        {
            // 1. Look up link by short code with minimal data
            // Use AsNoTracking for better performance (read-only)
            var link = await _context.Links
                .AsNoTracking()
                .Where(l => l.ShortCode == shortCode)
                .Select(l => new
                {
                    l.Id,
                    l.OriginalUrl,
                    l.IsActive,
                    l.ExpiryType,
                    l.ExpiresAt,
                    l.MaxViews,
                    l.CurrentViews,
                    l.PasswordHash,
                    l.CustomMessage
                })
                .FirstOrDefaultAsync();

            // 2. Link not found
            if (link == null)
            {
                _logger.LogWarning("Short code not found: {ShortCode}", shortCode);
                return NotFound(new
                {
                    error = "Link not found",
                    message = "This link does not exist or has been deleted."
                });
            }

            // 3. Check if link is already inactive
            if (!link.IsActive)
            {
                return StatusCode(410, new
                {
                    error = "Link expired",
                    message = link.CustomMessage ?? "This link has expired.",
                    shortCode,
                    reason = "inactive"
                });
            }

            // 4. Check time-based expiry
            if ((link.ExpiryType == "TIME" || link.ExpiryType == "BOTH") &&
                link.ExpiresAt.HasValue &&
                link.ExpiresAt.Value < DateTime.UtcNow)
            {
                // Mark as inactive
                await MarkLinkInactiveAsync(link.Id);

                return StatusCode(410, new
                {
                    error = "Link expired",
                    message = link.CustomMessage ?? $"This link expired on {link.ExpiresAt.Value:MMM dd, yyyy}.",
                    shortCode,
                    reason = "time_expired",
                    expiredAt = link.ExpiresAt.Value
                });
            }

            // 5. Check view-based expiry (before incrementing)
            if ((link.ExpiryType == "VIEWS" || link.ExpiryType == "BOTH") &&
                link.MaxViews.HasValue &&
                link.CurrentViews >= link.MaxViews.Value)
            {
                // Mark as inactive
                await MarkLinkInactiveAsync(link.Id);

                return StatusCode(410, new
                {
                    error = "Link expired",
                    message = link.CustomMessage ?? $"This link has reached its maximum view limit of {link.MaxViews.Value}.",
                    shortCode,
                    reason = "views_expired",
                    maxViews = link.MaxViews.Value
                });
            }

            // 6. Check password protection
            if (!string.IsNullOrEmpty(link.PasswordHash))
            {
                // Check if password was provided in session or query
                var providedPassword = HttpContext.Session.GetString($"pwd_{shortCode}");

                if (string.IsNullOrEmpty(providedPassword))
                {
                    return StatusCode(401, new
                    {
                        error = "Password required",
                        message = "This link is password protected. Please provide a password.",
                        shortCode,
                        requiresPassword = true
                    });
                }

                // Verify password
                if (!BCrypt.Net.BCrypt.Verify(providedPassword, link.PasswordHash))
                {
                    return StatusCode(401, new
                    {
                        error = "Invalid password",
                        message = "The password you provided is incorrect.",
                        shortCode,
                        requiresPassword = true
                    });
                }
            }

            // 7. Increment view count atomically
            await IncrementViewCountAsync(link.Id, link.ExpiryType, link.MaxViews);

            // 8. Log click asynchronously (fire-and-forget - don't await)
            // This must not block the redirect
            _ = LogClickAsync(link.Id);

            // 9. Return redirect to original URL (302 Found)
            _logger.LogDebug("Redirecting {ShortCode} to {OriginalUrl}", shortCode, link.OriginalUrl);

            return Redirect(link.OriginalUrl);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing redirect for {ShortCode}", shortCode);
            return StatusCode(500, new
            {
                error = "Server error",
                message = "An error occurred while processing your request."
            });
        }
    }

    /// <summary>
    /// Handle password submission for password-protected links
    /// </summary>
    [HttpPost("/{shortCode}/password")]
    public async Task<IActionResult> SubmitPassword(string shortCode, [FromForm] string password)
    {
        _logger.LogInformation("Password submission for {ShortCode}, password length: {Length}", shortCode, password?.Length ?? 0);

        var link = await _context.Links
            .AsNoTracking()
            .Where(l => l.ShortCode == shortCode)
            .Select(l => new { l.PasswordHash })
            .FirstOrDefaultAsync();

        if (link == null || string.IsNullOrEmpty(link.PasswordHash))
        {
            _logger.LogWarning("Link not found or has no password: {ShortCode}", shortCode);
            return NotFound();
        }

        _logger.LogDebug("Hash from DB length: {Length}, starts with: {Prefix}",
            link.PasswordHash.Length,
            link.PasswordHash.Substring(0, Math.Min(10, link.PasswordHash.Length)));

        bool isValid = BCrypt.Net.BCrypt.Verify(password, link.PasswordHash);
        _logger.LogInformation("Password verification result for {ShortCode}: {Result}", shortCode, isValid);

        if (isValid)
        {
            // Store password in session
            HttpContext.Session.SetString($"pwd_{shortCode}", password);
            _logger.LogInformation("Password stored in session for {ShortCode}", shortCode);

            // Redirect to the link again
            return RedirectToAction(nameof(RedirectToUrl), new { shortCode });
        }

        _logger.LogWarning("Invalid password attempt for {ShortCode}", shortCode);
        return StatusCode(401, new
        {
            error = "Invalid password",
            message = "Invalid password. Please try again.",
            shortCode,
            requiresPassword = true
        });
    }

    /// <summary>
    /// Increment view count atomically
    /// </summary>
    private async Task IncrementViewCountAsync(Guid linkId, string expiryType, int? maxViews)
    {
        // Use raw SQL for atomic increment - fastest method
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE links SET current_views = current_views + 1, total_clicks = total_clicks + 1 WHERE id = {0}",
            linkId);

        // Check if this increment caused expiry
        if ((expiryType == "VIEWS" || expiryType == "BOTH") && maxViews.HasValue)
        {
            var link = await _context.Links
                .Where(l => l.Id == linkId)
                .Select(l => new { l.CurrentViews, l.MaxViews })
                .FirstOrDefaultAsync();

            if (link != null && link.CurrentViews >= link.MaxViews)
            {
                await MarkLinkInactiveAsync(linkId);
            }
        }
    }

    /// <summary>
    /// Mark link as inactive
    /// </summary>
    private async Task MarkLinkInactiveAsync(Guid linkId)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE links SET is_active = false WHERE id = {0}",
            linkId);
    }

    /// <summary>
    /// Log click asynchronously (fire-and-forget)
    /// This runs in the background and doesn't block the redirect
    /// </summary>
    private async Task LogClickAsync(Guid linkId)
    {
        try
        {
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            var userAgent = Request.Headers["User-Agent"].ToString();
            var referrer = Request.Headers["Referer"].ToString();

            // Don't await - this is fire-and-forget
            await Task.Run(async () =>
            {
                try
                {
                    await _analyticsService.LogClickAsync(linkId, ipAddress, userAgent, referrer);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error logging click for link {LinkId}", linkId);
                }
            });
        }
        catch (Exception ex)
        {
            // Never throw from fire-and-forget
            _logger.LogError(ex, "Error initiating click log for link {LinkId}", linkId);
        }
    }
}
