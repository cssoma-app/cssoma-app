using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Services
{
    public interface IUserService
    {
        Task<ServiceResult<List<AvailableServiceDto>>> GetAvailableServicesAsync(Guid? tenantId);
        Task<ServiceResult<List<AvailableDashboardCardDto>>> GetAvailableDashboardCardsAsync(Guid? tenantId);
        Task<ServiceResult<UserListResultDto>> GetUsersAsync(string? search, int page, Guid? tenantId);
        Task<ServiceResult> CreateUserAsync(CreateUserInput input);
        Task<ServiceResult> UpdateUserAsync(Guid id, UpdateUserInput input);
        Task<ServiceResult> ResendInvitationAsync(Guid id);
        Task<ServiceResult> ToggleActiveAsync(Guid id);
        Task<ServiceResult> DeleteUserAsync(Guid id);
    }

    public class AvailableServiceDto
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string? ParentKey { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class AvailableDashboardCardDto
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string TabKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class UserListItemDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public Guid? TenantId { get; set; }
        public string TenantName { get; set; } = string.Empty;
        public string RoleKey { get; set; } = string.Empty;
        public string RoleName { get; set; } = string.Empty;
        public bool IsDisabled { get; set; }
        public bool IsTemporaryPassword { get; set; }
        public bool HasLoggedIn { get; set; }
        public string Status { get; set; } = string.Empty;
        public List<int> ServiceIds { get; set; } = new();
        public List<int> DashboardCardIds { get; set; } = new();
    }

    public class UserListResultDto
    {
        public List<UserListItemDto> Items { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class CreateUserInput
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public Guid? TenantId { get; set; }
        public string? RoleKey { get; set; }
        public List<int>? ServiceIds { get; set; }
        public List<int>? DashboardCardIds { get; set; }
    }

    public class UpdateUserInput
    {
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? RoleKey { get; set; }
        public List<int>? ServiceIds { get; set; }
        public List<int>? DashboardCardIds { get; set; }
    }
}
