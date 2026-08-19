using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    // Regla 2, AGENTS.md: toda la lógica de negocio vive aquí, no en el controller.
    public class ServicesService : IServicesService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public ServicesService(ApplicationDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        // SuperAdmin o Admin del tenant propietario de la plataforma: mismo criterio que
        // TenantService/UserService (ver CanManageTenants/HasBroadAccess) para las pantallas
        // de configuración global de la plataforma.
        private bool HasBroadAccess()
        {
            return _currentUserService.IsSuperAdmin ||
                   (_currentUserService.IsAdmin && _currentUserService.IsPlatformOwnerTenant);
        }

        public async Task<ServiceResult<List<SassService>>> GetAllServicesAsync()
        {
            if (!HasBroadAccess())
            {
                return ServiceResult<List<SassService>>.Forbidden();
            }

            var services = await _dbContext.SassServices
                .OrderBy(s => s.Id)
                .ToListAsync();

            return ServiceResult<List<SassService>>.Ok(services);
        }

        public async Task<ServiceResult<SassService>> ToggleServiceAsync(int id)
        {
            if (!HasBroadAccess())
            {
                return ServiceResult<SassService>.Forbidden();
            }

            var service = await _dbContext.SassServices.FindAsync(id);
            if (service == null)
            {
                return ServiceResult<SassService>.NotFound("Servicio no encontrado.");
            }

            service.IsEnabled = !service.IsEnabled;
            await _dbContext.SaveChangesAsync();

            return ServiceResult<SassService>.Ok(service, $"Servicio '{service.Name}' {(service.IsEnabled ? "habilitado" : "deshabilitado")} exitosamente.");
        }
    }
}
