namespace BackendAPI.Models
{
    public enum UserRole
    {
        SST_Manager,
        General_Manager,
        SuperAdmin
    }

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
}
