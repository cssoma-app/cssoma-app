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
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<SassService> SassServices { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes
            modelBuilder.Entity<User>().HasIndex(u => u.SupabaseAuthId).IsUnique();
            modelBuilder.Entity<Document>().HasIndex(d => new { d.TenantId, d.ExpirationDate });

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
        }
    }
}
