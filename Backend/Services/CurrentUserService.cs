using System;
using System.Security.Claims;
using BackendAPI.Models;
using Microsoft.AspNetCore.Http;

namespace BackendAPI.Services
{
    public class CurrentUserService : ICurrentUserService
    {
        private readonly IHttpContextAccessor _httpContextAccessor;

        public CurrentUserService(IHttpContextAccessor httpContextAccessor)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public Guid? UserId
        {
            get
            {
                var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier) 
                               ?? _httpContextAccessor.HttpContext?.User?.FindFirst("sub");
                               
                if (userIdClaim != null && Guid.TryParse(userIdClaim.Value, out Guid userId))
                {
                    return userId;
                }
                return null;
            }
        }

        public Guid? TenantId
        {
            get
            {
                var tenantIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId");
                if (tenantIdClaim != null && Guid.TryParse(tenantIdClaim.Value, out Guid tenantId))
                {
                    return tenantId;
                }
                return null;
            }
        }

        public bool IsSuperAdmin
        {
            get
            {
                var roleClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Role);
                if (roleClaim != null)
                {
                    return roleClaim.Value == UserRole.SuperAdmin.ToString();
                }
                return false;
            }
        }

        public string? Email => _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Email)?.Value 
                             ?? _httpContextAccessor.HttpContext?.User?.FindFirst("email")?.Value;
    }
}
