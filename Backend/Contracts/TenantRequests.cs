using System.Collections.Generic;

namespace BackendAPI.Contracts
{
    public class CreateTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        // Sin especificar (null o vacío), la empresa arranca con todos los servicios habilitados.
        public List<int>? ServiceIds { get; set; }
        // Sin especificar (null o vacío), la empresa arranca con todas las tarjetas habilitadas.
        public List<int>? DashboardCardIds { get; set; }
    }

    public class UpdateTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        // Null = no tocar la selección de servicios actual. Lista (incluso vacía) = reemplazarla.
        public List<int>? ServiceIds { get; set; }
        // Null = no tocar la selección de tarjetas actual. Lista (incluso vacía) = reemplazarla.
        public List<int>? DashboardCardIds { get; set; }
    }
}
