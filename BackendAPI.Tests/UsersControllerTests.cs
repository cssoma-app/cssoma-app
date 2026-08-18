using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Controllers;
using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BackendAPI.Tests
{
    public class UsersControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IPasswordHasher<User>> _mockPasswordHasher;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;

        private readonly Guid _tenantAId = Guid.NewGuid();
        private readonly Guid _tenantBId = Guid.NewGuid();
        private readonly Guid _platformTenantId = Guid.NewGuid();
        private readonly int _docsServiceId;
        private readonly int _usersServiceId;
        private readonly int _cumplimientoCardId;
        private readonly int _comprasCardId;

        public UsersControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockCurrentUser = new Mock<ICurrentUserService>();

            // El DbContext toma ICurrentUserService para evaluar el Global Query Filter,
            // igual que en producción.
            _dbContext = new ApplicationDbContext(options, _mockCurrentUser.Object);

            _dbContext.Roles.AddRange(
                new Role { Id = RoleKeys.SuperAdminId, Key = RoleKeys.SuperAdmin, DisplayName = "Super Administrador" },
                new Role { Id = RoleKeys.AdminId, Key = RoleKeys.Admin, DisplayName = "Administrador de Empresa" },
                new Role { Id = RoleKeys.MemberId, Key = RoleKeys.Member, DisplayName = "Colaborador" }
            );
            var docsService = new SassService { Key = "documents", Name = "Documentos", IsEnabled = true };
            var usersService = new SassService { Key = "users", ParentKey = "admin", Name = "Usuarios", IsEnabled = true };
            _dbContext.SassServices.AddRange(docsService, usersService);

            var cumplimientoCard = new DashboardCard { Key = "cumplimiento-general", TabKey = "tab1", Name = "Cumplimiento General", IsEnabled = true };
            var comprasCard = new DashboardCard { Key = "compras-mes", TabKey = "tab2", Name = "Compras del Mes", IsEnabled = true };
            _dbContext.DashboardCards.AddRange(cumplimientoCard, comprasCard);

            var tenantA = new Tenant { Id = _tenantAId, Name = "Tenant A", RazonSocial = "A S.A.S.", NitRuc = "1", IsActive = true, EnabledServices = new List<SassService> { docsService, usersService }, EnabledDashboardCards = new List<DashboardCard> { cumplimientoCard, comprasCard } };
            var tenantB = new Tenant { Id = _tenantBId, Name = "Tenant B", RazonSocial = "B S.A.S.", NitRuc = "2", IsActive = true, EnabledServices = new List<SassService> { docsService }, EnabledDashboardCards = new List<DashboardCard> { cumplimientoCard } };
            _dbContext.Tenants.Add(tenantA);
            _dbContext.Tenants.Add(tenantB);
            _dbContext.Tenants.Add(new Tenant { Id = _platformTenantId, Name = "SSTerra Consultores", RazonSocial = "TECHNOLO-GIS S.A.S.", NitRuc = "900.985.000-1", IsActive = true, IsPlatformOwner = true });
            _dbContext.SaveChanges();

            _docsServiceId = docsService.Id;
            _usersServiceId = usersService.Id;
            _cumplimientoCardId = cumplimientoCard.Id;
            _comprasCardId = comprasCard.Id;

            _mockEmailService = new Mock<IEmailService>();
            _mockPasswordHasher = new Mock<IPasswordHasher<User>>();
            _mockPasswordHasher
                .Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>()))
                .Returns("hashed");
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private UsersController BuildController()
        {
            var service = new UserService(_dbContext, _mockPasswordHasher.Object, _mockEmailService.Object, _mockCurrentUser.Object);
            return new UsersController(service);
        }

        private void SetActorAsAdminOfTenantA(Guid adminUserId)
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_tenantAId);
            _mockCurrentUser.Setup(c => c.UserId).Returns(adminUserId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
        }

        private void SetActorAsPlatformOwnerAdmin(Guid adminUserId, Guid platformTenantId)
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(platformTenantId);
            _mockCurrentUser.Setup(c => c.UserId).Returns(adminUserId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(true);
        }

        private void SetActorAsSuperAdmin(Guid superAdminUserId)
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.TenantId).Returns((Guid?)null);
            _mockCurrentUser.Setup(c => c.UserId).Returns(superAdminUserId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
        }

        private User AddUser(Guid tenantId, Guid roleId, string email, bool isDisabled = false, DateTime? lastLoginAt = null)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                RoleId = roleId,
                Email = email,
                FullName = "Usuario " + email,
                PasswordHash = "x",
                SupabaseAuthId = "auth-" + Guid.NewGuid().ToString("N"),
                IsDisabled = isDisabled,
                LastLoginAt = lastLoginAt
            };
            _dbContext.Users.Add(user);
            _dbContext.SaveChanges();
            return user;
        }

        [Fact]
        public async Task CreateUser_AsAdmin_ForcesRoleToMember_EvenIfAdminRoleRequested()
        {
            var adminActorId = AddUser(_tenantAId, RoleKeys.AdminId, "admin.actor@a.com").Id;
            SetActorAsAdminOfTenantA(adminActorId);
            var controller = BuildController();

            var result = await controller.CreateUser(new CreateUserRequest
            {
                FullName = "Nuevo Colaborador",
                Email = "nuevo@a.com",
                RoleKey = RoleKeys.Admin, // intenta escalar a Admin
                TenantId = _tenantBId // intenta elegir otro tenant
            });

            Assert.IsType<OkObjectResult>(result);

            var created = await _dbContext.Users.IgnoreQueryFilters().Include(u => u.Role).FirstAsync(u => u.Email == "nuevo@a.com");
            Assert.Equal(RoleKeys.Member, created.Role!.Key);
            Assert.Equal(_tenantAId, created.TenantId); // ignora el tenant enviado por el cliente
        }

        [Fact]
        public async Task CreateUser_AsSuperAdmin_CanAssignAdminRoleToChosenTenant()
        {
            SetActorAsSuperAdmin(Guid.NewGuid());
            var controller = BuildController();

            var result = await controller.CreateUser(new CreateUserRequest
            {
                FullName = "Nueva Admin",
                Email = "nueva.admin@b.com",
                RoleKey = RoleKeys.Admin,
                TenantId = _tenantBId
            });

            Assert.IsType<OkObjectResult>(result);

            var created = await _dbContext.Users.IgnoreQueryFilters().Include(u => u.Role).FirstAsync(u => u.Email == "nueva.admin@b.com");
            Assert.Equal(RoleKeys.Admin, created.Role!.Key);
            Assert.Equal(_tenantBId, created.TenantId);
        }

        [Fact]
        public async Task UpdateUser_AsAdmin_TargetingAnotherAdmin_ReturnsForbid()
        {
            var actingAdminId = AddUser(_tenantAId, RoleKeys.AdminId, "actor@a.com").Id;
            var otherAdmin = AddUser(_tenantAId, RoleKeys.AdminId, "other-admin@a.com");
            SetActorAsAdminOfTenantA(actingAdminId);
            var controller = BuildController();

            var result = await controller.UpdateUser(otherAdmin.Id, new UpdateUserRequest
            {
                FullName = "Intento de Edicion",
                Email = "other-admin@a.com"
            });

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task UpdateUser_AsAdmin_TargetingMemberInOwnTenant_Succeeds()
        {
            var actingAdminId = AddUser(_tenantAId, RoleKeys.AdminId, "actor2@a.com").Id;
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member@a.com");
            SetActorAsAdminOfTenantA(actingAdminId);
            var controller = BuildController();

            var result = await controller.UpdateUser(member.Id, new UpdateUserRequest
            {
                FullName = "Nombre Actualizado",
                Email = "member@a.com"
            });

            Assert.IsType<OkObjectResult>(result);
            var updated = await _dbContext.Users.FirstAsync(u => u.Id == member.Id);
            Assert.Equal("Nombre Actualizado", updated.FullName);
        }

        [Fact]
        public async Task ToggleActive_CannotDisableOwnAccount()
        {
            var actingAdminId = AddUser(_tenantAId, RoleKeys.AdminId, "self@a.com").Id;
            SetActorAsAdminOfTenantA(actingAdminId);
            var controller = BuildController();

            var result = await controller.ToggleActive(actingAdminId);

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetUsers_AsAdmin_OnlyReturnsOwnTenantUsers()
        {
            var actingAdminId = AddUser(_tenantAId, RoleKeys.AdminId, "actor3@a.com").Id;
            AddUser(_tenantAId, RoleKeys.MemberId, "memberA@a.com");
            AddUser(_tenantBId, RoleKeys.MemberId, "memberB@b.com");
            SetActorAsAdminOfTenantA(actingAdminId);
            var controller = BuildController();

            var result = await controller.GetUsers(null, 1, null);

            var ok = Assert.IsType<OkObjectResult>(result);
            var items = GetItems(ok.Value!);
            var emails = items
                .Select(i => (string)i.GetType().GetProperty("Email")!.GetValue(i)!)
                .ToList();

            Assert.Contains("actor3@a.com", emails);
            Assert.Contains("memberA@a.com", emails);
            Assert.DoesNotContain("memberB@b.com", emails);
        }

        [Theory]
        [InlineData(false, null, "Inactivo")]
        [InlineData(false, "2026-08-01", "Activo")]
        [InlineData(true, "2026-08-01", "Inactivo")]
        public async Task GetUsers_ComputesStatus_FromIsDisabledAndLastLoginAt(bool isDisabled, string? lastLoginRaw, string expectedStatus)
        {
            SetActorAsSuperAdmin(Guid.NewGuid());
            var lastLogin = lastLoginRaw == null ? (DateTime?)null : DateTime.Parse(lastLoginRaw);
            var user = AddUser(_tenantAId, RoleKeys.MemberId, "status@a.com", isDisabled, lastLogin);
            var controller = BuildController();

            var result = await controller.GetUsers(null, 1, _tenantAId);

            var ok = Assert.IsType<OkObjectResult>(result);
            var items = GetItems(ok.Value!);
            var row = items.First(i => (Guid)i.GetType().GetProperty("Id")!.GetValue(i)! == user.Id);
            var status = (string)row.GetType().GetProperty("Status")!.GetValue(row)!;

            Assert.Equal(expectedStatus, status);
        }

        [Fact]
        public async Task GetUsers_AsPlatformOwnerAdmin_ReturnsUsersFromAllTenants()
        {
            var platformAdminId = AddUser(_platformTenantId, RoleKeys.AdminId, "platform.admin@sst.com").Id;
            AddUser(_tenantAId, RoleKeys.MemberId, "memberA@a.com");
            AddUser(_tenantBId, RoleKeys.MemberId, "memberB@b.com");
            SetActorAsPlatformOwnerAdmin(platformAdminId, _platformTenantId);
            var controller = BuildController();

            var result = await controller.GetUsers(null, 1, null);

            var ok = Assert.IsType<OkObjectResult>(result);
            var items = GetItems(ok.Value!);
            var emails = items
                .Select(i => (string)i.GetType().GetProperty("Email")!.GetValue(i)!)
                .ToList();

            Assert.Contains("memberA@a.com", emails);
            Assert.Contains("memberB@b.com", emails);
        }

        [Fact]
        public async Task UpdateUser_AsPlatformOwnerAdmin_CanEditAdminInAnotherTenant()
        {
            var platformAdminId = AddUser(_platformTenantId, RoleKeys.AdminId, "platform.admin2@sst.com").Id;
            var otherAdmin = AddUser(_tenantAId, RoleKeys.AdminId, "other-admin@a.com");
            SetActorAsPlatformOwnerAdmin(platformAdminId, _platformTenantId);
            var controller = BuildController();

            var result = await controller.UpdateUser(otherAdmin.Id, new UpdateUserRequest
            {
                FullName = "Editado por Admin de Plataforma",
                Email = "other-admin@a.com"
            });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task DeleteUser_AsPlatformOwnerAdmin_TargetingAnotherAdmin_ReturnsForbid()
        {
            var platformAdminId = AddUser(_platformTenantId, RoleKeys.AdminId, "platform.admin3@sst.com").Id;
            var otherAdmin = AddUser(_tenantAId, RoleKeys.AdminId, "other-admin2@a.com");
            SetActorAsPlatformOwnerAdmin(platformAdminId, _platformTenantId);
            var controller = BuildController();

            var result = await controller.DeleteUser(otherAdmin.Id);

            Assert.IsType<ForbidResult>(result);
            Assert.True(await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Id == otherAdmin.Id));
        }

        [Fact]
        public async Task DeleteUser_AsPlatformOwnerAdmin_TargetingMemberInAnotherTenant_Succeeds()
        {
            var platformAdminId = AddUser(_platformTenantId, RoleKeys.AdminId, "platform.admin4@sst.com").Id;
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member-to-delete@a.com");
            SetActorAsPlatformOwnerAdmin(platformAdminId, _platformTenantId);
            var controller = BuildController();

            var result = await controller.DeleteUser(member.Id);

            Assert.IsType<OkObjectResult>(result);
            Assert.False(await _dbContext.Users.IgnoreQueryFilters().AnyAsync(u => u.Id == member.Id));
        }

        [Fact]
        public async Task DeleteUser_AsSuperAdmin_TargetingAdmin_Succeeds()
        {
            var superAdminId = Guid.NewGuid();
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "deletable-admin@a.com");
            SetActorAsSuperAdmin(superAdminId);
            var controller = BuildController();

            var result = await controller.DeleteUser(admin.Id);

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task CreateUser_WithServiceNotEnabledForTenant_ReturnsBadRequest()
        {
            var actingAdminId = AddUser(_tenantBId, RoleKeys.AdminId, "actorB@b.com").Id;
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_tenantBId); // Tenant B solo tiene "documents"
            _mockCurrentUser.Setup(c => c.UserId).Returns(actingAdminId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.CreateUser(new CreateUserRequest
            {
                FullName = "Usuario Restringido",
                Email = "restringido@b.com",
                ServiceIds = new List<int> { _usersServiceId } // Tenant B no tiene "users" habilitado
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task CreateUser_WithoutServiceIds_DefaultsToAllTenantServices()
        {
            var actingAdminId = AddUser(_tenantAId, RoleKeys.AdminId, "actorA@a.com").Id;
            SetActorAsAdminOfTenantA(actingAdminId);
            var controller = BuildController();

            var result = await controller.CreateUser(new CreateUserRequest
            {
                FullName = "Usuario Completo",
                Email = "completo@a.com"
            });

            Assert.IsType<OkObjectResult>(result);
            var created = await _dbContext.Users.IgnoreQueryFilters()
                .Include(u => u.EnabledServices)
                .FirstAsync(u => u.Email == "completo@a.com");
            Assert.Equal(2, created.EnabledServices.Count); // docs + users, todo lo que Tenant A habilitó
        }

        [Fact]
        public async Task UpdateUser_WithServiceNotEnabledForTenant_ReturnsBadRequest()
        {
            var actingAdminId = AddUser(_tenantBId, RoleKeys.AdminId, "actorB2@b.com").Id;
            var member = AddUser(_tenantBId, RoleKeys.MemberId, "memberB2@b.com");
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_tenantBId);
            _mockCurrentUser.Setup(c => c.UserId).Returns(actingAdminId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.UpdateUser(member.Id, new UpdateUserRequest
            {
                FullName = member.FullName,
                Email = member.Email,
                ServiceIds = new List<int> { _usersServiceId }
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task CreateUser_WithDashboardCardNotEnabledForTenant_ReturnsBadRequest()
        {
            var actingAdminId = AddUser(_tenantBId, RoleKeys.AdminId, "actorB3@b.com").Id;
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_tenantBId); // Tenant B solo tiene "cumplimiento-general"
            _mockCurrentUser.Setup(c => c.UserId).Returns(actingAdminId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.CreateUser(new CreateUserRequest
            {
                FullName = "Usuario Restringido",
                Email = "restringidocard@b.com",
                DashboardCardIds = new List<int> { _comprasCardId } // Tenant B no tiene "compras-mes" habilitada
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task CreateUser_WithoutDashboardCardIds_DefaultsToAllTenantDashboardCards()
        {
            var actingAdminId = AddUser(_tenantAId, RoleKeys.AdminId, "actorA2@a.com").Id;
            SetActorAsAdminOfTenantA(actingAdminId);
            var controller = BuildController();

            var result = await controller.CreateUser(new CreateUserRequest
            {
                FullName = "Usuario Completo",
                Email = "completocard@a.com"
            });

            Assert.IsType<OkObjectResult>(result);
            var created = await _dbContext.Users.IgnoreQueryFilters()
                .Include(u => u.EnabledDashboardCards)
                .FirstAsync(u => u.Email == "completocard@a.com");
            Assert.Equal(2, created.EnabledDashboardCards.Count); // cumplimiento + compras, todo lo que Tenant A habilitó
        }

        [Fact]
        public async Task UpdateUser_WithDashboardCardNotEnabledForTenant_ReturnsBadRequest()
        {
            var actingAdminId = AddUser(_tenantBId, RoleKeys.AdminId, "actorB4@b.com").Id;
            var member = AddUser(_tenantBId, RoleKeys.MemberId, "memberB4@b.com");
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_tenantBId);
            _mockCurrentUser.Setup(c => c.UserId).Returns(actingAdminId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.UpdateUser(member.Id, new UpdateUserRequest
            {
                FullName = member.FullName,
                Email = member.Email,
                DashboardCardIds = new List<int> { _comprasCardId }
            });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        private static System.Collections.Generic.List<object> GetItems(object payload)
        {
            var itemsProperty = payload.GetType().GetProperty("Items")
                ?? throw new InvalidOperationException("La respuesta no contiene la propiedad 'Items'.");
            var itemsValue = (System.Collections.IEnumerable)itemsProperty.GetValue(payload)!;
            return itemsValue.Cast<object>().ToList();
        }
    }
}
