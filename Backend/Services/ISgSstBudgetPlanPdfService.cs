namespace BackendAPI.Services
{
    // Genera el PDF oficial (FOR-SST-004) a partir de datos ya guardados/radicados — nunca del
    // estado no persistido del formulario. Separado de SgSstBudgetPlanService (Regla 1 AGENTS.md —
    // Responsabilidad Única): ese servicio orquesta persistencia, este solo renderiza.
    public interface ISgSstBudgetPlanPdfService
    {
        byte[] GeneratePdf(TenantListItemDto tenant, SgSstBudgetPlanDto plan);
    }
}
