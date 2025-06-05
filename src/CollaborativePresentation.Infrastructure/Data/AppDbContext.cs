using Microsoft.EntityFrameworkCore;
using CollaborativePresentation.Core.Entities;

namespace CollaborativePresentation.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Presentation> Presentations { get; set; }
    public DbSet<Slide> Slides { get; set; }
    public DbSet<Element> Elements { get; set; }
    public DbSet<ActiveUser> ActiveUsers { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Presentation>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title)
                .IsRequired()
                .HasMaxLength(200);
            entity.Property(e => e.CreatorNickname)
                .IsRequired()
                .HasMaxLength(50);
            entity.HasIndex(e => e.Title);
            entity.HasIndex(e => e.IsActive);
            
            entity.HasMany(e => e.Slides)
                .WithOne(s => s.Presentation)
                .HasForeignKey(s => s.PresentationId)
                .OnDelete(DeleteBehavior.Cascade);
            
            entity.HasMany(e => e.ActiveUsers)
                .WithOne(u => u.Presentation)
                .HasForeignKey(u => u.PresentationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Slide>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Order).IsRequired();
            entity.Property(e => e.BackgroundColor)
                .HasMaxLength(7); // #FFFFFF
            entity.Property(e => e.BackgroundImage)
                .HasMaxLength(500);
            entity.HasIndex(e => new { e.PresentationId, e.Order });
            
            entity.HasMany(e => e.Elements)
                .WithOne(el => el.Slide)
                .HasForeignKey(el => el.SlideId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Element>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Type).IsRequired();
            entity.Property(e => e.Content)
                .IsRequired()
                .HasMaxLength(5000);
            entity.Property(e => e.Properties)
                .HasMaxLength(2000);
            entity.HasIndex(e => e.SlideId);
            entity.HasIndex(e => new { e.SlideId, e.ZIndex });
        });

        modelBuilder.Entity<ActiveUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Nickname)
                .IsRequired()
                .HasMaxLength(50);
            entity.Property(e => e.ConnectionId)
                .IsRequired()
                .HasMaxLength(100);
            entity.Property(e => e.Role).IsRequired();
            entity.HasIndex(e => e.ConnectionId).IsUnique();
            entity.HasIndex(e => new { e.PresentationId, e.Nickname });
            entity.HasIndex(e => e.IsConnected);
        });

        modelBuilder.Entity<Element>()
            .Property(e => e.Type)
            .HasConversion<string>();
        
        modelBuilder.Entity<ActiveUser>()
            .Property(e => e.Role)
            .HasConversion<string>();
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        return base.SaveChanges();
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && 
                       (e.State == EntityState.Added || e.State == EntityState.Modified));

        foreach (var entry in entries)
        {
            var entity = (BaseEntity)entry.Entity;
            entity.UpdatedAt = DateTime.UtcNow;

            if (entry.State == EntityState.Added)
            {
                entity.CreatedAt = DateTime.UtcNow;
            }
        }
    }
}