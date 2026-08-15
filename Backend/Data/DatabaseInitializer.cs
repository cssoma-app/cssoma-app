using System;
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

            // Sembrado de Superadmin desde la configuración
            var superAdminEmail = configuration["SuperAdmin:Email"];
            var supabaseAuthId = configuration["SuperAdmin:SupabaseAuthId"];

            if (!string.IsNullOrWhiteSpace(superAdminEmail))
            {
                var cleanedEmail = superAdminEmail.ToLower().Trim();

                // Usamos IgnoreQueryFilters() para validar existencia global del usuario
                var exists = await dbContext.Users
                    .IgnoreQueryFilters()
                    .AnyAsync(u => u.Email.ToLower() == cleanedEmail);

                if (!exists)
                {
                    var superAdmin = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = cleanedEmail,
                        FullName = "Super Administrador",
                        Role = UserRole.SuperAdmin,
                        SupabaseAuthId = string.IsNullOrWhiteSpace(supabaseAuthId) 
                            ? "superadmin-default-id" 
                            : supabaseAuthId,
                        TenantId = null // SuperAdmin no pertenece a ningún Tenant específico
                    };

                    dbContext.Users.Add(superAdmin);
                    await dbContext.SaveChangesAsync();

                    Console.WriteLine($"[SEED] Usuario Superadmin sembrado exitosamente: {cleanedEmail}");
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
