using BackendAPI.Data;
using BackendAPI.Helpers;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;
using System.Text;

namespace BackendAPI.Services
{
    public class SgSstResponsibleDesignationService : ISgSstResponsibleDesignationService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;
        private readonly IResolucion0312ComplianceValidator _complianceValidator;

        public SgSstResponsibleDesignationService(
            ApplicationDbContext dbContext,
            ICurrentUserService currentUserService,
            IResolucion0312ComplianceValidator complianceValidator)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
            _complianceValidator = complianceValidator;
        }

        public async Task<ServiceResult<SgSstResponsibleDesignationDto?>> GetCurrentAsync()
        {
            if (!_currentUserService.TenantId.HasValue)
                return ServiceResult<SgSstResponsibleDesignationDto?>.Forbidden();

            var designation = await _dbContext.SgSstResponsibleDesignations
                .Where(d => d.TenantId == _currentUserService.TenantId && d.Status == SgSstDesignationStatus.Active)
                .Include(d => d.DesignationFunctions)
                    .ThenInclude(df => df.Function)
                .FirstOrDefaultAsync();

            if (designation == null)
                return ServiceResult<SgSstResponsibleDesignationDto?>.Ok(null);

            return ServiceResult<SgSstResponsibleDesignationDto?>.Ok(MapToDto(designation));
        }

        public async Task<ServiceResult<List<SgSstResponsibleDesignationDto>>> GetHistoryAsync()
        {
            if (!_currentUserService.TenantId.HasValue)
                return ServiceResult<List<SgSstResponsibleDesignationDto>>.Forbidden();

            var designations = await _dbContext.SgSstResponsibleDesignations
                .Where(d => d.TenantId == _currentUserService.TenantId)
                .Include(d => d.DesignationFunctions)
                    .ThenInclude(df => df.Function)
                .OrderByDescending(d => d.Version)
                .ToListAsync();

            return ServiceResult<List<SgSstResponsibleDesignationDto>>.Ok(
                designations.Select(MapToDto).ToList()
            );
        }

        public async Task<ServiceResult<SgSstResponsibleDesignationDto>> CreateAsync(
            CreateSgSstResponsibleDesignationInput input,
            Guid createdByUserId)
        {
            if (!_currentUserService.TenantId.HasValue || !_currentUserService.IsAdmin)
                return ServiceResult<SgSstResponsibleDesignationDto>.Forbidden();

            var tenantId = _currentUserService.TenantId.Value;

            if (string.IsNullOrWhiteSpace(input.ResponsableNombreCompleto))
                return ServiceResult<SgSstResponsibleDesignationDto>.BadRequest("Nombre del responsable es requerido.");
            if (string.IsNullOrWhiteSpace(input.ResponsableCargo))
                return ServiceResult<SgSstResponsibleDesignationDto>.BadRequest("Cargo del responsable es requerido.");
            if (string.IsNullOrWhiteSpace(input.LicenciaSstNumero))
                return ServiceResult<SgSstResponsibleDesignationDto>.BadRequest("Número de licencia SST es requerido.");
            if (string.IsNullOrWhiteSpace(input.EmpleadorAceptaNombre))
                return ServiceResult<SgSstResponsibleDesignationDto>.BadRequest("Nombre del representante legal es requerido.");
            if (string.IsNullOrWhiteSpace(input.ResponsableAceptaNombre))
                return ServiceResult<SgSstResponsibleDesignationDto>.BadRequest("Aceptación del responsable con nombre es requerida.");

            var tenant = await _dbContext.Tenants.FindAsync(tenantId);
            if (tenant == null)
                return ServiceResult<SgSstResponsibleDesignationDto>.NotFound("Tenant no encontrado.");

            var currentDesignation = await _dbContext.SgSstResponsibleDesignations
                .Where(d => d.TenantId == tenantId && d.Status == SgSstDesignationStatus.Active)
                .FirstOrDefaultAsync();

            int newVersion = 1;
            if (currentDesignation != null)
            {
                currentDesignation.Status = SgSstDesignationStatus.Superseded;
                newVersion = currentDesignation.Version + 1;
            }

            var (complianceStatus, complianceNota) = _complianceValidator.ValidateCompetencyRequirements(
                tenant.NumeroTrabajadores,
                tenant.ClaseRiesgo,
                input.NivelCompetencia);

            var designation = new SgSstResponsibleDesignation
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Version = newVersion,
                Status = SgSstDesignationStatus.Active,
                CoberturaCentroTrabajo = InputSanitizer.SanitizeText(input.CoberturaCentroTrabajo).Normalize(),
                CoberturaDetalle = string.IsNullOrWhiteSpace(input.CoberturaDetalle) ? null : InputSanitizer.SanitizeText(input.CoberturaDetalle).Normalize(),
                ResponsableNombreCompleto = InputSanitizer.SanitizeText(input.ResponsableNombreCompleto).Normalize(),
                ResponsableCargo = InputSanitizer.SanitizeText(input.ResponsableCargo).Normalize(),
                ResponsableTipoDocumento = input.ResponsableTipoDocumento,
                ResponsableNumeroDocumento = InputSanitizer.SanitizeText(input.ResponsableNumeroDocumento).Normalize(),
                NivelCompetencia = input.NivelCompetencia,
                LicenciaSstNumero = InputSanitizer.SanitizeText(input.LicenciaSstNumero).Normalize(),
                LicenciaSstExpedidaPor = InputSanitizer.SanitizeText(input.LicenciaSstExpedidaPor).Normalize(),
                Curso50HorasAprobado = input.Curso50HorasAprobado,
                FechaActualizacion20Horas = input.FechaActualizacion20Horas,
                EmpleadorAceptaNombre = InputSanitizer.SanitizeText(input.EmpleadorAceptaNombre).Normalize(),
                EmpleadorAceptaCargo = InputSanitizer.SanitizeText(input.EmpleadorAceptaCargo).Normalize(),
                EmpleadorAceptaDocumento = InputSanitizer.SanitizeText(input.EmpleadorAceptaDocumento).Normalize(),
                EmpleadorAceptaFechaHora = DateTime.UtcNow,
                ResponsableAceptaNombre = InputSanitizer.SanitizeText(input.ResponsableAceptaNombre).Normalize(),
                ResponsableAceptaLicencia = InputSanitizer.SanitizeText(input.ResponsableAceptaLicencia).Normalize(),
                ResponsableAceptaDocumento = InputSanitizer.SanitizeText(input.ResponsableAceptaDocumento).Normalize(),
                ResponsableAceptaFechaHora = DateTime.UtcNow,
                SuscripcionCiudad = InputSanitizer.SanitizeText(input.SuscripcionCiudad).Normalize(),
                SuscripcionFecha = input.SuscripcionFecha,
                ComplianceStatus = complianceStatus,
                ComplianceNota = complianceNota,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId
            };

            foreach (var functionInput in input.FunctionAcceptances)
            {
                var function = await _dbContext.SgSstFunctionCatalogs.FindAsync(functionInput.FunctionId);
                if (function != null)
                {
                    designation.DesignationFunctions.Add(new SgSstDesignationFunction
                    {
                        DesignationId = designation.Id,
                        FunctionId = functionInput.FunctionId,
                        IsAccepted = functionInput.IsAccepted
                    });
                }
            }

            _dbContext.SgSstResponsibleDesignations.Add(designation);
            await _dbContext.SaveChangesAsync();

            return ServiceResult<SgSstResponsibleDesignationDto>.Ok(MapToDto(designation));
        }

        private SgSstResponsibleDesignationDto MapToDto(SgSstResponsibleDesignation designation)
        {
            return new SgSstResponsibleDesignationDto
            {
                Id = designation.Id,
                Version = designation.Version,
                Status = designation.Status,
                ResponsableNombreCompleto = designation.ResponsableNombreCompleto,
                ResponsableCargo = designation.ResponsableCargo,
                NivelCompetencia = designation.NivelCompetencia,
                SuscripcionFecha = designation.SuscripcionFecha,
                ComplianceStatus = designation.ComplianceStatus,
                ComplianceNota = designation.ComplianceNota,
                CreatedAt = designation.CreatedAt,
                FunctionAcceptances = designation.DesignationFunctions
                    .OrderBy(df => df.Function?.DisplayOrder ?? 0)
                    .Select(df => new FunctionAcceptanceDto
                    {
                        FunctionId = df.FunctionId,
                        FunctionTitle = df.Function?.Title ?? string.Empty,
                        IsAccepted = df.IsAccepted
                    })
                    .ToList()
            };
        }
    }
}
