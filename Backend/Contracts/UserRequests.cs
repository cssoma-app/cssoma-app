using System;
using System.Collections.Generic;

namespace BackendAPI.Contracts
{
    public class CreateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public Guid? TenantId { get; set; }
        public string? RoleKey { get; set; }
        // Sin especificar (null), el usuario arranca con todos los servicios que la empresa habilitó.
        public List<int>? ServiceIds { get; set; }
        // Sin especificar (null), el usuario arranca con todas las tarjetas que la empresa habilitó.
        public List<int>? DashboardCardIds { get; set; }
    }

    public class UpdateUserRequest
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? RoleKey { get; set; }
        // Null = no tocar la selección de servicios actual. Lista (incluso vacía) = reemplazarla.
        public List<int>? ServiceIds { get; set; }
        // Null = no tocar la selección de tarjetas actual. Lista (incluso vacía) = reemplazarla.
        public List<int>? DashboardCardIds { get; set; }
    }
}
