using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class DashboardCard
    {
        public int Id { get; set; }
        // Identificador estable usado por el frontend para decidir si renderiza esta tarjeta
        // en /dashboard. Nunca se expone para edición.
        public string Key { get; set; } = string.Empty;
        // Agrupa la tarjeta bajo una pestaña del dashboard (ej. "tab1" = riesgos propios,
        // "tab2" = visión global de empresas).
        public string TabKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        // Interruptor maestro de plataforma: si es false, nadie ve la tarjeta.
        public bool IsEnabled { get; set; } = true;

        // Navigation properties (many-to-many implícito)
        public ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
