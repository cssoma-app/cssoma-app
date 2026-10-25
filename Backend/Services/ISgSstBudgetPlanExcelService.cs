namespace BackendAPI.Services
{
    // Genera el Excel oficial (FOR-SST-004) a partir de datos ya guardados/radicados — nunca del
    // estado no persistido del formulario. Separado de SgSstBudgetPlanService y de
    // SgSstBudgetPlanPdfService (Regla 1 AGENTS.md — Responsabilidad Única): este servicio solo
    // renderiza una hoja de cálculo real (.xlsx vía ClosedXML), a partir del mismo DTO que ya
    // consume el PDF — nunca recalcula subtotales ni vuelve a consultar la base de datos.
    public interface ISgSstBudgetPlanExcelService
    {
        byte[] GenerateExcel(TenantListItemDto tenant, SgSstBudgetPlanDto plan);
    }
}
