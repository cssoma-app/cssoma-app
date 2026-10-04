using System;
using System.Threading.Tasks;
using BackendAPI.Contracts;
using BackendAPI.Filters;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/sgsst/budget-plans")]
    public class SgSstBudgetPlansController : ControllerBase
    {
        private readonly ISgSstBudgetPlanService _budgetPlanService;
        private readonly ICurrentUserService _currentUserService;
        private readonly ISgSstBudgetPlanPdfService _pdfService;
        private readonly ISgSstBudgetPlanExcelService _excelService;
        private readonly ITenantService _tenantService;

        public SgSstBudgetPlansController(
            ISgSstBudgetPlanService budgetPlanService,
            ICurrentUserService currentUserService,
            ISgSstBudgetPlanPdfService pdfService,
            ISgSstBudgetPlanExcelService excelService,
            ITenantService tenantService)
        {
            _budgetPlanService = budgetPlanService;
            _currentUserService = currentUserService;
            _pdfService = pdfService;
            _excelService = excelService;
            _tenantService = tenantService;
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrent()
        {
            var result = await _budgetPlanService.GetCurrentAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetHistory()
        {
            var result = await _budgetPlanService.GetHistoryAsync();
            return this.ToActionResult(result);
        }

        // PDF oficial generado en servidor (QuestPDF) a partir del presupuesto vigente ya
        // radicado — nunca del estado sin guardar del formulario. Requiere que exista un
        // presupuesto Active; si no, no hay nada "guardado y firmado" que exportar todavía.
        [HttpGet("current/pdf")]
        public async Task<IActionResult> GetCurrentPdf()
        {
            var tenantResult = await _tenantService.GetCurrentTenantAsync();
            if (tenantResult.Outcome != ServiceOutcome.Ok || tenantResult.Data == null)
                return this.ToActionResult(tenantResult);

            var currentResult = await _budgetPlanService.GetCurrentAsync();
            if (currentResult.Outcome != ServiceOutcome.Ok || currentResult.Data == null)
                return NotFound(new { message = "No hay un presupuesto vigente radicado. Firma y radica el formulario antes de exportar el PDF oficial." });

            var pdfBytes = _pdfService.GeneratePdf(tenantResult.Data, currentResult.Data);
            var fileName = $"FOR-SST-004_Presupuesto_Recursos_SGSST_v{currentResult.Data.Version:00}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }

        // Excel oficial (ClosedXML) generado a partir del MISMO DTO que el PDF — nunca se
        // recalculan subtotales ni se vuelve a consultar la base de datos en el servicio de Excel.
        // Mismo guard que el PDF: solo existe si hay un presupuesto Active radicado.
        [HttpGet("current/excel")]
        public async Task<IActionResult> GetCurrentExcel()
        {
            var tenantResult = await _tenantService.GetCurrentTenantAsync();
            if (tenantResult.Outcome != ServiceOutcome.Ok || tenantResult.Data == null)
                return this.ToActionResult(tenantResult);

            var currentResult = await _budgetPlanService.GetCurrentAsync();
            if (currentResult.Outcome != ServiceOutcome.Ok || currentResult.Data == null)
                return NotFound(new { message = "No hay un presupuesto vigente radicado. Firma y radica el formulario antes de exportar el Excel oficial." });

            var excelBytes = _excelService.GenerateExcel(tenantResult.Data, currentResult.Data);
            var fileName = $"FOR-SST-004_Presupuesto_Recursos_SGSST_v{currentResult.Data.Version:00}.xlsx";
            return File(excelBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [Idempotent]
        [HttpPost]
        public async Task<IActionResult> CreateBudgetPlan([FromBody] CreateSgSstBudgetPlanRequest? request)
        {
            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            if (!_currentUserService.UserId.HasValue)
                return StatusCode(401, new { message = "No autenticado." });

            var input = MapToInput(request);
            var result = await _budgetPlanService.CreateAsync(input, _currentUserService.UserId.Value);
            return this.ToActionResult(result);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpGet("draft")]
        public async Task<IActionResult> GetDraft()
        {
            var result = await _budgetPlanService.GetDraftAsync();
            return this.ToActionResult(result);
        }

        [Authorize(Roles = "SuperAdmin,Admin")]
        [HttpPost("draft")]
        public async Task<IActionResult> SaveDraft([FromBody] CreateSgSstBudgetPlanRequest? request)
        {
            if (request == null)
                return BadRequest(new { message = "Request body is required." });

            if (!_currentUserService.UserId.HasValue)
                return StatusCode(401, new { message = "No autenticado." });

            var input = MapToInput(request);
            var result = await _budgetPlanService.SaveDraftAsync(input, _currentUserService.UserId.Value);
            return this.ToActionResult(result);
        }

        private static CreateSgSstBudgetPlanInput MapToInput(CreateSgSstBudgetPlanRequest request)
        {
            return new CreateSgSstBudgetPlanInput
            {
                Vigencia = request.Vigencia,
                RepresentanteLegalNombre = request.RepresentanteLegalNombre ?? string.Empty,
                RepresentanteLegalDocumento = request.RepresentanteLegalDocumento ?? string.Empty,
                RepresentanteLegalFirmaImagen = request.RepresentanteLegalFirmaImagen,
                ResponsableSgSstNombre = request.ResponsableSgSstNombre ?? string.Empty,
                ResponsableSgSstDocumento = request.ResponsableSgSstDocumento ?? string.Empty,
                ResponsableSgSstFirmaImagen = request.ResponsableSgSstFirmaImagen,
                LineItems = request.LineItems.ConvertAll(li => new BudgetLineItemInput
                {
                    CategoriaNombre = li.CategoriaNombre ?? string.Empty,
                    CategoriaOrder = li.CategoriaOrder,
                    DisplayOrder = li.DisplayOrder,
                    Codigo = li.Codigo,
                    Concepto = li.Concepto ?? string.Empty,
                    FasePhva = li.FasePhva,
                    MesProgramado = li.MesProgramado ?? string.Empty,
                    ValorPresupuestado = li.ValorPresupuestado,
                    ValorEjecutado = li.ValorEjecutado,
                    AreaResponsable = li.AreaResponsable ?? string.Empty,
                    SoporteComprobante = li.SoporteComprobante,
                    EstadoManual = li.EstadoManual
                })
            };
        }
    }
}
