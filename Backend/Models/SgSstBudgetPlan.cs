using System;
using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class SgSstBudgetPlan
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public int Version { get; set; }
        public SgSstDesignationStatus Status { get; set; } = SgSstDesignationStatus.Active;

        public int Vigencia { get; set; } // año presupuestal, ej. 2026

        public string RepresentanteLegalNombre { get; set; } = string.Empty;
        public string RepresentanteLegalDocumento { get; set; } = string.Empty;
        public DateTime? RepresentanteLegalFechaHora { get; set; }
        public string? RepresentanteLegalFirmaImagen { get; set; }

        public string ResponsableSgSstNombre { get; set; } = string.Empty;
        public string ResponsableSgSstDocumento { get; set; } = string.Empty;
        public DateTime? ResponsableSgSstFechaHora { get; set; }
        public string? ResponsableSgSstFirmaImagen { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid CreatedByUserId { get; set; }

        public Tenant? Tenant { get; set; }
        public ICollection<SgSstBudgetLineItem> LineItems { get; set; } = new List<SgSstBudgetLineItem>();
    }
}
