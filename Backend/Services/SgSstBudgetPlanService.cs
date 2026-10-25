using BackendAPI.Data;
using BackendAPI.Helpers;
using BackendAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    public class SgSstBudgetPlanService : ISgSstBudgetPlanService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ICurrentUserService _currentUserService;

        public SgSstBudgetPlanService(
            ApplicationDbContext dbContext,
            ICurrentUserService currentUserService)
        {
            _dbContext = dbContext;
            _currentUserService = currentUserService;
        }

        // Npgsql exige Kind=Utc para columnas timestamp with time zone. Las fechas que llegan
        // deserializadas desde JSON tienen Kind=Unspecified por defecto en System.Text.Json, lo
        // que revienta el INSERT/UPDATE si no se normalizan antes de persistir.
        private static DateTime EnsureUtc(DateTime value) =>
            value.Kind == DateTimeKind.Utc ? value : DateTime.SpecifyKind(value, DateTimeKind.Utc);

        private static DateTime? EnsureUtc(DateTime? value) =>
            value.HasValue ? EnsureUtc(value.Value) : null;

        public async Task<ServiceResult<SgSstBudgetPlanDto?>> GetCurrentAsync()
        {
            if (!_currentUserService.TenantId.HasValue)
                return ServiceResult<SgSstBudgetPlanDto?>.Forbidden();

            var plan = await _dbContext.SgSstBudgetPlans
                .Where(p => p.TenantId == _currentUserService.TenantId && p.Status == SgSstDesignationStatus.Active)
                .Include(p => p.LineItems)
                .FirstOrDefaultAsync();

            if (plan == null)
                return ServiceResult<SgSstBudgetPlanDto?>.Ok(null);

            return ServiceResult<SgSstBudgetPlanDto?>.Ok(MapToDto(plan));
        }

        public async Task<ServiceResult<List<SgSstBudgetPlanDto>>> GetHistoryAsync()
        {
            if (!_currentUserService.TenantId.HasValue)
                return ServiceResult<List<SgSstBudgetPlanDto>>.Forbidden();

            var plans = await _dbContext.SgSstBudgetPlans
                .Where(p => p.TenantId == _currentUserService.TenantId && p.Status != SgSstDesignationStatus.Draft)
                .Include(p => p.LineItems)
                .OrderByDescending(p => p.Version)
                .ToListAsync();

            return ServiceResult<List<SgSstBudgetPlanDto>>.Ok(plans.Select(MapToDto).ToList());
        }

        public async Task<ServiceResult<SgSstBudgetPlanDto?>> GetDraftAsync()
        {
            if (!_currentUserService.TenantId.HasValue)
                return ServiceResult<SgSstBudgetPlanDto?>.Forbidden();

            var draft = await _dbContext.SgSstBudgetPlans
                .Where(p => p.TenantId == _currentUserService.TenantId && p.Status == SgSstDesignationStatus.Draft)
                .Include(p => p.LineItems)
                .FirstOrDefaultAsync();

            return ServiceResult<SgSstBudgetPlanDto?>.Ok(draft == null ? null : MapToDto(draft));
        }

        public async Task<ServiceResult<SgSstBudgetPlanDto>> SaveDraftAsync(
            CreateSgSstBudgetPlanInput input,
            Guid savedByUserId)
        {
            if (!_currentUserService.TenantId.HasValue || (!_currentUserService.IsAdmin && !_currentUserService.IsSuperAdmin))
                return ServiceResult<SgSstBudgetPlanDto>.Forbidden();

            var tenantId = _currentUserService.TenantId.Value;

            var draft = await _dbContext.SgSstBudgetPlans
                .FirstOrDefaultAsync(p => p.TenantId == tenantId && p.Status == SgSstDesignationStatus.Draft);

            if (draft == null)
            {
                draft = new SgSstBudgetPlan
                {
                    Id = Guid.NewGuid(),
                    TenantId = tenantId,
                    Version = 0,
                    Status = SgSstDesignationStatus.Draft,
                    CreatedAt = DateTime.UtcNow,
                    CreatedByUserId = savedByUserId
                };
                _dbContext.SgSstBudgetPlans.Add(draft);
            }

            draft.Vigencia = input.Vigencia;
            draft.RepresentanteLegalNombre = InputSanitizer.SanitizeText(input.RepresentanteLegalNombre ?? string.Empty).Normalize();
            draft.RepresentanteLegalDocumento = InputSanitizer.SanitizeText(input.RepresentanteLegalDocumento ?? string.Empty).Normalize();
            draft.RepresentanteLegalFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.RepresentanteLegalFirmaImagen);
            draft.ResponsableSgSstNombre = InputSanitizer.SanitizeText(input.ResponsableSgSstNombre ?? string.Empty).Normalize();
            draft.ResponsableSgSstDocumento = InputSanitizer.SanitizeText(input.ResponsableSgSstDocumento ?? string.Empty).Normalize();
            draft.ResponsableSgSstFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.ResponsableSgSstFirmaImagen);

            // El cliente no manda un Id estable para filas nuevas creadas dinámicamente en el UI
            // (a diferencia del join SgSstDesignationFunction, que diffea por FunctionId), así que
            // el reemplazo total de line items en cada guardado es la estrategia correcta y simple.
            // Se usa un DELETE masivo (ExecuteDeleteAsync) por filtro en vez de cargar las filas y
            // hacer RemoveRange sobre entidades trackeadas: un RemoveRange trackeado le exige a EF
            // que compruebe "1 fila afectada" por cada DELETE, y si esa fila ya no está (por
            // cualquier motivo — otra petición, un guardado previo, etc.) lanza
            // DbUpdateConcurrencyException aunque el resultado deseado (que no exista) ya se cumple.
            // Un DELETE masivo por filtro no tiene ese problema estructural: borra lo que exista, sin
            // excepción si ya no hay nada que borrar.
            await _dbContext.SgSstBudgetLineItems
                .Where(li => li.BudgetPlanId == draft.Id)
                .ExecuteDeleteAsync();

            // ExecuteDeleteAsync borra directo en la base de datos sin pasar por el change tracker,
            // así que si alguna de esas filas ya estaba trackeada en este DbContext (ej. por una
            // operación previa dentro del mismo ciclo de vida), quedaría "fantasma": tanto en el
            // tracker como en la colección de navegación draft.LineItems en memoria, y se mezclaría
            // con las líneas nuevas en cualquier lectura posterior. Se remueve explícitamente de
            // AMBOS lugares (la colección en memoria y el tracker) para que el estado coincida con
            // lo que la base de datos realmente tiene — destrackear solo la entrada no alcanza,
            // porque no saca la referencia de la lista `ICollection<T>` en memoria.
            foreach (var stale in _dbContext.ChangeTracker.Entries<SgSstBudgetLineItem>()
                         .Where(e => e.Entity.BudgetPlanId == draft.Id)
                         .Select(e => e.Entity)
                         .ToList())
            {
                draft.LineItems.Remove(stale);
                _dbContext.Entry(stale).State = EntityState.Detached;
            }

            foreach (var itemInput in input.LineItems)
            {
                _dbContext.SgSstBudgetLineItems.Add(BuildLineItem(itemInput, draft.Id));
            }

            await _dbContext.SaveChangesAsync();

            var saved = await _dbContext.SgSstBudgetPlans
                .Include(p => p.LineItems)
                .FirstAsync(p => p.Id == draft.Id);

            return ServiceResult<SgSstBudgetPlanDto>.Ok(MapToDto(saved));
        }

        public async Task<ServiceResult<SgSstBudgetPlanDto>> CreateAsync(
            CreateSgSstBudgetPlanInput input,
            Guid createdByUserId)
        {
            if (!_currentUserService.TenantId.HasValue || (!_currentUserService.IsAdmin && !_currentUserService.IsSuperAdmin))
                return ServiceResult<SgSstBudgetPlanDto>.Forbidden();

            var tenantId = _currentUserService.TenantId.Value;

            if (input.Vigencia <= 0)
                return ServiceResult<SgSstBudgetPlanDto>.BadRequest("Vigencia es requerida.");
            if (string.IsNullOrWhiteSpace(input.RepresentanteLegalNombre))
                return ServiceResult<SgSstBudgetPlanDto>.BadRequest("Nombre del representante legal es requerido.");
            if (string.IsNullOrWhiteSpace(input.ResponsableSgSstNombre))
                return ServiceResult<SgSstBudgetPlanDto>.BadRequest("Nombre del responsable SG-SST es requerido.");
            if (input.LineItems.Count == 0)
                return ServiceResult<SgSstBudgetPlanDto>.BadRequest("Debe incluir al menos un rubro presupuestal.");

            var tenant = await _dbContext.Tenants.FindAsync(tenantId);
            if (tenant == null)
                return ServiceResult<SgSstBudgetPlanDto>.NotFound("Tenant no encontrado.");

            var currentPlan = await _dbContext.SgSstBudgetPlans
                .Where(p => p.TenantId == tenantId && p.Status == SgSstDesignationStatus.Active)
                .FirstOrDefaultAsync();

            int newVersion = 1;
            if (currentPlan != null)
            {
                currentPlan.Status = SgSstDesignationStatus.Superseded;
                newVersion = currentPlan.Version + 1;
            }

            var plan = new SgSstBudgetPlan
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                Version = newVersion,
                Status = SgSstDesignationStatus.Active,
                Vigencia = input.Vigencia,
                RepresentanteLegalNombre = InputSanitizer.SanitizeText(input.RepresentanteLegalNombre).Normalize(),
                RepresentanteLegalDocumento = InputSanitizer.SanitizeText(input.RepresentanteLegalDocumento ?? string.Empty).Normalize(),
                RepresentanteLegalFechaHora = DateTime.UtcNow,
                RepresentanteLegalFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.RepresentanteLegalFirmaImagen),
                ResponsableSgSstNombre = InputSanitizer.SanitizeText(input.ResponsableSgSstNombre).Normalize(),
                ResponsableSgSstDocumento = InputSanitizer.SanitizeText(input.ResponsableSgSstDocumento ?? string.Empty).Normalize(),
                ResponsableSgSstFechaHora = DateTime.UtcNow,
                ResponsableSgSstFirmaImagen = ImageValidationHelper.SanitizeImageDataUrl(input.ResponsableSgSstFirmaImagen),
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = createdByUserId
            };

            foreach (var itemInput in input.LineItems)
            {
                plan.LineItems.Add(BuildLineItem(itemInput, plan.Id));
            }

            _dbContext.SgSstBudgetPlans.Add(plan);

            // Al radicar formalmente, el borrador (si existe) queda obsoleto — se elimina para que
            // la próxima vez que se abra el formulario no se prellene con datos ya superados. DELETE
            // masivo por filtro (no carga+Remove sobre una entidad trackeada) por la misma razón que
            // en SaveDraftAsync — nunca debe lanzar DbUpdateConcurrencyException si el borrador ya no
            // está. El ON DELETE CASCADE de la FK se encarga de las líneas del borrador en la BD.
            await _dbContext.SgSstBudgetPlans
                .Where(p => p.TenantId == tenantId && p.Status == SgSstDesignationStatus.Draft)
                .ExecuteDeleteAsync();

            await _dbContext.SaveChangesAsync();

            return ServiceResult<SgSstBudgetPlanDto>.Ok(MapToDto(plan));
        }

        // Únicos valores de estado que un usuario puede fijar manualmente; cualquier otro valor
        // recibido se descarta y la fila vuelve al cálculo automático.
        private static readonly HashSet<string> AllowedManualEstados = new(StringComparer.OrdinalIgnoreCase)
        {
            "Completado", "En Progreso", "Pendiente"
        };

        private static string? SanitizeEstadoManual(string? estadoManual)
        {
            if (string.IsNullOrWhiteSpace(estadoManual)) return null;
            var normalized = InputSanitizer.SanitizeText(estadoManual).Normalize();
            return AllowedManualEstados.Contains(normalized) ? normalized : null;
        }

        private static SgSstBudgetLineItem BuildLineItem(BudgetLineItemInput itemInput, Guid planId)
        {
            return new SgSstBudgetLineItem
            {
                Id = Guid.NewGuid(),
                BudgetPlanId = planId,
                CategoriaNombre = InputSanitizer.SanitizeText(itemInput.CategoriaNombre ?? string.Empty).Normalize(),
                CategoriaOrder = itemInput.CategoriaOrder,
                DisplayOrder = itemInput.DisplayOrder,
                Codigo = string.IsNullOrWhiteSpace(itemInput.Codigo) ? null : InputSanitizer.SanitizeText(itemInput.Codigo).Normalize(),
                Concepto = InputSanitizer.SanitizeText(itemInput.Concepto ?? string.Empty).Normalize(),
                FasePhva = itemInput.FasePhva,
                MesProgramado = InputSanitizer.SanitizeText(itemInput.MesProgramado ?? string.Empty).Normalize(),
                ValorPresupuestado = itemInput.ValorPresupuestado,
                ValorEjecutado = itemInput.ValorEjecutado,
                AreaResponsable = InputSanitizer.SanitizeText(itemInput.AreaResponsable ?? string.Empty).Normalize(),
                SoporteComprobante = string.IsNullOrWhiteSpace(itemInput.SoporteComprobante) ? null : InputSanitizer.SanitizeText(itemInput.SoporteComprobante).Normalize(),
                EstadoManual = SanitizeEstadoManual(itemInput.EstadoManual)
            };
        }

        // "Completado" si ya se ejecutó el 100% o más del presupuesto; "Pendiente" si aún no se ha
        // ejecutado nada; "En Progreso" en cualquier otro caso intermedio. Un EstadoManual no nulo
        // fijado por el usuario tiene prioridad sobre el cálculo automático.
        private static string ComputeEstadoLineItem(decimal presupuestado, decimal ejecutado, string? estadoManual)
        {
            if (!string.IsNullOrWhiteSpace(estadoManual)) return estadoManual;
            var pct = presupuestado > 0 ? (double)(ejecutado / presupuestado) : 0;
            if (pct >= 1.0) return "Completado";
            if (ejecutado <= 0) return "Pendiente";
            return "En Progreso";
        }

        // Misma lógica que ComputeEstadoLineItem pero a nivel de categoría agregada, donde una
        // categoría sin ninguna ejecución se considera "Crítico" (requiere atención) en vez de
        // simplemente "Pendiente". Si todos los rubros de la categoría están "Completado" (ya sea
        // por cálculo automático o por override manual), la categoría se marca "Completado" aunque
        // la suma monetaria no alcance el 100% (p. ej. rubros manuales o con leves desviaciones).
        private static string ComputeEstadoCategoria(decimal presupuestado, decimal ejecutado, bool allLineItemsCompletado)
        {
            if (allLineItemsCompletado) return "Completado";
            var pct = presupuestado > 0 ? (double)(ejecutado / presupuestado) : 0;
            if (pct >= 1.0) return "Completado";
            if (ejecutado <= 0) return "Crítico";
            return "En Progreso";
        }

        private static SgSstBudgetPlanDto MapToDto(SgSstBudgetPlan plan)
        {
            var lineItemDtos = plan.LineItems
                .OrderBy(li => li.CategoriaOrder)
                .ThenBy(li => li.DisplayOrder)
                .Select(li =>
                {
                    var desviacion = li.ValorPresupuestado - li.ValorEjecutado;
                    var pct = li.ValorPresupuestado > 0 ? (double)(li.ValorEjecutado / li.ValorPresupuestado) : 0;
                    return new BudgetLineItemDto
                    {
                        Id = li.Id,
                        CategoriaNombre = li.CategoriaNombre,
                        CategoriaOrder = li.CategoriaOrder,
                        DisplayOrder = li.DisplayOrder,
                        Codigo = li.Codigo,
                        Concepto = li.Concepto,
                        FasePhva = li.FasePhva,
                        MesProgramado = li.MesProgramado,
                        ValorPresupuestado = li.ValorPresupuestado,
                        ValorEjecutado = li.ValorEjecutado,
                        Desviacion = desviacion,
                        PctEjecucion = pct,
                        Estado = ComputeEstadoLineItem(li.ValorPresupuestado, li.ValorEjecutado, li.EstadoManual),
                        EstadoManual = li.EstadoManual,
                        AreaResponsable = li.AreaResponsable,
                        SoporteComprobante = li.SoporteComprobante
                    };
                })
                .ToList();

            // Agrupa por categoría (orden de primera aparición según CategoriaOrder) para el
            // resumen de control presupuestal por categoría. Se agrupa sobre lineItemDtos (no
            // sobre las entidades crudas) para poder verificar si TODOS los rubros de la
            // categoría ya quedaron "Completado" (respetando el override manual de cada uno).
            var categorySummaries = lineItemDtos
                .GroupBy(li => li.CategoriaNombre)
                .Select(g =>
                {
                    var totalPresupuestado = g.Sum(li => li.ValorPresupuestado);
                    var totalEjecutado = g.Sum(li => li.ValorEjecutado);
                    var desviacion = totalPresupuestado - totalEjecutado;
                    var pct = totalPresupuestado > 0 ? (double)(totalEjecutado / totalPresupuestado) : 0;
                    var allLineItemsCompletado = g.All(li => li.Estado == "Completado");
                    return new BudgetCategorySummaryDto
                    {
                        CategoriaNombre = g.Key,
                        CategoriaOrder = g.Min(li => li.CategoriaOrder),
                        TotalPresupuestado = totalPresupuestado,
                        TotalEjecutado = totalEjecutado,
                        Desviacion = desviacion,
                        PctEjecucion = pct,
                        Estado = ComputeEstadoCategoria(totalPresupuestado, totalEjecutado, allLineItemsCompletado)
                    };
                })
                .OrderBy(c => c.CategoriaOrder)
                .ToList();

            var grandTotalPresupuestado = plan.LineItems.Sum(li => li.ValorPresupuestado);
            var grandTotalEjecutado = plan.LineItems.Sum(li => li.ValorEjecutado);
            var grandDesviacion = grandTotalPresupuestado - grandTotalEjecutado;
            var grandPct = grandTotalPresupuestado > 0 ? (double)(grandTotalEjecutado / grandTotalPresupuestado) : 0;

            return new SgSstBudgetPlanDto
            {
                Id = plan.Id,
                Version = plan.Version,
                Status = plan.Status,
                Vigencia = plan.Vigencia,
                RepresentanteLegalNombre = plan.RepresentanteLegalNombre,
                RepresentanteLegalDocumento = plan.RepresentanteLegalDocumento,
                RepresentanteLegalFechaHora = plan.RepresentanteLegalFechaHora,
                RepresentanteLegalFirmaImagen = plan.RepresentanteLegalFirmaImagen,
                ResponsableSgSstNombre = plan.ResponsableSgSstNombre,
                ResponsableSgSstDocumento = plan.ResponsableSgSstDocumento,
                ResponsableSgSstFechaHora = plan.ResponsableSgSstFechaHora,
                ResponsableSgSstFirmaImagen = plan.ResponsableSgSstFirmaImagen,
                CreatedAt = plan.CreatedAt,
                LineItems = lineItemDtos,
                CategorySummaries = categorySummaries,
                GrandTotal = new BudgetGrandTotalDto
                {
                    TotalPresupuestado = grandTotalPresupuestado,
                    TotalEjecutado = grandTotalEjecutado,
                    Desviacion = grandDesviacion,
                    PctEjecucion = grandPct,
                    CategoriasCriticas = categorySummaries.Count(c => c.Estado == "Crítico")
                }
            };
        }
    }
}
