using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LinkExpiry.API.Models.Entities;

/// <summary>
/// Email capture entity for tracking emails collected from expired link pages
/// </summary>
[Table("expiry_page_emails")]
public class ExpiryPageEmail
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("expiry_page_id")]
    public Guid ExpiryPageId { get; set; }

    [Column("link_id")]
    public Guid? LinkId { get; set; }

    [Required]
    [MaxLength(255)]
    [Column("email")]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Column("captured_at")]
    public DateTime CapturedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(64)]
    [Column("ip_hash")]
    public string? IpHash { get; set; }

    [Column("user_agent")]
    public string? UserAgent { get; set; }

    // Navigation properties
    [ForeignKey("ExpiryPageId")]
    public virtual ExpiryPage ExpiryPage { get; set; } = null!;

    [ForeignKey("LinkId")]
    public virtual Link? Link { get; set; }
}
