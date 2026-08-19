using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.EntityFrameworkCore;
using System;

namespace BackendAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly ICurrentUserService? _currentUserService;

        public ApplicationDbContext(
            DbContextOptions<ApplicationDbContext> options,
            ICurrentUserService? currentUserService = null) : base(options)
        {
            _currentUserService = currentUserService;
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<SassService> SassServices { get; set; }
        public DbSet<DashboardCard> DashboardCards { get; set; }
        public DbSet<Alert> Alerts { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes
            modelBuilder.Entity<User>().HasIndex(u => u.SupabaseAuthId).IsUnique();
            modelBuilder.Entity<User>().HasIndex(u => new { u.TenantId, u.IsDisabled });
            modelBuilder.Entity<Role>().HasIndex(r => r.Key).IsUnique();
            modelBuilder.Entity<Document>().HasIndex(d => new { d.TenantId, d.ExpirationDate });
            modelBuilder.Entity<SassService>().HasIndex(s => s.Key).IsUnique();
            modelBuilder.Entity<DashboardCard>().HasIndex(d => d.Key).IsUnique();
            modelBuilder.Entity<Alert>().HasIndex(a => new { a.RecipientUserId, a.IsAccepted });

            // Relaciones
            modelBuilder.Entity<User>()
                .HasOne(u => u.Role)
                .WithMany(r => r.Users)
                .HasForeignKey(u => u.RoleId)
                .OnDelete(DeleteBehavior.Restrict);

            // Many-to-many: servicios/menús habilitados por empresa y por usuario.
            modelBuilder.Entity<Tenant>()
                .HasMany(t => t.EnabledServices)
                .WithMany(s => s.Tenants)
                .UsingEntity(j => j.ToTable("TenantServices"));

            modelBuilder.Entity<User>()
                .HasMany(u => u.EnabledServices)
                .WithMany(s => s.Users)
                .UsingEntity(j => j.ToTable("UserServices"));

            // Many-to-many: tarjetas del dashboard habilitadas por empresa y por usuario.
            modelBuilder.Entity<Tenant>()
                .HasMany(t => t.EnabledDashboardCards)
                .WithMany(c => c.Tenants)
                .UsingEntity(j => j.ToTable("TenantDashboardCards"));

            modelBuilder.Entity<User>()
                .HasMany(u => u.EnabledDashboardCards)
                .WithMany(c => c.Users)
                .UsingEntity(j => j.ToTable("UserDashboardCards"));

            // Alertas: un usuario (destinatario) tiene muchas; se borran en cascada con el usuario.
            modelBuilder.Entity<Alert>()
                .HasOne(a => a.Recipient)
                .WithMany(u => u.Alerts)
                .HasForeignKey(a => a.RecipientUserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Global Query Filters (se evalúan en tiempo de ejecución por petición)
            modelBuilder.Entity<User>().HasQueryFilter(u => 
                (_currentUserService != null && _currentUserService.IsSuperAdmin) || 
                u.TenantId == (_currentUserService != null ? _currentUserService.TenantId : null));

            modelBuilder.Entity<Employee>().HasQueryFilter(e => 
                (_currentUserService != null && _currentUserService.IsSuperAdmin) || 
                e.TenantId == (_currentUserService != null && _currentUserService.TenantId.HasValue ? _currentUserService.TenantId.Value : Guid.Empty));

            modelBuilder.Entity<Document>().HasQueryFilter(d =>
                (_currentUserService != null && _currentUserService.IsSuperAdmin) ||
                d.TenantId == (_currentUserService != null && _currentUserService.TenantId.HasValue ? _currentUserService.TenantId.Value : Guid.Empty));

            modelBuilder.Entity<Alert>().HasQueryFilter(a =>
                (_currentUserService != null && _currentUserService.IsSuperAdmin) ||
                a.TenantId == (_currentUserService != null && _currentUserService.TenantId.HasValue ? _currentUserService.TenantId.Value : Guid.Empty));
        }
    }
}
