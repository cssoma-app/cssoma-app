using System.Threading.Tasks;

namespace BackendAPI.Services
{
    public interface IEmailService
    {
        Task SendSecurityCodeAsync(string email, string code);
        Task SendWelcomeEmailAsync(string email, string tempPassword, string companyName, string roleName);
    }
}
