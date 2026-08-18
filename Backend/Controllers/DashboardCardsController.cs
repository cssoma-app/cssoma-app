using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Filters;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    // Controller delgado: toda la lógica de negocio vive en IDashboardCardService (Regla 2, AGENTS.md).
    [Idempotent]
    [Authorize(Roles = "SuperAdmin")]
    [ApiController]
    [Route("api/dashboard-cards")]
    public class DashboardCardsController : ControllerBase
    {
        private readonly IDashboardCardService _dashboardCardService;

        public DashboardCardsController(IDashboardCardService dashboardCardService)
        {
            _dashboardCardService = dashboardCardService;
        }

        [HttpGet]
        public async Task<IActionResult> GetCards()
        {
            var result = await _dashboardCardService.GetAllCardsAsync();
            return this.ToActionResult(result);
        }

        [HttpPost("toggle/{id}")]
        public async Task<IActionResult> ToggleCard(int id)
        {
            var result = await _dashboardCardService.ToggleCardAsync(id);
            return this.ToActionResult(result);
        }

        [HttpPut("rename/{id}")]
        public async Task<IActionResult> RenameCard(int id, [FromBody] RenameDashboardCardRequest request)
        {
            var result = await _dashboardCardService.RenameCardAsync(id, request?.Name ?? string.Empty);
            return this.ToActionResult(result);
        }
    }
}
