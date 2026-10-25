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

        // Npgsql exige Kind=Utc para columnas timestamp with time zone. Las fechas que llegan
        // deserializadas desde JSON (ej. "2026-09-20") tienen Kind=Unspecified por defecto en
        // System.Text.Json, lo que revienta el INSERT/UPDATE si no se normalizan antes de persistir.
        private static DateTime EnsureUtc(DateTime value) =>
            value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);

        private static DateTime? EnsureUtc(DateTime? value) =>
            value.HasValue ? EnsureUtc(value.Value) : null;

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
                .Where(d => d.TenantId == _currentUserService.TenantId && d.Status != SgSstDesignationStatus.Draft)
                .Include(d => d.DesignationFunctions)
                    .ThenInclude(df => df.Function)
                .OrderByDescending(d => d.Version)
                .ToListAsync();

            return ServiceResult<List<SgSstResponsibleDesignationDto>>.Ok(
                designations.Select(MapToDto).ToList()
            );
        }

        public async Task<ServiceResult<SgSstResponsibleDesignationDto?>> GetDraftAsync()
        {
            if (!_currentUserService.TenantId.HasValue)
                return ServiceResult<SgSstResponsibleDesignationDto?>.Forbidden();

            var draft = await _dbContext.SgSstResponsibleDesignations
                .Where(d => d.TenantId == _currentUserService.TenantId && d.Status == SgSstDesignationStatus.Draft)
                .Include(d => d.DesignationFunctions)
                    .ThenInclude(df => df.Function)
                .FirstOrDefaultAsync();

            return ServiceResult<SgSstResponsibleDesignationDto?>.Ok(draft == null ? null : MapToDto(draft));
        }

        public async Task<ServiceResult<SgSstResponsibleDesignationDto>> SaveDraftAsync(
            CreateSgSstResponsibleDesignationInput input,
            Guid savedByUserId)
        {
            if (!_currentUserService.TenantId.HasValue || (!_currentUserService.IsAdmin && !_currentUserService.IsSuperAdmin))
                return ServiceResult<SgSstResponsibleDesignationDto>.Forbidden();

            var tenantId = _currentUserService.TenantId.Value;

            var draft = await _dbContext.SgSstResponsibleDesignations
                .Include(d => d.DesignationFunctions)
                .FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Status == SgSstDesignationStatus.Draft);

            if (draft == null)
            {
                draft = new SgSstResponsibleDesignation
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Version = 0,
                    Status = SgSstDesignationStatus.Draft,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = savedByUserId
                };
                _dbContext.SgSstResponsibleDesignations.Add(draft);
            }

            draft.CoberturaCentroTrabajo = InputSanitizer.SanitizeText(input.CoberturaCentroTrabajo ?? string.Empty).Normalize();
            draft.CoberturaDetalle = string.IsNullOrWhiteSpace(input.CoberturaDetalle) ? null : InputSanitizer.SanitizeText(input.CoberturaDetalle).Normalize();
            draft.OrganizacionDepartamento = InputSanitizer.SanitizeText(input.OrganizacionDepartamento ?? string.Empty).Normalize();
            draft.OrganizacionMunicipio = InputSanitizer.SanitizeText(input.OrganizacionMunicipio ?? string.Empty).Normalize();
            draft.OrganizacionNivelRiesgoArl = InputSanitizer.SanitizeText(input.OrganizacionNivelRiesgoArl ?? string.Empty).Normalize();
            draft.OrganizacionActividadEconomica = InputSanitizer.SanitizeText(input.OrganizacionActividadEconomica ?? string.Empty).Normalize();
            draft.ResponsableNombreCompleto = InputSanitizer.SanitizeText(input.ResponsableNombreCompleto ?? string.Empty).Normalize();
            draft.ResponsableCargo = InputSanitizer.SanitizeText(input.ResponsableCargo ?? string.Empty).Normalize();
            draft.ResponsableTipoDocumento = input.ResponsableTipoDocumento;
            draft.ResponsableNumeroDocumento = InputSanitizer.SanitizeText(input.ResponsableNumeroDocumento ?? string.Empty).Normalize();
            draft.NivelCompetencia = input.NivelCompetencia;
            draft.LicenciaSstNumero = InputSanitizer.SanitizeText(input.LicenciaSstNumero ?? string.Empty).Normalize();
            draft.LicenciaSstExpedidaPor = InputSanitizer.SanitizeText(input.LicenciaSstExpedidaPor ?? string.Empty).Normalize();
            draft.Curso50HorasAprobado = input.Curso50HorasAprobado;
            draft.FechaActualizacion20Horas = EnsureUtc(input.FechaActualizacion20Horas);
            draft.EmpleadorAceptaNombre = InputSanitizer.SanitizeText(input.EmpleadorAceptaNombre ?? string.Empty).Normalize();
            draft.EmpleadorAceptaCargo = InputSanitizer.SanitizeText(input.EmpleadorAceptaCargo ?? string.Empty).Normalize();
            draft.EmpleadorAceptaDocumento = InputSanitizer.SanitizeText(input.EmpleadorAceptaDocumento ?? string.Empty).Normalize();
            draft.EmpleadorFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.EmpleadorFirmaImagen);
            draft.ResponsableAceptaNombre = InputSanitizer.SanitizeText(input.ResponsableAceptaNombre ?? string.Empty).Normalize();
            draft.ResponsableAceptaLicencia = InputSanitizer.SanitizeText(input.ResponsableAceptaLicencia ?? string.Empty).Normalize();
            draft.ResponsableAceptaDocumento = InputSanitizer.SanitizeText(input.ResponsableAceptaDocumento ?? string.Empty).Normalize();
            draft.ResponsableFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.ResponsableFirmaImagen);
            draft.SuscripcionCiudad = InputSanitizer.SanitizeText(input.SuscripcionCiudad ?? string.Empty).Normalize();
            draft.SuscripcionFecha = EnsureUtc(input.SuscripcionFecha);

            var existingFunctionIds = draft.DesignationFunctions.Select(df => df.FunctionId).ToHashSet();
            var incomingFunctionIds = input.FunctionAcceptances.Select(f => f.FunctionId).ToHashSet();

            _dbContext.SgSstDesignationFunctions.RemoveRange(
                draft.DesignationFunctions.Where(df => !incomingFunctionIds.Contains(df.FunctionId)));

            foreach (var functionInput in input.FunctionAcceptances)
            {
                var existingFunction = draft.DesignationFunctions.FirstOrDefault(df => df.FunctionId == functionInput.FunctionId);
                if (existingFunction != null)
                {
                    existingFunction.IsAccepted = functionInput.IsAccepted;
                }
                else if (await _dbContext.SgSstFunctionCatalogs.AnyAsync(f => f.Id == functionInput.FunctionId))
                {
                    draft.DesignationFunctions.Add(new SgSstDesignationFunction
                    {
                        DesignationId = draft.Id,
                        FunctionId = functionInput.FunctionId,
                        IsAccepted = functionInput.IsAccepted
                    });
                }
            }

            await _dbContext.SaveChangesAsync();

            var saved = await _dbContext.SgSstResponsibleDesignations
                .Include(d => d.DesignationFunctions)
                    .ThenInclude(df => df.Function)
                .FirstAsync(d => d.Id == draft.Id);

            return ServiceResult<SgSstResponsibleDesignationDto>.Ok(MapToDto(saved));
        }

        public async Task<ServiceResult<SgSstResponsibleDesignationDto>> CreateAsync(
            CreateSgSstResponsibleDesignationInput input,
            Guid createdByUserId)
        {
            if (!_currentUserService.TenantId.HasValue || (!_currentUserService.IsAdmin && !_currentUserService.IsSuperAdmin))
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
                OrganizacionDepartamento = InputSanitizer.SanitizeText(input.OrganizacionDepartamento ?? string.Empty).Normalize(),
                OrganizacionMunicipio = InputSanitizer.SanitizeText(input.OrganizacionMunicipio ?? string.Empty).Normalize(),
                OrganizacionNivelRiesgoArl = InputSanitizer.SanitizeText(input.OrganizacionNivelRiesgoArl ?? string.Empty).Normalize(),
                OrganizacionActividadEconomica = InputSanitizer.SanitizeText(input.OrganizacionActividadEconomica ?? string.Empty).Normalize(),
                ResponsableNombreCompleto = InputSanitizer.SanitizeText(input.ResponsableNombreCompleto).Normalize(),
                ResponsableCargo = InputSanitizer.SanitizeText(input.ResponsableCargo).Normalize(),
                ResponsableTipoDocumento = input.ResponsableTipoDocumento,
                ResponsableNumeroDocumento = InputSanitizer.SanitizeText(input.ResponsableNumeroDocumento).Normalize(),
                NivelCompetencia = input.NivelCompetencia,
                LicenciaSstNumero = InputSanitizer.SanitizeText(input.LicenciaSstNumero).Normalize(),
                LicenciaSstExpedidaPor = InputSanitizer.SanitizeText(input.LicenciaSstExpedidaPor).Normalize(),
                Curso50HorasAprobado = input.Curso50HorasAprobado,
                FechaActualizacion20Horas = EnsureUtc(input.FechaActualizacion20Horas),
                EmpleadorAceptaNombre = InputSanitizer.SanitizeText(input.EmpleadorAceptaNombre).Normalize(),
                EmpleadorAceptaCargo = InputSanitizer.SanitizeText(input.EmpleadorAceptaCargo).Normalize(),
                EmpleadorAceptaDocumento = InputSanitizer.SanitizeText(input.EmpleadorAceptaDocumento).Normalize(),
                EmpleadorAceptaFechaHora = DateTime.UtcNow,
                EmpleadorFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.EmpleadorFirmaImagen),
                ResponsableAceptaNombre = InputSanitizer.SanitizeText(input.ResponsableAceptaNombre).Normalize(),
                ResponsableAceptaLicencia = InputSanitizer.SanitizeText(input.ResponsableAceptaLicencia).Normalize(),
                ResponsableAceptaDocumento = InputSanitizer.SanitizeText(input.ResponsableAceptaDocumento).Normalize(),
                ResponsableAceptaFechaHora = DateTime.UtcNow,
                ResponsableFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.ResponsableFirmaImagen),
                SuscripcionCiudad = InputSanitizer.SanitizeText(input.SuscripcionCiudad).Normalize(),
                SuscripcionFecha = EnsureUtc(input.SuscripcionFecha),
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

            // Al radicar formalmente, el borrador (si existe) queda obsoleto — se elimina para
            // que la próxima vez que se abra el formulario no se prellene con datos ya superados.
            var draft = await _dbContext.SgSstResponsibleDesignations
                .FirstOrDefaultAsync(d => d.TenantId == tenantId && d.Status == SgSstDesignationStatus.Draft);
            if (draft != null)
            {
                _dbContext.SgSstResponsibleDesignations.Remove(draft);
            }

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
                CoberturaCentroTrabajo = designation.CoberturaCentroTrabajo,
                CoberturaDetalle = designation.CoberturaDetalle,
                OrganizacionDepartamento = designation.OrganizacionDepartamento,
                OrganizacionMunicipio = designation.OrganizacionMunicipio,
                OrganizacionNivelRiesgoArl = designation.OrganizacionNivelRiesgoArl,
                OrganizacionActividadEconomica = designation.OrganizacionActividadEconomica,
                ResponsableNombreCompleto = designation.ResponsableNombreCompleto,
                ResponsableCargo = designation.ResponsableCargo,
                ResponsableTipoDocumento = designation.ResponsableTipoDocumento,
                ResponsableNumeroDocumento = designation.ResponsableNumeroDocumento,
                NivelCompetencia = designation.NivelCompetencia,
                LicenciaSstNumero = designation.LicenciaSstNumero,
                LicenciaSstExpedidaPor = designation.LicenciaSstExpedidaPor,
                Curso50HorasAprobado = designation.Curso50HorasAprobado,
                FechaActualizacion20Horas = designation.FechaActualizacion20Horas,
                EmpleadorAceptaNombre = designation.EmpleadorAceptaNombre,
                EmpleadorAceptaCargo = designation.EmpleadorAceptaCargo,
                EmpleadorAceptaDocumento = designation.EmpleadorAceptaDocumento,
                EmpleadorFirmaImagen = designation.EmpleadorFirmaImagen,
                ResponsableAceptaNombre = designation.ResponsableAceptaNombre,
                ResponsableAceptaLicencia = designation.ResponsableAceptaLicencia,
                ResponsableAceptaDocumento = designation.ResponsableAceptaDocumento,
                ResponsableFirmaImagen = designation.ResponsableFirmaImagen,
                SuscripcionCiudad = designation.SuscripcionCiudad,
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
                        FunctionDescription = df.Function?.Description ?? string.Empty,
                        FunctionDisplayOrder = df.Function?.DisplayOrder ?? 0,
                        IsAccepted = df.IsAccepted
                    })
                    .ToList()
            };
        }
    }
}
