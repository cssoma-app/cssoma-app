namespace BackendAPI.Contracts
{
    public class CreateRoleRequest
    {
        public string DisplayName { get; set; } = string.Empty;
    }

    public class UpdateRoleRequest
    {
        public string DisplayName { get; set; } = string.Empty;
    }
}
