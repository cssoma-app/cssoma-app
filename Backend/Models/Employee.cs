using System;

namespace BackendAPI.Models
{
    public class Employee
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;

        // Navigation property
        public Tenant? Tenant { get; set; }
    }
}
