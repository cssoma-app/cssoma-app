namespace BackendAPI.Models
{
    public enum DocStatus
    {
        Valid,
        Expiring,
        Expired
    }

    public enum DocType
    {
        Normative,
        Matrix,
        TrainingRecord
    }

    public enum DocumentIdType
    {
        Cc,
        Ce,
        Pasaporte
    }

    public enum SstCompetencyLevel
    {
        TecnicoSst,
        TecnologoSst,
        ProfesionalSst,
        EspecialistaSst
    }

    public enum SgSstDesignationStatus
    {
        Active,
        Superseded,
        // Guardado parcial del formulario antes de radicar formalmente (Regla "Guardar Borrador").
        // Una única fila Draft por tenant, con Version = 0 (fuera del rango de versiones reales,
        // que empiezan en 1), nunca pasa por el validador de cumplimiento ni por el historial.
        Draft
    }

    public enum ComplianceStatus
    {
        Cumple,
        NoCumple,
        RequiereRevision
    }

    public enum SstPhvaPhase
    {
        Planear,
        Hacer,
        Verificar,
        Actuar
    }
}
