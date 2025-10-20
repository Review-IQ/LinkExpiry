using LinkExpiry.API.Data;
using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Entities;
using LinkExpiry.API.Models.Responses;
using LinkExpiry.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace LinkExpiry.API.Controllers;

/// <summary>
/// Controller for managing custom expiry pages
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ExpiryPageController : ControllerBase
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<ExpiryPageController> _logger;

    public ExpiryPageController(IUnitOfWork unitOfWork, ILogger<ExpiryPageController> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    /// <summary>
    /// Get all expiry pages for the current user
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<ExpiryPageResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExpiryPages()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse("Invalid user"));
        }

        var expiryPages = (await _unitOfWork.ExpiryPages.FindAsync(ep => ep.UserId == userId))
            .OrderByDescending(ep => ep.CreatedAt)
            .ToList();

        var responses = new List<ExpiryPageResponse>();
        foreach (var page in expiryPages)
        {
            var linksUsing = await _unitOfWork.Links.CountAsync(l => l.ExpiryPageId == page.Id);
            var emailsCaptured = await _unitOfWork.ExpiryPageEmails.CountAsync(e => e.ExpiryPageId == page.Id);

            responses.Add(new ExpiryPageResponse
            {
                Id = page.Id,
                UserId = page.UserId,
                Name = page.Name,
                Title = page.Title,
                Message = page.Message,
                LogoUrl = page.LogoUrl,
                BackgroundColor = page.BackgroundColor,
                CtaButtonText = page.CtaButtonText,
                CtaButtonUrl = page.CtaButtonUrl,
                CtaButtonColor = page.CtaButtonColor,
                SocialFacebook = page.SocialFacebook,
                SocialTwitter = page.SocialTwitter,
                SocialInstagram = page.SocialInstagram,
                SocialLinkedin = page.SocialLinkedin,
                SocialWebsite = page.SocialWebsite,
                CustomCss = page.CustomCss,
                EnableEmailCapture = page.EnableEmailCapture,
                EmailCaptureText = page.EmailCaptureText,
                CreatedAt = page.CreatedAt,
                UpdatedAt = page.UpdatedAt,
                LinksUsingCount = linksUsing,
                EmailsCaptured = emailsCaptured
            });
        }

        return Ok(ApiResponse<List<ExpiryPageResponse>>.SuccessResponse(responses));
    }

    /// <summary>
    /// Get a specific expiry page by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ExpiryPageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetExpiryPage(Guid id)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse("Invalid user"));
        }

        var page = await _unitOfWork.ExpiryPages.FirstOrDefaultAsync(ep => ep.Id == id && ep.UserId == userId);
        if (page == null)
        {
            return NotFound(ApiResponse.ErrorResponse("Expiry page not found"));
        }

        var linksUsing = await _unitOfWork.Links.CountAsync(l => l.ExpiryPageId == page.Id);
        var emailsCaptured = await _unitOfWork.ExpiryPageEmails.CountAsync(e => e.ExpiryPageId == page.Id);

        var response = new ExpiryPageResponse
        {
            Id = page.Id,
            UserId = page.UserId,
            Name = page.Name,
            Title = page.Title,
            Message = page.Message,
            LogoUrl = page.LogoUrl,
            BackgroundColor = page.BackgroundColor,
            CtaButtonText = page.CtaButtonText,
            CtaButtonUrl = page.CtaButtonUrl,
            CtaButtonColor = page.CtaButtonColor,
            SocialFacebook = page.SocialFacebook,
            SocialTwitter = page.SocialTwitter,
            SocialInstagram = page.SocialInstagram,
            SocialLinkedin = page.SocialLinkedin,
            SocialWebsite = page.SocialWebsite,
            CustomCss = page.CustomCss,
            EnableEmailCapture = page.EnableEmailCapture,
            EmailCaptureText = page.EmailCaptureText,
            CreatedAt = page.CreatedAt,
            UpdatedAt = page.UpdatedAt,
            LinksUsingCount = linksUsing,
            EmailsCaptured = emailsCaptured
        };

        return Ok(ApiResponse<ExpiryPageResponse>.SuccessResponse(response));
    }

    /// <summary>
    /// Create a new expiry page
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ExpiryPageResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateExpiryPage([FromBody] CreateExpiryPageRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse.ErrorResponse("Validation failed", errors));
        }

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse("Invalid user"));
        }

        var expiryPage = new ExpiryPage
        {
            UserId = userId,
            Name = request.Name,
            Title = request.Title,
            Message = request.Message,
            LogoUrl = request.LogoUrl,
            BackgroundColor = request.BackgroundColor,
            CtaButtonText = request.CtaButtonText,
            CtaButtonUrl = request.CtaButtonUrl,
            CtaButtonColor = request.CtaButtonColor,
            SocialFacebook = request.SocialFacebook,
            SocialTwitter = request.SocialTwitter,
            SocialInstagram = request.SocialInstagram,
            SocialLinkedin = request.SocialLinkedin,
            SocialWebsite = request.SocialWebsite,
            CustomCss = request.CustomCss,
            EnableEmailCapture = request.EnableEmailCapture,
            EmailCaptureText = request.EmailCaptureText,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.ExpiryPages.AddAsync(expiryPage);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Created expiry page {Id} for user {UserId}", expiryPage.Id, userId);

        var response = new ExpiryPageResponse
        {
            Id = expiryPage.Id,
            UserId = expiryPage.UserId,
            Name = expiryPage.Name,
            Title = expiryPage.Title,
            Message = expiryPage.Message,
            LogoUrl = expiryPage.LogoUrl,
            BackgroundColor = expiryPage.BackgroundColor,
            CtaButtonText = expiryPage.CtaButtonText,
            CtaButtonUrl = expiryPage.CtaButtonUrl,
            CtaButtonColor = expiryPage.CtaButtonColor,
            SocialFacebook = expiryPage.SocialFacebook,
            SocialTwitter = expiryPage.SocialTwitter,
            SocialInstagram = expiryPage.SocialInstagram,
            SocialLinkedin = expiryPage.SocialLinkedin,
            SocialWebsite = expiryPage.SocialWebsite,
            CustomCss = expiryPage.CustomCss,
            EnableEmailCapture = expiryPage.EnableEmailCapture,
            EmailCaptureText = expiryPage.EmailCaptureText,
            CreatedAt = expiryPage.CreatedAt,
            UpdatedAt = expiryPage.UpdatedAt,
            LinksUsingCount = 0,
            EmailsCaptured = 0
        };

        return CreatedAtAction(nameof(GetExpiryPage), new { id = expiryPage.Id },
            ApiResponse<ExpiryPageResponse>.SuccessResponse(response, "Expiry page created successfully"));
    }

    /// <summary>
    /// Update an existing expiry page
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<ExpiryPageResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateExpiryPage(Guid id, [FromBody] UpdateExpiryPageRequest request)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => e.ErrorMessage)
                .ToList();
            return BadRequest(ApiResponse.ErrorResponse("Validation failed", errors));
        }

        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse("Invalid user"));
        }

        var page = await _unitOfWork.ExpiryPages.FirstOrDefaultAsync(ep => ep.Id == id && ep.UserId == userId);
        if (page == null)
        {
            return NotFound(ApiResponse.ErrorResponse("Expiry page not found"));
        }

        // Update only provided fields
        if (request.Name != null) page.Name = request.Name;
        if (request.Title != null) page.Title = request.Title;
        if (request.Message != null) page.Message = request.Message;
        if (request.LogoUrl != null) page.LogoUrl = request.LogoUrl;
        if (request.BackgroundColor != null) page.BackgroundColor = request.BackgroundColor;
        if (request.CtaButtonText != null) page.CtaButtonText = request.CtaButtonText;
        if (request.CtaButtonUrl != null) page.CtaButtonUrl = request.CtaButtonUrl;
        if (request.CtaButtonColor != null) page.CtaButtonColor = request.CtaButtonColor;
        if (request.SocialFacebook != null) page.SocialFacebook = request.SocialFacebook;
        if (request.SocialTwitter != null) page.SocialTwitter = request.SocialTwitter;
        if (request.SocialInstagram != null) page.SocialInstagram = request.SocialInstagram;
        if (request.SocialLinkedin != null) page.SocialLinkedin = request.SocialLinkedin;
        if (request.SocialWebsite != null) page.SocialWebsite = request.SocialWebsite;
        if (request.CustomCss != null) page.CustomCss = request.CustomCss;
        if (request.EnableEmailCapture.HasValue) page.EnableEmailCapture = request.EnableEmailCapture.Value;
        if (request.EmailCaptureText != null) page.EmailCaptureText = request.EmailCaptureText;

        page.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.ExpiryPages.Update(page);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Updated expiry page {Id}", id);

        var linksUsing = await _unitOfWork.Links.CountAsync(l => l.ExpiryPageId == page.Id);
        var emailsCaptured = await _unitOfWork.ExpiryPageEmails.CountAsync(e => e.ExpiryPageId == page.Id);

        var response = new ExpiryPageResponse
        {
            Id = page.Id,
            UserId = page.UserId,
            Name = page.Name,
            Title = page.Title,
            Message = page.Message,
            LogoUrl = page.LogoUrl,
            BackgroundColor = page.BackgroundColor,
            CtaButtonText = page.CtaButtonText,
            CtaButtonUrl = page.CtaButtonUrl,
            CtaButtonColor = page.CtaButtonColor,
            SocialFacebook = page.SocialFacebook,
            SocialTwitter = page.SocialTwitter,
            SocialInstagram = page.SocialInstagram,
            SocialLinkedin = page.SocialLinkedin,
            SocialWebsite = page.SocialWebsite,
            CustomCss = page.CustomCss,
            EnableEmailCapture = page.EnableEmailCapture,
            EmailCaptureText = page.EmailCaptureText,
            CreatedAt = page.CreatedAt,
            UpdatedAt = page.UpdatedAt,
            LinksUsingCount = linksUsing,
            EmailsCaptured = emailsCaptured
        };

        return Ok(ApiResponse<ExpiryPageResponse>.SuccessResponse(response, "Expiry page updated successfully"));
    }

    /// <summary>
    /// Delete an expiry page
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteExpiryPage(Guid id)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse("Invalid user"));
        }

        var page = await _unitOfWork.ExpiryPages.FirstOrDefaultAsync(ep => ep.Id == id && ep.UserId == userId);
        if (page == null)
        {
            return NotFound(ApiResponse.ErrorResponse("Expiry page not found"));
        }

        // Check if any links are using this page
        var linksUsing = await _unitOfWork.Links.CountAsync(l => l.ExpiryPageId == id);
        if (linksUsing > 0)
        {
            return BadRequest(ApiResponse.ErrorResponse(
                $"Cannot delete expiry page. {linksUsing} link(s) are currently using it. Please reassign or delete those links first."));
        }

        _unitOfWork.ExpiryPages.Remove(page);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Deleted expiry page {Id}", id);

        return Ok(ApiResponse.SuccessResponse("Expiry page deleted successfully"));
    }

    /// <summary>
    /// Get all emails captured from a specific expiry page
    /// </summary>
    [HttpGet("{id}/emails")]
    [ProducesResponseType(typeof(ApiResponse<List<ExpiryPageEmail>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCapturedEmails(Guid id)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse.ErrorResponse("Invalid user"));
        }

        var page = await _unitOfWork.ExpiryPages.FirstOrDefaultAsync(ep => ep.Id == id && ep.UserId == userId);
        if (page == null)
        {
            return NotFound(ApiResponse.ErrorResponse("Expiry page not found"));
        }

        var emails = (await _unitOfWork.ExpiryPageEmails.FindAsync(e => e.ExpiryPageId == id))
            .OrderByDescending(e => e.CapturedAt)
            .ToList();

        return Ok(ApiResponse<List<ExpiryPageEmail>>.SuccessResponse(emails));
    }

    /// <summary>
    /// Capture an email from an expiry page (public endpoint - no auth required)
    /// </summary>
    [HttpPost("{id}/capture-email")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<CaptureEmailResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CaptureEmail(Guid id, [FromBody] CaptureEmailRequest request)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ApiResponse.ErrorResponse("Invalid email address"));
        }

        var page = await _unitOfWork.ExpiryPages.GetByIdAsync(id);
        if (page == null || !page.EnableEmailCapture)
        {
            return NotFound(ApiResponse.ErrorResponse("Email capture not available for this page"));
        }

        // Hash IP for privacy
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        var ipHash = HashIpAddress(ipAddress);
        var userAgent = Request.Headers["User-Agent"].ToString();

        var emailCapture = new ExpiryPageEmail
        {
            ExpiryPageId = id,
            Email = request.Email.ToLower().Trim(),
            CapturedAt = DateTime.UtcNow,
            IpHash = ipHash,
            UserAgent = userAgent
        };

        await _unitOfWork.ExpiryPageEmails.AddAsync(emailCapture);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Captured email {Email} for expiry page {PageId}", request.Email, id);

        var response = new CaptureEmailResponse
        {
            Success = true,
            Message = "Thank you! We've captured your email."
        };

        return Ok(ApiResponse<CaptureEmailResponse>.SuccessResponse(response));
    }

    private string HashIpAddress(string ipAddress)
    {
        using var sha256 = SHA256.Create();
        var bytes = Encoding.UTF8.GetBytes(ipAddress);
        var hash = sha256.ComputeHash(bytes);
        return Convert.ToBase64String(hash);
    }
}
