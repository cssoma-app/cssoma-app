using BackendAPI.Services;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    // Traduce el resultado tipado de la capa de Services a la respuesta HTTP correspondiente —
    // mantiene los controllers delgados (Regla 2, AGENTS.md): sin lógica de negocio, solo mapeo.
    public static class ServiceResultExtensions
    {
        public static IActionResult ToActionResult(this ControllerBase controller, ServiceResult result)
        {
            return result.Outcome switch
            {
                ServiceOutcome.Ok => controller.Ok(new { Message = result.Message }),
                ServiceOutcome.BadRequest => controller.BadRequest(new { Message = result.Message }),
                ServiceOutcome.NotFound => controller.NotFound(new { Message = result.Message }),
                ServiceOutcome.Forbidden => controller.Forbid(),
                ServiceOutcome.Error => controller.StatusCode(500, new { Message = result.Message }),
                _ => controller.StatusCode(500)
            };
        }

        // Para endpoints GET que devuelven una colección/objeto de datos (sin envoltorio Message)
        // en el caso Ok — el frontend ya espera el shape crudo en esos endpoints.
        public static IActionResult ToActionResult<T>(this ControllerBase controller, ServiceResult<T> result)
        {
            return result.Outcome switch
            {
                ServiceOutcome.Ok => controller.Ok(result.Data),
                ServiceOutcome.BadRequest => controller.BadRequest(new { Message = result.Message }),
                ServiceOutcome.NotFound => controller.NotFound(new { Message = result.Message }),
                ServiceOutcome.Forbidden => controller.Forbid(),
                ServiceOutcome.Error => controller.StatusCode(500, new { Message = result.Message }),
                _ => controller.StatusCode(500)
            };
        }
    }
}
