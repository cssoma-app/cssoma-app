namespace BackendAPI.Models
{
    // Metadata de control documental (código, versión, fecha de aprobación, proceso) por cada
    // formato SG-SST soportado por la plataforma. Única fuente de verdad: tanto el servicio de
    // PDF como el DTO expuesto al frontend leen de aquí, en vez de repetir estos literales en
    // cada capa — evita que un futuro formulario los hardcodee por separado y queden desincronizados.
    public static class SgSstDocumentCatalog
    {
        public record DocumentMetadata(
            string Code,
            string Version,
            string ApprovalDate,
            string Process,
            string Title);

        public static readonly DocumentMetadata ResponsableDesignacion = new(
            Code: "FOR-SST-001",
            Version: "02",
            ApprovalDate: "27/08/2026",
            Process: "Gestión de SST / Talento Humano",
            Title: "FORMATO DE ASIGNACIÓN Y DELEGACIÓN DE RESPONSABILIDADES DEL SG-SST");

        public static readonly DocumentMetadata PresupuestoRecursos = new(
            Code: "FOR-SST-004",
            Version: "01",
            ApprovalDate: "21/09/2026",
            Process: "Gestión de SST / Planeación Financiera",
            Title: "RESUMEN EJECUTIVO Y CONTROL PRESUPUESTAL DEL SG-SST");

        // Al agregar un nuevo formato SG-SST, se registra una entrada nueva acá (ver skill
        // "nuevo-formulario-sgsst") en vez de repetir Código/Versión/Fecha en cada archivo nuevo.
    }
}
