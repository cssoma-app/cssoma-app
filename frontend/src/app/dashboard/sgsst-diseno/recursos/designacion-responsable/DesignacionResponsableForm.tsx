'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/context/NotificationContext'
import { getErrorMessage } from '@/lib/utils'
import { DEPARTAMENTOS, MUNICIPIOS_POR_DEPARTAMENTO } from '@/lib/data/colombia-divipola'
import { SGSST_DOCUMENT_CATALOG } from '@/lib/data/sgsst-document-catalog'
import { TenantLogoBox, SSTerraFooterCredit } from '@/components/sgsst/TenantDocumentBranding'

const DOC_META = SGSST_DOCUMENT_CATALOG.responsableDesignacion

interface Props {
  currentDesignation: any
  draft: any
  history: any[]
  functions: any[]
  tenantData: any
}

const RIESGO_OPTIONS = [
  { value: 'I', label: 'RIESGO I', sub: 'Mínimo' },
  { value: 'II', label: 'RIESGO II', sub: 'Bajo' },
  { value: 'III', label: 'RIESGO III', sub: 'Medio' },
  { value: 'IV', label: 'RIESGO IV', sub: 'Alto' },
  { value: 'V', label: 'RIESGO V', sub: 'Máximo' }
]

const PERFIL_OPTIONS = [
  { value: 'TecnicoSst', label: '[Técnico SST]', sub: 'Res. 0312 Art. 4' },
  { value: 'TecnologoSst', label: '[Tecnólogo SST]', sub: 'Res. 0312 Art. 9' },
  { value: 'ProfesionalSst', label: '[Profesional SST]', sub: 'Res. 0312 Art. 16' },
  { value: 'EspecialistaSst', label: '[Especialista SST]', sub: 'Posgrado Idóneo' }
]

const CARGO_OTRO = '__otro__'
const CARGO_OPTIONS = [
  'Responsable SG-SST',
  'Coordinador SST',
  'Coordinador HSEQ',
  'Jefe de Seguridad y Salud en el Trabajo',
  'Director de Seguridad y Salud en el Trabajo',
  'Gerente de Seguridad y Salud en el Trabajo',
  'Profesional en Seguridad y Salud en el Trabajo',
  'Técnico en Seguridad y Salud en el Trabajo',
  'Tecnólogo en Seguridad y Salud en el Trabajo',
  'Especialista en Seguridad y Salud en el Trabajo',
  'Supervisor SST',
  'Analista SST',
  'Líder SST',
  'Inspector de Seguridad Industrial',
  'Coordinador de Seguridad Industrial'
]

const MESES: Record<string, number> = {
  enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6,
  julio: 7, agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12
}

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin shrink-0`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function docTipoToEnum(value: string): string {
  if (value === 'C.C.') return 'Cc'
  if (value === 'C.E.') return 'Ce'
  return 'Pasaporte'
}

function setupCanvas(canvas: HTMLCanvasElement, onDraw?: () => void) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let isDrawing = false

  const dpr = window.devicePixelRatio || 1
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  ctx.scale(dpr, dpr)
  canvas.style.width = `${rect.width}px`
  canvas.style.height = `${rect.height}px`

  ctx.strokeStyle = '#0F172A'
  ctx.lineWidth = 1.8
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  const getPos = (e: MouseEvent | TouchEvent) => {
    const r = canvas.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY
    return { x: clientX - r.left, y: clientY - r.top }
  }

  const start = (e: MouseEvent | TouchEvent) => {
    isDrawing = true
    onDraw?.()
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: MouseEvent | TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stop = () => { isDrawing = false }

  canvas.addEventListener('mousedown', start)
  canvas.addEventListener('mousemove', draw)
  window.addEventListener('mouseup', stop)
  canvas.addEventListener('touchstart', start, { passive: false })
  canvas.addEventListener('touchmove', draw, { passive: false })
  window.addEventListener('touchend', stop)

  return () => {
    canvas.removeEventListener('mousedown', start)
    canvas.removeEventListener('mousemove', draw)
    window.removeEventListener('mouseup', stop)
    canvas.removeEventListener('touchstart', start)
    canvas.removeEventListener('touchmove', draw)
    window.removeEventListener('touchend', stop)
  }
}

function drawSavedSignature(canvas: HTMLCanvasElement, dataUrl: string, onLoaded: () => void) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = new window.Image()
  img.onload = () => {
    const dpr = window.devicePixelRatio || 1
    ctx.drawImage(img, 0, 0, canvas.width / dpr, canvas.height / dpr)
    onLoaded()
  }
  img.src = dataUrl
}

export default function DesignacionResponsableForm({
  currentDesignation,
  draft,
  history,
  functions,
  tenantData
}: Props) {
  const { showSuccess, showError } = useNotification()
  const router = useRouter()
  // El borrador (si existe) representa la edición más reciente en curso y tiene prioridad
  // sobre la designación vigente para prellenar el formulario.
  const source = draft || currentDesignation
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState(draft ? 'Borrador guardado previamente' : 'Sin borrador guardado')

  const employerCanvasRef = useRef<HTMLCanvasElement>(null)
  const sstCanvasRef = useRef<HTMLCanvasElement>(null)
  const [employerSignatureDrawn, setEmployerSignatureDrawn] = useState(false)
  const [sstSignatureDrawn, setSstSignatureDrawn] = useState(false)

  useEffect(() => {
    const cleanups: Array<() => void> = []
    if (employerCanvasRef.current) {
      const c = setupCanvas(employerCanvasRef.current, () => setEmployerSignatureDrawn(true))
      if (c) cleanups.push(c)
      if (source?.empleadorFirmaImagen) {
        drawSavedSignature(employerCanvasRef.current, source.empleadorFirmaImagen, () => setEmployerSignatureDrawn(true))
      }
    }
    if (sstCanvasRef.current) {
      const c = setupCanvas(sstCanvasRef.current, () => setSstSignatureDrawn(true))
      if (c) cleanups.push(c)
      if (source?.responsableFirmaImagen) {
        drawSavedSignature(sstCanvasRef.current, source.responsableFirmaImagen, () => setSstSignatureDrawn(true))
      }
    }
    return () => cleanups.forEach(fn => fn())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearSignature = (ref: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    if (ref === employerCanvasRef) setEmployerSignatureDrawn(false)
    if (ref === sstCanvasRef) setSstSignatureDrawn(false)
  }

  const captureSignature = (ref: React.RefObject<HTMLCanvasElement | null>, wasDrawn: boolean): string | null => {
    if (!wasDrawn || !ref.current) return null
    try {
      return ref.current.toDataURL('image/png')
    } catch {
      return null
    }
  }

  const today = new Date()
  const currentMonthName = today.toLocaleDateString('es-ES', { month: 'long' })

  const [formData, setFormData] = useState({
    org_razon_social: tenantData?.razonSocial || '',
    org_nit: tenantData?.nitRuc || '',
    org_direccion: tenantData?.direccion || '',
    org_departamento: source?.organizacionDepartamento || '',
    org_municipio: source?.organizacionMunicipio || '',
    org_cobertura_detalle: '',
    org_actividad_economica: source?.organizacionActividadEconomica || tenantData?.ciiu || '',
    nivel_riesgo_arl: source?.organizacionNivelRiesgoArl || tenantData?.claseRiesgo || '',
    org_centro_trabajo: source?.coberturaCentroTrabajo || '',

    resp_nombres: source?.responsableNombreCompleto || '',
    resp_doc_tipo: 'C.C.',
    resp_doc_numero: source?.responsableNumeroDocumento || '',
    resp_cargo: source?.responsableCargo || '',
    resp_perfil: source?.nivelCompetencia || '',
    resp_licencia_num: source?.licenciaSstNumero || '',
    resp_licencia_expedida: source?.licenciaSstExpedidaPor || '',
    resp_curso_50h: source ? (source.curso50HorasAprobado ? 'SI' : 'NO') : 'SI',
    resp_actualizacion_20h: source?.fechaActualizacion20Horas
      ? String(source.fechaActualizacion20Horas).split('T')[0]
      : '',

    suscripcion_ciudad: source?.suscripcionCiudad || '',
    suscripcion_dia: today.getDate(),
    suscripcion_mes: currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1),
    suscripcion_anio: today.getFullYear() % 100,

    firma_emp_nombre: source?.empleadorAceptaNombre || '',
    firma_emp_cargo: source?.empleadorAceptaCargo || 'Representante Legal / Alta Dirección',
    firma_emp_doc: source?.empleadorAceptaDocumento || '',

    firma_sst_nombre: source?.responsableAceptaNombre || source?.responsableNombreCompleto || '',
    firma_sst_licencia: source?.responsableAceptaLicencia || source?.licenciaSstNumero || '',
    firma_sst_doc: source?.responsableAceptaDocumento || source?.responsableNumeroDocumento || ''
  })

  const [functionAcceptances, setFunctionAcceptances] = useState(
    functions.map((fn: any) => ({
      functionId: fn.id,
      isAccepted: source
        ? (source.functionAcceptances?.some((fa: any) => fa.functionId === fn.id && fa.isAccepted) ?? false)
        : true
    }))
  )

  const [cargoIsOtro, setCargoIsOtro] = useState(
    !!source?.responsableCargo && !CARGO_OPTIONS.includes(source.responsableCargo)
  )

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDepartamentoChange = (departamento: string) => {
    setFormData(prev => ({ ...prev, org_departamento: departamento, org_municipio: '' }))
  }

  const handleCargoSelectChange = (value: string) => {
    if (value === CARGO_OTRO) {
      setCargoIsOtro(true)
      handleInputChange('resp_cargo', '')
    } else {
      setCargoIsOtro(false)
      handleInputChange('resp_cargo', value)
    }
  }

  const handleFunctionToggle = (index: number) => {
    setFunctionAcceptances(prev =>
      prev.map((f, i) => i === index ? { ...f, isAccepted: !f.isAccepted } : f)
    )
  }

  const handleToggleAllFunctions = (status: boolean) => {
    setFunctionAcceptances(prev => prev.map(f => ({ ...f, isAccepted: status })))
  }

  const progressPercent = useMemo(() => {
    let filled = 0
    const total = 35
    if (formData.org_razon_social.trim()) filled++
    if (formData.org_nit.trim()) filled++
    if (formData.org_direccion.trim()) filled++
    if (formData.org_departamento.trim()) filled++
    if (formData.org_municipio.trim()) filled++
    if (formData.org_actividad_economica.trim()) filled++
    if (formData.nivel_riesgo_arl.trim()) filled++
    if (formData.org_centro_trabajo.trim()) filled++

    if (formData.resp_nombres.trim()) filled++
    if (formData.resp_doc_numero.trim()) filled++
    if (formData.resp_cargo.trim()) filled++
    if (formData.resp_perfil.trim()) filled++
    if (formData.resp_licencia_num.trim()) filled++
    if (formData.resp_licencia_expedida.trim()) filled++

    filled += functionAcceptances.filter(f => f.isAccepted).length

    if (String(formData.suscripcion_ciudad).trim()) filled++
    if (String(formData.suscripcion_dia).trim()) filled++
    if (String(formData.suscripcion_mes).trim()) filled++
    if (String(formData.suscripcion_anio).trim()) filled++

    if (formData.firma_emp_nombre.trim()) filled++
    if (formData.firma_emp_cargo.trim()) filled++
    if (formData.firma_emp_doc.trim()) filled++
    if (formData.firma_sst_nombre.trim()) filled++
    if (formData.firma_sst_licencia.trim()) filled++
    if (formData.firma_sst_doc.trim()) filled++

    return Math.max(10, Math.min(100, Math.round((filled / total) * 100)))
  }, [formData, functionAcceptances])

  const buildPayload = () => {
    const mesNumero = MESES[String(formData.suscripcion_mes).trim().toLowerCase()] || today.getMonth() + 1
    const anioCompleto = 2000 + Number(formData.suscripcion_anio)
    const suscripcionFecha = `${anioCompleto}-${String(mesNumero).padStart(2, '0')}-${String(formData.suscripcion_dia).padStart(2, '0')}`

    return {
      coberturaCentroTrabajo: formData.org_centro_trabajo,
      coberturaDetalle: formData.org_centro_trabajo === 'Específico' ? formData.org_cobertura_detalle : null,
      organizacionDepartamento: formData.org_departamento,
      organizacionMunicipio: formData.org_municipio,
      organizacionNivelRiesgoArl: formData.nivel_riesgo_arl,
      organizacionActividadEconomica: formData.org_actividad_economica,
      responsableNombreCompleto: formData.resp_nombres,
      responsableCargo: formData.resp_cargo,
      responsableTipoDocumento: docTipoToEnum(formData.resp_doc_tipo),
      responsableNumeroDocumento: formData.resp_doc_numero,
      nivelCompetencia: formData.resp_perfil,
      licenciaSstNumero: formData.resp_licencia_num,
      licenciaSstExpedidaPor: formData.resp_licencia_expedida,
      curso50HorasAprobado: formData.resp_curso_50h === 'SI',
      fechaActualizacion20Horas: formData.resp_actualizacion_20h || null,
      empleadorAceptaNombre: formData.firma_emp_nombre,
      empleadorAceptaCargo: formData.firma_emp_cargo,
      empleadorAceptaDocumento: formData.firma_emp_doc,
      empleadorFirmaImagen: captureSignature(employerCanvasRef, employerSignatureDrawn),
      responsableAceptaNombre: formData.firma_sst_nombre,
      responsableAceptaLicencia: formData.firma_sst_licencia,
      responsableAceptaDocumento: formData.firma_sst_doc,
      responsableFirmaImagen: captureSignature(sstCanvasRef, sstSignatureDrawn),
      suscripcionCiudad: formData.suscripcion_ciudad,
      suscripcionFecha,
      functionAcceptances
    }
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setSaveStatus('Guardando borrador...')
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

      const response = await fetch(`${apiBaseUrl}/api/sgsst/responsible-designations/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(buildPayload())
      })

      if (response.ok) {
        setSaveStatus(`Borrador guardado a las ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)
      } else {
        const errorBody = await response.json().catch(() => ({}))
        setSaveStatus('Error al guardar el borrador')
        showError('Error al guardar borrador', errorBody.message || `No se pudo guardar el borrador (código ${response.status}).`)
      }
    } catch (error) {
      setSaveStatus('Error al guardar el borrador')
      showError('Error al guardar borrador', getErrorMessage(error, 'No se pudo guardar el borrador'))
    } finally {
      setIsSavingDraft(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

      const response = await fetch(`${apiBaseUrl}/api/sgsst/responsible-designations/current/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        showError(
          'No se pudo exportar el PDF',
          errorBody.message || `Ocurrió un error al generar el PDF oficial (código ${response.status}).`
        )
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${DOC_META.code}_Designacion_Responsable_SGSST.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showError('No se pudo exportar el PDF', getErrorMessage(error, 'Ocurrió un error al generar el PDF oficial'))
    } finally {
      setIsExporting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1]

      const payload = buildPayload()

      const response = await fetch(`${apiBaseUrl}/api/sgsst/responsible-designations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowSuccessModal(true)
      } else {
        const errorBody = await response.json().catch(() => ({}))
        showError('Error al guardar', errorBody.message || `Ocurrió un error al guardar la designación (código ${response.status}).`)
      }
    } catch (error) {
      showError('Error al guardar', getErrorMessage(error, 'Ocurrió un error al guardar la designación'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col antialiased text-slate-800 bg-slate-50 pb-44 sm:pb-28">
      {/* BEGIN: Top Bar Navigation / Metadata */}
      <nav className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-0 sm:h-16 flex flex-wrap sm:flex-nowrap items-center justify-between gap-2">
          <div className="flex items-center space-x-3 min-w-0">
            <button
              type="button"
              onClick={() => router.push('/dashboard/sgsst-diseno')}
              title="Volver a Diseño e Implementación SG-SST"
              className="shrink-0 flex items-center gap-1 text-slate-600 hover:text-brand-900 hover:bg-slate-100 px-2.5 py-1.5 rounded-md text-xs font-semibold border border-slate-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
              <span className="hidden sm:inline">Volver</span>
            </button>
            <div className="w-9 h-9 rounded-lg bg-brand-900 text-white flex items-center justify-center font-bold text-lg shadow-inner shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase block">Sistema Integrado de Gestión</span>
              <h1 className="text-sm sm:text-base font-bold text-brand-900 leading-tight truncate">Módulo Documental SIG-SST</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
              <span className="w-1.5 h-1.5 sm:mr-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="hidden sm:inline">Versión Vigente (v02)</span>
            </span>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              title="Descargar el PDF oficial radicado"
              className="text-slate-600 hover:text-brand-900 hover:bg-slate-100 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              )}
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1">
          <div className="bg-gradient-to-r from-brand-600 to-accent-500 h-1 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
      </nav>
      {/* END: Top Bar Navigation / Metadata */}

      {/* BEGIN: Main Document Wrapper */}
      <main className="flex-grow max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        <form className="space-y-8" onSubmit={handleSubmit} id="assignmentForm">
          {/* BEGIN: Header Institutional Matrix */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="md:col-span-3 p-5 flex flex-col items-center justify-center bg-slate-50/50 text-center">
                <TenantLogoBox logoUrl={tenantData?.logoUrl} tenantName={tenantData?.razonSocial || tenantData?.name} />
              </div>
              <div className="md:col-span-6 p-6 flex flex-col justify-center text-center">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-1">Sistema Integrado de Gestión (ISO 9001 / ISO 45001)</span>
                <h2 className="text-base sm:text-lg font-black text-brand-900 tracking-tight leading-snug">
                  {DOC_META.title}
                </h2>
                <p className="text-xs text-slate-500 mt-1">Sistema de Gestión de la Seguridad y Salud en el Trabajo</p>
              </div>
              <div className="md:col-span-3 text-xs divide-y divide-slate-200 bg-slate-50/30">
                <div className="p-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Código:</span>
                  <span className="font-mono font-bold text-brand-900 bg-slate-200/80 px-2 py-0.5 rounded">{DOC_META.code}</span>
                </div>
                <div className="p-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Versión:</span>
                  <span className="font-bold text-slate-800">{DOC_META.version}</span>
                </div>
                <div className="p-2.5 flex justify-between items-center">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Fecha Aprobación:</span>
                  <span className="font-medium text-slate-800">{DOC_META.approvalDate}</span>
                </div>
                <div className="p-2.5 flex flex-col">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Proceso:</span>
                  <span className="font-semibold text-brand-900 text-[11px] mt-0.5">{DOC_META.process}</span>
                </div>
                <div className="p-2.5 flex flex-col">
                  <span className="font-bold text-slate-500 uppercase tracking-wider text-[10px]">Propiedad Intelectual del Formato:</span>
                  <span className="font-semibold text-brand-900 text-[11px] mt-0.5">© SSTerra Consultores</span>
                </div>
              </div>
            </div>
          </section>
          {/* END: Header Institutional Matrix */}

          {/* BEGIN: Regulatory Legal Framework */}
          <section className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 text-slate-800 relative shadow-sm">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-brand-600 text-white rounded-lg shrink-0 mt-0.5 shadow-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              </div>
              <div className="text-xs leading-relaxed">
                <h3 className="font-bold text-brand-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>Marco Legal y Normativo Aplicable</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 bg-blue-200/80 text-brand-900 rounded-full">Obligatorio</span>
                </h3>
                <p className="text-slate-700 text-justify">
                  El presente documento de control de la información documentada se expide conforme a las exigencias de la{' '}
                  <strong className="text-brand-900 font-semibold">NTC-ISO 9001:2015 (Numeral 7.5)</strong>, la{' '}
                  <strong className="text-brand-900 font-semibold">NTC-ISO 45001:2018 (Numerales 5.3 y 7.5)</strong>, el{' '}
                  <strong className="text-brand-900 font-semibold">Artículo 2.2.4.6.8 (Numeral 2) del Decreto 1072 de 2015</strong> y los criterios de idoneidad técnica previstos en los{' '}
                  <strong className="text-brand-900 font-semibold">Artículos 4, 9 y 16 de la Resolución 0312 de 2019</strong> del Ministerio del Trabajo de Colombia.
                </p>
              </div>
            </div>
          </section>
          {/* END: Regulatory Legal Framework */}

          {/* BEGIN: Section 1 - Employer / Organization Identification */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-brand-900 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center border border-white/20">1</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Identificación de la Organización / Empleador</h3>
              </div>
              <span className="text-[11px] text-blue-200 font-medium">Requisito Obligatorio Decreto 1072</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-8">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Razón Social <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.org_razon_social}
                    onChange={e => handleInputChange('org_razon_social', e.target.value)}
                    placeholder="Nombre Completo de la Empresa o Entidad"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="md:col-span-4">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    NIT / Identificación Legal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.org_nit}
                    onChange={e => handleInputChange('org_nit', e.target.value)}
                    placeholder="Ej: 900.123.456-7"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-12">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Dirección de la Sede <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.org_direccion}
                    onChange={e => handleInputChange('org_direccion', e.target.value)}
                    placeholder="Dirección de la Sede Principal (Calle, Carrera, No.)"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Departamento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.org_departamento}
                    onChange={e => handleDepartamentoChange(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600"
                    required
                  >
                    <option disabled value="">Seleccione departamento...</option>
                    {DEPARTAMENTOS.map(dep => (
                      <option key={dep} value={dep}>{dep}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Municipio <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.org_municipio}
                    onChange={e => handleInputChange('org_municipio', e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 disabled:bg-slate-100 disabled:text-slate-400"
                    disabled={!formData.org_departamento}
                    required
                  >
                    <option disabled value="">
                      {formData.org_departamento ? 'Seleccione municipio...' : 'Seleccione primero el departamento'}
                    </option>
                    {(MUNICIPIOS_POR_DEPARTAMENTO[formData.org_departamento] || []).map(mun => (
                      <option key={mun} value={mun}>{mun}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-12">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Actividad Económica Principal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.org_actividad_economica}
                    onChange={e => handleInputChange('org_actividad_economica', e.target.value)}
                    placeholder="Descripción de la actividad según Clasificación CIU"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-1">
                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Nivel de Riesgo ARL <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {RIESGO_OPTIONS.map(opt => (
                      <label key={opt.value} className="cursor-pointer">
                        <input
                          type="radio"
                          name="nivel_riesgo_arl"
                          value={opt.value}
                          checked={formData.nivel_riesgo_arl === opt.value}
                          onChange={e => handleInputChange('nivel_riesgo_arl', e.target.value)}
                          className="peer sr-only"
                          required
                        />
                        <div className="text-center py-2 px-1 rounded-lg border border-slate-300 bg-white peer-checked:bg-brand-900 peer-checked:text-white peer-checked:border-brand-900 hover:bg-slate-50 transition-all">
                          <span className="text-xs font-bold block">{opt.label}</span>
                          <span className="text-[10px] opacity-75">{opt.sub}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-6">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Centro de Trabajo / Cobertura <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.org_centro_trabajo}
                    onChange={e => handleInputChange('org_centro_trabajo', e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 py-2.5"
                    required
                  >
                    <option disabled value="">Seleccione cobertura de la designación...</option>
                    <option value="Sede Central">Sede Central</option>
                    <option value="Sede Operativa">Sede Operativa</option>
                    <option value="Todos los Centros de Trabajo">Todos los Centros de Trabajo a Nivel Nacional</option>
                    <option value="Específico">Otro Centro de Trabajo Específico</option>
                  </select>
                  {formData.org_centro_trabajo === 'Específico' && (
                    <input
                      type="text"
                      value={formData.org_cobertura_detalle}
                      onChange={e => handleInputChange('org_cobertura_detalle', e.target.value)}
                      placeholder="Especifique el centro de trabajo"
                      className="mt-2 w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                      required
                      autoFocus
                    />
                  )}
                </div>
              </div>
            </div>
          </section>
          {/* END: Section 1 */}

          {/* BEGIN: Section 2 - Designated Person Profile & Identification */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-brand-900 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center border border-white/20">2</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Perfil e Identificación del Responsable Designado</h3>
              </div>
              <span className="text-[11px] text-blue-200 font-medium">Resolución 0312 de 2019</span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-7">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Nombres y Apellidos <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.resp_nombres}
                    onChange={e => handleInputChange('resp_nombres', e.target.value)}
                    placeholder="Nombres y Apellidos Completos del Designado"
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                    required
                  />
                </div>
                <div className="md:col-span-5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Tipo y N° de Documento <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                      value={formData.resp_doc_tipo}
                      onChange={e => handleInputChange('resp_doc_tipo', e.target.value)}
                      className="text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600"
                    >
                      <option value="C.C.">C.C.</option>
                      <option value="C.E.">C.E.</option>
                      <option value="Pasaporte">Pasap.</option>
                    </select>
                    <input
                      type="text"
                      value={formData.resp_doc_numero}
                      onChange={e => handleInputChange('resp_doc_numero', e.target.value)}
                      placeholder="Número de documento"
                      className="sm:col-span-2 text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-12">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Cargo Organizacional <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={cargoIsOtro ? CARGO_OTRO : formData.resp_cargo}
                    onChange={e => handleCargoSelectChange(e.target.value)}
                    className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600"
                    required={!cargoIsOtro}
                  >
                    <option disabled value="">Seleccione el cargo formal del responsable...</option>
                    {CARGO_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                    <option value={CARGO_OTRO}>Otro (especificar)</option>
                  </select>
                  {cargoIsOtro && (
                    <input
                      type="text"
                      value={formData.resp_cargo}
                      onChange={e => handleInputChange('resp_cargo', e.target.value)}
                      placeholder="Escriba el cargo formal en la estructura de la empresa"
                      className="mt-2 w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400"
                      required
                      autoFocus
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Nivel de Competencia / Perfil Idóneo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PERFIL_OPTIONS.map(opt => (
                    <label key={opt.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="resp_perfil"
                        value={opt.value}
                        checked={formData.resp_perfil === opt.value}
                        onChange={e => handleInputChange('resp_perfil', e.target.value)}
                        className="peer sr-only"
                        required
                      />
                      <div className="p-3 rounded-lg border border-slate-300 bg-white text-center peer-checked:bg-brand-900 peer-checked:text-white peer-checked:border-brand-900 hover:bg-slate-50 transition-all">
                        <span className="text-xs font-bold block">{opt.label}</span>
                        <span className="text-[10px] opacity-75">{opt.sub}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-3">Licencia en Seguridad y Salud en el Trabajo (SST) Vigente</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      N° de Licencia SST <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.resp_licencia_num}
                      onChange={e => handleInputChange('resp_licencia_num', e.target.value)}
                      placeholder="Número de Licencia según Resolución Departamental"
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Expedida por: <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.resp_licencia_expedida}
                      onChange={e => handleInputChange('resp_licencia_expedida', e.target.value)}
                      placeholder="Secretaría Seccional / Distrital de Salud"
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 placeholder:text-slate-400 bg-white"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50/80 p-4 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider mb-3">Formación Obligatoria Normativa</h4>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-6">
                    <span className="block text-xs font-medium text-slate-700 mb-2">Curso Virtual de 50 Horas del SG-SST: <span className="text-red-500">*</span></span>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="resp_curso_50h"
                          value="SI"
                          checked={formData.resp_curso_50h === 'SI'}
                          onChange={e => handleInputChange('resp_curso_50h', e.target.value)}
                          className="text-brand-600 focus:ring-brand-600"
                        />
                        <span className="ml-2 text-xs font-bold text-slate-800">[ SÍ ] Aprobado</span>
                      </label>
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="radio"
                          name="resp_curso_50h"
                          value="NO"
                          checked={formData.resp_curso_50h === 'NO'}
                          onChange={e => handleInputChange('resp_curso_50h', e.target.value)}
                          className="text-brand-600 focus:ring-brand-600"
                        />
                        <span className="ml-2 text-xs font-bold text-slate-800">[ NO ] Pendiente</span>
                      </label>
                    </div>
                  </div>
                  <div className="md:col-span-6">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Última Actualización Curso 20 Horas (si aplica):
                    </label>
                    <input
                      type="date"
                      value={formData.resp_actualizacion_20h}
                      onChange={e => handleInputChange('resp_actualizacion_20h', e.target.value)}
                      className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* END: Section 2 */}

          {/* BEGIN: Section 3 - Functions, Authority & Assigned Responsibilities */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-brand-900 px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center border border-white/20">3</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Funciones, Autoridad y Responsabilidades Asignadas</h3>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleToggleAllFunctions(true)}
                  className="text-[11px] font-semibold text-blue-200 hover:text-white underline text-left sm:text-right"
                >
                  Marcar todas
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleAllFunctions(false)}
                  className="text-[11px] font-semibold text-blue-200 hover:text-white underline text-left sm:text-right"
                >
                  Desmarcar todas
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="bg-slate-50 border-l-4 border-brand-700 p-4 mb-6 rounded-r-lg">
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  En consonancia con la estructura del ciclo <strong>PHVA (Planear, Hacer, Verificar, Actuar)</strong> exigido por <strong>ISO 45001:2018</strong> y la legislación colombiana vigente, la persona asignada asume la <strong>autoridad técnica y administrativa</strong> para desarrollar las siguientes funciones:
                </p>
              </div>
              <div className="space-y-3">
                {functions.map((fn: any, idx: number) => (
                  <div key={fn.id} className="border border-slate-200 rounded-lg p-4 hover:border-brand-600/60 transition-colors bg-white">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={functionAcceptances[idx]?.isAccepted || false}
                        onChange={() => handleFunctionToggle(idx)}
                        className="mt-1 rounded border-slate-300 text-brand-600 focus:ring-brand-600 w-4 h-4 cursor-pointer"
                      />
                      <label className="text-xs sm:text-sm leading-snug cursor-pointer select-none">
                        <strong className="font-bold text-brand-900 block sm:inline">{idx + 1}. {fn.title}:</strong>{' '}
                        <span className="text-slate-700">{fn.description}</span>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* END: Section 3 */}

          {/* BEGIN: Section 4 - Management Commitment, Acceptance & Signatures */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-brand-900 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center border border-white/20">4</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Compromiso de la Alta Dirección y Declaración de Aceptación</h3>
              </div>
              <span className="text-[11px] text-blue-200 font-medium">Suscripción Formal</span>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="text-xs sm:text-sm leading-relaxed">
                  <strong className="font-bold text-brand-900 block mb-1">Por parte de la Alta Dirección / Representación Legal:</strong>
                  <p className="text-slate-700 text-justify">
                    La empresa se compromete a suministrar los recursos financieros, humanos, técnicos y tecnológicos necesarios para la operación y mejora continua del SG-SST, otorgando la autoridad formal al responsable para la toma de decisiones técnicas dentro del marco del Sistema Integrado de Gestión.
                  </p>
                </div>
                <hr className="border-slate-200" />
                <div className="text-xs sm:text-sm leading-relaxed">
                  <strong className="font-bold text-brand-900 block mb-1">Por parte del Responsable Designado:</strong>
                  <p className="text-slate-700 text-justify">
                    Acepto expresamente la asignación de responsabilidades y la autoridad conferida, comprometiéndome a cumplir los lineamientos del Sistema Integrado de Gestión (ISO 9001 / ISO 45001) y la legislación colombiana aplicable con rigor ético y profesional.
                  </p>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-800">
                <span className="font-medium">Para constancia de lo anterior, se suscribe el presente documento en la ciudad de</span>
                <input
                  type="text"
                  value={formData.suscripcion_ciudad}
                  onChange={e => handleInputChange('suscripcion_ciudad', e.target.value)}
                  placeholder="Ciudad de suscripción"
                  className="text-xs sm:text-sm font-medium border-b border-t-0 border-l-0 border-r-0 border-slate-400 focus:ring-0 focus:border-brand-600 px-1 py-0.5 bg-transparent min-w-[140px]"
                  required
                />
                <span className="font-medium">, a los</span>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.suscripcion_dia}
                  onChange={e => handleInputChange('suscripcion_dia', e.target.value)}
                  placeholder="Día"
                  className="w-16 text-center text-xs sm:text-sm font-medium border-b border-t-0 border-l-0 border-r-0 border-slate-400 focus:ring-0 focus:border-brand-600 px-1 py-0.5 bg-transparent"
                  required
                />
                <span className="font-medium">días del mes de</span>
                <input
                  type="text"
                  value={formData.suscripcion_mes}
                  onChange={e => handleInputChange('suscripcion_mes', e.target.value)}
                  placeholder="Mes"
                  className="text-xs sm:text-sm font-medium border-b border-t-0 border-l-0 border-r-0 border-slate-400 focus:ring-0 focus:border-brand-600 px-1 py-0.5 bg-transparent min-w-[120px]"
                  required
                />
                <span className="font-medium">de 20</span>
                <input
                  type="number"
                  min={24}
                  max={99}
                  value={formData.suscripcion_anio}
                  onChange={e => handleInputChange('suscripcion_anio', e.target.value)}
                  className="w-14 text-center text-xs sm:text-sm font-medium border-b border-t-0 border-l-0 border-r-0 border-slate-400 focus:ring-0 focus:border-brand-600 px-1 py-0.5 bg-transparent"
                  required
                />
                <span className="font-medium">.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Employer Signature Column */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Firma Autorizada 1</span>
                    <h4 className="text-sm font-bold text-brand-900 uppercase">Por la Organización / Empleador</h4>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500 font-medium">Espacio de Firma Digital / Electrónica:</span>
                      <button type="button" onClick={() => clearSignature(employerCanvasRef)} className="text-[11px] text-red-600 hover:underline">Limpiar Firma</button>
                    </div>
                    <canvas ref={employerCanvasRef} className="signature-pad w-full" height={110} />
                  </div>
                  <div className="space-y-3 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Nombre del Representante Legal:</label>
                      <input
                        type="text"
                        value={formData.firma_emp_nombre}
                        onChange={e => handleInputChange('firma_emp_nombre', e.target.value)}
                        placeholder="Nombre del Representante Legal"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Cargo:</label>
                      <input
                        type="text"
                        value={formData.firma_emp_cargo}
                        onChange={e => handleInputChange('firma_emp_cargo', e.target.value)}
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Documento de Identidad (C.C.):</label>
                      <input
                        type="text"
                        value={formData.firma_emp_doc}
                        onChange={e => handleInputChange('firma_emp_doc', e.target.value)}
                        placeholder="C.C. N°"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Designated SST Responsible Signature Column */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Firma Autorizada 2</span>
                    <h4 className="text-sm font-bold text-brand-900 uppercase">El Responsable Designado del SG-SST</h4>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500 font-medium">Espacio de Firma Digital / Electrónica:</span>
                      <button type="button" onClick={() => clearSignature(sstCanvasRef)} className="text-[11px] text-red-600 hover:underline">Limpiar Firma</button>
                    </div>
                    <canvas ref={sstCanvasRef} className="signature-pad w-full" height={110} />
                  </div>
                  <div className="space-y-3 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Nombre del Responsable SST:</label>
                      <input
                        type="text"
                        value={formData.firma_sst_nombre}
                        onChange={e => handleInputChange('firma_sst_nombre', e.target.value)}
                        placeholder="Nombre del Responsable SST"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Licencia SST N°:</label>
                      <input
                        type="text"
                        value={formData.firma_sst_licencia}
                        onChange={e => handleInputChange('firma_sst_licencia', e.target.value)}
                        placeholder="Número de Licencia SST Vigente"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Documento de Identidad (C.C.):</label>
                      <input
                        type="text"
                        value={formData.firma_sst_doc}
                        onChange={e => handleInputChange('firma_sst_doc', e.target.value)}
                        placeholder="C.C. N°"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* END: Section 4 */}

          {/* BEGIN: Section 5 - Change Control & Document Custody */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-brand-900 px-6 py-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center border border-white/20">5</span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Control de Cambios y Custodia Documental (ISO 9001 / ISO 45001)</h3>
              </div>
              <span className="text-[11px] text-blue-200 font-medium">Trazabilidad SIG</span>
            </div>
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200 uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-20 text-center">Versión</th>
                      <th className="py-2.5 px-3 w-32">Fecha Cambio</th>
                      <th className="py-2.5 px-4">Descripción de la Modificación / Actualización</th>
                      <th className="py-2.5 px-3 w-48">Elaboró / Revisó</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {history.length === 0 ? (
                      <tr>
                        <td className="py-3 px-3 text-center font-mono font-semibold">01</td>
                        <td className="py-3 px-3 font-medium text-slate-600">20/09/2026</td>
                        <td className="py-3 px-4">Emisión inicial del formato de asignación bajo Decreto 1072 de 2015.</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">Líder de SST</td>
                      </tr>
                    ) : (
                      history.map((record: any) => (
                        <tr key={record.id} className={record.status === 'Active' ? 'hover:bg-slate-50 bg-blue-50/30' : 'hover:bg-slate-50'}>
                          <td className={`py-3 px-3 text-center font-mono font-semibold ${record.status === 'Active' ? 'font-bold text-brand-900' : ''}`}>
                            {String(record.version).padStart(2, '0')}
                          </td>
                          <td className={`py-3 px-3 font-medium ${record.status === 'Active' ? 'font-semibold text-brand-900' : 'text-slate-600'}`}>
                            {record.suscripcionFecha ? new Date(record.suscripcionFecha).toLocaleDateString('es-CO') : '20/09/2026'}
                          </td>
                          <td className={`py-3 px-4 ${record.status === 'Active' ? 'text-slate-800' : ''}`}>
                            Designación de {record.responsableNombreCompleto} como {record.responsableCargo}
                            {record.status !== 'Active' && ' (versión reemplazada).'}
                          </td>
                          <td className={`py-3 px-3 font-semibold ${record.status === 'Active' ? 'text-brand-900' : 'text-slate-800'}`}>
                            Coordinador SGI / SIG
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>Período mínimo de conservación en archivo activo y digital: <strong>20 años</strong> (Art. 2.2.4.6.13 Decreto 1072).</span>
                <button
                  type="button"
                  onClick={() => showSuccess('Nueva revisión', 'Para registrar una nueva revisión, complete y firme el formulario nuevamente arriba.')}
                  className="no-print text-brand-600 hover:text-brand-800 font-semibold hover:underline"
                >
                  + Registrar Nueva Revisión
                </button>
              </div>
            </div>
          </section>
          {/* END: Section 5 */}

          {/* BEGIN: Bottom Institutional Document Footer */}
          <footer className="pt-2 text-center text-xs text-slate-400 space-y-1.5">
            <div className="flex justify-between items-center text-[11px] text-slate-500 px-1 font-medium">
              <span>SISTEMA INTEGRADO DE GESTIÓN (ISO 9001 / ISO 45001)</span>
              <span>Formato Oficial SG-SST • Página 1 y 2 Consolidadas</span>
            </div>
            <p className="text-[10px] text-slate-400">Documento confidencial propiedad de la organización. Su reproducción parcial o total no autorizada constituye una violación a las políticas de seguridad de la información.</p>
            <SSTerraFooterCredit />
          </footer>
        </form>
      </main>
      {/* END: Main Document Wrapper */}

      {/* BEGIN: Sticky Floating Action Bar */}
      <aside className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3 sm:py-3.5 px-4 sm:px-8 shadow-lg z-50 no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-600">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{saveStatus}</span>
            <span className="hidden md:inline text-slate-300">•</span>
            <span className="hidden md:inline text-slate-500">
              {functionAcceptances.filter(f => f.isAccepted).length}/{functions.length} Funciones revisadas
            </span>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingDraft && <Spinner className="w-3.5 h-3.5" />}
              {isSavingDraft ? 'Guardando...' : 'Guardar Borrador'}
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="px-3 sm:px-4 py-2 text-xs font-semibold text-brand-900 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              )}
              <span className="truncate">{isExporting ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>
            <button
              type="submit"
              form="assignmentForm"
              disabled={isSubmitting}
              className="col-span-2 sm:col-span-1 px-5 py-2 text-xs font-bold text-white bg-brand-900 rounded-lg hover:bg-brand-800 transition-all shadow hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? <Spinner className="w-4 h-4" /> : (
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                </svg>
              )}
              {isSubmitting ? 'Radicando...' : 'Firmar y Radicar Formulario'}
            </button>
          </div>
        </div>
      </aside>
      {/* END: Sticky Floating Action Bar */}

      {/* BEGIN: Modal Success Confirmation Notification */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center transform transition-all">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-brand-900 mb-1">¡Delegación SG-SST Radicada Exitosamente!</h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              El documento <span className="font-mono font-semibold text-brand-900">{DOC_META.code} (Versión {DOC_META.version})</span> ha sido formalizado y archivado en el Sistema Integrado de Gestión bajo los lineamientos ISO 45001 y Decreto 1072.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button type="button" onClick={handleExport} disabled={isExporting} className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                {isExporting ? 'Generando PDF...' : 'Descargar PDF Oficial'}
              </button>
              <button
                type="button"
                onClick={() => { setShowSuccessModal(false); window.location.reload() }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-900 rounded-lg hover:bg-brand-800"
              >
                Cerrar Notificación
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: Modal Success Confirmation Notification */}

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          body { background-color: #FFFFFF; }
        }
        .signature-pad {
          touch-action: none;
          background-color: #FFFFFF;
          border: 1px dashed #94A3B8;
          border-radius: 0.5rem;
          cursor: crosshair;
        }
      `}</style>
    </div>
  )
}
