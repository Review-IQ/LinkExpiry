using LinkExpiry.API.Models.DTOs;

namespace LinkExpiry.API.Services;

/// <summary>
/// Service interface for link management operations
/// </summary>
public interface ILinkService
{
    Task<LinkResponse> CreateLinkAsync(Guid userId, CreateLinkRequest request);
    Task<PaginatedLinksResponse> GetUserLinksAsync(Guid userId, int pageNumber = 1, int pageSize = 10, bool? activeOnly = null);
    Task<LinkResponse?> GetLinkByIdAsync(Guid linkId, Guid userId);
    Task<LinkResponse?> GetLinkByShortCodeAsync(string shortCode);
    Task<LinkResponse> UpdateLinkAsync(Guid linkId, Guid userId, UpdateLinkRequest request);
    Task<bool> DeleteLinkAsync(Guid linkId, Guid userId);
    Task<bool> ValidateLinkPasswordAsync(string shortCode, string password);
    Task<int> GetUserLinkCountThisMonthAsync(Guid userId);
    Task<bool> CheckUserCanCreateLinkAsync(Guid userId);
}
