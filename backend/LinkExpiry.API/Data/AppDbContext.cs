using LinkExpiry.API.Models.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace LinkExpiry.API.Data;

/// <summary>
/// Application database context for LinkExpiry
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Link> Links { get; set; }
    public DbSet<Click> Clicks { get; set; }
    public DbSet<ExpiryPage> ExpiryPages { get; set; }
    public DbSet<ExpiryPageEmail> ExpiryPageEmails { get; set; }

    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        // Configure all DateTime properties to use UTC for PostgreSQL compatibility
        configurationBuilder.Properties<DateTime>()
            .HaveConversion<UtcDateTimeConverter>();

        configurationBuilder.Properties<DateTime?>()
            .HaveConversion<UtcNullableDateTimeConverter>();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User entity configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
        });

        // Link entity configuration
        modelBuilder.Entity<Link>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ShortCode).IsUnique();
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt).HasFilter("is_active = true");
            entity.HasIndex(e => new { e.IsActive, e.ExpiresAt, e.CurrentViews, e.MaxViews });

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Links)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Click entity configuration
        modelBuilder.Entity<Click>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.LinkId);
            entity.HasIndex(e => e.ClickedAt);

            entity.Property(e => e.ClickedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.Link)
                .WithMany(l => l.Clicks)
                .HasForeignKey(e => e.LinkId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ExpiryPage entity configuration
        modelBuilder.Entity<ExpiryPage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId);

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.UpdatedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.User)
                .WithMany(u => u.ExpiryPages)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ExpiryPageEmail entity configuration
        modelBuilder.Entity<ExpiryPageEmail>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.ExpiryPageId);
            entity.HasIndex(e => e.LinkId).HasFilter("link_id IS NOT NULL");
            entity.HasIndex(e => e.CapturedAt);

            entity.Property(e => e.CapturedAt).HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.HasOne(e => e.ExpiryPage)
                .WithMany(ep => ep.EmailCaptures)
                .HasForeignKey(e => e.ExpiryPageId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Link)
                .WithMany()
                .HasForeignKey(e => e.LinkId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }

    /// <summary>
    /// Calls the PostgreSQL function to increment link view count atomically
    /// </summary>
    public async Task<LinkViewResult?> IncrementLinkViewAsync(string shortCode)
    {
        var result = await Links
            .FromSqlRaw("SELECT * FROM increment_link_view({0})", shortCode)
            .Select(l => new LinkViewResult
            {
                IsValid = l.IsActive,
                OriginalUrl = l.OriginalUrl,
                RequiresPassword = !string.IsNullOrEmpty(l.PasswordHash),
                CustomMessage = l.CustomMessage
            })
            .FirstOrDefaultAsync();

        return result;
    }
}

/// <summary>
/// Result from increment_link_view database function
/// </summary>
public class LinkViewResult
{
    public bool IsValid { get; set; }
    public string OriginalUrl { get; set; } = string.Empty;
    public bool RequiresPassword { get; set; }
    public string? CustomMessage { get; set; }
}

/// <summary>
/// Converts DateTime to UTC for PostgreSQL timestamp with time zone compatibility
/// </summary>
public class UtcDateTimeConverter : ValueConverter<DateTime, DateTime>
{
    public UtcDateTimeConverter() : base(
        // Convert to UTC when writing to database
        v => v.Kind == DateTimeKind.Utc ? v : DateTime.SpecifyKind(v, DateTimeKind.Utc),
        // Ensure UTC when reading from database
        v => DateTime.SpecifyKind(v, DateTimeKind.Utc))
    {
    }
}

/// <summary>
/// Converts nullable DateTime to UTC for PostgreSQL timestamp with time zone compatibility
/// </summary>
public class UtcNullableDateTimeConverter : ValueConverter<DateTime?, DateTime?>
{
    public UtcNullableDateTimeConverter() : base(
        // Convert to UTC when writing to database
        v => v.HasValue ? (v.Value.Kind == DateTimeKind.Utc ? v.Value : DateTime.SpecifyKind(v.Value, DateTimeKind.Utc)) : v,
        // Ensure UTC when reading from database
        v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v)
    {
    }
}
