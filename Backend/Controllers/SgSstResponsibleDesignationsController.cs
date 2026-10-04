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
        private readonly ISgSstResponsibleDesignationPdfService _pdfService;
        private readonly ITenantService _tenantService;

        public SgSstResponsibleDesignationsController(
            ISgSstResponsibleDesignationService designationService,
            ISgSstFunctionCatalogReader functionCatalogReader,
            ICurrentUserService currentUserService,
            ISgSstResponsibleDesignationPdfService pdfService,
            ITenantService tenantService)
        {
            _designationService = designationService;
            _functionCatalogReader = functionCatalogReader;
            _currentUserService = currentUserService;
            _pdfService = pdfService;
            _tenantService = tenantService;
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

        // PDF oficial generado en servidor (QuestPDF) a partir de la designación vigente ya
        // radicada — nunca del estado sin guardar del formulario. Requiere que exista una
        // designación Active; si no, no hay nada "guardado y firmado" que exportar todavía.
        [HttpGet("current/pdf")]
        public async Task<IActionResult> GetCurrentPdf()
        {
            var tenantResult = await _tenantService.GetCurrentTenantAsync();
            if (tenantResult.Outcome != ServiceOutcome.Ok || tenantResult.Data == null)
                return this.ToActionResult(tenantResult);

            var currentResult = await _designationService.GetCurrentAsync();
            if (currentResult.Outcome != ServiceOutcome.Ok || currentResult.Data == null)
                return NotFound(new { message = "No hay una designación vigente radicada. Firma y radica el formulario antes de exportar el PDF oficial." });

            var historyResult = await _designationService.GetHistoryAsync();
            var history = historyResult.Outcome == ServiceOutcome.Ok ? historyResult.Data ?? new() : new();

            var pdfBytes = _pdfService.GeneratePdf(tenantResult.Data, currentResult.Data, history);
            var fileName = $"FOR-SST-001_Designacion_Responsable_SGSST_v{currentResult.Data.Version:00}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [Idempotent]
        [HttpPost]
        public async Task<IActionResult> CreateDesignation([FromBody] CreateSgSstResponsibleDesignationRequest? request)
        {
            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            if (!_currentUserService.UserId.HasValue)
                return StatusCode(401, new { message = "No autenticado." });

            var input = MapToInput(request);
            var result = await _designationService.CreateAsync(input, _currentUserService.UserId.Value);
            return this.ToActionResult(result);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpGet("draft")]
        public async Task<IActionResult> GetDraft()
        {
            var result = await _designationService.GetDraftAsync();
            return this.ToActionResult(result);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPost("draft")]
        public async Task<IActionResult> SaveDraft([FromBody] CreateSgSstResponsibleDesignationRequest? request)
        {
            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            if (!_currentUserService.UserId.HasValue)
                return StatusCode(401, new { message = "No autenticado." });

            var input = MapToInput(request);
            var result = await _designationService.SaveDraftAsync(input, _currentUserService.UserId.Value);
            return this.ToActionResult(result);
        }

        private static CreateSgSstResponsibleDesignationInput MapToInput(CreateSgSstResponsibleDesignationRequest request)
        {
            return new CreateSgSstResponsibleDesignationInput
            {
                CoberturaCentroTrabajo = request.CoberturaCentroTrabajo ?? string.Empty,
                CoberturaDetalle = request.CoberturaDetalle,
                OrganizacionDepartamento = request.OrganizacionDepartamento ?? string.Empty,
                OrganizacionMunicipio = request.OrganizacionMunicipio ?? string.Empty,
                OrganizacionNivelRiesgoArl = request.OrganizacionNivelRiesgoArl ?? string.Empty,
                OrganizacionActividadEconomica = request.OrganizacionActividadEconomica ?? string.Empty,
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
                EmpleadorFirmaImagen = request.EmpleadorFirmaImagen,
                ResponsableAceptaNombre = request.ResponsableAceptaNombre ?? string.Empty,
                ResponsableAceptaLicencia = request.ResponsableAceptaLicencia ?? string.Empty,
                ResponsableAceptaDocumento = request.ResponsableAceptaDocumento ?? string.Empty,
                ResponsableFirmaImagen = request.ResponsableFirmaImagen,
                SuscripcionCiudad = request.SuscripcionCiudad ?? string.Empty,
                SuscripcionFecha = request.SuscripcionFecha,
                FunctionAcceptances = request.FunctionAcceptances.ConvertAll(f => new FunctionAcceptanceInput
                {
                    FunctionId = f.FunctionId,
                    IsAccepted = f.IsAccepted
                })
            };
        }
    }
}
