namespace BackendAPI.Services
{
    public class DocumentTemplateDto
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string ContentType { get; set; } = string.Empty;
    }

    public class DocumentTemplateFile
    {
        public byte[] Content { get; set; } = System.Array.Empty<byte>();
        public string FileName { get; set; } = string.Empty;
        public string ContentType { get; set; } = string.Empty;
    }

    public interface IDocumentTemplateService
    {
        Task<ServiceResult<List<DocumentTemplateDto>>> GetActiveTemplatesAsync();
        Task<ServiceResult<DocumentTemplateFile>> GetTemplateFileAsync(string code);
    }
}
