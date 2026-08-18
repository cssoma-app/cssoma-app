using System.Collections.Generic;
using System.Threading.Tasks;

namespace BackendAPI.Services
{
    public interface IDashboardCardService
    {
        Task<ServiceResult<List<DashboardCardDto>>> GetAllCardsAsync();
        Task<ServiceResult<DashboardCardDto>> ToggleCardAsync(int id);
        Task<ServiceResult<DashboardCardDto>> RenameCardAsync(int id, string name);
        Task<ServiceResult<MyDashboardCardsDto>> GetMyDashboardCardsAsync();
    }

    public class DashboardCardDto
    {
        public int Id { get; set; }
        public string Key { get; set; } = string.Empty;
        public string TabKey { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsEnabled { get; set; }
    }

    public class MyDashboardCardsDto
    {
        public bool All { get; set; }
        public List<string> Keys { get; set; } = new();
    }
}
