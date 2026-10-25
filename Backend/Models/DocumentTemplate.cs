using System;

namespace BackendAPI.Models
{
    // Catálogo global (no tenant-scoped) de plantillas descargables en blanco (ej. FOR-SST-001.docx).
    // El archivo físico vive en StaticAssets/Templates/{FileName} — nunca se expone esa ruta directamente,
    // solo se sirve a través de DocumentTemplatesController (regla auth.md: [Authorize] + roles).
    public class DocumentTemplate
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
