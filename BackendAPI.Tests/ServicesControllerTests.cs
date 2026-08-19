using System;
using System.Threading.Tasks;
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
    public class ServicesControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;
        private readonly int _serviceId;

        public ServicesControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockCurrentUser = new Mock<ICurrentUserService>();
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(true);
            _dbContext = new ApplicationDbContext(options, _mockCurrentUser.Object);

            var service = new SassService { Key = "pipeline", ParentKey = "development", Name = "Pipeline CI/CD", Description = "Estado del pipeline.", IsEnabled = true };
            _dbContext.SassServices.Add(service);
            _dbContext.SaveChanges();
            _serviceId = service.Id;
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private ServicesController BuildController() =>
            new ServicesController(new ServicesService(_dbContext, _mockCurrentUser.Object));

        [Fact]
        public async Task GetServices_AsSuperAdmin_Succeeds()
        {
            var controller = BuildController();

            var result = await controller.GetServices();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetServices_AsPlatformOwnerAdmin_Succeeds()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(true);
            var controller = BuildController();

            var result = await controller.GetServices();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetServices_AsClientTenantAdmin_ReturnsForbid()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.GetServices();

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task ToggleService_AsPlatformOwnerAdmin_FlipsIsEnabled()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(true);
            var controller = BuildController();

            var result = await controller.ToggleService(_serviceId);

            var ok = Assert.IsType<OkObjectResult>(result);
            var service = await _dbContext.SassServices.FirstAsync(s => s.Id == _serviceId);
            Assert.False(service.IsEnabled);
            Assert.NotNull(ok.Value);
        }

        [Fact]
        public async Task ToggleService_AsClientTenantAdmin_ReturnsForbid()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.ToggleService(_serviceId);

            Assert.IsType<ForbidResult>(result);
            var service = await _dbContext.SassServices.FirstAsync(s => s.Id == _serviceId);
            Assert.True(service.IsEnabled); // no se modificó
        }

        [Fact]
        public async Task ToggleService_UnknownId_ReturnsNotFound()
        {
            var controller = BuildController();

            var result = await controller.ToggleService(999999);

            Assert.IsType<NotFoundObjectResult>(result);
        }
    }
}
