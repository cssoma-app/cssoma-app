using System;
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
    public class TenantsControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<IPasswordHasher<User>> _mockPasswordHasher;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;

        private readonly Guid _platformTenantId = Guid.NewGuid();
        private readonly Guid _clientTenantId = Guid.NewGuid();

        public TenantsControllerTests()
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
            _dbContext.Tenants.Add(new Tenant { Id = _platformTenantId, Name = "SSTerra Consultores", RazonSocial = "TECHNOLO-GIS S.A.S.", NitRuc = "900.985.000-1", IsActive = true, IsPlatformOwner = true });
            _dbContext.Tenants.Add(new Tenant { Id = _clientTenantId, Name = "Cliente XYZ", RazonSocial = "XYZ S.A.S.", NitRuc = "1", IsActive = true, IsPlatformOwner = false });
            _dbContext.SaveChanges();

            _mockEmailService = new Mock<IEmailService>();
            _mockPasswordHasher = new Mock<IPasswordHasher<User>>();
            _mockPasswordHasher.Setup(h => h.HashPassword(It.IsAny<User>(), It.IsAny<string>())).Returns("hashed");
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private TenantsController BuildController()
        {
            var service = new TenantService(_dbContext, _mockPasswordHasher.Object, _mockEmailService.Object, _mockCurrentUser.Object);
            return new TenantsController(service);
        }

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
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_clientTenantId);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
        }

        private void SetActorAsSuperAdmin()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.TenantId).Returns((Guid?)null);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
        }

        [Fact]
        public async Task GetTenants_AsPlatformOwnerAdmin_IsAllowed()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var result = await controller.GetTenants();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetTenants_AsRegularClientTenantAdmin_IsForbidden()
        {
            SetActorAsClientTenantAdmin();
            var controller = BuildController();

            var result = await controller.GetTenants();

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task CreateTenant_AsRegularClientTenantAdmin_IsForbidden()
        {
            SetActorAsClientTenantAdmin();
            var controller = BuildController();

            var result = await controller.CreateTenant(new CreateTenantRequest
            {
                Name = "Empresa Intrusa",
                RazonSocial = "Intrusa S.A.S.",
                NitRuc = "999",
                AdminEmail = "intruso@x.com"
            });

            Assert.IsType<ForbidResult>(result);
            Assert.False(await _dbContext.Tenants.AnyAsync(t => t.Name == "Empresa Intrusa"));
        }

        [Fact]
        public async Task CreateTenant_AsPlatformOwnerAdmin_Succeeds()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var result = await controller.CreateTenant(new CreateTenantRequest
            {
                Name = "Nueva Empresa Cliente",
                RazonSocial = "Nueva S.A.S.",
                NitRuc = "123",
                AdminEmail = "admin@nueva.com"
            });

            Assert.IsType<OkObjectResult>(result);
            var created = await _dbContext.Tenants.IgnoreQueryFilters().FirstAsync(t => t.Name == "Nueva Empresa Cliente");
            Assert.False(created.IsPlatformOwner);
        }

        [Fact]
        public async Task CreateTenant_WithInvalidDigitoVerificacion_ReturnsBadRequest()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var result = await controller.CreateTenant(new CreateTenantRequest
            {
                Name = "Empresa DV Inválido",
                RazonSocial = "DV S.A.S.",
                NitRuc = "123456789",
                DigitoVerificacion = "12", // más de un dígito
                AdminEmail = "admin@dvinvalido.com"
            });

            Assert.IsType<BadRequestObjectResult>(result);
            Assert.False(await _dbContext.Tenants.AnyAsync(t => t.Name == "Empresa DV Inválido"));
        }

        [Fact]
        public async Task CreateTenant_WithSstProfileFields_PersistsThem()
        {
            SetActorAsPlatformOwnerAdmin();
            var controller = BuildController();

            var result = await controller.CreateTenant(new CreateTenantRequest
            {
                Name = "Empresa Perfil SST",
                RazonSocial = "Perfil S.A.S.",
                NitRuc = "900123456",
                DigitoVerificacion = "7",
                AdminEmail = "admin@perfilsst.com",
                Ciiu = "1071",
                NumeroTrabajadores = 25,
                CentrosTrabajo = 2,
                ClaseRiesgo = "III",
                Arl = "Sura",
                ResponsableSst = "Juan Pérez",
                TieneCopasst = true,
                TieneComiteConvivencia = true,
                TieneBrigada = false,
                TieneContratistas = true
            });

            Assert.IsType<OkObjectResult>(result);
            var created = await _dbContext.Tenants.IgnoreQueryFilters().FirstAsync(t => t.Name == "Empresa Perfil SST");
            Assert.Equal("7", created.DigitoVerificacion);
            Assert.Equal("1071", created.Ciiu);
            Assert.Equal(25, created.NumeroTrabajadores);
            Assert.Equal(2, created.CentrosTrabajo);
            Assert.Equal("III", created.ClaseRiesgo);
            Assert.Equal("Sura", created.Arl);
            Assert.Equal("Juan Pérez", created.ResponsableSst);
            Assert.True(created.TieneCopasst);
            Assert.True(created.TieneComiteConvivencia);
            Assert.False(created.TieneBrigada);
            Assert.True(created.TieneContratistas);
        }

        [Fact]
        public async Task DeleteTenant_TargetingPlatformOwnerTenant_IsBlockedEvenForSuperAdmin()
        {
            SetActorAsSuperAdmin();
            var controller = BuildController();

            var result = await controller.DeleteTenant(_platformTenantId);

            Assert.IsType<BadRequestObjectResult>(result);
            Assert.True(await _dbContext.Tenants.AnyAsync(t => t.Id == _platformTenantId));
        }

        [Fact]
        public async Task ToggleActive_AsRegularClientTenantAdmin_IsForbidden()
        {
            SetActorAsClientTenantAdmin();
            var controller = BuildController();

            var result = await controller.ToggleActive(_clientTenantId);

            Assert.IsType<ForbidResult>(result);
        }
    }
}
