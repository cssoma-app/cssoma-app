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
    public class DashboardCardsControllerTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;
        private readonly int _cardId;

        public DashboardCardsControllerTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockCurrentUser = new Mock<ICurrentUserService>();
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(true);
            _dbContext = new ApplicationDbContext(options, _mockCurrentUser.Object);

            var card = new DashboardCard { Key = "compras-mes", TabKey = "tab2", Name = "Compras del Mes", Description = "Ingresos del mes.", IsEnabled = true };
            _dbContext.DashboardCards.Add(card);
            _dbContext.SaveChanges();
            _cardId = card.Id;
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private DashboardCardsController BuildController() =>
            new DashboardCardsController(new DashboardCardService(_dbContext, _mockCurrentUser.Object));

        [Fact]
        public async Task ToggleCard_FlipsIsEnabled()
        {
            var controller = BuildController();

            var result = await controller.ToggleCard(_cardId);

            Assert.IsType<OkObjectResult>(result);
            var card = await _dbContext.DashboardCards.FirstAsync(c => c.Id == _cardId);
            Assert.False(card.IsEnabled);
        }

        [Fact]
        public async Task ToggleCard_UnknownId_ReturnsNotFound()
        {
            var controller = BuildController();

            var result = await controller.ToggleCard(999999);

            Assert.IsType<NotFoundObjectResult>(result);
        }

        [Fact]
        public async Task RenameCard_UpdatesName_ButNotKey()
        {
            var controller = BuildController();

            var result = await controller.RenameCard(_cardId, new RenameDashboardCardRequest { Name = "Ingresos Mensuales" });

            Assert.IsType<OkObjectResult>(result);
            var card = await _dbContext.DashboardCards.FirstAsync(c => c.Id == _cardId);
            Assert.Equal("Ingresos Mensuales", card.Name);
            Assert.Equal("compras-mes", card.Key); // el Key interno no cambia
        }

        [Fact]
        public async Task RenameCard_WithEmptyName_ReturnsBadRequest()
        {
            var controller = BuildController();

            var result = await controller.RenameCard(_cardId, new RenameDashboardCardRequest { Name = "   " });

            Assert.IsType<BadRequestObjectResult>(result);
        }

        [Fact]
        public async Task GetCards_ReturnsFullCatalog()
        {
            var controller = BuildController();

            var result = await controller.GetCards();

            var ok = Assert.IsType<OkObjectResult>(result);
            var cards = Assert.IsAssignableFrom<System.Collections.Generic.List<DashboardCardDto>>(ok.Value);
            Assert.Single(cards);
            Assert.Equal("compras-mes", cards[0].Key);
        }

        [Fact]
        public async Task GetCards_AsPlatformOwnerAdmin_Succeeds()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(true);
            var controller = BuildController();

            var result = await controller.GetCards();

            Assert.IsType<OkObjectResult>(result);
        }

        [Fact]
        public async Task GetCards_AsClientTenantAdmin_ReturnsForbid()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.GetCards();

            Assert.IsType<ForbidResult>(result);
        }

        [Fact]
        public async Task ToggleCard_AsClientTenantAdmin_ReturnsForbid()
        {
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsPlatformOwnerTenant).Returns(false);
            var controller = BuildController();

            var result = await controller.ToggleCard(_cardId);

            Assert.IsType<ForbidResult>(result);
            var card = await _dbContext.DashboardCards.FirstAsync(c => c.Id == _cardId);
            Assert.True(card.IsEnabled); // no se modificó
        }
    }
}
