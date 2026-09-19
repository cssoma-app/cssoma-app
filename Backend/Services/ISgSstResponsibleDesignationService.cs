using BackendAPI.Models;

namespace BackendAPI.Services
{
    public class CreateSgSstResponsibleDesignationInput
    {
        public string CoberturaCentroTrabajo { get; set; } = string.Empty;
        public string? CoberturaDetalle { get; set; }

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

        public string ResponsableAceptaNombre { get; set; } = string.Empty;
        public string ResponsableAceptaLicencia { get; set; } = string.Empty;
        public string ResponsableAceptaDocumento { get; set; } = string.Empty;

        public string SuscripcionCiudad { get; set; } = string.Empty;
        public DateTime SuscripcionFecha { get; set; }

        public List<FunctionAcceptanceInput> FunctionAcceptances { get; set; } = new();
    }

    public class FunctionAcceptanceInput
    {
        public int FunctionId { get; set; }
        public bool IsAccepted { get; set; }
    }

    public class SgSstResponsibleDesignationDto
    {
        public Guid Id { get; set; }
        public int Version { get; set; }
        public SgSstDesignationStatus Status { get; set; }
        public string ResponsableNombreCompleto { get; set; } = string.Empty;
        public string ResponsableCargo { get; set; } = string.Empty;
        public SstCompetencyLevel NivelCompetencia { get; set; }
        public DateTime SuscripcionFecha { get; set; }
        public ComplianceStatus ComplianceStatus { get; set; }
        public string? ComplianceNota { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<FunctionAcceptanceDto> FunctionAcceptances { get; set; } = new();
    }

    public class FunctionAcceptanceDto
    {
        public int FunctionId { get; set; }
        public string FunctionTitle { get; set; } = string.Empty;
        public bool IsAccepted { get; set; }
    }

    public interface ISgSstResponsibleDesignationService
    {
        Task<ServiceResult<SgSstResponsibleDesignationDto?>> GetCurrentAsync();
        Task<ServiceResult<List<SgSstResponsibleDesignationDto>>> GetHistoryAsync();
        Task<ServiceResult<SgSstResponsibleDesignationDto>> CreateAsync(CreateSgSstResponsibleDesignationInput input, Guid createdByUserId);
    }
}
