using BackendAPI.Models;

namespace BackendAPI.Services
{
    public class SgSstFunctionDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
    }

    public interface ISgSstFunctionCatalogReader
    {
        Task<List<SgSstFunctionDto>> GetActiveFunctionsAsync();
    }
}
