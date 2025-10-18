using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Responses;
using LinkExpiry.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace LinkExpiry.API.Controllers;

/// <summary>
/// Controller for link management operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class LinksController : ControllerBase
{
    private readonly ILinkService _linkService;
    private readonly ILogger<LinksController> _logger;

    public LinksController(ILinkService linkService, ILogger<LinksController> logger)
    {
        _linkService = linkService;
        _logger = logger;
    }

    /// <summary>
    /// Create a new link
    /// </summary>
    /// <param name="request">Link creation details</param>
    /// <returns>Created link details</returns>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<LinkResponse>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateLink([FromBody] CreateLinkRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse.ErrorResponse("Validation failed", errors));
            }

            var userId = GetUserId();
            var response = await _linkService.CreateLinkAsync(userId, request);

            _logger.LogInformation("Link created: {ShortCode} by user {UserId}", response.ShortCode, userId);

            return CreatedAtAction(
                nameof(GetLink),
                new { id = response.Id },
                ApiResponse<LinkResponse>.SuccessResponse(response, "Link created successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Link creation failed: {Message}", ex.Message);
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning(ex, "Invalid link request: {Message}", ex.Message);
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating link");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while creating the link"));
        }
    }

    /// <summary>
    /// Get user's links with pagination
    /// </summary>
    /// <param name="pageNumber">Page number (default 1)</param>
    /// <param name="pageSize">Page size (default 10, max 100)</param>
    /// <param name="activeOnly">Filter by active status</param>
    /// <returns>Paginated list of links</returns>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedLinksResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLinks(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] bool? activeOnly = null)
    {
        try
        {
            var userId = GetUserId();
            var response = await _linkService.GetUserLinksAsync(userId, pageNumber, pageSize, activeOnly);

            return Ok(ApiResponse<PaginatedLinksResponse>.SuccessResponse(response));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving links");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving links"));
        }
    }

    /// <summary>
    /// Get single link by ID
    /// </summary>
    /// <param name="id">Link ID</param>
    /// <returns>Link details</returns>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<LinkResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLink(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var link = await _linkService.GetLinkByIdAsync(id, userId);

            if (link == null)
            {
                return NotFound(ApiResponse.ErrorResponse("Link not found"));
            }

            return Ok(ApiResponse<LinkResponse>.SuccessResponse(link));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving link {LinkId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving the link"));
        }
    }

    /// <summary>
    /// Update link
    /// </summary>
    /// <param name="id">Link ID</param>
    /// <param name="request">Update details</param>
    /// <returns>Updated link details</returns>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(ApiResponse<LinkResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateLink(Guid id, [FromBody] UpdateLinkRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return BadRequest(ApiResponse.ErrorResponse("Validation failed", errors));
            }

            var userId = GetUserId();
            var response = await _linkService.UpdateLinkAsync(id, userId, request);

            _logger.LogInformation("Link updated: {LinkId} by user {UserId}", id, userId);

            return Ok(ApiResponse<LinkResponse>.SuccessResponse(response, "Link updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Link update failed: {Message}", ex.Message);
            return NotFound(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating link {LinkId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while updating the link"));
        }
    }

    /// <summary>
    /// Delete link
    /// </summary>
    /// <param name="id">Link ID</param>
    /// <returns>Success response</returns>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteLink(Guid id)
    {
        try
        {
            var userId = GetUserId();
            var success = await _linkService.DeleteLinkAsync(id, userId);

            if (!success)
            {
                return NotFound(ApiResponse.ErrorResponse("Link not found"));
            }

            _logger.LogInformation("Link deleted: {LinkId} by user {UserId}", id, userId);

            return Ok(ApiResponse.SuccessResponse("Link deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting link {LinkId}", id);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while deleting the link"));
        }
    }

    /// <summary>
    /// Validate link password
    /// </summary>
    /// <param name="shortCode">Short code</param>
    /// <param name="request">Password to validate</param>
    /// <returns>Validation result</returns>
    [HttpPost("{shortCode}/verify-password")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> VerifyPassword(string shortCode, [FromBody] VerifyLinkPasswordRequest request)
    {
        try
        {
            var isValid = await _linkService.ValidateLinkPasswordAsync(shortCode, request.Password);

            if (!isValid)
            {
                return Unauthorized(ApiResponse.ErrorResponse("Invalid password"));
            }

            return Ok(ApiResponse<object>.SuccessResponse(new { valid = true }, "Password verified"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error verifying password for link {ShortCode}", shortCode);
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while verifying the password"));
        }
    }

    /// <summary>
    /// Get user's link usage stats
    /// </summary>
    /// <returns>Usage statistics</returns>
    [HttpGet("usage")]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetUsage()
    {
        try
        {
            var userId = GetUserId();
            var linksCreatedThisMonth = await _linkService.GetUserLinkCountThisMonthAsync(userId);
            var canCreateMore = await _linkService.CheckUserCanCreateLinkAsync(userId);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                linksCreatedThisMonth,
                canCreateMore
            }));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving usage stats");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred while retrieving usage stats"));
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
