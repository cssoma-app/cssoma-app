using BackendAPI.Models;

namespace BackendAPI.Services
{
    public interface ITokenService
    {
        string GenerateToken(User user);
    }
}
