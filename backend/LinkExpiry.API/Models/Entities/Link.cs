using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LinkExpiry.API.Models.Entities;

/// <summary>
/// Link entity representing a shortened link with expiry conditions
/// </summary>
[Table("links")]
public class Link
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(10)]
    [Column("short_code")]
    public string ShortCode { get; set; } = string.Empty;

    [Required]
    [Column("original_url")]
    public string OriginalUrl { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("expires_at")]
    public DateTime? ExpiresAt { get; set; }

    [Column("max_views")]
    public int? MaxViews { get; set; }

    [Column("current_views")]
    public int CurrentViews { get; set; } = 0;

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    [Required]
    [MaxLength(10)]
    [Column("expiry_type")]
    public string ExpiryType { get; set; } = "NONE";

    [MaxLength(255)]
    [Column("password_hash")]
    public string? PasswordHash { get; set; }

    [Column("custom_message")]
    public string? CustomMessage { get; set; }

    [MaxLength(255)]
    [Column("title")]
    public string? Title { get; set; }

    [Column("total_clicks")]
    public int TotalClicks { get; set; } = 0;

    // Navigation properties
    [ForeignKey("UserId")]
    public virtual User User { get; set; } = null!;

    public virtual ICollection<Click> Clicks { get; set; } = new List<Click>();
}

/// <summary>
/// Expiry type enumeration
/// </summary>
public static class ExpiryType
{
    public const string Time = "TIME";
    public const string Views = "VIEWS";
    public const string Both = "BOTH";
    public const string None = "NONE";
}
