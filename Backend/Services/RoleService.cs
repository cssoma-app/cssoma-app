using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Helpers;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    // Catálogo de roles: configuración a nivel de plataforma (no de un tenant puntual),
    // por lo que solo SuperAdmin o el Admin del tenant propietario pueden gestionarlo
    // (ver CanManageRoles, misma regla que TenantService).
    public class RoleService : IRoleService
    {
        private const string RoleInUseMessage = "No se puede eliminar/editar este rol porque hay un usuario asociado, primero cambie el rol del usuario para proceder.";

        private readonly ApplicationDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public RoleService(ApplicationDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        private bool CanManageRoles()
        {
            return _currentUserService.IsSuperAdmin ||
                   (_currentUserService.IsAdmin && _currentUserService.IsPlatformOwnerTenant);
        }

        public async Task<ServiceResult<List<RoleDto>>> GetRolesAsync()
        {
            if (!CanManageRoles())
            {
                return ServiceResult<List<RoleDto>>.Forbidden();
            }

            var roles = await _dbContext.Roles
                .Select(r => new RoleDto
                {
                    Id = r.Id,
                    Key = r.Key,
                    DisplayName = r.DisplayName,
                    IsSystemRole = r.IsSystemRole,
                    UsersCount = r.Users.Count
                })
                .OrderBy(r => r.DisplayName)
                .ToListAsync();

            return ServiceResult<List<RoleDto>>.Ok(roles);
        }

        public async Task<ServiceResult> CreateRoleAsync(string displayName)
        {
            if (!CanManageRoles())
            {
                return ServiceResult.Forbidden();
            }

            if (string.IsNullOrWhiteSpace(displayName))
            {
                return ServiceResult.BadRequest("El nombre del rol es requerido.");
            }

            var nameCleaned = InputSanitizer.SanitizeText(displayName);
            if (string.IsNullOrWhiteSpace(nameCleaned))
            {
                return ServiceResult.BadRequest("El nombre del rol es requerido.");
            }

            var exists = await _dbContext.Roles.AnyAsync(r => r.DisplayName.ToLower() == nameCleaned.ToLower());
            if (exists)
            {
                return ServiceResult.BadRequest("Ya existe un rol con este nombre.");
            }

            var role = new Role
            {
                Id = Guid.NewGuid(),
                Key = nameCleaned,
                DisplayName = nameCleaned,
                IsSystemRole = false
            };

            _dbContext.Roles.Add(role);
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Rol creado con éxito.");
        }

        public async Task<ServiceResult> UpdateRoleAsync(Guid id, string displayName)
        {
            if (!CanManageRoles())
            {
                return ServiceResult.Forbidden();
            }

            if (string.IsNullOrWhiteSpace(displayName))
            {
                return ServiceResult.BadRequest("El nombre del rol es requerido.");
            }

            var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Id == id);
            if (role == null)
            {
                return ServiceResult.NotFound("Rol no encontrado.");
            }

            // Renombrar (DisplayName) es seguro incluso para roles del sistema o con usuarios
            // asignados — el "Key" interno (referenciado por [Authorize] y RoleKeys) no cambia.
            var nameCleaned = InputSanitizer.SanitizeText(displayName);
            if (string.IsNullOrWhiteSpace(nameCleaned))
            {
                return ServiceResult.BadRequest("El nombre del rol es requerido.");
            }

            var exists = await _dbContext.Roles.AnyAsync(r => r.DisplayName.ToLower() == nameCleaned.ToLower() && r.Id != id);
            if (exists)
            {
                return ServiceResult.BadRequest("Ya existe un rol con este nombre.");
            }

            role.DisplayName = nameCleaned;
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Rol actualizado con éxito.");
        }

        public async Task<ServiceResult> DeleteRoleAsync(Guid id)
        {
            if (!CanManageRoles())
            {
                return ServiceResult.Forbidden();
            }

            var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Id == id);
            if (role == null)
            {
                return ServiceResult.NotFound("Rol no encontrado.");
            }

            if (role.IsSystemRole)
            {
                return ServiceResult.BadRequest("No se puede eliminar un rol del sistema.");
            }

            var hasUsers = await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.RoleId == id);
            if (hasUsers)
            {
                return ServiceResult.BadRequest(RoleInUseMessage);
            }

            _dbContext.Roles.Remove(role);
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Rol eliminado con éxito.");
        }
    }
}
