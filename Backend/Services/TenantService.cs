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
    public class TenantService : ITenantService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IEmailService _emailService;
        private readonly ICurrentUserService _currentUserService;

        public TenantService(
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

        // SuperAdmin: acceso total. Admin: solo si pertenece al tenant marcado IsPlatformOwner
        // (claim "IsPlatformOwner" del JWT, ver JwtTokenService). Un Admin de una empresa cliente
        // cualquiera no cumple ninguna de las dos condiciones.
        private bool CanManageTenants()
        {
            return _currentUserService.IsSuperAdmin ||
                   (_currentUserService.IsAdmin && _currentUserService.IsPlatformOwnerTenant);
        }

        // El dígito de verificación del NIT es opcional, pero si se envía debe ser exactamente
        // un dígito numérico (formato colombiano: XXXXXXXXX-X).
        private static bool IsValidDigitoVerificacion(string digitoVerificacion)
        {
            return string.IsNullOrEmpty(digitoVerificacion) ||
                   (digitoVerificacion.Length == 1 && char.IsDigit(digitoVerificacion[0]));
        }

        public async Task<ServiceResult<List<TenantListItemDto>>> GetTenantsAsync()
        {
            if (!CanManageTenants())
            {
                return ServiceResult<List<TenantListItemDto>>.Forbidden();
            }

            var adminRoleId = RoleKeys.AdminId;

            var tenants = await _dbContext.Tenants
                .Select(t => new TenantListItemDto
                {
                    Id = t.Id,
                    Name = t.Name,
                    RazonSocial = t.RazonSocial,
                    NitRuc = t.NitRuc,
                    DigitoVerificacion = t.DigitoVerificacion,
                    Direccion = t.Direccion,
                    Telefono = t.Telefono,
                    IsActive = t.IsActive,
                    CreatedAt = t.CreatedAt,
                    UsersCount = t.Users.Count,
                    EmployeesCount = t.Employees.Count,
                    DocumentsCount = t.Documents.Count,
                    AdminEmail = t.Users.Where(u => u.RoleId == adminRoleId).Select(u => u.Email).FirstOrDefault() ?? "",
                    // Si el administrador corporativo (Admin) aún tiene contraseña temporal, está en espera
                    IsAdminTemporary = t.Users.Any(u => u.RoleId == adminRoleId && u.IsTemporaryPassword),
                    ServiceIds = t.EnabledServices.Select(s => s.Id).ToList(),
                    DashboardCardIds = t.EnabledDashboardCards.Select(c => c.Id).ToList(),
                    Ciiu = t.Ciiu,
                    NumeroTrabajadores = t.NumeroTrabajadores,
                    CentrosTrabajo = t.CentrosTrabajo,
                    ClaseRiesgo = t.ClaseRiesgo,
                    Arl = t.Arl,
                    ResponsableSst = t.ResponsableSst,
                    TieneCopasst = t.TieneCopasst,
                    TieneComiteConvivencia = t.TieneComiteConvivencia,
                    TieneBrigada = t.TieneBrigada,
                    TieneContratistas = t.TieneContratistas
                })
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return ServiceResult<List<TenantListItemDto>>.Ok(tenants);
        }

        public async Task<ServiceResult> CreateTenantAsync(CreateTenantInput input)
        {
            if (!CanManageTenants())
            {
                return ServiceResult.Forbidden();
            }

            if (string.IsNullOrWhiteSpace(input.Name) ||
                string.IsNullOrWhiteSpace(input.RazonSocial) ||
                string.IsNullOrWhiteSpace(input.NitRuc) ||
                string.IsNullOrWhiteSpace(input.AdminEmail))
            {
                return ServiceResult.BadRequest("El nombre, razón social, NIT/RUC e email del administrador son obligatorios.");
            }

            var digitoVerificacionCleaned = InputSanitizer.SanitizeText(input.DigitoVerificacion).Trim();
            if (!IsValidDigitoVerificacion(digitoVerificacionCleaned))
            {
                return ServiceResult.BadRequest("El dígito de verificación del NIT debe ser un solo número.");
            }

            var nameCleaned = input.Name.Trim();
            var emailCleaned = input.AdminEmail.ToLower().Trim();

            var existsTenant = await _dbContext.Tenants.AnyAsync(t => t.Name.ToLower() == nameCleaned.ToLower());
            if (existsTenant)
            {
                return ServiceResult.BadRequest("Ya existe una empresa registrada con este nombre.");
            }

            var existsUser = await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == emailCleaned);
            if (existsUser)
            {
                return ServiceResult.BadRequest("El correo electrónico del administrador ya está registrado por otro usuario.");
            }

            var randomNum = new Random().Next(100, 999);
            var tempPassword = $"SSTerra{randomNum}!";

            // Sin selección explícita, la empresa nueva arranca con todos los servicios
            // habilitados (comportamiento previo a este catálogo: todo visible por defecto).
            var selectedServices = input.ServiceIds != null && input.ServiceIds.Count > 0
                ? await _dbContext.SassServices.Where(s => input.ServiceIds.Contains(s.Id)).ToListAsync()
                : await _dbContext.SassServices.ToListAsync();

            // Sin selección explícita, la empresa nueva arranca con todas las tarjetas del
            // dashboard habilitadas (mismo criterio por defecto que los servicios).
            var selectedDashboardCards = input.DashboardCardIds != null && input.DashboardCardIds.Count > 0
                ? await _dbContext.DashboardCards.Where(c => input.DashboardCardIds.Contains(c.Id)).ToListAsync()
                : await _dbContext.DashboardCards.ToListAsync();

            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = nameCleaned,
                RazonSocial = input.RazonSocial.Trim(),
                NitRuc = input.NitRuc.Trim(),
                DigitoVerificacion = digitoVerificacionCleaned,
                Direccion = (input.Direccion ?? "").Trim(),
                Telefono = (input.Telefono ?? "").Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                EnabledServices = selectedServices,
                EnabledDashboardCards = selectedDashboardCards,
                Ciiu = InputSanitizer.SanitizeText(input.Ciiu).Trim(),
                NumeroTrabajadores = Math.Max(0, input.NumeroTrabajadores),
                CentrosTrabajo = Math.Max(0, input.CentrosTrabajo),
                ClaseRiesgo = InputSanitizer.SanitizeText(input.ClaseRiesgo).Trim(),
                Arl = InputSanitizer.SanitizeText(input.Arl).Trim(),
                ResponsableSst = InputSanitizer.SanitizeText(input.ResponsableSst).Trim(),
                TieneCopasst = input.TieneCopasst,
                TieneComiteConvivencia = input.TieneComiteConvivencia,
                TieneBrigada = input.TieneBrigada,
                TieneContratistas = input.TieneContratistas
            };

            _dbContext.Tenants.Add(tenant);

            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Email = emailCleaned,
                FullName = "Administrador " + nameCleaned,
                RoleId = RoleKeys.AdminId,
                IsTemporaryPassword = true,
                SupabaseAuthId = "local-auth-" + Guid.NewGuid().ToString("N"),
                // El admin inicial de la empresa arranca con acceso a todo lo que la empresa habilitó.
                EnabledServices = new List<SassService>(selectedServices),
                EnabledDashboardCards = new List<DashboardCard>(selectedDashboardCards)
            };

            adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, tempPassword);
            _dbContext.Users.Add(adminUser);

            await _dbContext.SaveChangesAsync();

            try
            {
                await _emailService.SendWelcomeEmailAsync(emailCleaned, tempPassword, nameCleaned, "Administrador de Empresa");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR] Fallo al enviar correo de bienvenida: {ex.Message}");
            }

            return ServiceResult.Ok("Empresa registrada exitosamente. Se ha enviado la contraseña temporal al administrador.");
        }

        public async Task<ServiceResult> UpdateTenantAsync(Guid id, UpdateTenantInput input)
        {
            if (!CanManageTenants())
            {
                return ServiceResult.Forbidden();
            }

            if (string.IsNullOrWhiteSpace(input.Name) ||
                string.IsNullOrWhiteSpace(input.RazonSocial) ||
                string.IsNullOrWhiteSpace(input.NitRuc))
            {
                return ServiceResult.BadRequest("El nombre, razón social y NIT/RUC son requeridos.");
            }

            var digitoVerificacionCleaned = InputSanitizer.SanitizeText(input.DigitoVerificacion).Trim();
            if (!IsValidDigitoVerificacion(digitoVerificacionCleaned))
            {
                return ServiceResult.BadRequest("El dígito de verificación del NIT debe ser un solo número.");
            }

            var tenant = await _dbContext.Tenants
                .Include(t => t.EnabledServices)
                .Include(t => t.EnabledDashboardCards)
                .Include(t => t.Users).ThenInclude(u => u.EnabledServices)
                .Include(t => t.Users).ThenInclude(u => u.EnabledDashboardCards)
                .FirstOrDefaultAsync(t => t.Id == id);
            if (tenant == null)
            {
                return ServiceResult.NotFound("Empresa no encontrada.");
            }

            // Validar que el nombre no esté duplicado en otra empresa
            var nameCleaned = input.Name.Trim();
            var nameExists = await _dbContext.Tenants.AnyAsync(t => t.Name.ToLower() == nameCleaned.ToLower() && t.Id != id);
            if (nameExists)
            {
                return ServiceResult.BadRequest("Ya existe otra empresa registrada con este nombre comercial.");
            }

            tenant.Name = nameCleaned;
            tenant.RazonSocial = input.RazonSocial.Trim();
            tenant.NitRuc = input.NitRuc.Trim();
            tenant.DigitoVerificacion = digitoVerificacionCleaned;
            tenant.Direccion = (input.Direccion ?? "").Trim();
            tenant.Telefono = (input.Telefono ?? "").Trim();
            tenant.Ciiu = InputSanitizer.SanitizeText(input.Ciiu).Trim();
            tenant.NumeroTrabajadores = Math.Max(0, input.NumeroTrabajadores);
            tenant.CentrosTrabajo = Math.Max(0, input.CentrosTrabajo);
            tenant.ClaseRiesgo = InputSanitizer.SanitizeText(input.ClaseRiesgo).Trim();
            tenant.Arl = InputSanitizer.SanitizeText(input.Arl).Trim();
            tenant.ResponsableSst = InputSanitizer.SanitizeText(input.ResponsableSst).Trim();
            tenant.TieneCopasst = input.TieneCopasst;
            tenant.TieneComiteConvivencia = input.TieneComiteConvivencia;
            tenant.TieneBrigada = input.TieneBrigada;
            tenant.TieneContratistas = input.TieneContratistas;

            if (input.ServiceIds != null)
            {
                var newServices = await _dbContext.SassServices.Where(s => input.ServiceIds.Contains(s.Id)).ToListAsync();
                tenant.EnabledServices = newServices;

                // Un usuario nunca puede conservar un servicio que la empresa ya no tiene habilitado.
                var newServiceIds = newServices.Select(s => s.Id).ToHashSet();
                foreach (var user in tenant.Users)
                {
                    var removedFromUser = user.EnabledServices.Where(s => !newServiceIds.Contains(s.Id)).ToList();
                    foreach (var service in removedFromUser)
                    {
                        user.EnabledServices.Remove(service);
                    }
                }
            }

            if (input.DashboardCardIds != null)
            {
                var newCards = await _dbContext.DashboardCards.Where(c => input.DashboardCardIds.Contains(c.Id)).ToListAsync();
                tenant.EnabledDashboardCards = newCards;

                // Un usuario nunca puede conservar una tarjeta que la empresa ya no tiene habilitada.
                var newCardIds = newCards.Select(c => c.Id).ToHashSet();
                foreach (var user in tenant.Users)
                {
                    var removedFromUser = user.EnabledDashboardCards.Where(c => !newCardIds.Contains(c.Id)).ToList();
                    foreach (var card in removedFromUser)
                    {
                        user.EnabledDashboardCards.Remove(card);
                    }
                }
            }

            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Datos de la empresa actualizados con éxito.");
        }

        public async Task<ServiceResult> DeleteTenantAsync(Guid id)
        {
            if (!CanManageTenants())
            {
                return ServiceResult.Forbidden();
            }

            var tenant = await _dbContext.Tenants
                .Include(t => t.Users)
                .Include(t => t.Employees)
                .Include(t => t.Documents)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant == null)
            {
                return ServiceResult.NotFound("Empresa no encontrada.");
            }

            if (tenant.IsPlatformOwner)
            {
                return ServiceResult.BadRequest("No se puede eliminar la empresa propietaria de la plataforma.");
            }

            // Eliminación en cascada de entidades dependientes
            _dbContext.Users.RemoveRange(tenant.Users);
            _dbContext.Employees.RemoveRange(tenant.Employees);
            _dbContext.Documents.RemoveRange(tenant.Documents);
            _dbContext.Tenants.Remove(tenant);

            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok("Empresa eliminada con éxito de la plataforma.");
        }

        public async Task<ServiceResult> ToggleActiveAsync(Guid id)
        {
            if (!CanManageTenants())
            {
                return ServiceResult.Forbidden();
            }

            var tenant = await _dbContext.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return ServiceResult.NotFound("Empresa no encontrada.");
            }

            if (tenant.IsPlatformOwner)
            {
                return ServiceResult.BadRequest("No se puede desactivar la empresa propietaria de la plataforma.");
            }

            tenant.IsActive = !tenant.IsActive;
            await _dbContext.SaveChangesAsync();

            return ServiceResult.Ok($"Empresa {(tenant.IsActive ? "activada" : "desactivada")} con éxito.");
        }

        public async Task<ServiceResult> ResendWelcomeAsync(Guid id)
        {
            if (!CanManageTenants())
            {
                return ServiceResult.Forbidden();
            }

            var tenant = await _dbContext.Tenants
                .Include(t => t.Users)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant == null)
            {
                return ServiceResult.NotFound("Empresa no encontrada.");
            }

            // Buscar el administrador de la empresa (rol Admin)
            var adminUser = tenant.Users.FirstOrDefault(u => u.RoleId == RoleKeys.AdminId);
            if (adminUser == null)
            {
                return ServiceResult.BadRequest("No se encontró una cuenta de administrador asociada a esta empresa.");
            }

            if (!adminUser.IsTemporaryPassword)
            {
                return ServiceResult.BadRequest("El administrador ya ingresó y configuró su contraseña permanente. No se puede reenviar contraseña temporal.");
            }

            // Generar nueva contraseña temporal legible
            var randomNum = new Random().Next(100, 999);
            var tempPassword = $"SSTerra{randomNum}!";

            adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, tempPassword);
            await _dbContext.SaveChangesAsync();

            try
            {
                await _emailService.SendWelcomeEmailAsync(adminUser.Email, tempPassword, tenant.Name, "Administrador de Empresa");
            }
            catch (Exception ex)
            {
                return ServiceResult.Error($"Contraseña regenerada, pero falló el envío del email: {ex.Message}");
            }

            return ServiceResult.Ok("Contraseña temporal regenerada y reenviada con éxito al administrador.");
        }
    }
}
