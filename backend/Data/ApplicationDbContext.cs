using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;
using System;

namespace BackendAPI.Data
{
    public class ApplicationDbContext : DbContext
    {
        private readonly Guid? _currentTenantId;
        private readonly bool _isSuperAdmin;

        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
            // For now, these are null/false. In a real scenario, they would be injected via an ITenantService or IHttpContextAccessor.
            _currentTenantId = null; 
            _isSuperAdmin = true; // Set true for initial migrations to bypass filters, or allow migrations regardless.
        }

        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Document> Documents { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Indexes
            modelBuilder.Entity<User>().HasIndex(u => u.SupabaseAuthId).IsUnique();
            modelBuilder.Entity<Document>().HasIndex(d => new { d.TenantId, d.ExpirationDate });

            // Global Query Filters
            modelBuilder.Entity<User>().HasQueryFilter(u => _isSuperAdmin || u.TenantId == _currentTenantId);
            modelBuilder.Entity<Employee>().HasQueryFilter(e => _isSuperAdmin || e.TenantId == _currentTenantId);
            modelBuilder.Entity<Document>().HasQueryFilter(d => _isSuperAdmin || d.TenantId == _currentTenantId);
        }
    }
}
