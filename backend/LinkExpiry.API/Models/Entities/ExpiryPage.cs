using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LinkExpiry.API.Models.Entities;

/// <summary>
/// Custom expiry page entity for branded expired link pages
/// </summary>
[Table("expiry_pages")]
public class ExpiryPage
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    // Page content
    [Required]
    [MaxLength(200)]
    [Column("title")]
    public string Title { get; set; } = string.Empty;

    [Column("message")]
    public string? Message { get; set; }

    [MaxLength(500)]
    [Column("logo_url")]
    public string? LogoUrl { get; set; }

    [MaxLength(50)]
    [Column("background_color")]
    public string BackgroundColor { get; set; } = "#f3f4f6";

    // Call to action
    [MaxLength(50)]
    [Column("cta_button_text")]
    public string? CtaButtonText { get; set; }

    [MaxLength(500)]
    [Column("cta_button_url")]
    public string? CtaButtonUrl { get; set; }

    [MaxLength(50)]
    [Column("cta_button_color")]
    public string CtaButtonColor { get; set; } = "#4f46e5";

    // Social media links
    [MaxLength(255)]
    [Column("social_facebook")]
    public string? SocialFacebook { get; set; }

    [MaxLength(255)]
    [Column("social_twitter")]
    public string? SocialTwitter { get; set; }

    [MaxLength(255)]
    [Column("social_instagram")]
    public string? SocialInstagram { get; set; }

    [MaxLength(255)]
    [Column("social_linkedin")]
    public string? SocialLinkedin { get; set; }

    [MaxLength(255)]
    [Column("social_website")]
    public string? SocialWebsite { get; set; }

    // Advanced customization
    [Column("custom_css")]
    public string? CustomCss { get; set; }

    [Column("enable_email_capture")]
    public bool EnableEmailCapture { get; set; } = false;

    [MaxLength(200)]
    [Column("email_capture_text")]
    public string? EmailCaptureText { get; set; }

    // Metadata
    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    public virtual ICollection<Link> Links { get; set; } = new List<Link>();
    public virtual ICollection<ExpiryPageEmail> EmailCaptures { get; set; } = new List<ExpiryPageEmail>();
}
