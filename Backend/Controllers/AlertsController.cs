using System;
using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Filters;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    // Controller delgado: toda la lógica de negocio vive en IAlertService (Regla 2, AGENTS.md).
    [Idempotent]
    [Authorize]
    [ApiController]
    [Route("api/alerts")]
    public class AlertsController : ControllerBase
    {
        private readonly IAlertService _alertService;

        public AlertsController(IAlertService alertService)
        {
            _alertService = alertService;
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var result = await _alertService.GetMyAlertsAsync();
            return this.ToActionResult(result);
        }

        [HttpPost("{id}/accept")]
        public async Task<IActionResult> Accept(Guid id)
        {
            var result = await _alertService.AcceptAlertAsync(id);
            return this.ToActionResult(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var result = await _alertService.DeleteAlertAsync(id);
            return this.ToActionResult(result);
        }

        // Solo Admin (de su propia empresa) o SuperAdmin (cualquiera) pueden mandar alertas —
        // se combina en AND con el [Authorize] de la clase.
        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateAlertRequest request)
        {
            var result = await _alertService.CreateAlertAsync(new CreateAlertInput
            {
                RecipientUserId = request?.RecipientUserId ?? Guid.Empty,
                Title = request?.Title ?? string.Empty,
                Message = request?.Message ?? string.Empty
            });
            return this.ToActionResult(result);
        }
    }
}
