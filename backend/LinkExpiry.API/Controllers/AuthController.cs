using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Responses;
using LinkExpiry.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LinkExpiry.API.Controllers;

/// <summary>
/// Controller for authentication operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    /// <param name="request">Registration details</param>
    /// <returns>Authentication response with JWT tokens</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
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

            var response = await _authService.RegisterAsync(request);

            // Set refresh token in httpOnly cookie
            SetRefreshTokenCookie(response.RefreshToken);

            _logger.LogInformation("User registered successfully: {Email}", request.Email);

            return Ok(ApiResponse<AuthResponse>.SuccessResponse(
                response,
                "Registration successful"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Registration failed: {Message}", ex.Message);
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during registration");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred during registration"));
        }
    }

    /// <summary>
    /// Login existing user
    /// </summary>
    /// <param name="request">Login credentials</param>
    /// <returns>Authentication response with JWT tokens</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
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

            var response = await _authService.LoginAsync(request);

            // Set refresh token in httpOnly cookie
            SetRefreshTokenCookie(response.RefreshToken);

            _logger.LogInformation("User logged in successfully: {Email}", request.Email);

            return Ok(ApiResponse<AuthResponse>.SuccessResponse(
                response,
                "Login successful"));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Login failed: {Message}", ex.Message);
            return Unauthorized(ApiResponse.ErrorResponse("Invalid credentials"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during login");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred during login"));
        }
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    /// <param name="request">Refresh token request</param>
    /// <returns>New access and refresh tokens</returns>
    [HttpPost("refresh")]
    [ProducesResponseType(typeof(ApiResponse<RefreshTokenResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        try
        {
            // Try to get refresh token from cookie if not provided in body
            var refreshToken = request.RefreshToken;
            if (string.IsNullOrEmpty(refreshToken))
            {
                refreshToken = Request.Cookies["refreshToken"];
            }

            if (string.IsNullOrEmpty(refreshToken))
            {
                return Unauthorized(ApiResponse.ErrorResponse("Refresh token is required"));
            }

            var response = await _authService.RefreshTokenAsync(refreshToken);

            // Set new refresh token in httpOnly cookie
            SetRefreshTokenCookie(response.RefreshToken);

            return Ok(ApiResponse<RefreshTokenResponse>.SuccessResponse(
                response,
                "Token refreshed successfully"));
        }
        catch (UnauthorizedAccessException ex)
        {
            _logger.LogWarning("Token refresh failed: {Message}", ex.Message);
            return Unauthorized(ApiResponse.ErrorResponse("Invalid or expired refresh token"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during token refresh");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred during token refresh"));
        }
    }

    /// <summary>
    /// Logout user (clear refresh token cookie)
    /// </summary>
    /// <returns>Success response</returns>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    public IActionResult Logout()
    {
        // Clear refresh token cookie
        Response.Cookies.Delete("refreshToken");

        _logger.LogInformation("User logged out");

        return Ok(ApiResponse.SuccessResponse("Logout successful"));
    }

    /// <summary>
    /// Get current user info (for testing authentication)
    /// </summary>
    /// <returns>User information</returns>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    public IActionResult GetCurrentUser()
    {
        var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
        var planType = User.FindFirst("plan_type")?.Value;

        return Ok(ApiResponse<object>.SuccessResponse(new
        {
            userId,
            email,
            planType
        }));
    }

    /// <summary>
    /// Update user profile
    /// </summary>
    /// <param name="request">Profile update details</param>
    /// <returns>Updated user information</returns>
    [HttpPut("profile")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
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

            var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(ApiResponse.ErrorResponse("Invalid user"));
            }

            var updatedUser = await _authService.UpdateProfileAsync(userId, request);

            return Ok(ApiResponse<object>.SuccessResponse(new
            {
                userId = updatedUser.Id,
                firstName = updatedUser.FirstName,
                lastName = updatedUser.LastName,
                email = updatedUser.Email,
                phone = updatedUser.Phone,
                planType = updatedUser.PlanType
            }, "Profile updated successfully"));
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogWarning(ex, "Profile update failed: {Message}", ex.Message);
            return BadRequest(ApiResponse.ErrorResponse(ex.Message));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during profile update");
            return StatusCode(500, ApiResponse.ErrorResponse("An error occurred during profile update"));
        }
    }

    /// <summary>
    /// Set refresh token in httpOnly cookie
    /// </summary>
    private void SetRefreshTokenCookie(string refreshToken)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true, // Only send over HTTPS
            SameSite = SameSiteMode.Strict,
            Expires = DateTime.UtcNow.AddDays(7)
        };

        Response.Cookies.Append("refreshToken", refreshToken, cookieOptions);
    }
}
