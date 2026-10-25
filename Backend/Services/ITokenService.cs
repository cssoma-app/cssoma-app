using BackendAPI.Models;

namespace BackendAPI.Services
{
    public interface ITokenService
    {
        string GenerateToken(User user);
        // Reemite un token para el mismo actor (identidad/rol sin cambios) pero con TenantId/TenantName
        // apuntando a activeTenant — usado por el selector de empresa (cambio de contexto de tenant).
        string GenerateTenantContextToken(User actor, Tenant activeTenant);
    }
}
