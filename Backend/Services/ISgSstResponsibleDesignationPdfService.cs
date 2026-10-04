namespace BackendAPI.Services
{
    // Genera el PDF oficial (FOR-SST-001) a partir de datos ya guardados/radicados — nunca del
    // estado no persistido del formulario. Separado de SgSstResponsibleDesignationService (Regla 1
    // AGENTS.md — Responsabilidad Única): ese servicio orquesta persistencia, este solo renderiza.
    public interface ISgSstResponsibleDesignationPdfService
    {
        byte[] GeneratePdf(
            TenantListItemDto tenant,
            SgSstResponsibleDesignationDto designation,
            List<SgSstResponsibleDesignationDto> history);
    }
}
