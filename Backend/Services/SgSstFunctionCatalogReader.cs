using BackendAPI.Data;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    public class SgSstFunctionCatalogReader : ISgSstFunctionCatalogReader
    {
        private readonly ApplicationDbContext _dbContext;

        public SgSstFunctionCatalogReader(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<List<SgSstFunctionDto>> GetActiveFunctionsAsync()
        {
            return await _dbContext.SgSstFunctionCatalogs
                .Where(f => f.IsActive)
                .OrderBy(f => f.DisplayOrder)
                .Select(f => new SgSstFunctionDto
                {
                    Id = f.Id,
                    Code = f.Code,
                    Title = f.Title,
                    Description = f.Description,
                    DisplayOrder = f.DisplayOrder
                })
                .ToListAsync();
        }
    }
}
