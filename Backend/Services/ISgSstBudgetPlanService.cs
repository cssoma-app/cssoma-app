using BackendAPI.Models;

namespace BackendAPI.Services
{
    public class CreateSgSstBudgetPlanInput
    {
        public int Vigencia { get; set; }
        public string RepresentanteLegalNombre { get; set; } = string.Empty;
        public string RepresentanteLegalDocumento { get; set; } = string.Empty;
        public string? RepresentanteLegalFirmaImagen { get; set; }
        public string ResponsableSgSstNombre { get; set; } = string.Empty;
        public string ResponsableSgSstDocumento { get; set; } = string.Empty;
        public string? ResponsableSgSstFirmaImagen { get; set; }
        public List<BudgetLineItemInput> LineItems { get; set; } = new();
    }

    public class BudgetLineItemInput
    {
        public string CategoriaNombre { get; set; } = string.Empty;
        public int CategoriaOrder { get; set; }
        public int DisplayOrder { get; set; }
        public string? Codigo { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public SstPhvaPhase FasePhva { get; set; }
        public string MesProgramado { get; set; } = string.Empty;
        public decimal ValorPresupuestado { get; set; }
        public decimal ValorEjecutado { get; set; }
        public string AreaResponsable { get; set; } = string.Empty;
        public string? SoporteComprobante { get; set; }
        public string? EstadoManual { get; set; }
    }

    public class SgSstBudgetPlanDto
    {
        public Guid Id { get; set; }
        public int Version { get; set; }
        public SgSstDesignationStatus Status { get; set; }
        public int Vigencia { get; set; }
        public string RepresentanteLegalNombre { get; set; } = string.Empty;
        public string RepresentanteLegalDocumento { get; set; } = string.Empty;
        public DateTime? RepresentanteLegalFechaHora { get; set; }
        public string? RepresentanteLegalFirmaImagen { get; set; }
        public string ResponsableSgSstNombre { get; set; } = string.Empty;
        public string ResponsableSgSstDocumento { get; set; } = string.Empty;
        public DateTime? ResponsableSgSstFechaHora { get; set; }
        public string? ResponsableSgSstFirmaImagen { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<BudgetLineItemDto> LineItems { get; set; } = new();
        public List<BudgetCategorySummaryDto> CategorySummaries { get; set; } = new();
        public BudgetGrandTotalDto GrandTotal { get; set; } = new();
    }

    public class BudgetLineItemDto
    {
        public Guid Id { get; set; }
        public string CategoriaNombre { get; set; } = string.Empty;
        public int CategoriaOrder { get; set; }
        public int DisplayOrder { get; set; }
        public string? Codigo { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public SstPhvaPhase FasePhva { get; set; }
        public string MesProgramado { get; set; } = string.Empty;
        public decimal ValorPresupuestado { get; set; }
        public decimal ValorEjecutado { get; set; }
        public decimal Desviacion { get; set; }       // computado: Presupuestado - Ejecutado
        public double PctEjecucion { get; set; }       // computado: Ejecutado/Presupuestado, 0 si Presupuestado <= 0
        public string Estado { get; set; } = string.Empty; // "EstadoManual" si fue fijado por el usuario, o automático
        public string? EstadoManual { get; set; } // null = automático; si no, el valor fijado manualmente
        public string AreaResponsable { get; set; } = string.Empty;
        public string? SoporteComprobante { get; set; }
    }

    public class BudgetCategorySummaryDto
    {
        public string CategoriaNombre { get; set; } = string.Empty;
        public int CategoriaOrder { get; set; }
        public decimal TotalPresupuestado { get; set; }
        public decimal TotalEjecutado { get; set; }
        public decimal Desviacion { get; set; }
        public double PctEjecucion { get; set; }
        public string Estado { get; set; } = string.Empty; // "Completado" (>=100%) | "Crítico" (ejecutado==0) | "En Progreso" (resto)
    }

    public class BudgetGrandTotalDto
    {
        public decimal TotalPresupuestado { get; set; }
        public decimal TotalEjecutado { get; set; }
        public decimal Desviacion { get; set; }
        public double PctEjecucion { get; set; }
        public int CategoriasCriticas { get; set; } // count de CategorySummaries con Estado == "Crítico"
    }

    public interface ISgSstBudgetPlanService
    {
        Task<ServiceResult<SgSstBudgetPlanDto?>> GetCurrentAsync();
        Task<ServiceResult<List<SgSstBudgetPlanDto>>> GetHistoryAsync();
        Task<ServiceResult<SgSstBudgetPlanDto>> CreateAsync(CreateSgSstBudgetPlanInput input, Guid createdByUserId);
        Task<ServiceResult<SgSstBudgetPlanDto?>> GetDraftAsync();
        Task<ServiceResult<SgSstBudgetPlanDto>> SaveDraftAsync(CreateSgSstBudgetPlanInput input, Guid savedByUserId);
    }
}
