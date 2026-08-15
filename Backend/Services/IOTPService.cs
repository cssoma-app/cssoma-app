namespace BackendAPI.Services
{
    public interface IOTPService
    {
        string GenerateCode(string email);
        bool ValidateCode(string email, string code);
    }
}
