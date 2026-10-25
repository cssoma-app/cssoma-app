using System;

namespace BackendAPI.Models
{
    public class Alert
    {
        public Guid Id { get; set; }
        // Tenant del destinatario, usado por el Global Query Filter (defensa en profundidad).
        public Guid? TenantId { get; set; }
        public Guid RecipientUserId { get; set; }
        // Sin navigation property a propósito: evita una segunda FK ambigua hacia Users
        // (RecipientUserId ya tiene su propia relación con User.Alerts).
        public Guid CreatedByUserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public bool IsAccepted { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? AcceptedAt { get; set; }

        public User? Recipient { get; set; }
    }
}
