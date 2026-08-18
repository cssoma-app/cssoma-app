using System;
using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class Role
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        // Roles del sistema (SuperAdmin/Admin/Member) no se pueden editar ni eliminar vía RolesController.
        public bool IsSystemRole { get; set; } = false;

        // Navigation property
        public ICollection<User> Users { get; set; } = new List<User>();
    }

    public static class RoleKeys
    {
        public const string SuperAdmin = "SuperAdmin";
        public const string Admin = "Admin";
        public const string Member = "Member";

        // GUID fijos para poder sembrar y referenciar los roles del sistema
        // de forma determinística tanto desde migraciones (SQL) como desde código.
        public static readonly Guid SuperAdminId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        public static readonly Guid AdminId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        public static readonly Guid MemberId = Guid.Parse("33333333-3333-3333-3333-333333333333");
    }
}
