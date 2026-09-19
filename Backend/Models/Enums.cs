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
        Superseded
    }

    public enum ComplianceStatus
    {
        Cumple,
        NoCumple,
        RequiereRevision
    }
}
