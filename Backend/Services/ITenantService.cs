using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Services
{
    public interface ITenantService
    {
        Task<ServiceResult<List<TenantListItemDto>>> GetTenantsAsync();
        Task<ServiceResult> CreateTenantAsync(CreateTenantInput input);
        Task<ServiceResult> UpdateTenantAsync(Guid id, UpdateTenantInput input);
        Task<ServiceResult> DeleteTenantAsync(Guid id);
        Task<ServiceResult> ToggleActiveAsync(Guid id);
        Task<ServiceResult> ResendWelcomeAsync(Guid id);
    }

    public class TenantListItemDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        public string DigitoVerificacion { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int UsersCount { get; set; }
        public int EmployeesCount { get; set; }
        public int DocumentsCount { get; set; }
        public string AdminEmail { get; set; } = string.Empty;
        public bool IsAdminTemporary { get; set; }
        public List<int> ServiceIds { get; set; } = new();
        public List<int> DashboardCardIds { get; set; } = new();
        public string Ciiu { get; set; } = string.Empty;
        public int NumeroTrabajadores { get; set; }
        public int CentrosTrabajo { get; set; }
        public string ClaseRiesgo { get; set; } = string.Empty;
        public string Arl { get; set; } = string.Empty;
        public string ResponsableSst { get; set; } = string.Empty;
        public bool TieneCopasst { get; set; }
        public bool TieneComiteConvivencia { get; set; }
        public bool TieneBrigada { get; set; }
        public bool TieneContratistas { get; set; }
    }

    public class CreateTenantInput
    {
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        public string DigitoVerificacion { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
        public List<int>? ServiceIds { get; set; }
        public List<int>? DashboardCardIds { get; set; }
        public string Ciiu { get; set; } = string.Empty;
        public int NumeroTrabajadores { get; set; }
        public int CentrosTrabajo { get; set; }
        public string ClaseRiesgo { get; set; } = string.Empty;
        public string Arl { get; set; } = string.Empty;
        public string ResponsableSst { get; set; } = string.Empty;
        public bool TieneCopasst { get; set; }
        public bool TieneComiteConvivencia { get; set; }
        public bool TieneBrigada { get; set; }
        public bool TieneContratistas { get; set; }
    }

    public class UpdateTenantInput
    {
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        public string DigitoVerificacion { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public List<int>? ServiceIds { get; set; }
        public List<int>? DashboardCardIds { get; set; }
        public string Ciiu { get; set; } = string.Empty;
        public int NumeroTrabajadores { get; set; }
        public int CentrosTrabajo { get; set; }
        public string ClaseRiesgo { get; set; } = string.Empty;
        public string Arl { get; set; } = string.Empty;
        public string ResponsableSst { get; set; } = string.Empty;
        public bool TieneCopasst { get; set; }
        public bool TieneComiteConvivencia { get; set; }
        public bool TieneBrigada { get; set; }
        public bool TieneContratistas { get; set; }
    }
}
