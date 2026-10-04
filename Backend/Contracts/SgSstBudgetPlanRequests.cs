using BackendAPI.Models;

namespace BackendAPI.Contracts
{
    public class CreateSgSstBudgetPlanRequest
    {
        public int Vigencia { get; set; }
        public string RepresentanteLegalNombre { get; set; } = string.Empty;
        public string RepresentanteLegalDocumento { get; set; } = string.Empty;
        public string? RepresentanteLegalFirmaImagen { get; set; }
        public string ResponsableSgSstNombre { get; set; } = string.Empty;
        public string ResponsableSgSstDocumento { get; set; } = string.Empty;
        public string? ResponsableSgSstFirmaImagen { get; set; }

        public List<BudgetLineItemRequest> LineItems { get; set; } = new();
    }

    public class BudgetLineItemRequest
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
}
