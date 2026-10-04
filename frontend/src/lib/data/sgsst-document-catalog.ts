// Metadata de control documental (código, versión, fecha de aprobación, proceso) por cada
// formato SG-SST del sistema. Única fuente de verdad en el frontend — espejo del catálogo
// equivalente en el backend (Backend/Models/SgSstDocumentCatalog.cs). Un formulario nuevo agrega
// una entrada acá en vez de repetir estos literales dentro de su componente (ver skill
// "nuevo-formulario-sgsst").
export interface SgSstDocumentMetadata {
  code: string
  version: string
  approvalDate: string
  process: string
  title: string
}

export const SGSST_DOCUMENT_CATALOG = {
  responsableDesignacion: {
    code: 'FOR-SST-001',
    version: '02',
    approvalDate: '27/08/2026',
    process: 'Gestión de SST / Talento Humano',
    title: 'FORMATO DE ASIGNACIÓN Y DELEGACIÓN DE RESPONSABILIDADES DEL SG-SST'
  } satisfies SgSstDocumentMetadata,
  presupuestoRecursos: {
    code: 'FOR-SST-004',
    version: '01',
    approvalDate: '21/09/2026',
    process: 'Gestión de SST / Planeación Financiera',
    title: 'RESUMEN EJECUTIVO Y CONTROL PRESUPUESTAL DEL SG-SST'
  } satisfies SgSstDocumentMetadata
} as const
