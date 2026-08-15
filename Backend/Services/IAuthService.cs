using System.Threading.Tasks;

namespace BackendAPI.Services
{
    public interface IAuthService
    {
        Task<bool> RequestCodeAsync(string email);
        Task<string?> VerifyCodeAsync(string email, string code);
        Task<string?> LoginWithPasswordAsync(string email, string password);
        Task<bool> SetPasswordAsync(string email, string newPassword);
        Task<string?> UpdateProfileAndGetTokenAsync(string currentEmail, string newName, string newEmail);
        Task<LoginResult?> LoginWithPasswordDetailsAsync(string email, string password);
        Task<string?> ChangeTempPasswordAndGetTokenAsync(string email, string newPassword);
    }

    public class LoginResult
    {
        public string Token { get; set; } = string.Empty;
        public bool MustChangePassword { get; set; }
    }
}
