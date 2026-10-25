using System;

namespace BackendAPI.Models
{
    public class SgSstBudgetLineItem
    {
        public Guid Id { get; set; }
        public Guid BudgetPlanId { get; set; }

        public string CategoriaNombre { get; set; } = string.Empty; // libre, definida por el usuario
        public int CategoriaOrder { get; set; } // orden de aparición de la categoría en el reporte
        public int DisplayOrder { get; set; } // orden de la fila dentro de su categoría

        public string? Codigo { get; set; }
        public string Concepto { get; set; } = string.Empty;
        public SstPhvaPhase FasePhva { get; set; }
        public string MesProgramado { get; set; } = string.Empty;
        public decimal ValorPresupuestado { get; set; }
        public decimal ValorEjecutado { get; set; }
        public string AreaResponsable { get; set; } = string.Empty;
        public string? SoporteComprobante { get; set; }

        // Override manual del estado calculado automáticamente ("Completado" | "En Progreso" |
        // "Pendiente"). Null significa "automático" (se deriva de ValorPresupuestado/ValorEjecutado).
        public string? EstadoManual { get; set; }

        public SgSstBudgetPlan? BudgetPlan { get; set; }
    }
}
