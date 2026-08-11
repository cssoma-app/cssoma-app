using System;

namespace BackendAPI.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public Guid? TenantId { get; set; } // Nullable for SuperAdmins
        public string SupabaseAuthId { get; set; } = string.Empty;
        public UserRole Role { get; set; }
        public string Email { get; set; } = string.Empty;

        // Navigation property
        public Tenant? Tenant { get; set; }
    }
}
