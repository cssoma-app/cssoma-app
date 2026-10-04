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

            // Sembrado del catálogo de funciones del Responsable SG-SST (FOR-SST-001 v02).
            // Texto literal tomado del formato oficial para no alterar el contenido normativo.
            if (!await dbContext.SgSstFunctionCatalogs.AnyAsync())
            {
                dbContext.SgSstFunctionCatalogs.AddRange(
                    new SgSstFunctionCatalog { Code = "F01", DisplayOrder = 1, IsActive = true, Title = "Planificación Estratégica (Planear)", Description = "Diseñar, implementar y evaluar el Plan de Trabajo Anual del SG-SST, asegurando su alineación con los objetivos de calidad y SST de la organización (ISO 9001 / ISO 45001 Cap. 6)." },
                    new SgSstFunctionCatalog { Code = "F02", DisplayOrder = 2, IsActive = true, Title = "Identificación de Peligros y Evaluación de Riesgos (IPEVR)", Description = "Administrar la metodología para la identificación de peligros, evaluación y valoración de riesgos en todos los centros y puestos de trabajo, definiendo la jerarquía de controles preventivos." },
                    new SgSstFunctionCatalog { Code = "F03", DisplayOrder = 3, IsActive = true, Title = "Cumplimiento Legal y Normativo", Description = "Estructurar, actualizar y evaluar periódicamente la Matriz de Requisitos Legales aplicables en materia de riesgos laborales y normatividad ISO aplicable." },
                    new SgSstFunctionCatalog { Code = "F04", DisplayOrder = 4, IsActive = true, Title = "Competencia y Toma de Conciencia", Description = "Coordinar y ejecutar el Plan Anual de Capacitación en SST, promoviendo la toma de conciencia sobre el impacto en la seguridad de las operaciones." },
                    new SgSstFunctionCatalog { Code = "F05", DisplayOrder = 5, IsActive = true, Title = "Investigación de Incidentes y Accidentes", Description = "Liderar el análisis de causas e investigación de incidentes, accidentes de trabajo (AT) y enfermedades laborales (EL), en conjunto con el COPASST / Vigía de SST." },
                    new SgSstFunctionCatalog { Code = "F06", DisplayOrder = 6, IsActive = true, Title = "Medicina del Trabajo y Vigilancia Epidemiológica", Description = "Coordinar los exámenes médicos ocupacionales y ejecutar los programas de vigilancia epidemiológica requeridos según los factores de riesgo prioritarios." },
                    new SgSstFunctionCatalog { Code = "F07", DisplayOrder = 7, IsActive = true, Title = "Inspecciones y Control Operativo", Description = "Realizar inspecciones periódicas a la infraestructura, herramientas, maquinaria y equipos, garantizando el suministro y uso adecuado de Elementos de Protección Personal (EPP)." },
                    new SgSstFunctionCatalog { Code = "F08", DisplayOrder = 8, IsActive = true, Title = "Respuesta ante Emergencias", Description = "Mantener actualizado y probado el Plan de Prevención, Preparación y Respuesta ante Emergencias de la empresa." },
                    new SgSstFunctionCatalog { Code = "F09", DisplayOrder = 9, IsActive = true, Title = "Participación y Consulta", Description = "Promover la consulta activa de los trabajadores, coordinando las actividades del COPASST / Vigía de SST y el Comité de Convivencia Laboral." },
                    new SgSstFunctionCatalog { Code = "F10", DisplayOrder = 10, IsActive = true, Title = "Control de la Información Documentada y Rendición de Cuentas", Description = "Garantizar la custodia, integridad, legibilidad y conservación segura de los registros del SG-SST (mínimo 20 años para registros clave) y rendir cuentas periódicamente ante la Alta Dirección." },
                    new SgSstFunctionCatalog { Code = "F11", DisplayOrder = 11, IsActive = true, Title = "Mejora Continua y Acción Correctiva (Actuar)", Description = "Establecer y verificar los planes de acción correctivos, preventivos y de mejora derivados de auditorías internas (ISO 9001 / 45001), revisiones de la dirección e investigaciones." }
                );
                await dbContext.SaveChangesAsync();
                Console.WriteLine("[SEED] Catálogo de funciones del Responsable SG-SST (FOR-SST-001) sembrado exitosamente.");
            }
        }
    }
}
