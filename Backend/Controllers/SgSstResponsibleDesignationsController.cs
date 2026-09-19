using System;
using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Filters;
using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/sgsst/responsible-designations")]
    public class SgSstResponsibleDesignationsController : ControllerBase
    {
        private readonly ISgSstResponsibleDesignationService _designationService;
        private readonly ISgSstFunctionCatalogReader _functionCatalogReader;
        private readonly ICurrentUserService _currentUserService;

        public SgSstResponsibleDesignationsController(
            ISgSstResponsibleDesignationService designationService,
            ISgSstFunctionCatalogReader functionCatalogReader,
            ICurrentUserService currentUserService)
        {
            _designationService = designationService;
            _functionCatalogReader = functionCatalogReader;
            _currentUserService = currentUserService;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrent()
        {
            var result = await _designationService.GetCurrentAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var result = await _designationService.GetHistoryAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("functions-catalog")]
        public async Task<IActionResult> GetFunctionsCatalog()
        {
            var functions = await _functionCatalogReader.GetActiveFunctionsAsync();
            return Ok(functions);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [Idempotent]
        [HttpPost]
        public async Task<IActionResult> CreateDesignation([FromBody] CreateSgSstResponsibleDesignationRequest? request)
        {
            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            var input = new CreateSgSstResponsibleDesignationInput
            {
                CoberturaCentroTrabajo = request.CoberturaCentroTrabajo ?? string.Empty,
                CoberturaDetalle = request.CoberturaDetalle,
                ResponsableNombreCompleto = request.ResponsableNombreCompleto ?? string.Empty,
                ResponsableCargo = request.ResponsableCargo ?? string.Empty,
                ResponsableTipoDocumento = request.ResponsableTipoDocumento,
                ResponsableNumeroDocumento = request.ResponsableNumeroDocumento ?? string.Empty,
                NivelCompetencia = request.NivelCompetencia,
                LicenciaSstNumero = request.LicenciaSstNumero ?? string.Empty,
                LicenciaSstExpedidaPor = request.LicenciaSstExpedidaPor ?? string.Empty,
                Curso50HorasAprobado = request.Curso50HorasAprobado,
                FechaActualizacion20Horas = request.FechaActualizacion20Horas,
                EmpleadorAceptaNombre = request.EmpleadorAceptaNombre ?? string.Empty,
                EmpleadorAceptaCargo = request.EmpleadorAceptaCargo ?? string.Empty,
                EmpleadorAceptaDocumento = request.EmpleadorAceptaDocumento ?? string.Empty,
                ResponsableAceptaNombre = request.ResponsableAceptaNombre ?? string.Empty,
                ResponsableAceptaLicencia = request.ResponsableAceptaLicencia ?? string.Empty,
                ResponsableAceptaDocumento = request.ResponsableAceptaDocumento ?? string.Empty,
                SuscripcionCiudad = request.SuscripcionCiudad ?? string.Empty,
                SuscripcionFecha = request.SuscripcionFecha,
                FunctionAcceptances = request.FunctionAcceptances.ConvertAll(f => new FunctionAcceptanceInput
                {
                    FunctionId = f.FunctionId,
                    IsAccepted = f.IsAccepted
                })
            };

            if (!_currentUserService.UserId.HasValue)
                return Unauthorized();

            var result = await _designationService.CreateAsync(input, _currentUserService.UserId.Value);
            return this.ToActionResult(result);
        }
    }
}
