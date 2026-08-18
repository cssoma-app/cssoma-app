using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Services
{
    public interface IRoleService
    {
        Task<ServiceResult<List<RoleDto>>> GetRolesAsync();
        Task<ServiceResult> CreateRoleAsync(string displayName);
        Task<ServiceResult> UpdateRoleAsync(Guid id, string displayName);
        Task<ServiceResult> DeleteRoleAsync(Guid id);
    }

    public class RoleDto
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public bool IsSystemRole { get; set; }
        public int UsersCount { get; set; }
    }
}
