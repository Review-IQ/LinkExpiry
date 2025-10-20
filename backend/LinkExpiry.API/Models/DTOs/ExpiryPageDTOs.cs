using System.ComponentModel.DataAnnotations;

namespace LinkExpiry.API.Models.DTOs;

/// <summary>
/// Request to create a new custom expiry page
/// </summary>
public class CreateExpiryPageRequest
{
    [Required(ErrorMessage = "Name is required")]
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Title is required")]
    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string Title { get; set; } = string.Empty;

    [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string? Message { get; set; }

    [MaxLength(500, ErrorMessage = "Logo URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Invalid logo URL format")]
    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$|^linear-gradient.*|^radial-gradient.*",
        ErrorMessage = "Invalid background color format")]
    public string BackgroundColor { get; set; } = "#f3f4f6";

    [MaxLength(50, ErrorMessage = "CTA button text cannot exceed 50 characters")]
    public string? CtaButtonText { get; set; }

    [MaxLength(500, ErrorMessage = "CTA button URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Invalid CTA button URL format")]
    public string? CtaButtonUrl { get; set; }

    [MaxLength(50)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Invalid button color format")]
    public string CtaButtonColor { get; set; } = "#4f46e5";

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid Facebook URL")]
    public string? SocialFacebook { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid Twitter URL")]
    public string? SocialTwitter { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid Instagram URL")]
    public string? SocialInstagram { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid LinkedIn URL")]
    public string? SocialLinkedin { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid website URL")]
    public string? SocialWebsite { get; set; }

    [MaxLength(5000, ErrorMessage = "Custom CSS cannot exceed 5000 characters")]
    public string? CustomCss { get; set; }

    public bool EnableEmailCapture { get; set; } = false;

    [MaxLength(200, ErrorMessage = "Email capture text cannot exceed 200 characters")]
    public string? EmailCaptureText { get; set; }
}

/// <summary>
/// Request to update an existing expiry page
/// </summary>
public class UpdateExpiryPageRequest
{
    [MaxLength(100, ErrorMessage = "Name cannot exceed 100 characters")]
    public string? Name { get; set; }

    [MaxLength(200, ErrorMessage = "Title cannot exceed 200 characters")]
    public string? Title { get; set; }

    [MaxLength(2000, ErrorMessage = "Message cannot exceed 2000 characters")]
    public string? Message { get; set; }

    [MaxLength(500, ErrorMessage = "Logo URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Invalid logo URL format")]
    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$|^linear-gradient.*|^radial-gradient.*",
        ErrorMessage = "Invalid background color format")]
    public string? BackgroundColor { get; set; }

    [MaxLength(50, ErrorMessage = "CTA button text cannot exceed 50 characters")]
    public string? CtaButtonText { get; set; }

    [MaxLength(500, ErrorMessage = "CTA button URL cannot exceed 500 characters")]
    [Url(ErrorMessage = "Invalid CTA button URL format")]
    public string? CtaButtonUrl { get; set; }

    [MaxLength(50)]
    [RegularExpression(@"^#[0-9A-Fa-f]{6}$", ErrorMessage = "Invalid button color format")]
    public string? CtaButtonColor { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid Facebook URL")]
    public string? SocialFacebook { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid Twitter URL")]
    public string? SocialTwitter { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid Instagram URL")]
    public string? SocialInstagram { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid LinkedIn URL")]
    public string? SocialLinkedin { get; set; }

    [MaxLength(255)]
    [Url(ErrorMessage = "Invalid website URL")]
    public string? SocialWebsite { get; set; }

    [MaxLength(5000, ErrorMessage = "Custom CSS cannot exceed 5000 characters")]
    public string? CustomCss { get; set; }

    public bool? EnableEmailCapture { get; set; }

    [MaxLength(200, ErrorMessage = "Email capture text cannot exceed 200 characters")]
    public string? EmailCaptureText { get; set; }
}

/// <summary>
/// Response containing expiry page details
/// </summary>
public class ExpiryPageResponse
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Message { get; set; }
    public string? LogoUrl { get; set; }
    public string BackgroundColor { get; set; } = "#f3f4f6";
    public string? CtaButtonText { get; set; }
    public string? CtaButtonUrl { get; set; }
    public string CtaButtonColor { get; set; } = "#4f46e5";
    public string? SocialFacebook { get; set; }
    public string? SocialTwitter { get; set; }
    public string? SocialInstagram { get; set; }
    public string? SocialLinkedin { get; set; }
    public string? SocialWebsite { get; set; }
    public string? CustomCss { get; set; }
    public bool EnableEmailCapture { get; set; }
    public string? EmailCaptureText { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int LinksUsingCount { get; set; } // Number of links using this template
    public int EmailsCaptured { get; set; } // Number of emails captured
}

/// <summary>
/// Request to capture email from expiry page
/// </summary>
public class CaptureEmailRequest
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;
}

/// <summary>
/// Response after email capture
/// </summary>
public class CaptureEmailResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}
