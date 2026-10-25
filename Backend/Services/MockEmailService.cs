using System;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace BackendAPI.Services
{
    public class MockEmailService : IEmailService
    {
        private readonly ILogger<MockEmailService> _logger;

        public MockEmailService(ILogger<MockEmailService> logger)
        {
            _logger = logger;
        }

        public Task SendSecurityCodeAsync(string email, string code)
        {
            // Registrar en consola/logs de forma muy clara para desarrollo
            var logMessage = $"\n==================================================\n" +
                             $"[MOCK EMAIL] Enviando código de seguridad\n" +
                             $"Destinatario: {email}\n" +
                             $"Código de Acceso: {code}\n" +
                             $"Válido por: 5 minutos\n" +
                             $"==================================================\n";
            
            _logger.LogInformation(logMessage);
            Console.WriteLine(logMessage);

            return Task.CompletedTask;
        }

        public Task SendWelcomeEmailAsync(string email, string tempPassword, string companyName, string roleName)
        {
            var logMessage = $"\n==================================================\n" +
                             $"[MOCK EMAIL] Enviando bienvenida y contraseña temporal\n" +
                             $"Destinatario: {email}\n" +
                             $"Empresa: {companyName}\n" +
                             $"Rol Asignado: {roleName}\n" +
                             $"Contraseña Temporal: {tempPassword}\n" +
                             $"==================================================\n";
            
            _logger.LogInformation(logMessage);
            Console.WriteLine(logMessage);

            return Task.CompletedTask;
        }
    }
}
