using System;
using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class SgSstResponsibleDesignation
    {
        public Guid Id { get; set; }
        public Guid TenantId { get; set; }
        public int Version { get; set; }
        public SgSstDesignationStatus Status { get; set; } = SgSstDesignationStatus.Active;

        public string CoberturaCentroTrabajo { get; set; } = string.Empty;
        public string? CoberturaDetalle { get; set; }

        // Snapshot de ubicación de la organización al momento de la designación (independiente
        // de los datos del Tenant, que pueden cambiar después sin afectar el histórico).
        public string OrganizacionDepartamento { get; set; } = string.Empty;
        public string OrganizacionMunicipio { get; set; } = string.Empty;
        public string OrganizacionNivelRiesgoArl { get; set; } = string.Empty;
        public string OrganizacionActividadEconomica { get; set; } = string.Empty;

        public string ResponsableNombreCompleto { get; set; } = string.Empty;
        public string ResponsableCargo { get; set; } = string.Empty;
        public DocumentIdType ResponsableTipoDocumento { get; set; }
        public string ResponsableNumeroDocumento { get; set; } = string.Empty;

        public SstCompetencyLevel NivelCompetencia { get; set; }
        public string LicenciaSstNumero { get; set; } = string.Empty;
        public string LicenciaSstExpedidaPor { get; set; } = string.Empty;
        public bool Curso50HorasAprobado { get; set; } = false;
        public DateTime? FechaActualizacion20Horas { get; set; }

        public string EmpleadorAceptaNombre { get; set; } = string.Empty;
        public string EmpleadorAceptaCargo { get; set; } = string.Empty;
        public string EmpleadorAceptaDocumento { get; set; } = string.Empty;
        public DateTime? EmpleadorAceptaFechaHora { get; set; }
        // Firma dibujada a mano en el canvas, capturada como PNG en base64 (data URL). Nula si
        // el firmante no dibujó nada (la aceptación sigue siendo válida vía los campos de texto).
        public string? EmpleadorFirmaImagen { get; set; }

        public string ResponsableAceptaNombre { get; set; } = string.Empty;
        public string ResponsableAceptaLicencia { get; set; } = string.Empty;
        public string ResponsableAceptaDocumento { get; set; } = string.Empty;
        public DateTime? ResponsableAceptaFechaHora { get; set; }
        public string? ResponsableFirmaImagen { get; set; }

        public string SuscripcionCiudad { get; set; } = string.Empty;
        public DateTime SuscripcionFecha { get; set; }

        public ComplianceStatus ComplianceStatus { get; set; } = ComplianceStatus.RequiereRevision;
        public string? ComplianceNota { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Guid CreatedByUserId { get; set; }

        public Tenant? Tenant { get; set; }
        public ICollection<SgSstDesignationFunction> DesignationFunctions { get; set; } = new List<SgSstDesignationFunction>();
    }
}
