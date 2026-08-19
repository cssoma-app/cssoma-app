using System.Threading.Tasks;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    // Controller delgado: toda la lógica de negocio vive en IServicesService (Regla 2, AGENTS.md).
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ApiController]
    [Route("api/services")]
    public class ServicesController : ControllerBase
    {
        private readonly IServicesService _servicesService;

        public ServicesController(IServicesService servicesService)
        {
            _servicesService = servicesService;
        }

        [HttpGet]
        public async Task<IActionResult> GetServices()
        {
            var result = await _servicesService.GetAllServicesAsync();
            return this.ToActionResult(result);
        }

        [HttpPost("toggle/{id}")]
        public async Task<IActionResult> ToggleService(int id)
        {
            var result = await _servicesService.ToggleServiceAsync(id);
            if (result.Outcome != ServiceOutcome.Ok)
            {
                return this.ToActionResult(result);
            }

            return Ok(new { Message = result.Message, Service = result.Data });
        }
    }
}
