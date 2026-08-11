using System;

namespace BackendAPI.Models
{
    public class Document
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string FileUrl { get; set; } = string.Empty;
        public DateTime? ExpirationDate { get; set; }
        public DocStatus Status { get; set; }
        public DocType Type { get; set; }

        // Navigation property
        public Tenant? Tenant { get; set; }
    }
}
