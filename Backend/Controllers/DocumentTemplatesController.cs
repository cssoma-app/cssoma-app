using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BackendAPI.Controllers
{
    // Catálogo de plantillas SG-SST descargables en blanco. Solo Admin/SuperAdmin —
    // no son documentos públicos (regla auth.md: [Authorize] con roles explícitos).
    [Authorize(Roles = "SuperAdmin,Admin")]
    [ApiController]
    [Route("api/document-templates")]
    public class DocumentTemplatesController : ControllerBase
    {
        private readonly IDocumentTemplateService _documentTemplateService;

        public DocumentTemplatesController(IDocumentTemplateService documentTemplateService)
        {
            _documentTemplateService = documentTemplateService;
        }

        [HttpGet]
        public async Task<IActionResult> GetTemplates()
        {
            var result = await _documentTemplateService.GetActiveTemplatesAsync();
            return this.ToActionResult(result);
        }

        [HttpGet("{code}/download")]
        public async Task<IActionResult> DownloadTemplate(string code)
        {
            var result = await _documentTemplateService.GetTemplateFileAsync(code);

            if (result.Outcome != ServiceOutcome.Ok || result.Data == null)
            {
                return this.ToActionResult(result);
            }

            return File(result.Data.Content, result.Data.ContentType, result.Data.FileName);
        }
    }
}
