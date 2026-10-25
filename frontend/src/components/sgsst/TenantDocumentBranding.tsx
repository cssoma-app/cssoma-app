// Piezas de marca reutilizables para los formatos SG-SST que se radican en representación de
// una empresa cliente (tenant). Cada formato pertenece a la empresa seleccionada, no a SSTerra
// Consultores (dueña de la plataforma) — por eso el logo institucional del documento es el de
// esa empresa, con el nombre como respaldo textual cuando no ha subido uno. La atribución a
// SSTerra como proveedor de la plataforma va aparte, en letra pequeña, solo en el pie de página
// (ver SSTerraFooterCredit) — nunca compite con la marca del cliente en el encabezado.

interface TenantLogoBoxProps {
  logoUrl?: string | null
  tenantName?: string | null
  className?: string
}

export function TenantLogoBox({ logoUrl, tenantName, className = 'w-32 h-24' }: TenantLogoBoxProps) {
  if (logoUrl) {
    return (
      <div className={`${className} flex items-center justify-center`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoUrl} alt={`Logo de ${tenantName || 'la empresa'}`} className="max-h-full max-w-full object-contain" />
      </div>
    )
  }

  return (
    <div className={`${className} flex items-center justify-center p-2 border-2 border-dashed border-slate-300 rounded-xl bg-white`}>
      <span className="text-sm font-black text-brand-900 text-center leading-tight break-words">
        {tenantName || 'Sin logo'}
      </span>
    </div>
  )
}

export function SSTerraFooterCredit() {
  const year = new Date().getFullYear()
  return (
    <p className="text-[9px] text-slate-300">
      Plataforma de gestión SG-SST desarrollada por SSTerra Consultores. © {year} SSTerra Consultores.
      Todos los derechos de autor reservados sobre la plataforma y sus formatos.
    </p>
  )
}
