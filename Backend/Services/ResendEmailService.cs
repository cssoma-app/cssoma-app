using System;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace BackendAPI.Services
{
    public class ResendEmailService : IEmailService
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private readonly ILogger<ResendEmailService> _logger;

        public ResendEmailService(
            IHttpClientFactory httpClientFactory, 
            IConfiguration configuration,
            ILogger<ResendEmailService> logger)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendSecurityCodeAsync(string email, string code)
        {
            var apiKey = _configuration["Resend:ApiKey"];
            var fromEmail = _configuration["Resend:FromEmail"] ?? "onboarding@resend.dev";
            var fromName = _configuration["Resend:FromName"] ?? "CSOMA SSTerra";

            // Fallback para desarrollo si no hay ApiKey configurada
            if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Equals("MOCK", StringComparison.OrdinalIgnoreCase))
            {
                var fallbackLog = $"\n==================================================\n" +
                                  $"[FALLBACK RESEND EMAIL] (ApiKey no configurada o es MOCK)\n" +
                                  $"Para: {email}\n" +
                                  $"Código: {code}\n" +
                                  $"Remitente: {fromName} <{fromEmail}>\n" +
                                  $"==================================================\n";
                _logger.LogWarning(fallbackLog);
                Console.WriteLine(fallbackLog);
                return;
            }

            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var requestBody = new
                {
                    from = $"{fromName} <{fromEmail}>",
                    to = new[] { email },
                    subject = "Código de Acceso - SSTerra CSOMA",
                    html = $"<div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; rounded-2xl;'>" +
                           $"<h2 style='color: #10b981;'>Tu Código de Seguridad</h2>" +
                           $"<p>Has solicitado ingresar al portal de clientes de CSOMA.</p>" +
                           $"<div style='background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #0f172a; border-radius: 12px; margin: 20px 0;'>" +
                           $"{code}" +
                           $"</div>" +
                           $"<p style='color: #64748b; font-size: 14px;'>Este código es válido por 5 minutos y de un solo uso.</p>" +
                           $"</div>"
                };

                var jsonPayload = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var response = await client.PostAsync("https://api.resend.com/emails", content);

                if (!response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Fallo al enviar correo mediante Resend API. Status: {response.StatusCode}, Detalle: {responseContent}");
                    throw new InvalidOperationException($"Error al enviar correo con Resend API: {response.ReasonPhrase}");
                }

                _logger.LogInformation($"Correo de código enviado exitosamente a {email} usando Resend API.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Excepción al intentar enviar correo a {email} usando Resend API.");
                throw;
            }
        }

        public async Task SendWelcomeEmailAsync(string email, string tempPassword, string companyName, string roleName)
        {
            var apiKey = _configuration["Resend:ApiKey"];
            var fromEmail = _configuration["Resend:FromEmail"] ?? "onboarding@resend.dev";
            var fromName = _configuration["Resend:FromName"] ?? "CSOMA SSTerra";

            if (string.IsNullOrWhiteSpace(apiKey) || apiKey.Equals("MOCK", StringComparison.OrdinalIgnoreCase))
            {
                var fallbackLog = $"\n==================================================\n" +
                                  $"[FALLBACK RESEND EMAIL] (Welcome Email)\n" +
                                  $"Para: {email}\n" +
                                  $"Empresa: {companyName}\n" +
                                  $"Contraseña Temporal: {tempPassword}\n" +
                                  $"Remitente: {fromName} <{fromEmail}>\n" +
                                  $"==================================================\n";
                _logger.LogWarning(fallbackLog);
                Console.WriteLine(fallbackLog);
                return;
            }

            try
            {
                using var client = _httpClientFactory.CreateClient();
                client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                var requestBody = new
                {
                    from = $"{fromName} <{fromEmail}>",
                    to = new[] { email },
                    subject = "Bienvenido a SSTerra CSOMA - Credenciales de Acceso",
                    html = $"<div style='font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;'>" +
                           $"<h2 style='color: #10b981;'>¡Bienvenido a SSTerra CSOMA!</h2>" +
                           $"<p>Has sido registrado en la plataforma de <strong>{companyName}</strong>.</p>" +
                           $"<p>Se te ha asignado el rol de <strong>{roleName}</strong>. Tus credenciales de acceso inicial son:</p>" +
                           $"<div style='background-color: #f1f5f9; padding: 15px; border-radius: 12px; margin: 20px 0;'>" +
                           $"<p style='margin: 5px 0;'><strong>Usuario (Email):</strong> {email}</p>" +
                           $"<p style='margin: 5px 0;'><strong>Contraseña Temporal:</strong> <span style='font-family: monospace; font-size: 16px; font-weight: bold; background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px;'>{tempPassword}</span></p>" +
                           $"</div>" +
                           $"<p style='color: #ef4444; font-weight: bold;'>Importante: Al iniciar sesión por primera vez, se te solicitará cambiar obligatoriamente esta contraseña temporal por una de tu elección.</p>" +
                           $"</div>"
                };

                var jsonPayload = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

                var response = await client.PostAsync("https://api.resend.com/emails", content);

                if (!response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"Fallo al enviar correo de bienvenida. Status: {response.StatusCode}, Detalle: {responseContent}");
                    throw new InvalidOperationException($"Error al enviar correo con Resend API: {response.ReasonPhrase}");
                }

                _logger.LogInformation($"Correo de bienvenida enviado exitosamente a {email}.");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Excepción al enviar correo de bienvenida a {email}.");
                throw;
            }
        }
    }
}
