using System;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BackendAPI.Data
{
    public static class DatabaseInitializer
    {
        public static async Task SeedDataAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

            // Aplicar migraciones pendientes
            await dbContext.Database.MigrateAsync();

            // Sembrado de Roles del sistema (RBAC vía datos, no enum rígido)
            if (!await dbContext.Roles.AnyAsync())
            {
                dbContext.Roles.AddRange(
                    new Role { Id = RoleKeys.SuperAdminId, Key = RoleKeys.SuperAdmin, DisplayName = "Super Administrador", IsSystemRole = true },
                    new Role { Id = RoleKeys.AdminId, Key = RoleKeys.Admin, DisplayName = "Administrador de Empresa", IsSystemRole = true },
                    new Role { Id = RoleKeys.MemberId, Key = RoleKeys.Member, DisplayName = "Colaborador", IsSystemRole = true }
                );
                await dbContext.SaveChangesAsync();
                Console.WriteLine("[SEED] Roles del sistema sembrados exitosamente.");
            }
            else
            {
                // Backfill: marcar como sistema los 3 roles sembrados antes de que existiera IsSystemRole,
                // para que RolesController los proteja de edición/eliminación.
                var systemRoleIds = new[] { RoleKeys.SuperAdminId, RoleKeys.AdminId, RoleKeys.MemberId };
                var unmarkedSystemRoles = await dbContext.Roles
                    .Where(r => systemRoleIds.Contains(r.Id) && !r.IsSystemRole)
                    .ToListAsync();

                if (unmarkedSystemRoles.Count > 0)
                {
                    foreach (var role in unmarkedSystemRoles)
                    {
                        role.IsSystemRole = true;
                    }
                    await dbContext.SaveChangesAsync();
                    Console.WriteLine("[SEED] Roles del sistema existentes marcados como IsSystemRole.");
                }
            }

            // Sembrado del Tenant propietario de la plataforma (SSTerra Consultores).
            // Los Admin que pertenezcan a este tenant obtienen permisos ampliados sobre
            // el resto de empresas y usuarios (ver TenantsController.CanManageTenants()
            // y UsersController.HasBroadAccess()).
            var platformTenant = await dbContext.Tenants
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(t => t.IsPlatformOwner);

            if (platformTenant == null)
            {
                platformTenant = new Tenant
                {
                    Id = Guid.NewGuid(),
                    Name = "SSTerra Consultores",
                    RazonSocial = "TECHNOLO-GIS S.A.S.",
                    NitRuc = "900.985.000-1",
                    IsActive = true,
                    IsPlatformOwner = true,
                    CreatedAt = DateTime.UtcNow
                };

                dbContext.Tenants.Add(platformTenant);
                await dbContext.SaveChangesAsync();
                Console.WriteLine("[SEED] Tenant propietario de la plataforma (SSTerra Consultores) sembrado exitosamente.");
            }

            // Sembrado de Superadmin desde la configuración
            var superAdminEmail = configuration["SuperAdmin:Email"];
            var supabaseAuthId = configuration["SuperAdmin:SupabaseAuthId"];

            if (!string.IsNullOrWhiteSpace(superAdminEmail))
            {
                var cleanedEmail = superAdminEmail.ToLower().Trim();

                // Usamos IgnoreQueryFilters() para validar existencia global del usuario
                var existingSuperAdmin = await dbContext.Users
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanedEmail);

                if (existingSuperAdmin == null)
                {
                    var superAdmin = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = cleanedEmail,
                        FullName = "Super Administrador",
                        RoleId = RoleKeys.SuperAdminId,
                        SupabaseAuthId = string.IsNullOrWhiteSpace(supabaseAuthId)
                            ? "superadmin-default-id"
                            : supabaseAuthId,
                        TenantId = platformTenant.Id
                    };

                    dbContext.Users.Add(superAdmin);
                    await dbContext.SaveChangesAsync();

                    Console.WriteLine($"[SEED] Usuario Superadmin sembrado exitosamente: {cleanedEmail}");
                }
                else
                {
                    // Backfill/auto-corrección: el email configurado en SuperAdmin:Email SIEMPRE debe
                    // terminar con RoleId=SuperAdmin y vinculado al tenant propietario, sin importar
                    // qué rol/tenant tuviera esa fila antes (ej. si el email ya existía como Admin de
                    // pruebas previas a esta migración).
                    var needsUpdate = false;

                    if (existingSuperAdmin.TenantId != platformTenant.Id)
                    {
                        existingSuperAdmin.TenantId = platformTenant.Id;
                        needsUpdate = true;
                    }

                    if (existingSuperAdmin.RoleId != RoleKeys.SuperAdminId)
                    {
                        existingSuperAdmin.RoleId = RoleKeys.SuperAdminId;
                        needsUpdate = true;
                    }

                    if (needsUpdate)
                    {
                        dbContext.Users.Update(existingSuperAdmin);
                        await dbContext.SaveChangesAsync();
                        Console.WriteLine("[SEED] Usuario Superadmin existente corregido (rol y/o tenant propietario).");
                    }
                }
            }

            // Sembrado de Servicios
            if (!await dbContext.SassServices.AnyAsync())
            {
                dbContext.SassServices.AddRange(
                    new SassService { Name = "Gestión Documental", Description = "Almacenamiento, indexación y consulta de documentos digitales de seguridad e higiene.", IsEnabled = true },
                    new SassService { Name = "Gestión de Empleados", Description = "Administración del personal corporativo, roles y asignación de EPP.", IsEnabled = true },
                    new SassService { Name = "Auditoría de Seguridad", Description = "Generación de bitácoras de auditoría en tiempo real y logs de actividades.", IsEnabled = true },
                    new SassService { Name = "Alertas Automáticas", Description = "Notificaciones automatizadas ante expiración de documentos de empleados.", IsEnabled = true }
                );
                await dbContext.SaveChangesAsync();
                Console.WriteLine("[SEED] Servicios iniciales de la plataforma sembrados exitosamente.");
            }
        }
    }
}
