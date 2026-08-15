using System;

namespace BackendAPI.Services
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }
        Guid? TenantId { get; }
        bool IsSuperAdmin { get; }
        string? Email { get; }
    }
}
