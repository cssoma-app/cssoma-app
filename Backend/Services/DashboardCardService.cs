using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Helpers;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    // Regla 2, AGENTS.md: toda la lógica de negocio vive aquí, no en el controller.
    public class DashboardCardService : IDashboardCardService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public DashboardCardService(ApplicationDbContext dbContext, ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        // SuperAdmin o Admin del tenant propietario de la plataforma: mismo criterio que
        // TenantService/UserService/ServicesService para las pantallas de configuración
        // global de la plataforma.
        private bool HasBroadAccess()
        {
            return _currentUserService.IsSuperAdmin ||
                   (_currentUserService.IsAdmin && _currentUserService.IsPlatformOwnerTenant);
        }

        public async Task<ServiceResult<List<DashboardCardDto>>> GetAllCardsAsync()
        {
            if (!HasBroadAccess())
            {
                return ServiceResult<List<DashboardCardDto>>.Forbidden();
            }

            var cards = await _dbContext.DashboardCards
                .OrderBy(c => c.TabKey).ThenBy(c => c.Id)
                .Select(c => new DashboardCardDto
                {
                    Id = c.Id,
                    Key = c.Key,
                    TabKey = c.TabKey,
                    Name = c.Name,
                    Description = c.Description,
                    IsEnabled = c.IsEnabled
                })
                .ToListAsync();

            return ServiceResult<List<DashboardCardDto>>.Ok(cards);
        }

        public async Task<ServiceResult<DashboardCardDto>> ToggleCardAsync(int id)
        {
            if (!HasBroadAccess())
            {
                return ServiceResult<DashboardCardDto>.Forbidden();
            }

            var card = await _dbContext.DashboardCards.FindAsync(id);
            if (card == null)
            {
                return ServiceResult<DashboardCardDto>.NotFound("Tarjeta no encontrada.");
            }

            card.IsEnabled = !card.IsEnabled;
            await _dbContext.SaveChangesAsync();

            return ServiceResult<DashboardCardDto>.Ok(new DashboardCardDto
            {
                Id = card.Id,
                Key = card.Key,
                TabKey = card.TabKey,
                Name = card.Name,
                Description = card.Description,
                IsEnabled = card.IsEnabled
            }, $"Tarjeta '{card.Name}' {(card.IsEnabled ? "habilitada" : "deshabilitada")} exitosamente.");
        }

        public async Task<ServiceResult<DashboardCardDto>> RenameCardAsync(int id, string name)
        {
            if (!HasBroadAccess())
            {
                return ServiceResult<DashboardCardDto>.Forbidden();
            }

            var nameCleaned = InputSanitizer.SanitizeText(name ?? string.Empty);
            if (string.IsNullOrWhiteSpace(nameCleaned))
            {
                return ServiceResult<DashboardCardDto>.BadRequest("El nombre de la tarjeta es requerido.");
            }

            var card = await _dbContext.DashboardCards.FindAsync(id);
            if (card == null)
            {
                return ServiceResult<DashboardCardDto>.NotFound("Tarjeta no encontrada.");
            }

            card.Name = nameCleaned;
            await _dbContext.SaveChangesAsync();

            return ServiceResult<DashboardCardDto>.Ok(new DashboardCardDto
            {
                Id = card.Id,
                Key = card.Key,
                TabKey = card.TabKey,
                Name = card.Name,
                Description = card.Description,
                IsEnabled = card.IsEnabled
            }, $"Tarjeta renombrada a '{card.Name}' con éxito.");
        }

        // Claves de tarjeta efectivamente visibles para el usuario autenticado, usadas por
        // /dashboard en el frontend. SuperAdmin queda exento: siempre ve todo.
        public async Task<ServiceResult<MyDashboardCardsDto>> GetMyDashboardCardsAsync()
        {
            if (_currentUserService.IsSuperAdmin)
            {
                return ServiceResult<MyDashboardCardsDto>.Ok(new MyDashboardCardsDto { All = true, Keys = new List<string>() });
            }

            if (!_currentUserService.UserId.HasValue)
            {
                return ServiceResult<MyDashboardCardsDto>.Forbidden();
            }

            var keys = await _dbContext.Users
                .IgnoreQueryFilters()
                .Where(u => u.Id == _currentUserService.UserId.Value)
                .SelectMany(u => u.EnabledDashboardCards)
                .Where(c => c.IsEnabled)
                .Select(c => c.Key)
                .Distinct()
                .ToListAsync();

            return ServiceResult<MyDashboardCardsDto>.Ok(new MyDashboardCardsDto { All = false, Keys = keys });
        }
    }
}
