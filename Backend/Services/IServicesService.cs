using System.Collections.Generic;
using System.Threading.Tasks;
using BackendAPI.Models;

namespace BackendAPI.Services
{
    public interface IServicesService
    {
        Task<ServiceResult<List<SassService>>> GetAllServicesAsync();
        Task<ServiceResult<SassService>> ToggleServiceAsync(int id);
    }
}
