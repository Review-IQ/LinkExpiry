using LinkExpiry.API.Data;
using LinkExpiry.API.Models.DTOs;
using LinkExpiry.API.Models.Entities;
using LinkExpiry.API.Constants;
using Microsoft.EntityFrameworkCore;

namespace LinkExpiry.API.Services;

/// <summary>
/// Service for managing link operations with business logic
/// </summary>
public class LinkService : ILinkService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ShortCodeGenerator _shortCodeGenerator;
    private readonly IConfiguration _configuration;
    private readonly ILogger<LinkService> _logger;

    public LinkService(
        IUnitOfWork unitOfWork,
        ShortCodeGenerator shortCodeGenerator,
        IConfiguration configuration,
        ILogger<LinkService> logger)
    {
        _unitOfWork = unitOfWork;
        _shortCodeGenerator = shortCodeGenerator;
        _configuration = configuration;
        _logger = logger;
    }

    /// <summary>
    /// Create a new link with expiry conditions
    /// </summary>
    public async Task<LinkResponse> CreateLinkAsync(Guid userId, CreateLinkRequest request)
    {
        // Get user to check plan limits
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        // Check if user can create more links this month
        if (!await CheckUserCanCreateLinkAsync(userId))
        {
            var limit = PlanLimits.GetMonthlyLinkLimit(user.PlanType);
            throw new InvalidOperationException($"Monthly link limit reached. Your {user.PlanType} plan allows {limit} links per month.");
        }

        // Validate expiry type and required fields
        ValidateExpiryRequest(request);

        // Validate max views against plan limit
        if (request.MaxViews.HasValue)
        {
            var maxViewsLimit = PlanLimits.GetMaxViewsPerLink(user.PlanType);
            if (request.MaxViews.Value > maxViewsLimit)
            {
                throw new InvalidOperationException($"Maximum views per link exceeded. Your {user.PlanType} plan allows up to {maxViewsLimit} views per link.");
            }
        }

        // Generate unique short code
        var shortCode = await _shortCodeGenerator.GenerateUniqueCodeAsync();

        // Hash password if provided
        string? passwordHash = null;
        if (!string.IsNullOrEmpty(request.Password))
        {
            passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        // Create link entity
        var link = new Link
        {
            UserId = userId,
            ShortCode = shortCode,
            OriginalUrl = request.OriginalUrl,
            Title = request.Title,
            ExpiryType = request.ExpiryType,
            ExpiresAt = request.ExpiresAt,
            MaxViews = request.MaxViews,
            PasswordHash = passwordHash,
            CustomMessage = request.CustomMessage,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        await _unitOfWork.Links.AddAsync(link);

        // Increment user's monthly count
        user.LinksCreatedThisMonth++;
        user.UpdatedAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);

        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Link created: {ShortCode} for user {UserId}", shortCode, userId);

        return MapToLinkResponse(link);
    }

    /// <summary>
    /// Get user's links with pagination
    /// </summary>
    public async Task<PaginatedLinksResponse> GetUserLinksAsync(
        Guid userId,
        int pageNumber = 1,
        int pageSize = 10,
        bool? activeOnly = null)
    {
        if (pageNumber < 1) pageNumber = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 10;

        // Build query
        var query = (await _unitOfWork.Links.FindAsync(l => l.UserId == userId)).AsQueryable();

        if (activeOnly.HasValue)
        {
            query = query.Where(l => l.IsActive == activeOnly.Value);
        }

        // Get total count
        var totalCount = query.Count();

        // Get paginated results
        var links = query
            .OrderByDescending(l => l.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        var linkResponses = links.Select(MapToLinkResponse).ToList();

        return new PaginatedLinksResponse
        {
            Links = linkResponses,
            TotalCount = totalCount,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
            HasNextPage = pageNumber * pageSize < totalCount,
            HasPreviousPage = pageNumber > 1
        };
    }

    /// <summary>
    /// Get single link by ID (user must own it)
    /// </summary>
    public async Task<LinkResponse?> GetLinkByIdAsync(Guid linkId, Guid userId)
    {
        var link = await _unitOfWork.Links
            .FirstOrDefaultAsync(l => l.Id == linkId && l.UserId == userId);

        return link == null ? null : MapToLinkResponse(link);
    }

    /// <summary>
    /// Get link by short code (public - for redirect)
    /// </summary>
    public async Task<LinkResponse?> GetLinkByShortCodeAsync(string shortCode)
    {
        var link = await _unitOfWork.Links
            .FirstOrDefaultAsync(l => l.ShortCode == shortCode);

        return link == null ? null : MapToLinkResponse(link);
    }

    /// <summary>
    /// Update link properties
    /// </summary>
    public async Task<LinkResponse> UpdateLinkAsync(Guid linkId, Guid userId, UpdateLinkRequest request)
    {
        var link = await _unitOfWork.Links
            .FirstOrDefaultAsync(l => l.Id == linkId && l.UserId == userId);

        if (link == null)
        {
            throw new InvalidOperationException("Link not found or access denied");
        }

        // Update allowed fields
        if (request.Title != null)
        {
            link.Title = request.Title;
        }

        if (request.CustomMessage != null)
        {
            link.CustomMessage = request.CustomMessage;
        }

        if (request.IsActive.HasValue)
        {
            link.IsActive = request.IsActive.Value;
        }

        _unitOfWork.Links.Update(link);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Link updated: {LinkId} by user {UserId}", linkId, userId);

        return MapToLinkResponse(link);
    }

    /// <summary>
    /// Delete link (soft delete - set inactive)
    /// </summary>
    public async Task<bool> DeleteLinkAsync(Guid linkId, Guid userId)
    {
        var link = await _unitOfWork.Links
            .FirstOrDefaultAsync(l => l.Id == linkId && l.UserId == userId);

        if (link == null)
        {
            return false;
        }

        link.IsActive = false;
        _unitOfWork.Links.Update(link);
        await _unitOfWork.SaveChangesAsync();

        _logger.LogInformation("Link deleted: {LinkId} by user {UserId}", linkId, userId);

        return true;
    }

    /// <summary>
    /// Validate password for password-protected link
    /// </summary>
    public async Task<bool> ValidateLinkPasswordAsync(string shortCode, string password)
    {
        var link = await _unitOfWork.Links
            .FirstOrDefaultAsync(l => l.ShortCode == shortCode);

        if (link == null || string.IsNullOrEmpty(link.PasswordHash))
        {
            return false;
        }

        return BCrypt.Net.BCrypt.Verify(password, link.PasswordHash);
    }

    /// <summary>
    /// Get count of links created by user this month
    /// </summary>
    public async Task<int> GetUserLinkCountThisMonthAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        return user?.LinksCreatedThisMonth ?? 0;
    }

    /// <summary>
    /// Check if user can create more links based on their plan
    /// </summary>
    public async Task<bool> CheckUserCanCreateLinkAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
        {
            return false;
        }

        var limit = PlanLimits.GetMonthlyLinkLimit(user.PlanType);

        // int.MaxValue means unlimited
        if (limit == int.MaxValue)
        {
            return true;
        }

        return user.LinksCreatedThisMonth < limit;
    }

    /// <summary>
    /// Map Link entity to LinkResponse DTO
    /// </summary>
    private LinkResponse MapToLinkResponse(Link link)
    {
        var baseUrl = _configuration["AppSettings:BaseUrl"] ?? "https://localhost:7001";

        string status;
        if (!link.IsActive)
        {
            status = "Expired";
        }
        else if (link.ExpiryType == ExpiryType.Time && link.ExpiresAt.HasValue && link.ExpiresAt.Value < DateTime.UtcNow)
        {
            status = "Expired";
        }
        else if (link.ExpiryType == ExpiryType.Views && link.MaxViews.HasValue && link.CurrentViews >= link.MaxViews.Value)
        {
            status = "Expired";
        }
        else if (link.ExpiryType == ExpiryType.Both)
        {
            if ((link.ExpiresAt.HasValue && link.ExpiresAt.Value < DateTime.UtcNow) ||
                (link.MaxViews.HasValue && link.CurrentViews >= link.MaxViews.Value))
            {
                status = "Expired";
            }
            else
            {
                status = "Active";
            }
        }
        else
        {
            status = "Active";
        }

        return new LinkResponse
        {
            Id = link.Id,
            ShortCode = link.ShortCode,
            ShortUrl = $"{baseUrl}/{link.ShortCode}",
            OriginalUrl = link.OriginalUrl,
            Title = link.Title,
            CreatedAt = link.CreatedAt,
            ExpiresAt = link.ExpiresAt,
            MaxViews = link.MaxViews,
            CurrentViews = link.CurrentViews,
            TotalClicks = link.TotalClicks,
            IsActive = link.IsActive,
            ExpiryType = link.ExpiryType,
            HasPassword = !string.IsNullOrEmpty(link.PasswordHash),
            CustomMessage = link.CustomMessage,
            Status = status
        };
    }

    /// <summary>
    /// Validate expiry request based on type
    /// </summary>
    private void ValidateExpiryRequest(CreateLinkRequest request)
    {
        switch (request.ExpiryType)
        {
            case ExpiryType.Time:
                if (!request.ExpiresAt.HasValue)
                {
                    throw new ArgumentException("ExpiresAt is required for TIME expiry type");
                }
                if (request.ExpiresAt.Value <= DateTime.UtcNow)
                {
                    throw new ArgumentException("ExpiresAt must be in the future");
                }
                break;

            case ExpiryType.Views:
                if (!request.MaxViews.HasValue || request.MaxViews.Value < 1)
                {
                    throw new ArgumentException("MaxViews must be at least 1 for VIEWS expiry type");
                }
                break;

            case ExpiryType.Both:
                if (!request.ExpiresAt.HasValue || !request.MaxViews.HasValue)
                {
                    throw new ArgumentException("Both ExpiresAt and MaxViews are required for BOTH expiry type");
                }
                if (request.ExpiresAt.Value <= DateTime.UtcNow)
                {
                    throw new ArgumentException("ExpiresAt must be in the future");
                }
                if (request.MaxViews.Value < 1)
                {
                    throw new ArgumentException("MaxViews must be at least 1");
                }
                break;

            case ExpiryType.None:
                // No validation needed
                break;

            default:
                throw new ArgumentException("Invalid expiry type");
        }
    }

}
