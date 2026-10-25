using System;
using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class User
    {
        public Guid Id { get; set; }
        public Guid? TenantId { get; set; } // Nullable: SuperAdmin normalmente pertenece al tenant propietario de la plataforma, pero no se exige
        public string SupabaseAuthId { get; set; } = string.Empty;
        public Guid RoleId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public bool IsTemporaryPassword { get; set; } = false;
        public bool IsDisabled { get; set; } = false;
        public DateTime? LastLoginAt { get; set; }
        public int FailedLoginAttempts { get; set; } = 0;
        public DateTime? LockedUntil { get; set; }

        // Navigation properties
        public Tenant? Tenant { get; set; }
        public Role? Role { get; set; }
        // Servicios/menús habilitados para este usuario en particular, siempre subconjunto de
        // Tenant.EnabledServices (ver UsersController). Ignorado para SuperAdmin (siempre ve todo).
        public ICollection<SassService> EnabledServices { get; set; } = new List<SassService>();
        // Tarjetas del dashboard habilitadas para este usuario en particular, siempre subconjunto
        // de Tenant.EnabledDashboardCards. Ignorado para SuperAdmin (siempre ve todo).
        public ICollection<DashboardCard> EnabledDashboardCards { get; set; } = new List<DashboardCard>();
        // Alertas recibidas por este usuario (ver AlertService).
        public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
    }
}
