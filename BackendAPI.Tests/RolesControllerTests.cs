using System;
using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Controllers;
using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BackendAPI.Tests
{
    public class RolesControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;

        private readonly Guid _tenantAId = Guid.NewGuid();
        private readonly Guid _platformTenantId = Guid.NewGuid();

        public RolesControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockCurrentUser = new Mock<ICurrentUserService>();
            _dbContext = new ApplicationDbContext(options, _mockCurrentUser.Object);

            _dbContext.Roles.AddRange(
                new Role { Id = RoleKeys.SuperAdminId, Key = RoleKeys.SuperAdmin, DisplayName = "Super Administrador", IsSystemRole = true },
                new Role { Id = RoleKeys.AdminId, Key = RoleKeys.Admin, DisplayName = "Administrador de Empresa", IsSystemRole = true },
                new Role { Id = RoleKeys.MemberId, Key = RoleKeys.Member, DisplayName = "Colaborador", IsSystemRole = true }
            );
            _dbContext.Tenants.Add(new Tenant { Id = _tenantAId, Name = "Tenant A", RazonSocial = "A S.A.S.", NitRuc = "1", IsActive = true });
            _dbContext.Tenants.Add(new Tenant { Id = _platformTenantId, Name = "SSTerra Consultores", RazonSocial = "TECHNOLO-GIS S.A.S.", NitRuc = "900.985.000-1", IsActive = true, IsPlatformOwner = true });
            _dbContext.SaveChanges();
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private RolesController BuildController() => new RolesController(new RoleService(_dbContext, _mockCurrentUser.Object));

        private void SetActorAsPlatformOwnerAdmin()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_platformTenantId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(true);
        }

        private void SetActorAsClientTenantAdmin()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_tenantAId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
        }

        private User AddUser(Guid roleId, string email)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantAId,
                RoleId = roleId,
                Email = email,
                FullName = "Usuario " + email,
                PasswordHash = "x",
                SupabaseAuthId = "auth-" + Guid.NewGuid().ToString("N")
            };
            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();
            return user;
        }

        [Fact]
        public async Task CreateRole_AsClientTenantAdmin_IsForbidden()
        {
            SetActorAsClientTenantAdmin();
            var controller = BuildController();

            var result = await controller.CreateRole(new CreateRoleRequest { DisplayName = "Auditor" });

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task CreateRole_AsPlatformOwnerAdmin_Succeeds()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var result = await controller.CreateRole(new CreateRoleRequest { DisplayName = "Auditor" });

            Assert.IsType<OkObjectResult>(result);
            var created = await _dbContext.Roles.FirstAsync(r => r.DisplayName == "Auditor");
            Assert.False(created.IsSystemRole);
        }

        [Fact]
        public async Task DeleteRole_SystemRole_IsBlocked()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var result = await controller.DeleteRole(RoleKeys.MemberId);

            Assert.IsType<BadRequestObjectResult>(result);
            Assert.True(await _dbContext.Roles.AnyAsync(r => r.Id == RoleKeys.MemberId));
        }

        [Fact]
        public async Task DeleteRole_WithAssignedUser_IsBlockedWithExactMessage()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var createResult = await controller.CreateRole(new CreateRoleRequest { DisplayName = "Auditor" });
            var created = await _dbContext.Roles.FirstAsync(r => r.DisplayName == "Auditor");
            AddUser(created.Id, "auditor@a.com");

            var result = await controller.DeleteRole(created.Id);

            var badRequest = Assert.IsType<BadRequestObjectResult>(result);
            var message = (string)badRequest.Value!.GetType().GetProperty("Message")!.GetValue(badRequest.Value)!;
            Assert.Equal("No se puede eliminar/editar este rol porque hay un usuario asociado, primero cambie el rol del usuario para proceder.", message);
            Assert.True(await _dbContext.Roles.AnyAsync(r => r.Id == created.Id));
        }

        [Fact]
        public async Task DeleteRole_WithoutAssignedUsers_Succeeds()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            await controller.CreateRole(new CreateRoleRequest { DisplayName = "Auditor" });
            var created = await _dbContext.Roles.FirstAsync(r => r.DisplayName == "Auditor");

            var result = await controller.DeleteRole(created.Id);

            Assert.IsType<OkObjectResult>(result);
            Assert.False(await _dbContext.Roles.AnyAsync(r => r.Id == created.Id));
        }

        [Fact]
        public async Task UpdateRole_SystemRole_CanBeRenamed()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var result = await controller.UpdateRole(RoleKeys.AdminId, new UpdateRoleRequest { DisplayName = "Otro Nombre" });

            Assert.IsType<OkObjectResult>(result);
            var updated = await _dbContext.Roles.FirstAsync(r => r.Id == RoleKeys.AdminId);
            Assert.Equal("Otro Nombre", updated.DisplayName);
            Assert.Equal(RoleKeys.Admin, updated.Key); // el Key interno no cambia
        }

        [Fact]
        public async Task UpdateRole_WithAssignedUsers_CanStillBeRenamed()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();
            AddUser(RoleKeys.MemberId, "member@a.com");

            var result = await controller.UpdateRole(RoleKeys.MemberId, new UpdateRoleRequest { DisplayName = "Colaborador Renombrado" });

            Assert.IsType<OkObjectResult>(result);
        }
    }
}
