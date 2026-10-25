using System;

namespace BackendAPI.Services
{
    public interface ICurrentUserService
    {
        Guid? UserId { get; }
        Guid? TenantId { get; }
        bool IsSuperAdmin { get; }
        bool IsAdmin { get; }
        bool IsPlatformOwnerTenant { get; }
        string? Email { get; }
    }
}
