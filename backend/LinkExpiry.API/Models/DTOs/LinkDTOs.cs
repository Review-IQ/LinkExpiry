using System.ComponentModel.DataAnnotations;

namespace LinkExpiry.API.Models.DTOs;

/// <summary>
/// Request model for creating a new link
/// </summary>
public class CreateLinkRequest
{
    [Required(ErrorMessage = "Original URL is required")]
    [Url(ErrorMessage = "Invalid URL format")]
    [MaxLength(2000)]
    public string OriginalUrl { get; set; } = string.Empty;

    [MaxLength(255)]
    public string? Title { get; set; }

    [Required(ErrorMessage = "Expiry type is required")]
    [RegularExpression("^(TIME|VIEWS|BOTH|NONE)$", ErrorMessage = "Invalid expiry type")]
    public string ExpiryType { get; set; } = "NONE";

    public DateTime? ExpiresAt { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Max views must be at least 1")]
    public int? MaxViews { get; set; }

    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public string? Password { get; set; }

    [MaxLength(500)]
    public string? CustomMessage { get; set; }
}

/// <summary>
/// Request model for updating a link
/// </summary>
public class UpdateLinkRequest
{
    [MaxLength(255)]
    public string? Title { get; set; }

    [MaxLength(500)]
    public string? CustomMessage { get; set; }

    public bool? IsActive { get; set; }
}

/// <summary>
/// Response model for link operations
/// </summary>
public class LinkResponse
{
    public Guid Id { get; set; }
    public string ShortCode { get; set; } = string.Empty;
    public string ShortUrl { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public string? Title { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ExpiresAt { get; set; }
    public int? MaxViews { get; set; }
    public int CurrentViews { get; set; }
    public int TotalClicks { get; set; }
    public bool IsActive { get; set; }
    public string ExpiryType { get; set; } = string.Empty;
    public bool HasPassword { get; set; }
    public string? CustomMessage { get; set; }
    public string Status { get; set; } = string.Empty;
}

/// <summary>
/// Response model for paginated link list
/// </summary>
public class PaginatedLinksResponse
{
    public List<LinkResponse> Links { get; set; } = new();
    public int TotalCount { get; set; }
    public int PageNumber { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
    public bool HasNextPage { get; set; }
    public bool HasPreviousPage { get; set; }
}

/// <summary>
/// Request model for link password verification
/// </summary>
public class VerifyLinkPasswordRequest
{
    [Required]
    public string Password { get; set; } = string.Empty;
}
