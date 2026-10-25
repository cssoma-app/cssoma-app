using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BackendAPI.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace BackendAPI.Services
{
    public class JwtTokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public JwtTokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user)
        {
            return BuildToken(user, effectiveTenantId: user.TenantId, effectiveTenantName: user.Tenant?.Name ?? string.Empty);
        }

        // El claim IsPlatformOwner siempre se calcula de actor.Tenant (la empresa REAL del usuario,
        // sin importar cuál esté activa) — así el selector de empresa nunca le hace perder el acceso
        // amplio a un Admin de la empresa propietaria al cambiar de contexto (ver DashboardLayout).
        public string GenerateTenantContextToken(User actor, Tenant activeTenant)
        {
            return BuildToken(actor, effectiveTenantId: activeTenant.Id, effectiveTenantName: activeTenant.Name);
        }

        private string BuildToken(User user, Guid? effectiveTenantId, string effectiveTenantName)
        {
            var secretKey = _configuration["Jwt:Secret"] ?? "superSecretKeyCSOMA2026SSTerraSaaSPlatform";
            var issuer = _configuration["Jwt:Issuer"] ?? "SSTerraAPI";
            var audience = _configuration["Jwt:Audience"] ?? "SSTerraApp";

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                new Claim(JwtRegisteredClaimNames.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role?.Key ?? string.Empty),
                new Claim("FullName", user.FullName ?? string.Empty),
                new Claim("TenantId", effectiveTenantId?.ToString() ?? string.Empty),
                new Claim("TenantName", effectiveTenantName),
                new Claim("IsPlatformOwner", (user.Tenant?.IsPlatformOwner ?? false) ? "true" : "false")
            };

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7), // Token dura 7 días
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
