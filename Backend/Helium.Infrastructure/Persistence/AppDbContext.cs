using Helium.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Helium.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<FuelEntry> FuelEntries => Set<FuelEntry>();
    public DbSet<ChargingEntry> ChargingEntries => Set<ChargingEntry>();
    public DbSet<MaintenanceRecord> MaintenanceRecords => Set<MaintenanceRecord>();
    public DbSet<MaintenanceReminder> MaintenanceReminders => Set<MaintenanceReminder>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(200);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PreferredCurrency).HasMaxLength(10);
            entity.HasMany(u => u.Vehicles).WithOne(v => v.User).HasForeignKey(v => v.UserId);
        });

        modelBuilder.Entity<Vehicle>(entity =>
        {
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Name).IsRequired().HasMaxLength(100);
            entity.Property(v => v.Make).IsRequired().HasMaxLength(100);
            entity.Property(v => v.Model).IsRequired().HasMaxLength(100);
            entity.Property(v => v.Vin).HasMaxLength(50);
            entity.HasMany(v => v.FuelEntries).WithOne(f => f.Vehicle).HasForeignKey(f => f.VehicleId);
            entity.HasMany(v => v.ChargingEntries).WithOne(c => c.Vehicle).HasForeignKey(c => c.VehicleId);
            entity.HasMany(v => v.MaintenanceRecords).WithOne(m => m.Vehicle).HasForeignKey(m => m.VehicleId);
        });

        modelBuilder.Entity<FuelEntry>(entity =>
        {
            entity.HasKey(f => f.Id);
            entity.Property(f => f.FuelStationName).HasMaxLength(200);
            entity.HasOne(f => f.User).WithMany().HasForeignKey(f => f.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<ChargingEntry>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.ChargingLocation).HasMaxLength(200);
            entity.HasOne(c => c.User).WithMany().HasForeignKey(c => c.UserId).OnDelete(DeleteBehavior.NoAction);
        });

        modelBuilder.Entity<MaintenanceRecord>(entity =>
        {
            entity.HasKey(m => m.Id);
            entity.Property(m => m.MaintenanceType).IsRequired().HasMaxLength(200);
            entity.Property(m => m.Cost).HasColumnType("decimal(18,2)");
            entity.Property(m => m.GarageName).HasMaxLength(200);
            entity.Property(m => m.MechanicName).HasMaxLength(200);
            entity.HasOne(m => m.User).WithMany().HasForeignKey(m => m.UserId).OnDelete(DeleteBehavior.NoAction);
            entity.HasOne(m => m.Reminder)
                .WithOne(r => r.MaintenanceRecord)
                .HasForeignKey<MaintenanceReminder>(r => r.MaintenanceRecordId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MaintenanceReminder>(entity =>
        {
            entity.HasKey(r => r.Id);
        });
    }
}
