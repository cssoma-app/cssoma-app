using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Controllers
{
    [Authorize(Roles = "SuperAdmin")]
    [ApiController]
    [Route("api/tenants")]
    public class TenantsController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IPasswordHasher<User> _passwordHasher;
        private readonly IEmailService _emailService;

        public TenantsController(
            ApplicationDbContext dbContext,
            IPasswordHasher<User> passwordHasher,
            IEmailService emailService)
        {
            _dbContext = dbContext;
            _passwordHasher = passwordHasher;
            _emailService = emailService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTenants()
        {
            var tenants = await _dbContext.Tenants
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    t.RazonSocial,
                    t.NitRuc,
                    t.Direccion,
                    t.Telefono,
                    t.IsActive,
                    t.CreatedAt,
                    UsersCount = t.Users.Count,
                    EmployeesCount = t.Employees.Count,
                    DocumentsCount = t.Documents.Count,
                    AdminEmail = t.Users.Where(u => u.Role == UserRole.SST_Manager).Select(u => u.Email).FirstOrDefault() ?? "",
                    // Si el administrador corporativo (SST_Manager) aún tiene contraseña temporal, está en espera
                    IsAdminTemporary = t.Users.Any(u => u.Role == UserRole.SST_Manager && u.IsTemporaryPassword)
                })
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();

            return Ok(tenants);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTenant([FromBody] CreateTenantRequest request)
        {
            if (request == null || 
                string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.RazonSocial) ||
                string.IsNullOrWhiteSpace(request.NitRuc) ||
                string.IsNullOrWhiteSpace(request.AdminEmail))
            {
                return BadRequest(new { Message = "El nombre, razón social, NIT/RUC e email del administrador son obligatorios." });
            }

            var nameCleaned = request.Name.Trim();
            var emailCleaned = request.AdminEmail.ToLower().Trim();

            var existsTenant = await _dbContext.Tenants.AnyAsync(t => t.Name.ToLower() == nameCleaned.ToLower());
            if (existsTenant)
            {
                return BadRequest(new { Message = "Ya existe una empresa registrada con este nombre." });
            }

            var existsUser = await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Email.ToLower() == emailCleaned);
            if (existsUser)
            {
                return BadRequest(new { Message = "El correo electrónico del administrador ya está registrado por otro usuario." });
            }

            var randomNum = new Random().Next(100, 999);
            var tempPassword = $"SSTerra{randomNum}!";

            var tenant = new Tenant
            {
                Id = Guid.NewGuid(),
                Name = nameCleaned,
                RazonSocial = request.RazonSocial.Trim(),
                NitRuc = request.NitRuc.Trim(),
                Direccion = (request.Direccion ?? "").Trim(),
                Telefono = (request.Telefono ?? "").Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _dbContext.Tenants.Add(tenant);

            var adminUser = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Email = emailCleaned,
                FullName = "Administrador " + nameCleaned,
                Role = UserRole.SST_Manager,
                IsTemporaryPassword = true,
                SupabaseAuthId = "local-auth-" + Guid.NewGuid().ToString("N")
            };

            adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, tempPassword);
            _dbContext.Users.Add(adminUser);

            await _dbContext.SaveChangesAsync();

            try
            {
                await _emailService.SendWelcomeEmailAsync(emailCleaned, tempPassword, nameCleaned);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EMAIL ERROR] Fallo al enviar correo de bienvenida: {ex.Message}");
            }

            return Ok(new
            {
                Message = "Empresa registrada exitosamente. Se ha enviado la contraseña temporal al administrador.",
                Tenant = new
                {
                    tenant.Id,
                    tenant.Name,
                    tenant.RazonSocial,
                    tenant.NitRuc,
                    tenant.CreatedAt
                }
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTenant(Guid id, [FromBody] UpdateTenantRequest request)
        {
            if (request == null || 
                string.IsNullOrWhiteSpace(request.Name) ||
                string.IsNullOrWhiteSpace(request.RazonSocial) ||
                string.IsNullOrWhiteSpace(request.NitRuc))
            {
                return BadRequest(new { Message = "El nombre, razón social y NIT/RUC son requeridos." });
            }

            var tenant = await _dbContext.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound(new { Message = "Empresa no encontrada." });
            }

            // Validar que el nombre no esté duplicado en otra empresa
            var nameCleaned = request.Name.Trim();
            var nameExists = await _dbContext.Tenants.AnyAsync(t => t.Name.ToLower() == nameCleaned.ToLower() && t.Id != id);
            if (nameExists)
            {
                return BadRequest(new { Message = "Ya existe otra empresa registrada con este nombre comercial." });
            }

            tenant.Name = nameCleaned;
            tenant.RazonSocial = request.RazonSocial.Trim();
            tenant.NitRuc = request.NitRuc.Trim();
            tenant.Direccion = (request.Direccion ?? "").Trim();
            tenant.Telefono = (request.Telefono ?? "").Trim();

            _dbContext.Tenants.Update(tenant);
            await _dbContext.SaveChangesAsync();

            return Ok(new { Message = "Datos de la empresa actualizados con éxito.", Tenant = tenant });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTenant(Guid id)
        {
            var tenant = await _dbContext.Tenants
                .Include(t => t.Users)
                .Include(t => t.Employees)
                .Include(t => t.Documents)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant == null)
            {
                return NotFound(new { Message = "Empresa no encontrada." });
            }

            // Eliminación en cascada de entidades dependientes
            _dbContext.Users.RemoveRange(tenant.Users);
            _dbContext.Employees.RemoveRange(tenant.Employees);
            _dbContext.Documents.RemoveRange(tenant.Documents);
            _dbContext.Tenants.Remove(tenant);

            await _dbContext.SaveChangesAsync();

            return Ok(new { Message = "Empresa eliminada con éxito de la plataforma." });
        }

        [HttpPost("toggle-active/{id}")]
        public async Task<IActionResult> ToggleActive(Guid id)
        {
            var tenant = await _dbContext.Tenants.FindAsync(id);
            if (tenant == null)
            {
                return NotFound(new { Message = "Empresa no encontrada." });
            }

            tenant.IsActive = !tenant.IsActive;
            _dbContext.Tenants.Update(tenant);
            await _dbContext.SaveChangesAsync();

            return Ok(new 
            { 
                Message = $"Empresa {(tenant.IsActive ? "activada" : "desactivada")} con éxito.",
                IsActive = tenant.IsActive 
            });
        }

        [HttpPost("resend-welcome/{id}")]
        public async Task<IActionResult> ResendWelcome(Guid id)
        {
            var tenant = await _dbContext.Tenants
                .Include(t => t.Users)
                .FirstOrDefaultAsync(t => t.Id == id);

            if (tenant == null)
            {
                return NotFound(new { Message = "Empresa no encontrada." });
            }

            // Buscar el administrador de la empresa (SST_Manager)
            var adminUser = tenant.Users.FirstOrDefault(u => u.Role == UserRole.SST_Manager);
            if (adminUser == null)
            {
                return BadRequest(new { Message = "No se encontró una cuenta de administrador asociada a esta empresa." });
            }

            if (!adminUser.IsTemporaryPassword)
            {
                return BadRequest(new { Message = "El administrador ya ingresó y configuró su contraseña permanente. No se puede reenviar contraseña temporal." });
            }

            // Generar nueva contraseña temporal legible
            var randomNum = new Random().Next(100, 999);
            var tempPassword = $"SSTerra{randomNum}!";

            adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, tempPassword);
            _dbContext.Users.Update(adminUser);
            await _dbContext.SaveChangesAsync();

            try
            {
                await _emailService.SendWelcomeEmailAsync(adminUser.Email, tempPassword, tenant.Name);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Contraseña regenerada, pero falló el envío del email: {ex.Message}" });
            }

            return Ok(new { Message = "Contraseña temporal regenerada y reenviada con éxito al administrador." });
        }
    }

    public class CreateTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public string AdminEmail { get; set; } = string.Empty;
    }

    public class UpdateTenantRequest
    {
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
    }
}
