using System;
using System.Linq;
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
    public class AlertsControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;

        private readonly Guid _tenantAId = Guid.NewGuid();
        private readonly Guid _tenantBId = Guid.NewGuid();

        public AlertsControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockCurrentUser = new Mock<ICurrentUserService>();
            _dbContext = new ApplicationDbContext(options, _mockCurrentUser.Object);

            _dbContext.Roles.AddRange(
                new Role { Id = RoleKeys.SuperAdminId, Key = RoleKeys.SuperAdmin, DisplayName = "Super Administrador" },
                new Role { Id = RoleKeys.AdminId, Key = RoleKeys.Admin, DisplayName = "Administrador de Empresa" },
                new Role { Id = RoleKeys.MemberId, Key = RoleKeys.Member, DisplayName = "Colaborador" }
            );
            _dbContext.Tenants.Add(new Tenant { Id = _tenantAId, Name = "Tenant A", RazonSocial = "A S.A.S.", NitRuc = "1", IsActive = true });
            _dbContext.Tenants.Add(new Tenant { Id = _tenantBId, Name = "Tenant B", RazonSocial = "B S.A.S.", NitRuc = "2", IsActive = true });
            _dbContext.SaveChanges();
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private AlertsController BuildController() =>
            new AlertsController(new AlertService(_dbContext, _mockCurrentUser.Object));

        private User AddUser(Guid tenantId, Guid roleId, string email)
        {
            var user = new User
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
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

        private void SetActorAsAdmin(Guid userId, Guid tenantId)
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(tenantId);
            _mockCurrentUser.Setup(c => c.UserId).Returns(userId);
        }

        private void SetActorAsSuperAdmin(Guid userId)
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.TenantId).Returns((Guid?)null);
            _mockCurrentUser.Setup(c => c.UserId).Returns(userId);
        }

        private void SetActorAsMember(Guid userId, Guid tenantId)
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.TenantId).Returns(tenantId);
            _mockCurrentUser.Setup(c => c.UserId).Returns(userId);
        }

        [Fact]
        public async Task CreateAlert_AsAdmin_ForOwnTenantUser_Succeeds()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin@a.com");
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member@a.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var controller = BuildController();

            var result = await controller.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Aviso", Message = "Revisa esto" });

            Assert.IsType<OkObjectResult>(result);
            var alert = await _dbContext.Alerts.IgnoreQueryFilters().FirstAsync(a => a.RecipientUserId == member.Id);
            Assert.Equal("Aviso", alert.Title);
            Assert.Equal(admin.Id, alert.CreatedByUserId);
            Assert.False(alert.IsAccepted);
        }

        [Fact]
        public async Task CreateAlert_AsAdmin_ForOtherTenantUser_ReturnsForbid()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin2@a.com");
            var otherTenantMember = AddUser(_tenantBId, RoleKeys.MemberId, "member@b.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var controller = BuildController();

            var result = await controller.Create(new CreateAlertRequest { RecipientUserId = otherTenantMember.Id, Title = "Aviso", Message = "Revisa esto" });

            Assert.IsType<ForbidResult>(result);
            Assert.False(await _dbContext.Alerts.IgnoreQueryFilters().AnyAsync());
        }

        [Fact]
        public async Task CreateAlert_AsSuperAdmin_ForAnyTenantUser_Succeeds()
        {
            var superAdminId = Guid.NewGuid();
            var member = AddUser(_tenantBId, RoleKeys.MemberId, "member2@b.com");
            SetActorAsSuperAdmin(superAdminId);
            var controller = BuildController();

            var result = await controller.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Global", Message = "Aviso de plataforma" });

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task CreateAlert_AsMember_ReturnsForbid()
        {
            var actorMember = AddUser(_tenantAId, RoleKeys.MemberId, "actor@a.com");
            var target = AddUser(_tenantAId, RoleKeys.MemberId, "target@a.com");
            SetActorAsMember(actorMember.Id, _tenantAId);
            var controller = BuildController();

            var result = await controller.Create(new CreateAlertRequest { RecipientUserId = target.Id, Title = "Aviso", Message = "Mensaje" });

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task CreateAlert_WithBlankTitle_ReturnsBadRequest()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin3@a.com");
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member3@a.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var controller = BuildController();

            var result = await controller.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "   ", Message = "Mensaje" });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task AcceptAlert_AsRecipient_MarksAccepted()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin4@a.com");
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member4@a.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var creatorController = BuildController();
            await creatorController.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Aviso", Message = "Revisa" });
            var alert = await _dbContext.Alerts.IgnoreQueryFilters().FirstAsync(a => a.RecipientUserId == member.Id);

            SetActorAsMember(member.Id, _tenantAId);
            var recipientController = BuildController();
            var result = await recipientController.Accept(alert.Id);

            Assert.IsType<OkObjectResult>(result);
            var updated = await _dbContext.Alerts.IgnoreQueryFilters().FirstAsync(a => a.Id == alert.Id);
            Assert.True(updated.IsAccepted);
            Assert.NotNull(updated.AcceptedAt);
        }

        [Fact]
        public async Task AcceptAlert_AsNonRecipient_ReturnsForbid()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin5@a.com");
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member5@a.com");
            var otherMember = AddUser(_tenantAId, RoleKeys.MemberId, "other5@a.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var creatorController = BuildController();
            await creatorController.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Aviso", Message = "Revisa" });
            var alert = await _dbContext.Alerts.IgnoreQueryFilters().FirstAsync(a => a.RecipientUserId == member.Id);

            SetActorAsMember(otherMember.Id, _tenantAId);
            var intruderController = BuildController();
            var result = await intruderController.Accept(alert.Id);

            Assert.IsType<ForbidResult>(result);
            var unchanged = await _dbContext.Alerts.IgnoreQueryFilters().FirstAsync(a => a.Id == alert.Id);
            Assert.False(unchanged.IsAccepted);
        }

        [Fact]
        public async Task DeleteAlert_AsRecipient_RemovesRow()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin6@a.com");
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member6@a.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var creatorController = BuildController();
            await creatorController.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Aviso", Message = "Revisa" });
            var alert = await _dbContext.Alerts.IgnoreQueryFilters().FirstAsync(a => a.RecipientUserId == member.Id);

            SetActorAsMember(member.Id, _tenantAId);
            var recipientController = BuildController();
            var result = await recipientController.Delete(alert.Id);

            Assert.IsType<OkObjectResult>(result);
            Assert.False(await _dbContext.Alerts.IgnoreQueryFilters().AnyAsync(a => a.Id == alert.Id));
        }

        [Fact]
        public async Task DeleteAlert_AsNonRecipient_ReturnsForbid()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin7@a.com");
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member7@a.com");
            var otherMember = AddUser(_tenantAId, RoleKeys.MemberId, "other7@a.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var creatorController = BuildController();
            await creatorController.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Aviso", Message = "Revisa" });
            var alert = await _dbContext.Alerts.IgnoreQueryFilters().FirstAsync(a => a.RecipientUserId == member.Id);

            SetActorAsMember(otherMember.Id, _tenantAId);
            var intruderController = BuildController();
            var result = await intruderController.Delete(alert.Id);

            Assert.IsType<ForbidResult>(result);
            Assert.True(await _dbContext.Alerts.IgnoreQueryFilters().AnyAsync(a => a.Id == alert.Id));
        }

        [Fact]
        public async Task GetMyAlerts_OnlyReturnsOwnAlerts_OrderedNewestFirst()
        {
            var admin = AddUser(_tenantAId, RoleKeys.AdminId, "admin8@a.com");
            var member = AddUser(_tenantAId, RoleKeys.MemberId, "member8@a.com");
            var otherMember = AddUser(_tenantAId, RoleKeys.MemberId, "other8@a.com");
            SetActorAsAdmin(admin.Id, _tenantAId);
            var creatorController = BuildController();
            await creatorController.Create(new CreateAlertRequest { RecipientUserId = otherMember.Id, Title = "No es mía", Message = "..." });
            await creatorController.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Primera", Message = "..." });
            await creatorController.Create(new CreateAlertRequest { RecipientUserId = member.Id, Title = "Segunda", Message = "..." });

            SetActorAsMember(member.Id, _tenantAId);
            var recipientController = BuildController();
            var result = await recipientController.GetMine();

            var ok = Assert.IsType<OkObjectResult>(result);
            var alerts = Assert.IsAssignableFrom<System.Collections.Generic.List<AlertDto>>(ok.Value);
            Assert.Equal(2, alerts.Count);
            Assert.Equal("Segunda", alerts[0].Title); // más reciente primero
            Assert.Equal("Usuario admin8@a.com", alerts[0].SenderName);
        }
    }
}
