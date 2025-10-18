using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace LinkExpiry.API.Models.Entities;

/// <summary>
/// Click entity representing analytics data for each link access
/// </summary>
[Table("clicks")]
public class Click
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("link_id")]
    public Guid LinkId { get; set; }

    [Column("clicked_at")]
    public DateTime ClickedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(64)]
    [Column("ip_hash")]
    public string? IpHash { get; set; }

    [Column("user_agent")]
    public string? UserAgent { get; set; }

    [Column("referrer")]
    public string? Referrer { get; set; }

    [MaxLength(2)]
    [Column("country_code")]
    public string? CountryCode { get; set; }

    [MaxLength(100)]
    [Column("country_name")]
    public string? CountryName { get; set; }

    [MaxLength(100)]
    [Column("city")]
    public string? City { get; set; }

    [MaxLength(100)]
    [Column("region")]
    public string? Region { get; set; }

    [MaxLength(20)]
    [Column("device_type")]
    public string? DeviceType { get; set; }

    [MaxLength(50)]
    [Column("browser")]
    public string? Browser { get; set; }

    // Navigation property
    [ForeignKey("LinkId")]
    public virtual Link Link { get; set; } = null!;
}
