using System;
using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    // Controller delgado: toda la lógica de negocio vive en ITenantService (Regla 2, AGENTS.md).
    // Habilitado también para Admin: solo el Admin del tenant propietario de la plataforma pasa
    // el guard interno del service; un Admin de cualquier otra empresa cliente queda en 403.
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ApiController]
    [Route("api/tenants")]
    public class TenantsController : ControllerBase
    {
        private readonly ITenantService _tenantService;

        public TenantsController(ITenantService tenantService)
        {
            _tenantService = tenantService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTenants()
        {
            var result = await _tenantService.GetTenantsAsync();
            return this.ToActionResult(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
        {
            var result = await _tenantService.CreateTenantAsync(new CreateTenantInput
            {
                Name = request?.Name ?? string.Empty,
                RazonSocial = request?.RazonSocial ?? string.Empty,
                NitRuc = request?.NitRuc ?? string.Empty,
                Direccion = request?.Direccion ?? string.Empty,
                Telefono = request?.Telefono ?? string.Empty,
                AdminEmail = request?.AdminEmail ?? string.Empty,
                ServiceIds = request?.ServiceIds,
                DashboardCardIds = request?.DashboardCardIds
            });
            return this.ToActionResult(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantRequest request)
        {
            var result = await _tenantService.UpdateTenantAsync(id, new UpdateTenantInput
            {
                Name = request?.Name ?? string.Empty,
                RazonSocial = request?.RazonSocial ?? string.Empty,
                NitRuc = request?.NitRuc ?? string.Empty,
                Direccion = request?.Direccion ?? string.Empty,
                Telefono = request?.Telefono ?? string.Empty,
                ServiceIds = request?.ServiceIds,
                DashboardCardIds = request?.DashboardCardIds
            });
            return this.ToActionResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(Guid id)
        {
            var result = await _tenantService.DeleteTenantAsync(id);
            return this.ToActionResult(result);
        }

        [HttpPost("toggle-active/{id}")]
        public async Task<IActionResult> ToggleActive(Guid id)
        {
            var result = await _tenantService.ToggleActiveAsync(id);
            return this.ToActionResult(result);
        }

        [HttpPost("resend-welcome/{id}")]
        public async Task<IActionResult> ResendWelcome(Guid id)
        {
            var result = await _tenantService.ResendWelcomeAsync(id);
            return this.ToActionResult(result);
        }
    }
}
