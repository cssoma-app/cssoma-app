using BackendAPI.Models;

namespace BackendAPI.Contracts
{
    public class CreateSgSstResponsibleDesignationRequest
    {
        public string CoberturaCentroTrabajo { get; set; } = string.Empty;
        public string? CoberturaDetalle { get; set; }

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
        public string? EmpleadorFirmaImagen { get; set; }

        public string ResponsableAceptaNombre { get; set; } = string.Empty;
        public string ResponsableAceptaLicencia { get; set; } = string.Empty;
        public string ResponsableAceptaDocumento { get; set; } = string.Empty;
        public string? ResponsableFirmaImagen { get; set; }

        public string SuscripcionCiudad { get; set; } = string.Empty;
        public DateTime SuscripcionFecha { get; set; }

        public List<FunctionAcceptanceRequest> FunctionAcceptances { get; set; } = new();
    }

    public class FunctionAcceptanceRequest
    {
        public int FunctionId { get; set; }
        public bool IsAccepted { get; set; }
    }
}
