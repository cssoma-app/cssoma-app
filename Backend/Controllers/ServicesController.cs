using System.Linq;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Controllers
{
    [Authorize(Roles = "SuperAdmin")]
    [ApiController]
    [Route("api/services")]
    public class ServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;

        public ServicesController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetServices()
        {
            var services = await _dbContext.SassServices
                .OrderBy(s => s.Id)
                .ToListAsync();

            return Ok(services);
        }

        [HttpPost("toggle/{id}")]
        public async Task<IActionResult> ToggleService(int id)
        {
            var service = await _dbContext.SassServices.FindAsync(id);
            if (service == null)
            {
                return NotFound(new { Message = "Servicio no encontrado." });
            }

            service.IsEnabled = !service.IsEnabled;
            _dbContext.SassServices.Update(service);
            await _dbContext.SaveChangesAsync();

            return Ok(new
            {
                Message = $"Servicio '{service.Name}' {(service.IsEnabled ? "habilitado" : "deshabilitado")} exitosamente.",
                Service = service
            });
        }
    }
}
