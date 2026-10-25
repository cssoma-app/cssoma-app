using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class SassService
    {
        public int Id { get; set; }
        // Identificador estable usado por el frontend para mapear este servicio a un
        // ítem real del sidebar (ej. "users" -> /dashboard/users). Nunca se expone para edición.
        public string Key { get; set; } = string.Empty;
        // Agrupa el ítem bajo un submenú del sidebar (ej. "admin", "development"); null = ítem raíz.
        public string? ParentKey { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        // Interruptor maestro de plataforma: si es false, nadie lo ve (ni siquiera SuperAdmin lo necesita
        // ver deshabilitado globalmente, pero SuperAdmin igual conserva acceso pleno vía RBAC en su propia UI).
        public bool IsEnabled { get; set; } = true;

        // Navigation properties (many-to-many implícito)
        public ICollection<Tenant> Tenants { get; set; } = new List<Tenant>();
        public ICollection<User> Users { get; set; } = new List<User>();
    }
}
