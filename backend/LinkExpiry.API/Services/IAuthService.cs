using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Entities;

namespace LinkExpiry.API.Services;

/// <summary>
/// Service interface for authentication operations
/// </summary>
public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<RefreshTokenResponse> RefreshTokenAsync(string refreshToken);
    Task<bool> ValidateRefreshTokenAsync(string refreshToken, Guid userId);
    Task<User> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    Guid? GetUserIdFromToken(string token);
}
