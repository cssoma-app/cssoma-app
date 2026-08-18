using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Helpers;
using BackendAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    public class UserService : IUserService
    {
        private const int PageSize = 10;

        private readonly ApplicationDbContext _dbContext;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IEmailService _emailService;
        private readonly ICurrentUserService _currentUserService;

        public UserService(
            ApplicationDbContext dbContext,
            IPasswordHasher<User> passwordHasher,
            IEmailService emailService,
            ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
            _currentUserService = currentUserService;
        }

        // SuperAdmin o Admin del tenant propietario de la plataforma: mismo alcance que SuperAdmin
        // sobre usuarios de CUALQUIER empresa (crear/editar/reenviar/activar-desactivar). La única
        // excepción es Eliminar, que sigue exigiendo IsSuperAdmin puro cuando el objetivo es un Admin
        // (ver DeleteUserAsync) — un Admin de la plataforma no puede eliminar a otro Admin.
        private bool HasBroadAccess()
        {
            return _currentUserService.IsSuperAdmin ||
                   (_currentUserService.IsAdmin && _currentUserService.IsPlatformOwnerTenant);
        }

        public async Task<ServiceResult<List<AvailableServiceDto>>> GetAvailableServicesAsync(Guid? tenantId)
        {
            Guid effectiveTenantId;
            if (HasBroadAccess() && tenantId.HasValue)
            {
                effectiveTenantId = tenantId.Value;
            }
            else if (_currentUserService.TenantId.HasValue)
            {
                effectiveTenantId = _currentUserService.TenantId.Value;
            }
            else
            {
                return ServiceResult<List<AvailableServiceDto>>.Ok(new List<AvailableServiceDto>());
            }

            var services = await _dbContext.Tenants
                .Where(t => t.Id == effectiveTenantId)
                .SelectMany(t => t.EnabledServices)
                .Select(s => new AvailableServiceDto { Id = s.Id, Key = s.Key, ParentKey = s.ParentKey, Name = s.Name })
                .ToListAsync();

            return ServiceResult<List<AvailableServiceDto>>.Ok(services);
        }

        public async Task<ServiceResult<List<AvailableDashboardCardDto>>> GetAvailableDashboardCardsAsync(Guid? tenantId)
        {
            Guid effectiveTenantId;
            if (HasBroadAccess() && tenantId.HasValue)
            {
                effectiveTenantId = tenantId.Value;
            }
            else if (_currentUserService.TenantId.HasValue)
            {
                effectiveTenantId = _currentUserService.TenantId.Value;
            }
            else
            {
                return ServiceResult<List<AvailableDashboardCardDto>>.Ok(new List<AvailableDashboardCardDto>());
            }

            var cards = await _dbContext.Tenants
                .Where(t => t.Id == effectiveTenantId)
                .SelectMany(t => t.EnabledDashboardCards)
                .Select(c => new AvailableDashboardCardDto { Id = c.Id, Key = c.Key, TabKey = c.TabKey, Name = c.Name })
                .ToListAsync();

            return ServiceResult<List<AvailableDashboardCardDto>>.Ok(cards);
        }

        public async Task<ServiceResult<UserListResultDto>> GetUsersAsync(string? search, int page, Guid? tenantId)
        {
            if (page < 1) page = 1;

            var query = _dbContext.Users.IgnoreQueryFilters().Include(u => u.Role).Include(u => u.Tenant).AsQueryable();

            if (HasBroadAccess())
            {
                if (tenantId.HasValue)
                {
                    query = query.Where(u => u.TenantId == tenantId.Value);
                }
            }
            else
            {
                // Nunca se acepta el tenantId del cliente para un Admin regular: se fuerza su propia empresa.
                var ownTenantId = _currentUserService.TenantId;
                query = query.Where(u => u.TenantId == ownTenantId);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var searchCleaned = search.Trim().ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(searchCleaned) || u.Email.ToLower().Contains(searchCleaned));
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderBy(u => u.FullName)
                .Skip((page - 1) * PageSize)
                .Take(PageSize)
                .Select(u => new UserListItemDto
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    TenantId = u.TenantId,
                    TenantName = u.Tenant != null ? u.Tenant.Name : "Plataforma (Global)",
                    RoleKey = u.Role != null ? u.Role.Key : "",
                    RoleName = u.Role != null ? u.Role.DisplayName : "",
                    IsDisabled = u.IsDisabled,
                    IsTemporaryPassword = u.IsTemporaryPassword,
                    HasLoggedIn = u.LastLoginAt != null,
                    Status = u.IsDisabled ? "Inactivo" : (u.LastLoginAt != null ? "Activo" : "Inactivo"),
                    ServiceIds = u.EnabledServices.Select(s => s.Id).ToList(),
                    DashboardCardIds = u.EnabledDashboardCards.Select(c => c.Id).ToList()
                })
                .ToListAsync();

            return ServiceResult<UserListResultDto>.Ok(new UserListResultDto
            {
                Items = items,
                TotalCount = totalCount,
                Page = page,
                PageSize = PageSize
            });
        }

        public async Task<ServiceResult> CreateUserAsync(CreateUserInput input)
        {
            if (string.IsNullOrWhiteSpace(input.FullName) || string.IsNullOrWhiteSpace(input.Email))
            {
                return ServiceResult.BadRequest("El nombre y el correo electrónico son requeridos.");
            }

            var hasBroadAccess = HasBroadAccess();

            Guid targetTenantId;
            if (hasBroadAccess)
            {
                if (!input.TenantId.HasValue)
                {
                    return ServiceResult.BadRequest("Debes seleccionar una empresa para el nuevo usuario.");
                }
                targetTenantId = input.TenantId.Value;
            }
            else
            {
                if (!_currentUserService.TenantId.HasValue)
                {
                    return ServiceResult.Forbidden();
                }
                targetTenantId = _currentUserService.TenantId.Value;
            }

            var tenant = await _dbContext.Tenants.FindAsync(targetTenantId);
            if (tenant == null)
            {
                return ServiceResult.BadRequest("La empresa seleccionada no existe.");
            }

            // Un Admin regular solo puede crear colaboradores (Member), nunca otro Admin.
            var requestedRoleKey = hasBroadAccess ? (input.RoleKey ?? RoleKeys.Member).Trim() : RoleKeys.Member;
            if (requestedRoleKey != RoleKeys.Admin && requestedRoleKey != RoleKeys.Member)
            {
                return ServiceResult.BadRequest("Rol inválido.");
            }

            var role = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Key == requestedRoleKey);
            if (role == null)
            {
                return ServiceResult.BadRequest("Rol inválido.");
            }

            var emailCleaned = InputSanitizer.SanitizeEmail(input.Email);
            var nameCleaned = InputSanitizer.SanitizeText(input.FullName);

            if (string.IsNullOrWhiteSpace(emailCleaned) || string.IsNullOrWhiteSpace(nameCleaned))
            {
                return ServiceResult.BadRequest("El nombre y el correo electrónico son requeridos.");
            }

            var existsUser = await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == emailCleaned);
            if (existsUser)
            {
                return ServiceResult.BadRequest("El correo electrónico ya está registrado por otro usuario.");
            }

            // El usuario nunca puede tener un servicio que su empresa no tenga habilitado.
            var tenantServices = await _dbContext.Tenants
                .Where(t => t.Id == targetTenantId)
                .SelectMany(t => t.EnabledServices)
                .ToListAsync();

            List<SassService> userServices;
            if (input.ServiceIds != null)
            {
                var tenantServiceIds = tenantServices.Select(s => s.Id).ToHashSet();
                if (input.ServiceIds.Any(sid => !tenantServiceIds.Contains(sid)))
                {
                    return ServiceResult.BadRequest("Uno o más servicios seleccionados no están habilitados para esta empresa.");
                }
                userServices = tenantServices.Where(s => input.ServiceIds.Contains(s.Id)).ToList();
            }
            else
            {
                // Sin selección explícita, el usuario nuevo arranca con todo lo que la empresa habilitó.
                userServices = tenantServices;
            }

            // El usuario nunca puede ver una tarjeta del dashboard que su empresa no tenga habilitada.
            var tenantDashboardCards = await _dbContext.Tenants
                .Where(t => t.Id == targetTenantId)
                .SelectMany(t => t.EnabledDashboardCards)
                .ToListAsync();

            List<DashboardCard> userDashboardCards;
            if (input.DashboardCardIds != null)
            {
                var tenantCardIds = tenantDashboardCards.Select(c => c.Id).ToHashSet();
                if (input.DashboardCardIds.Any(cid => !tenantCardIds.Contains(cid)))
                {
                    return ServiceResult.BadRequest("Una o más tarjetas del dashboard seleccionadas no están habilitadas para esta empresa.");
                }
                userDashboardCards = tenantDashboardCards.Where(c => input.DashboardCardIds.Contains(c.Id)).ToList();
            }
            else
            {
                // Sin selección explícita, el usuario nuevo arranca con todo lo que la empresa habilitó.
                userDashboardCards = tenantDashboardCards;
            }

            var randomNum = new Random().Next(100, 999);
            var tempPassword = $"SSTerra{randomNum}!";

            var newUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = targetTenantId,
                Email = emailCleaned,
                FullName = nameCleaned,
                RoleId = role.Id,
                IsTemporaryPassword = true,
                SupabaseAuthId = "local-auth-" + Guid.NewGuid().ToString("N"),
                EnabledServices = userServices,
                EnabledDashboardCards = userDashboardCards
            };

            newUser.PasswordHash = _passwordHasher.HashPassword(newUser, tempPassword);
            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            try
            {
                await _emailService.SendWelcomeEmailAsync(emailCleaned, tempPassword, tenant.Name, role.DisplayName);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR] Fallo al enviar correo de invitación: {ex.Message}");
            }

            return ServiceResult.Ok("Usuario creado exitosamente. Se ha enviado la invitación con la contraseña temporal.");
        }

        public async Task<ServiceResult> UpdateUserAsync(Guid id, UpdateUserInput input)
        {
            if (string.IsNullOrWhiteSpace(input.FullName) || string.IsNullOrWhiteSpace(input.Email))
            {
                return ServiceResult.BadRequest("El nombre y el correo electrónico son requeridos.");
            }

            var targetUser = await _dbContext.Users.IgnoreQueryFilters()
                .Include(u => u.Role)
                .Include(u => u.EnabledServices)
                .Include(u => u.EnabledDashboardCards)
                .FirstOrDefaultAsync(u => u.Id == id);
            if (targetUser == null)
            {
                return ServiceResult.NotFound("Usuario no encontrado.");
            }

            // Nadie edita al SuperAdmin desde este endpoint (gestiona su propio perfil vía /api/auth/profile).
            if (targetUser.Role?.Key == RoleKeys.SuperAdmin)
            {
                return ServiceResult.Forbidden();
            }

            var hasBroadAccess = HasBroadAccess();

            if (!hasBroadAccess)
            {
                if (targetUser.TenantId != _currentUserService.TenantId)
                {
                    return ServiceResult.Forbidden();
                }
                if (targetUser.Role?.Key == RoleKeys.Admin)
                {
                    return ServiceResult.Forbidden();
                }
            }

            var emailCleaned = InputSanitizer.SanitizeEmail(input.Email);
            var nameCleaned = InputSanitizer.SanitizeText(input.FullName);

            if (string.IsNullOrWhiteSpace(emailCleaned) || string.IsNullOrWhiteSpace(nameCleaned))
            {
                return ServiceResult.BadRequest("El nombre y el correo electrónico son requeridos.");
            }

            if (emailCleaned != targetUser.Email.ToLower())
            {
                var emailTaken = await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == emailCleaned && u.Id != id);
                if (emailTaken)
                {
                    return ServiceResult.BadRequest("El correo electrónico ya está en uso por otro usuario.");
                }
            }

            targetUser.Email = emailCleaned;
            targetUser.FullName = nameCleaned;

            if (hasBroadAccess && !string.IsNullOrWhiteSpace(input.RoleKey))
            {
                if (input.RoleKey != RoleKeys.Admin && input.RoleKey != RoleKeys.Member)
                {
                    return ServiceResult.BadRequest("Rol inválido.");
                }

                var newRole = await _dbContext.Roles.FirstOrDefaultAsync(r => r.Key == input.RoleKey);
                if (newRole == null)
                {
                    return ServiceResult.BadRequest("Rol inválido.");
                }

                targetUser.RoleId = newRole.Id;
            }

            if (input.ServiceIds != null && targetUser.TenantId.HasValue)
            {
                var tenantServices = await _dbContext.Tenants
                    .Where(t => t.Id == targetUser.TenantId.Value)
                    .SelectMany(t => t.EnabledServices)
                    .ToListAsync();

                var tenantServiceIds = tenantServices.Select(s => s.Id).ToHashSet();
                if (input.ServiceIds.Any(sid => !tenantServiceIds.Contains(sid)))
                {
                    return ServiceResult.BadRequest("Uno o más servicios seleccionados no están habilitados para esta empresa.");
                }

                targetUser.EnabledServices = tenantServices.Where(s => input.ServiceIds.Contains(s.Id)).ToList();
            }

            if (input.DashboardCardIds != null && targetUser.TenantId.HasValue)
            {
                var tenantDashboardCards = await _dbContext.Tenants
                    .Where(t => t.Id == targetUser.TenantId.Value)
                    .SelectMany(t => t.EnabledDashboardCards)
                    .ToListAsync();

                var tenantCardIds = tenantDashboardCards.Select(c => c.Id).ToHashSet();
                if (input.DashboardCardIds.Any(cid => !tenantCardIds.Contains(cid)))
                {
                    return ServiceResult.BadRequest("Una o más tarjetas del dashboard seleccionadas no están habilitadas para esta empresa.");
                }

                targetUser.EnabledDashboardCards = tenantDashboardCards.Where(c => input.DashboardCardIds.Contains(c.Id)).ToList();
            }

            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Usuario actualizado con éxito.");
        }

        public async Task<ServiceResult> ResendInvitationAsync(Guid id)
        {
            var targetUser = await _dbContext.Users.IgnoreQueryFilters().Include(u => u.Role).Include(u => u.Tenant).FirstOrDefaultAsync(u => u.Id == id);
            if (targetUser == null)
            {
                return ServiceResult.NotFound("Usuario no encontrado.");
            }

            if (targetUser.Role?.Key == RoleKeys.SuperAdmin)
            {
                return ServiceResult.Forbidden();
            }

            if (!HasBroadAccess() && targetUser.Role?.Key == RoleKeys.Admin)
            {
                return ServiceResult.Forbidden();
            }

            if (!targetUser.IsTemporaryPassword)
            {
                return ServiceResult.BadRequest("El usuario ya ingresó y configuró su contraseña permanente. No se puede reenviar la invitación.");
            }

            var randomNum = new Random().Next(100, 999);
            var tempPassword = $"SSTerra{randomNum}!";

            targetUser.PasswordHash = _passwordHasher.HashPassword(targetUser, tempPassword);
            await _dbContext.SaveChangesAsync();

            try
            {
                await _emailService.SendWelcomeEmailAsync(
                    targetUser.Email,
                    tempPassword,
                    targetUser.Tenant?.Name ?? "SSTerra",
                    targetUser.Role?.DisplayName ?? "Colaborador");
            }
            catch (Exception ex)
            {
                return ServiceResult.Error($"Contraseña regenerada, pero falló el envío del email: {ex.Message}");
            }

            return ServiceResult.Ok("Invitación reenviada con éxito.");
        }

        public async Task<ServiceResult> ToggleActiveAsync(Guid id)
        {
            if (_currentUserService.UserId == id)
            {
                return ServiceResult.BadRequest("No puedes desactivar tu propia cuenta.");
            }

            var targetUser = await _dbContext.Users.IgnoreQueryFilters().Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (targetUser == null)
            {
                return ServiceResult.NotFound("Usuario no encontrado.");
            }

            if (targetUser.Role?.Key == RoleKeys.SuperAdmin)
            {
                return ServiceResult.Forbidden();
            }

            if (!HasBroadAccess() && targetUser.Role?.Key == RoleKeys.Admin)
            {
                return ServiceResult.Forbidden();
            }

            targetUser.IsDisabled = !targetUser.IsDisabled;
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok($"Usuario {(targetUser.IsDisabled ? "desactivado" : "activado")} con éxito.");
        }

        public async Task<ServiceResult> DeleteUserAsync(Guid id)
        {
            if (_currentUserService.UserId == id)
            {
                return ServiceResult.BadRequest("No puedes eliminar tu propia cuenta.");
            }

            var targetUser = await _dbContext.Users.IgnoreQueryFilters().Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == id);
            if (targetUser == null)
            {
                return ServiceResult.NotFound("Usuario no encontrado.");
            }

            // Eliminar un Admin (o al SuperAdmin) exige ser el SuperAdmin puro: un Admin de la
            // plataforma con "los mismos permisos" NO puede eliminar a otro Admin.
            if (!_currentUserService.IsSuperAdmin && (targetUser.Role?.Key == RoleKeys.Admin || targetUser.Role?.Key == RoleKeys.SuperAdmin))
            {
                return ServiceResult.Forbidden();
            }

            if (!HasBroadAccess() && targetUser.TenantId != _currentUserService.TenantId)
            {
                return ServiceResult.Forbidden();
            }

            _dbContext.Users.Remove(targetUser);
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Usuario eliminado con éxito.");
        }
    }
}
