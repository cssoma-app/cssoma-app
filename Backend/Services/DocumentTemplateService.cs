using System.Text.RegularExpressions;
using BackendAPI.Data;
using BackendAPI.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BackendAPI.Services
{
    public class DocumentTemplateService : IDocumentTemplateService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly string _storageRoot;
        private static readonly Regex CodePattern = new("^[A-Za-z0-9_-]{1,50}$", RegexOptions.Compiled);

        public DocumentTemplateService(
            ApplicationDbContext dbContext,
            IWebHostEnvironment webHostEnvironment,
            IConfiguration configuration)
        {
            _dbContext = dbContext;

            var relativePath = configuration["DocumentTemplates:StoragePath"] ?? "StaticAssets/Templates";
            _storageRoot = Path.GetFullPath(Path.Combine(webHostEnvironment.ContentRootPath, relativePath));
        }

        public async Task<ServiceResult<List<DocumentTemplateDto>>> GetActiveTemplatesAsync()
        {
            var templates = await _dbContext.DocumentTemplates
                .Where(t => t.IsActive)
                .OrderBy(t => t.Title)
                .Select(t => new DocumentTemplateDto
                {
                    Id = t.Id,
                    Code = t.Code,
                    Title = t.Title,
                    Description = t.Description,
                    ContentType = t.ContentType
                })
                .ToListAsync();

            return ServiceResult<List<DocumentTemplateDto>>.Ok(templates);
        }

        public async Task<ServiceResult<DocumentTemplateFile>> GetTemplateFileAsync(string code)
        {
            var sanitizedCode = InputSanitizer.SanitizeText(code ?? string.Empty);
            if (!CodePattern.IsMatch(sanitizedCode))
            {
                return ServiceResult<DocumentTemplateFile>.BadRequest("Código de plantilla inválido.");
            }

            var template = await _dbContext.DocumentTemplates
                .FirstOrDefaultAsync(t => t.Code == sanitizedCode && t.IsActive);

            if (template == null)
            {
                return ServiceResult<DocumentTemplateFile>.NotFound("Plantilla no encontrada.");
            }

            // Defensa en profundidad contra path traversal: se resuelve la ruta completa y se
            // verifica que siga contenida dentro de la carpeta de almacenamiento configurada,
            // aunque FileName ya proviene de una fila propia de BD y no de entrada del cliente.
            var fullPath = Path.GetFullPath(Path.Combine(_storageRoot, template.FileName));
            if (!fullPath.StartsWith(_storageRoot, StringComparison.OrdinalIgnoreCase) || !File.Exists(fullPath))
            {
                return ServiceResult<DocumentTemplateFile>.NotFound("El archivo de la plantilla no está disponible.");
            }

            var content = await File.ReadAllBytesAsync(fullPath);

            return ServiceResult<DocumentTemplateFile>.Ok(new DocumentTemplateFile
            {
                Content = content,
                FileName = template.FileName,
                ContentType = template.ContentType
            });
        }
    }
}
