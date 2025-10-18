using LinkExpiry.API.Data;
using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Entities;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace LinkExpiry.API.Services;

/// <summary>
/// Service for handling authentication operations with JWT
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthService> _logger;

    // In-memory cache for refresh tokens (in production, use Redis)
    private static readonly Dictionary<string, RefreshTokenData> _refreshTokens = new();

    public AuthService(
        IUnitOfWork unitOfWork,
        IConfiguration configuration,
        ILogger<AuthService> logger)
    {
        _unitOfWork = unitOfWork;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Check if email already exists
        var existingUser = await _unitOfWork.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (existingUser != null)
        {
            throw new InvalidOperationException("Email already registered");
        }

        // Normalize phone number (remove spaces and special characters for storage)
        var normalizedPhone = new string(request.Phone.Where(c => char.IsDigit(c) || c == '+').ToArray());

        // Hash password with BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create new user
        var user = new User
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = request.Email.ToLower().Trim(),
            Phone = normalizedPhone,
            PasswordHash = passwordHash,
            PlanType = "FREE",
            SubscriptionStatus = "ACTIVE",
            LinksCreatedThisMonth = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("New user registered: {Email}", user.Email);

        // Generate tokens
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();

        // Store refresh token
        _refreshTokens[refreshToken] = new RefreshTokenData
        {
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(
                _configuration.GetValue<int>("JwtSettings:RefreshTokenExpirationDays", 7))
        };

        return new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(
                _configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes", 60)),
            PlanType = user.PlanType
        };
    }

    /// <summary>
    /// Login an existing user
    /// </summary>
    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // Find user by email
        var user = await _unitOfWork.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            _logger.LogWarning("Failed login attempt for user: {Email}", request.Email);
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        _logger.LogInformation("User logged in: {Email}", user.Email);

        // Generate tokens
        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken();

        // Store refresh token
        _refreshTokens[refreshToken] = new RefreshTokenData
        {
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(
                _configuration.GetValue<int>("JwtSettings:RefreshTokenExpirationDays", 7))
        };

        return new AuthResponse
        {
            UserId = user.Id,
            Email = user.Email,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(
                _configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes", 60)),
            PlanType = user.PlanType
        };
    }

    /// <summary>
    /// Refresh access token using refresh token
    /// </summary>
    public async Task<RefreshTokenResponse> RefreshTokenAsync(string refreshToken)
    {
        // Validate refresh token
        if (!_refreshTokens.TryGetValue(refreshToken, out var tokenData))
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        // Check if token is expired
        if (tokenData.ExpiresAt < DateTime.UtcNow)
        {
            _refreshTokens.Remove(refreshToken);
            throw new UnauthorizedAccessException("Refresh token expired");
        }

        // Get user
        var user = await _unitOfWork.Users.GetByIdAsync(tokenData.UserId);
        if (user == null)
        {
            _refreshTokens.Remove(refreshToken);
            throw new UnauthorizedAccessException("User not found");
        }

        // Generate new tokens
        var newAccessToken = GenerateAccessToken(user);
        var newRefreshToken = GenerateRefreshToken();

        // Remove old refresh token and store new one
        _refreshTokens.Remove(refreshToken);
        _refreshTokens[newRefreshToken] = new RefreshTokenData
        {
            UserId = user.Id,
            ExpiresAt = DateTime.UtcNow.AddDays(
                _configuration.GetValue<int>("JwtSettings:RefreshTokenExpirationDays", 7))
        };

        return new RefreshTokenResponse
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddMinutes(
                _configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes", 60))
        };
    }

    /// <summary>
    /// Validate refresh token
    /// </summary>
    public Task<bool> ValidateRefreshTokenAsync(string refreshToken, Guid userId)
    {
        if (!_refreshTokens.TryGetValue(refreshToken, out var tokenData))
        {
            return Task.FromResult(false);
        }

        return Task.FromResult(
            tokenData.UserId == userId &&
            tokenData.ExpiresAt > DateTime.UtcNow
        );
    }

    /// <summary>
    /// Generate JWT access token
    /// </summary>
    public string GenerateAccessToken(User user)
    {
        var secretKey = _configuration["JwtSettings:SecretKey"]
            ?? throw new InvalidOperationException("JWT Secret Key not configured");
        var issuer = _configuration["JwtSettings:Issuer"];
        var audience = _configuration["JwtSettings:Audience"];
        var expirationMinutes = _configuration.GetValue<int>("JwtSettings:AccessTokenExpirationMinutes", 60);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("plan_type", user.PlanType)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expirationMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Generate cryptographically secure refresh token
    /// </summary>
    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    /// <summary>
    /// Update user profile information
    /// </summary>
    public async Task<User> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new InvalidOperationException("User not found");
        }

        // Check if email is being changed and if it's already taken
        if (user.Email.ToLower() != request.Email.ToLower())
        {
            var existingUser = await _unitOfWork.Users
                .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

            if (existingUser != null)
            {
                throw new InvalidOperationException("Email already in use");
            }

            user.Email = request.Email.ToLower().Trim();
        }

        // Normalize phone number
        var normalizedPhone = new string(request.Phone.Where(c => char.IsDigit(c) || c == '+').ToArray());

        // Update user fields
        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Phone = normalizedPhone;
        user.UpdatedAt = DateTime.UtcNow;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Profile updated for user: {UserId}", userId);

        return user;
    }

    /// <summary>
    /// Extract user ID from JWT token
    /// </summary>
    public Guid? GetUserIdFromToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jwtToken = tokenHandler.ReadJwtToken(token);
            var userIdClaim = jwtToken.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub);

            if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out var userId))
            {
                return userId;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error extracting user ID from token");
        }

        return null;
    }
}

/// <summary>
/// Internal class for storing refresh token data
/// </summary>
internal class RefreshTokenData
{
    public Guid UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
}
