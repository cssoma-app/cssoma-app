'use client'

import { useState, useEffect, useRef, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useNotification } from '@/context/NotificationContext'
import { getErrorMessage } from '@/lib/utils'
import { SGSST_DOCUMENT_CATALOG } from '@/lib/data/sgsst-document-catalog'
import { TenantLogoBox, SSTerraFooterCredit } from '@/components/sgsst/TenantDocumentBranding'

const DOC_META = SGSST_DOCUMENT_CATALOG.presupuestoRecursos

export type FasePhva = 'Planear' | 'Hacer' | 'Verificar' | 'Actuar'
const FASE_OPTIONS: FasePhva[] = ['Planear', 'Hacer', 'Verificar', 'Actuar']

// Color distintivo por fase del ciclo PHVA — se usa como etiqueta en la columna "Fase PHVA" de la
// matriz para romper la monotonía visual de una tabla densa, no solo como texto plano.
const FASE_PHVA_COLORS: Record<FasePhva, string> = {
  Planear: 'bg-sky-100 text-sky-800 border-sky-300',
  Hacer: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  Verificar: 'bg-amber-100 text-amber-800 border-amber-300',
  Actuar: 'bg-emerald-100 text-emerald-800 border-emerald-300'
}

type LineEstado = 'Completado' | 'En Progreso' | 'Pendiente'
type CategoriaEstado = 'Completado' | 'En Progreso' | 'Crítico'

// Periodicidad / mes programado — meses específicos más las periodicidades recurrentes más
// comunes en un cronograma presupuestal SG-SST.
const MES_PROGRAMADO_OPTIONS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
  'Mensual',
  'Bimestral',
  'Trimestral',
  'Cuatrimestral',
  'Semestral',
  'Anual',
  'Enero - Diciembre'
]

// Áreas responsables típicas de un presupuesto SG-SST — el valor actual de un rubro existente
// que no calce con ninguna opción se agrega dinámicamente para no perder el dato guardado.
const AREA_RESPONSABLE_OPTIONS = [
  'SST / GTH',
  'Gerencia General',
  'Talento Humano',
  'Financiera / Contabilidad',
  'Compras / Logística',
  'Salud Ocupacional',
  'Brigada de Emergencias',
  'Copasst',
  'Outsourcing / Asesor Externo'
]

// Formatea dígitos crudos con separador de miles (es-CO) para mostrarlos en un input de texto;
// el valor almacenado en el estado sigue siendo la cadena numérica sin formato.
function formatThousands(digits: string): string {
  const clean = digits.replace(/\D/g, '')
  if (!clean) return ''
  return new Intl.NumberFormat('es-CO').format(Number(clean))
}

function stripThousands(value: string): string {
  return value.replace(/\D/g, '')
}

export interface SgSstBudgetLineItemDto {
  id: string
  categoriaNombre: string
  categoriaOrder: number
  displayOrder: number
  codigo: string | null
  concepto: string
  fasePhva: FasePhva
  mesProgramado: string
  valorPresupuestado: number
  valorEjecutado: number
  desviacion: number
  pctEjecucion: number
  estado: LineEstado
  estadoManual: LineEstado | null
  areaResponsable: string
  soporteComprobante: string | null
}

export interface SgSstBudgetCategorySummaryDto {
  categoriaNombre: string
  categoriaOrder: number
  totalPresupuestado: number
  totalEjecutado: number
  desviacion: number
  pctEjecucion: number
  estado: CategoriaEstado
}

export interface SgSstBudgetGrandTotalDto {
  totalPresupuestado: number
  totalEjecutado: number
  desviacion: number
  pctEjecucion: number
  categoriasCriticas: number
}

export interface BudgetPlanDto {
  id: string
  version: number
  status: 'Active' | 'Superseded' | 'Draft'
  vigencia: number
  representanteLegalNombre: string
  representanteLegalDocumento: string
  representanteLegalFechaHora: string | null
  representanteLegalFirmaImagen: string | null
  responsableSgSstNombre: string
  responsableSgSstDocumento: string
  responsableSgSstFechaHora: string | null
  responsableSgSstFirmaImagen: string | null
  createdAt: string
  lineItems: SgSstBudgetLineItemDto[]
  categorySummaries: SgSstBudgetCategorySummaryDto[]
  grandTotal: SgSstBudgetGrandTotalDto
}

export interface TenantData {
  id: string
  name: string
  razonSocial: string
  nitRuc: string
  logoUrl?: string | null
}

interface Props {
  currentPlan: BudgetPlanDto | null
  draft: BudgetPlanDto | null
  history: BudgetPlanDto[]
  tenantData: TenantData | null
}

interface RubroRow {
  key: string
  codigo: string
  concepto: string
  fasePhva: FasePhva
  mesProgramado: string
  valorPresupuestado: string
  valorEjecutado: string
  areaResponsable: string
  soporteComprobante: string
  estadoManual: LineEstado | ''
}

interface CategoriaRow {
  key: string
  nombre: string
  rubros: RubroRow[]
}

let uidCounter = 0
function genKey(prefix: string): string {
  uidCounter += 1
  return `${prefix}-${uidCounter}-${Math.random().toString(36).slice(2, 8)}`
}

function emptyRubro(): RubroRow {
  return {
    key: genKey('rubro'),
    codigo: '',
    concepto: '',
    fasePhva: 'Planear',
    mesProgramado: '',
    valorPresupuestado: '',
    valorEjecutado: '',
    areaResponsable: '',
    soporteComprobante: '',
    estadoManual: ''
  }
}

function emptyCategoria(): CategoriaRow {
  return { key: genKey('cat'), nombre: '', rubros: [emptyRubro()] }
}

function buildCategoriesFromSource(source: BudgetPlanDto | null): CategoriaRow[] {
  if (!source || !source.lineItems || source.lineItems.length === 0) return [emptyCategoria()]

  const sorted = [...source.lineItems].sort(
    (a, b) => a.categoriaOrder - b.categoriaOrder || a.displayOrder - b.displayOrder
  )
  const order: number[] = []
  const map = new Map<number, CategoriaRow>()

  for (const li of sorted) {
    if (!map.has(li.categoriaOrder)) {
      map.set(li.categoriaOrder, { key: genKey('cat'), nombre: li.categoriaNombre, rubros: [] })
      order.push(li.categoriaOrder)
    }
    map.get(li.categoriaOrder)!.rubros.push({
      key: genKey('rubro'),
      codigo: li.codigo || '',
      concepto: li.concepto,
      fasePhva: li.fasePhva,
      mesProgramado: li.mesProgramado,
      valorPresupuestado: li.valorPresupuestado != null ? String(li.valorPresupuestado) : '',
      valorEjecutado: li.valorEjecutado != null ? String(li.valorEjecutado) : '',
      areaResponsable: li.areaResponsable,
      soporteComprobante: li.soporteComprobante || '',
      estadoManual: li.estadoManual || ''
    })
  }

  return order.map((o) => map.get(o)!)
}

function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
    Number.isFinite(value) ? value : 0
  )
}

// Paleta cíclica para el gráfico circular y el punto indicador de cada categoría —
// el número de categorías es dinámico (definido por el usuario), así que no se puede
// depender de colores fijos por nombre como en el diseño de referencia.
const CATEGORY_PALETTE = ['#1E3A8A', '#DC2626', '#65A30D', '#D97706', '#7C3AED', '#0891B2', '#0D9488', '#DB2777']

function categoryColor(index: number): string {
  return CATEGORY_PALETTE[index % CATEGORY_PALETTE.length]
}

function polarPoint(angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180
  return { x: 50 + 44 * Math.sin(rad), y: 50 - 44 * Math.cos(rad) }
}

function pieSlicePath(startAngle: number, endAngle: number): string {
  const start = polarPoint(startAngle)
  const end = polarPoint(endAngle)
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  return `M 50 50 L ${start.x.toFixed(3)} ${start.y.toFixed(3)} A 44 44 0 ${largeArc} 1 ${end.x.toFixed(3)} ${end.y.toFixed(3)} Z`
}

const rubroSchema = z.object({
  concepto: z.string().trim().min(1, 'Todos los rubros deben tener un Concepto / Actividad.'),
  valorPresupuestado: z.number().min(0, 'El valor presupuestado no puede ser negativo.'),
  valorEjecutado: z.number().min(0, 'El valor ejecutado no puede ser negativo.')
})

const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'Toda categoría debe tener un nombre.'),
  rubros: z.array(rubroSchema).min(1, 'Cada categoría debe tener al menos un rubro presupuestal.')
})

const budgetSchema = z.object({
  vigencia: z.number().int().positive('La vigencia debe ser un año válido.'),
  categorias: z.array(categoriaSchema).min(1, 'Debe existir al menos una categoría presupuestal.')
})

function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin shrink-0`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 3h6a1 1 0 011 1v3H8V4a1 1 0 011-1z"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
    </svg>
  )
}

// Estilo compacto para inputs embebidos dentro de celdas de tabla (matriz consolidada de la
// Pestaña "Detalle Presupuestal") — transparente en reposo, visible al enfocar o pasar el mouse.
const TABLE_CELL_INPUT_CLASS =
  'w-full text-xs bg-transparent border border-transparent rounded px-1.5 py-1 hover:border-slate-200 focus:border-brand-600 focus:ring-1 focus:ring-brand-600 focus:bg-white outline-none transition-colors'

function MetricCard({
  label,
  value,
  icon,
  iconBg,
  iconColor,
  children
}: {
  label: string
  value: string
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  children?: React.ReactNode
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between hover:border-slate-300 transition">
      <div className="flex items-center justify-between text-slate-500 mb-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className={`p-2 rounded-lg ${iconBg} ${iconColor}`}>{icon}</span>
      </div>
      <div>
        <div className="text-2xl font-bold text-slate-900 tracking-tight">{value}</div>
        {children}
      </div>
    </div>
  )
}

function EstadoCategoriaBadge({ estado }: { estado: CategoriaEstado }) {
  const className =
    estado === 'Completado'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : estado === 'En Progreso'
        ? 'bg-blue-100 text-blue-800 border-blue-300'
        : 'bg-red-100 text-red-800 border-red-300'
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider border whitespace-nowrap ${className}`}
    >
      {estado}
    </span>
  )
}

function KpiCard({
  label,
  value,
  subtitle,
  accent
}: {
  label: string
  value: string
  subtitle?: string
  accent: 'brand' | 'blue' | 'emerald' | 'red'
}) {
  const accentClass = {
    brand: 'border-l-brand-800 text-brand-900',
    blue: 'border-l-blue-600 text-blue-700',
    emerald: 'border-l-emerald-600 text-emerald-700',
    red: 'border-l-red-600 text-red-600'
  }[accent]
  return (
    <div className={`bg-white border-l-4 ${accentClass} p-4 rounded-lg shadow-sm border border-slate-200`}>
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className="text-lg font-black tabular-nums mt-1">{value}</p>
      {subtitle && <span className="block text-xs text-slate-500 mt-1">{subtitle}</span>}
    </div>
  )
}

function setupCanvas(canvas: HTMLCanvasElement, onDraw?: () => void, onVisible?: () => void) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  let isDrawing = false
  let activePointerId: number | null = null
  let configuredWidth = 0
  let configuredHeight = 0

  // El recuadro de firma vive dentro de la pestaña "Resumen Ejecutivo", que arranca oculta
  // (display:none) porque la pestaña activa por defecto es "Detalle Presupuestal". Si se mide el
  // tamaño con getBoundingClientRect() mientras está oculto, da 0x0 — y fijar "0px" como estilo
  // inline deja el recuadro invisible PARA SIEMPRE, incluso después de cambiar de pestaña, porque
  // un estilo inline pisa la clase CSS w-full y nada vuelve a tocarlo. Por eso el tamaño real se
  // aplica con un ResizeObserver, que dispara de nuevo en cuanto el canvas obtiene un tamaño
  // real (p. ej. al activar la pestaña) en vez de una sola vez al montar.
  const applySize = () => {
    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    if (rect.width === configuredWidth && rect.height === configuredHeight) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    // Redimensionar el canvas resetea su bitmap y el estado del contexto 2D — hay que reaplicar
    // el estilo de trazo y la escala DPR cada vez, no solo la primera.
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.scale(dpr, dpr)
    ctx.strokeStyle = '#0F172A'
    ctx.lineWidth = 1.8
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    configuredWidth = rect.width
    configuredHeight = rect.height
    onVisible?.()
  }

  applySize()
  const resizeObserver = new ResizeObserver(applySize)
  resizeObserver.observe(canvas)

  // Pointer Events unifica mouse, dedo (touch) y lápiz óptico/stylus (pointerType 'mouse' |
  // 'touch' | 'pen') en un solo modelo — a diferencia de escuchar mouse y touch por separado
  // (como antes), evita que un lápiz digitalizador dispare eventos duplicados o inconsistentes
  // según el navegador/dispositivo, y funciona igual para firmar con mouse o con lápiz óptico.
  const getPos = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const start = (e: PointerEvent) => {
    isDrawing = true
    activePointerId = e.pointerId
    canvas.setPointerCapture(e.pointerId)
    onDraw?.()
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    e.preventDefault()
  }

  const draw = (e: PointerEvent) => {
    if (!isDrawing || e.pointerId !== activePointerId) return
    e.preventDefault()
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stop = (e: PointerEvent) => {
    if (e.pointerId !== activePointerId) return
    isDrawing = false
    activePointerId = null
  }

  canvas.addEventListener('pointerdown', start)
  canvas.addEventListener('pointermove', draw)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)

  return () => {
    resizeObserver.disconnect()
    canvas.removeEventListener('pointerdown', start)
    canvas.removeEventListener('pointermove', draw)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
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

export default function PresupuestoRecursosForm({ currentPlan, draft, history, tenantData }: Props) {
  const { showSuccess, showError } = useNotification()
  const router = useRouter()
  // El borrador (si existe) representa la edición más reciente en curso y tiene prioridad
  // sobre el plan vigente para prellenar el formulario.
  const source = draft || currentPlan

  const [activeTab, setActiveTab] = useState<'detalle' | 'resumen'>('detalle')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSavingDraft, setIsSavingDraft] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isPrinting, setIsPrinting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState(draft ? 'Borrador guardado previamente' : 'Sin borrador guardado')
  // Confirmación previa a eliminar una categoría o rubro — evita borrados accidentales, ya que
  // antes se eliminaba de inmediato al hacer clic en el ícono de papelera.
  const [confirmDelete, setConfirmDelete] = useState<
    { type: 'categoria'; catIdx: number; label: string } | { type: 'rubro'; catIdx: number; rubroIdx: number; label: string } | null
  >(null)
  // Advertencia previa a exportar/imprimir si el presupuesto radicado aún no tiene todas sus
  // categorías en estado "Completado" — no bloquea la acción, solo pide confirmación.
  const [pendingExportAction, setPendingExportAction] = useState<'pdf' | 'excel' | 'print' | null>(null)

  const [vigencia, setVigencia] = useState<string>(String(source?.vigencia || new Date().getFullYear()))
  const [formData, setFormData] = useState({
    representanteLegalNombre: source?.representanteLegalNombre || '',
    representanteLegalDocumento: source?.representanteLegalDocumento || '',
    responsableSgSstNombre: source?.responsableSgSstNombre || '',
    responsableSgSstDocumento: source?.responsableSgSstDocumento || ''
  })
  const [categorias, setCategorias] = useState<CategoriaRow[]>(() => buildCategoriesFromSource(source))

  const representanteLegalCanvasRef = useRef<HTMLCanvasElement>(null)
  const responsableSgSstCanvasRef = useRef<HTMLCanvasElement>(null)
  const [representanteLegalSignatureDrawn, setRepresentanteLegalSignatureDrawn] = useState(false)
  const [responsableSgSstSignatureDrawn, setResponsableSgSstSignatureDrawn] = useState(false)

  useEffect(() => {
    const cleanups: Array<() => void> = []
    if (representanteLegalCanvasRef.current) {
      const c = setupCanvas(
        representanteLegalCanvasRef.current,
        () => setRepresentanteLegalSignatureDrawn(true),
        // Se vuelve a dibujar la firma guardada cada vez que el canvas obtiene un tamaño real —
        // no solo al montar — porque este recuadro empieza oculto (pestaña "Resumen Ejecutivo" no
        // activa por defecto) y redimensionar el canvas borra su contenido previo.
        () => {
          if (representanteLegalCanvasRef.current && source?.representanteLegalFirmaImagen) {
            drawSavedSignature(representanteLegalCanvasRef.current, source.representanteLegalFirmaImagen, () =>
              setRepresentanteLegalSignatureDrawn(true)
            )
          }
        }
      )
      if (c) cleanups.push(c)
    }
    if (responsableSgSstCanvasRef.current) {
      const c = setupCanvas(
        responsableSgSstCanvasRef.current,
        () => setResponsableSgSstSignatureDrawn(true),
        () => {
          if (responsableSgSstCanvasRef.current && source?.responsableSgSstFirmaImagen) {
            drawSavedSignature(responsableSgSstCanvasRef.current, source.responsableSgSstFirmaImagen, () =>
              setResponsableSgSstSignatureDrawn(true)
            )
          }
        }
      )
      if (c) cleanups.push(c)
    }
    return () => cleanups.forEach((fn) => fn())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const clearSignature = (ref: React.RefObject<HTMLCanvasElement | null>) => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    if (ref === representanteLegalCanvasRef) setRepresentanteLegalSignatureDrawn(false)
    if (ref === responsableSgSstCanvasRef) setResponsableSgSstSignatureDrawn(false)
  }

  const captureSignature = (ref: React.RefObject<HTMLCanvasElement | null>, wasDrawn: boolean): string | null => {
    if (!wasDrawn || !ref.current) return null
    try {
      return ref.current.toDataURL('image/png')
    } catch {
      return null
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const updateCategoriaNombre = (catIdx: number, nombre: string) => {
    setCategorias((prev) => prev.map((c, i) => (i === catIdx ? { ...c, nombre } : c)))
  }

  const addCategoria = () => setCategorias((prev) => [...prev, emptyCategoria()])

  const removeCategoria = (catIdx: number) => {
    setCategorias((prev) => prev.filter((_, i) => i !== catIdx))
  }

  const addRubro = (catIdx: number) => {
    setCategorias((prev) =>
      prev.map((c, i) => (i === catIdx ? { ...c, rubros: [...c.rubros, emptyRubro()] } : c))
    )
  }

  const removeRubro = (catIdx: number, rubroIdx: number) => {
    setCategorias((prev) =>
      prev.map((c, i) => (i === catIdx ? { ...c, rubros: c.rubros.filter((_, ri) => ri !== rubroIdx) } : c))
    )
  }

  const handleConfirmDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'categoria') {
      removeCategoria(confirmDelete.catIdx)
    } else {
      removeRubro(confirmDelete.catIdx, confirmDelete.rubroIdx)
    }
    setConfirmDelete(null)
  }

  const updateRubroField = (catIdx: number, rubroIdx: number, field: keyof RubroRow, value: string) => {
    setCategorias((prev) =>
      prev.map((c, i) =>
        i === catIdx
          ? { ...c, rubros: c.rubros.map((r, ri) => (ri === rubroIdx ? { ...r, [field]: value } : r)) }
          : c
      )
    )
  }

  // Réplica exacta, en TypeScript, de la lógica de cómputo del backend — para que el Resumen
  // Ejecutivo se vea igual antes y después de guardar (Pestaña 2 recalculada en vivo desde
  // el estado de la Pestaña 1, sin necesidad de guardar primero).
  const computedCategories = useMemo(() => {
    return categorias.map((cat, idx) => {
      const rubros = cat.rubros.map((r) => {
        const vp = Number(r.valorPresupuestado) || 0
        const ve = Number(r.valorEjecutado) || 0
        const desviacion = vp - ve
        const pctEjecucion = vp > 0 ? ve / vp : 0
        const estadoAuto: LineEstado = pctEjecucion >= 1 ? 'Completado' : ve <= 0 ? 'Pendiente' : 'En Progreso'
        const estado: LineEstado = r.estadoManual || estadoAuto
        return { ...r, valorPresupuestadoNum: vp, valorEjecutadoNum: ve, desviacion, pctEjecucion, estado, estadoAuto }
      })
      const totalPresupuestado = rubros.reduce((s, r) => s + r.valorPresupuestadoNum, 0)
      const totalEjecutado = rubros.reduce((s, r) => s + r.valorEjecutadoNum, 0)
      const desviacion = totalPresupuestado - totalEjecutado
      const pctEjecucion = totalPresupuestado > 0 ? totalEjecutado / totalPresupuestado : 0
      // Si TODOS los rubros de la categoría ya quedaron "Completado" (cálculo automático u
      // override manual), la categoría se marca "Completado" aunque la suma monetaria no llegue
      // exactamente al 100% (p. ej. rubros marcados manualmente o con pequeñas desviaciones).
      const allRubrosCompletado = rubros.length > 0 && rubros.every((r) => r.estado === 'Completado')
      const estado: CategoriaEstado =
        allRubrosCompletado || pctEjecucion >= 1 ? 'Completado' : totalEjecutado <= 0 ? 'Crítico' : 'En Progreso'
      return {
        categoriaNombre: cat.nombre,
        categoriaOrder: idx,
        rubros,
        totalPresupuestado,
        totalEjecutado,
        desviacion,
        pctEjecucion,
        estado
      }
    })
  }, [categorias])

  const grandTotal = useMemo(() => {
    const totalPresupuestado = computedCategories.reduce((s, c) => s + c.totalPresupuestado, 0)
    const totalEjecutado = computedCategories.reduce((s, c) => s + c.totalEjecutado, 0)
    const desviacion = totalPresupuestado - totalEjecutado
    const pctEjecucion = totalPresupuestado > 0 ? totalEjecutado / totalPresupuestado : 0
    const categoriasCriticas = computedCategories.filter((c) => c.estado === 'Crítico').length
    // Igual que a nivel de categoría: si TODAS las categorías están "Completado", el total
    // general también debe reflejar "Completado".
    const allCategoriasCompletado =
      computedCategories.length > 0 && computedCategories.every((c) => c.estado === 'Completado')
    const estado: CategoriaEstado =
      allCategoriasCompletado || pctEjecucion >= 1 ? 'Completado' : categoriasCriticas > 0 ? 'Crítico' : 'En Progreso'
    return { totalPresupuestado, totalEjecutado, desviacion, pctEjecucion, categoriasCriticas, estado }
  }, [computedCategories])

  // Estado del presupuesto REALMENTE radicado (currentPlan), no del borrador en edición — es lo
  // que efectivamente se exporta en PDF/Excel/Impresión, así que la advertencia de "no completado"
  // debe reflejar esos datos y no los cambios sin guardar del formulario.
  const currentPlanAllCompletado = useMemo(() => {
    if (!currentPlan || currentPlan.categorySummaries.length === 0) return false
    return currentPlan.categorySummaries.every((c) => c.estado === 'Completado')
  }, [currentPlan])

  // Conteo de actividades por estado para la tarjeta "Estado de Actividades" de la Pestaña
  // "Detalle Presupuestal" — recalculado en vivo a partir de las mismas líneas presupuestales.
  const activityStats = useMemo(() => {
    const allRubros = computedCategories.flatMap((c) => c.rubros)
    return {
      total: allRubros.length,
      completado: allRubros.filter((r) => r.estado === 'Completado').length,
      enProgreso: allRubros.filter((r) => r.estado === 'En Progreso').length,
      pendiente: allRubros.filter((r) => r.estado === 'Pendiente').length
    }
  }, [computedCategories])

  // Gráfico circular de distribución presupuestal por categoría — arcos calculados
  // dinámicamente (a diferencia del diseño de referencia, que tenía 3 categorías fijas).
  const pieSlices = useMemo(() => {
    const total = grandTotal.totalPresupuestado
    if (total <= 0) return []
    const withShare = computedCategories
      .map((cat, idx) => ({ categoriaNombre: cat.categoriaNombre, totalPresupuestado: cat.totalPresupuestado, idx, share: cat.totalPresupuestado / total }))
      .filter((c) => c.share > 0)
    if (withShare.length === 1) {
      return withShare.map((c) => ({ ...c, startAngle: 0, endAngle: 360, isFullCircle: true }))
    }
    let cursor = 0
    return withShare.map((c) => {
      const startAngle = cursor * 360
      cursor += c.share
      const endAngle = cursor * 360
      return { ...c, startAngle, endAngle, isFullCircle: false }
    })
  }, [computedCategories, grandTotal.totalPresupuestado])

  const progressPercent = useMemo(() => {
    let filled = 0
    const total = 6
    if (String(vigencia).trim()) filled++
    if (formData.representanteLegalNombre.trim()) filled++
    if (formData.representanteLegalDocumento.trim()) filled++
    if (formData.responsableSgSstNombre.trim()) filled++
    if (formData.responsableSgSstDocumento.trim()) filled++
    if (categorias.some((c) => c.nombre.trim() && c.rubros.some((r) => r.concepto.trim()))) filled++
    return Math.max(10, Math.min(100, Math.round((filled / total) * 100)))
  }, [vigencia, formData, categorias])

  const buildPayload = () => {
    const lineItems = categorias.flatMap((cat, catIdx) =>
      cat.rubros.map((r, rubroIdx) => ({
        categoriaNombre: cat.nombre,
        categoriaOrder: catIdx,
        displayOrder: rubroIdx,
        codigo: r.codigo.trim() ? r.codigo.trim() : null,
        concepto: r.concepto,
        fasePhva: r.fasePhva,
        mesProgramado: r.mesProgramado,
        valorPresupuestado: Number(r.valorPresupuestado) || 0,
        valorEjecutado: Number(r.valorEjecutado) || 0,
        areaResponsable: r.areaResponsable,
        soporteComprobante: r.soporteComprobante.trim() ? r.soporteComprobante.trim() : null,
        estadoManual: r.estadoManual || null
      }))
    )

    return {
      vigencia: Number(vigencia) || 0,
      representanteLegalNombre: formData.representanteLegalNombre,
      representanteLegalDocumento: formData.representanteLegalDocumento,
      representanteLegalFirmaImagen: captureSignature(representanteLegalCanvasRef, representanteLegalSignatureDrawn),
      responsableSgSstNombre: formData.responsableSgSstNombre,
      responsableSgSstDocumento: formData.responsableSgSstDocumento,
      responsableSgSstFirmaImagen: captureSignature(responsableSgSstCanvasRef, responsableSgSstSignatureDrawn),
      lineItems
    }
  }

  const validateForSubmit = (): boolean => {
    const parsed = budgetSchema.safeParse({
      vigencia: Number(vigencia) || 0,
      categorias: categorias.map((c) => ({
        nombre: c.nombre,
        rubros: c.rubros.map((r) => ({
          concepto: r.concepto,
          valorPresupuestado: Number(r.valorPresupuestado) || 0,
          valorEjecutado: Number(r.valorEjecutado) || 0
        }))
      }))
    })

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      showError('Revisa el formulario', firstIssue?.message || 'Hay campos incompletos o inválidos.')
      return false
    }

    if (!representanteLegalSignatureDrawn || !responsableSgSstSignatureDrawn) {
      showError(
        'Firmas requeridas',
        'Debes capturar ambas firmas (Representante Legal y Responsable SG-SST) antes de radicar el documento.'
      )
      return false
    }

    return true
  }

  const handleSaveDraft = async () => {
    setIsSavingDraft(true)
    setSaveStatus('Guardando borrador...')
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1]

      const response = await fetch(`${apiBaseUrl}/api/sgsst/budget-plans/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
    if (!currentPlan) return
    setIsExporting(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1]

      const response = await fetch(`${apiBaseUrl}/api/sgsst/budget-plans/current/pdf`, {
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
      link.download = `${DOC_META.code}_Presupuesto_Recursos_SGSST.pdf`
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

  // Excel oficial (ClosedXML en el backend) generado a partir del mismo presupuesto vigente que
  // el PDF — dos hojas: "Detalle Presupuestal" y "Resumen Ejecutivo", listas para filtrar/analizar
  // directamente en Excel (no una tabla HTML disfrazada de .xlsx).
  const handleExportExcel = async () => {
    if (!currentPlan) return
    setIsExportingExcel(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1]

      const response = await fetch(`${apiBaseUrl}/api/sgsst/budget-plans/current/excel`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        showError(
          'No se pudo exportar el Excel',
          errorBody.message || `Ocurrió un error al generar el Excel oficial (código ${response.status}).`
        )
        return
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${DOC_META.code}_Presupuesto_Recursos_SGSST.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      showError('No se pudo exportar el Excel', getErrorMessage(error, 'Ocurrió un error al generar el Excel oficial'))
    } finally {
      setIsExportingExcel(false)
    }
  }

  // Abre el PDF oficial (mismo endpoint que "Descargar PDF") en una pestaña nueva e intenta
  // disparar el diálogo de impresión nativo del visor de PDF del navegador — impresión real de
  // un reporte con formato profesional, no una captura de la pantalla del formulario.
  const openPdfForPrint = (blob: Blob) => {
    const url = window.URL.createObjectURL(blob)
    const printWindow = window.open(url, '_blank')

    if (!printWindow) {
      showError(
        'No se pudo abrir la vista de impresión',
        'Habilita las ventanas emergentes para este sitio e inténtalo de nuevo.'
      )
      window.URL.revokeObjectURL(url)
      return
    }

    let printed = false
    const triggerPrint = () => {
      if (printed) return
      printed = true
      printWindow.focus()
      printWindow.print()
    }
    printWindow.addEventListener('load', triggerPrint)
    // Algunos navegadores no disparan 'load' de forma confiable para su visor de PDF embebido,
    // así que se reintenta tras un breve retraso como respaldo.
    setTimeout(triggerPrint, 800)
  }

  const handlePrint = async () => {
    if (!currentPlan) return
    setIsPrinting(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1]

      const response = await fetch(`${apiBaseUrl}/api/sgsst/budget-plans/current/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}))
        showError(
          'No se pudo generar el PDF para imprimir',
          errorBody.message || `Ocurrió un error al generar el PDF oficial (código ${response.status}).`
        )
        return
      }

      const blob = await response.blob()
      openPdfForPrint(blob)
    } catch (error) {
      showError('No se pudo generar el PDF para imprimir', getErrorMessage(error, 'Ocurrió un error al generar el PDF oficial'))
    } finally {
      setIsPrinting(false)
    }
  }

  const runExportAction = (action: 'pdf' | 'excel' | 'print') => {
    if (action === 'pdf') handleExport()
    else if (action === 'excel') handleExportExcel()
    else handlePrint()
  }

  // Punto de entrada único de los botones de Descargar Excel / Descargar PDF / Imprimir: si el
  // presupuesto radicado aún no tiene todas sus categorías en "Completado", pide confirmación
  // antes de continuar; si ya está Completado, ejecuta la acción directo sin preguntar.
  const requestExport = (action: 'pdf' | 'excel' | 'print') => {
    if (!currentPlan) return
    if (!currentPlanAllCompletado) {
      setPendingExportAction(action)
      return
    }
    runExportAction(action)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForSubmit()) return
    setIsSubmitting(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'
      const token = document.cookie.split('; ').find((row) => row.startsWith('token='))?.split('=')[1]

      const response = await fetch(`${apiBaseUrl}/api/sgsst/budget-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': crypto.randomUUID()
        },
        body: JSON.stringify(buildPayload())
      })

      if (response.ok) {
        setShowSuccessModal(true)
      } else {
        const errorBody = await response.json().catch(() => ({}))
        showError('Error al guardar', errorBody.message || `Ocurrió un error al radicar el presupuesto (código ${response.status}).`)
      }
    } catch (error) {
      showError('Error al guardar', getErrorMessage(error, 'Ocurrió un error al radicar el presupuesto'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const bannerText = draft
    ? 'Borrador cargado (última edición en curso)'
    : currentPlan
      ? `Vigente radicado — Versión ${String(currentPlan.version).padStart(2, '0')}`
      : 'Sin presupuesto radicado todavía'

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
                <path
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase block">Sistema Integrado de Gestión</span>
              <h1 className="text-sm sm:text-base font-bold text-brand-900 leading-tight truncate">Módulo Documental SIG-SST</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                currentPlan
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border-amber-300'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 sm:mr-1.5 rounded-full animate-pulse ${currentPlan ? 'bg-emerald-500' : 'bg-amber-500'}`}
              ></span>
              <span className="hidden sm:inline">{bannerText}</span>
            </span>
            <button
              type="button"
              onClick={() => requestExport('excel')}
              disabled={isExportingExcel || !currentPlan}
              title={currentPlan ? 'Descargar el Excel oficial radicado (.xlsx)' : 'Aún no hay una versión vigente para exportar'}
              className="text-slate-600 hover:text-brand-900 hover:bg-slate-100 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExportingExcel ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 17h6m-6-4h6m-6-4h1m5 12H6a2 2 0 01-2-2V5a2 2 0 012-2h8l6 6v10a2 2 0 01-2 2z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              )}
              <span className="hidden sm:inline">Descargar Excel</span>
            </button>
            <button
              type="button"
              onClick={() => requestExport('pdf')}
              disabled={isExporting || !currentPlan}
              title={currentPlan ? 'Descargar el PDF oficial radicado' : 'Aún no hay una versión vigente para exportar'}
              className="text-slate-600 hover:text-brand-900 hover:bg-slate-100 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              )}
              <span className="hidden sm:inline">Descargar PDF</span>
            </button>
            <button
              type="button"
              onClick={() => requestExport('print')}
              disabled={isPrinting || !currentPlan}
              title={currentPlan ? 'Abrir el PDF oficial e imprimirlo' : 'Aún no hay una versión vigente para imprimir'}
              className="text-slate-600 hover:text-brand-900 hover:bg-slate-100 px-3 py-1.5 rounded-md text-xs font-medium border border-slate-300 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPrinting ? (
                <Spinner className="w-4 h-4" />
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              )}
              <span className="hidden sm:inline">Imprimir</span>
            </button>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-gradient-to-r from-brand-600 to-accent-500 h-1 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </nav>
      {/* END: Top Bar Navigation / Metadata */}

      {/* Ambas pestañas (Detalle Presupuestal y Resumen Ejecutivo) son vistas tipo hoja de cálculo
          — el contenedor se ensancha en las dos para reducir el scroll horizontal interno, en vez
          de quedar acotado al ancho angosto de lectura tipo documento (max-w-5xl). */}
      <main className="flex-grow max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        <form className="space-y-6" onSubmit={handleSubmit} id="budgetForm">
          {/* BEGIN: Header Institutional Matrix */}
          <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              <div className="md:col-span-3 p-5 flex flex-col items-center justify-center bg-slate-50/50 text-center">
                <TenantLogoBox logoUrl={tenantData?.logoUrl} tenantName={tenantData?.razonSocial || tenantData?.name} />
              </div>
              <div className="md:col-span-6 p-6 flex flex-col justify-center text-center">
                <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500 mb-1">
                  Sistema Integrado de Gestión (ISO 9001 / ISO 45001)
                </span>
                <h2 className="text-base sm:text-lg font-black text-brand-900 tracking-tight leading-snug">{DOC_META.title}</h2>
                <p className="text-xs text-slate-500 mt-1">Presupuesto y Asignación de Recursos SG-SST</p>
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
                  <path
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <div className="text-xs leading-relaxed">
                <h3 className="font-bold text-brand-900 text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>Marco Legal y Normativo Aplicable</span>
                  <span className="text-[10px] font-normal px-2 py-0.5 bg-blue-200/80 text-brand-900 rounded-full">Obligatorio</span>
                </h3>
                <p className="text-slate-700 text-justify">
                  El presente formato de presupuesto y asignación de recursos se expide conforme a las exigencias de la{' '}
                  <strong className="text-brand-900 font-semibold">NTC-ISO 45001:2018 (Numeral 5.1, literal e)</strong> y el{' '}
                  <strong className="text-brand-900 font-semibold">Artículo 2.2.4.6.8 (Numeral 4) del Decreto 1072 de 2015</strong>,
                  que exigen a la organización proveer los recursos financieros, técnicos y humanos necesarios para el diseño,
                  implementación, revisión y mejora continua del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SG-SST).
                </p>
              </div>
            </div>
          </section>
          {/* END: Regulatory Legal Framework */}

          {/* BEGIN: Tab selector */}
          <div className="flex gap-1 border-b border-slate-200 no-print">
            <button
              type="button"
              onClick={() => setActiveTab('detalle')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'detalle' ? 'text-brand-900 border-brand-600' : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Detalle Presupuestal
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('resumen')}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'resumen' ? 'text-brand-900 border-brand-600' : 'text-slate-500 border-transparent hover:text-slate-700'
              }`}
            >
              Resumen Ejecutivo
            </button>
          </div>
          {/* END: Tab selector */}

          {/* BEGIN: Tab 1 - Detalle Presupuestal */}
          <div className={activeTab === 'detalle' ? 'space-y-6' : 'hidden'}>
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-brand-900 px-6 py-3.5 flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-brand-700 text-white text-xs font-bold flex items-center justify-center border border-white/20">
                  1
                </span>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vigencia del Presupuesto</h3>
              </div>
              <div className="p-6">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Vigencia (Año) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={vigencia}
                  onChange={(e) => setVigencia(e.target.value)}
                  placeholder="Ej. 2026"
                  className="w-40 text-sm rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-brand-600"
                  required
                />
              </div>
            </section>

            {/* BEGIN: KPI Cards — resumen rápido de la matriz presupuestal en edición */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                label="Presupuesto Programado"
                value={formatCOP(grandTotal.totalPresupuestado)}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                }
              >
                <p className="text-xs text-slate-500 mt-1">100% asignado a {categorias.length || 0} categoría(s)</p>
              </MetricCard>
              <MetricCard
                label="Total Ejecutado"
                value={formatCOP(grandTotal.totalEjecutado)}
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                }
              >
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-2 rounded-full"
                      style={{ width: `${Math.min(100, grandTotal.pctEjecucion * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-700 shrink-0">
                    {(grandTotal.pctEjecucion * 100).toFixed(1)}%
                  </span>
                </div>
              </MetricCard>
              <MetricCard
                label="Desviación / Saldo Restante"
                value={formatCOP(grandTotal.desviacion)}
                iconBg="bg-amber-50"
                iconColor="text-amber-600"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                  </svg>
                }
              >
                <p className="text-xs text-amber-600 mt-1 font-medium">
                  {grandTotal.totalPresupuestado > 0
                    ? `${(100 - grandTotal.pctEjecucion * 100).toFixed(1)}% saldo por comprometer`
                    : 'Sin presupuesto asignado'}
                </p>
              </MetricCard>
              <MetricCard
                label="Estado de Actividades"
                value={`${activityStats.total} Actividad(es)`}
                iconBg="bg-purple-50"
                iconColor="text-purple-600"
                icon={
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                    />
                  </svg>
                }
              >
                <div className="flex items-center gap-3 text-xs mt-1 text-slate-500 flex-wrap">
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                    {activityStats.completado} Compl.
                  </span>
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
                    {activityStats.enProgreso} Prog.
                  </span>
                  <span className="inline-flex items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-400 mr-1" />
                    {activityStats.pendiente} Pend.
                  </span>
                </div>
              </MetricCard>
            </section>
            {/* END: KPI Cards */}

            {/* BEGIN: Matriz Consolidada de Recursos Presupuestados */}
            <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-600" />
                  <span className="text-xs font-bold text-slate-700 tracking-wide uppercase">
                    Matriz Consolidada de Recursos Presupuestados
                  </span>
                  <span className="text-xs bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
                    {categorias.length} Categoría(s)
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Completado
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> En Progreso
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" /> Pendiente
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1650px] text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-brand-900 text-white uppercase text-[11px] tracking-wider font-semibold">
                      <th className="py-3 px-2 min-w-[80px] text-center border-r border-brand-800">Código</th>
                      <th className="py-3 px-2 min-w-[220px] border-r border-brand-800">Concepto / Actividad</th>
                      <th className="py-3 px-2 min-w-[140px] text-center border-r border-brand-800">Fase PHVA</th>
                      <th className="py-3 px-2 min-w-[140px] text-center border-r border-brand-800">Mes Programado</th>
                      <th className="py-3 px-2 text-right min-w-[130px] border-r border-brand-800">Presupuestado</th>
                      <th className="py-3 px-2 text-right min-w-[130px] border-r border-brand-800">Ejecutado</th>
                      <th className="py-3 px-2 text-right min-w-[110px] border-r border-brand-800">Desviación ($)</th>
                      <th className="py-3 px-2 text-center min-w-[100px] border-r border-brand-800">% Ejecución</th>
                      <th className="py-3 px-2 text-center min-w-[150px] border-r border-brand-800">Estado</th>
                      <th className="py-3 px-2 text-center min-w-[170px] border-r border-brand-800">Área Resp.</th>
                      <th className="py-3 px-2 min-w-[130px] border-r border-brand-800">Soporte</th>
                      <th className="py-3 px-1 text-center w-12 no-print">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                    {computedCategories.map((cat, catIdx) => (
                      <Fragment key={categorias[catIdx].key}>
                        {/* Encabezado de categoría — nombre editable + eliminar categoría */}
                        <tr className="bg-blue-50 border-y border-blue-200">
                          <td colSpan={11} className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-1.5 h-4 rounded-sm shrink-0"
                                style={{ backgroundColor: categoryColor(catIdx) }}
                              />
                              <input
                                type="text"
                                value={categorias[catIdx].nombre}
                                onChange={(e) => updateCategoriaNombre(catIdx, e.target.value)}
                                placeholder="Nombre de la categoría (ej. Recursos Humanos)"
                                className="flex-1 min-w-0 bg-transparent text-xs font-bold text-blue-900 uppercase tracking-wide border-b border-blue-300 focus:border-blue-600 focus:outline-none px-1 py-0.5"
                                required
                              />
                            </div>
                          </td>
                          <td className="py-2 px-1 text-center no-print">
                            <button
                              type="button"
                              onClick={() =>
                                setConfirmDelete({
                                  type: 'categoria',
                                  catIdx,
                                  label: categorias[catIdx].nombre || `Categoría ${catIdx + 1}`
                                })
                              }
                              title="Eliminar categoría"
                              className="text-blue-700 hover:text-red-600 p-1"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                        {/* Filas de rubros — edición inline */}
                        {cat.rubros.map((rubro, rubroIdx) => (
                          <tr key={categorias[catIdx].rubros[rubroIdx].key} className="hover:bg-slate-50 transition">
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                value={rubro.codigo}
                                onChange={(e) => updateRubroField(catIdx, rubroIdx, 'codigo', e.target.value)}
                                placeholder="RH-01"
                                className={`${TABLE_CELL_INPUT_CLASS} text-center font-mono`}
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                value={rubro.concepto}
                                onChange={(e) => updateRubroField(catIdx, rubroIdx, 'concepto', e.target.value)}
                                placeholder="Concepto / Actividad SG-SST"
                                className={TABLE_CELL_INPUT_CLASS}
                                required
                              />
                            </td>
                            <td className="py-1 px-1">
                              <select
                                value={rubro.fasePhva}
                                onChange={(e) => updateRubroField(catIdx, rubroIdx, 'fasePhva', e.target.value)}
                                title="Fase del ciclo PHVA"
                                className={`w-full text-center text-[11px] font-semibold rounded-full border px-2 py-1 cursor-pointer outline-none focus:ring-1 focus:ring-brand-600 transition-colors ${FASE_PHVA_COLORS[rubro.fasePhva]}`}
                              >
                                {FASE_OPTIONS.map((f) => (
                                  <option key={f} value={f} className="bg-white text-slate-800 font-normal">
                                    {f}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1 px-1">
                              <select
                                value={rubro.mesProgramado}
                                onChange={(e) => updateRubroField(catIdx, rubroIdx, 'mesProgramado', e.target.value)}
                                className={`${TABLE_CELL_INPUT_CLASS} text-center`}
                              >
                                <option value="" disabled>
                                  Seleccionar...
                                </option>
                                {!MES_PROGRAMADO_OPTIONS.includes(rubro.mesProgramado) && rubro.mesProgramado && (
                                  <option value={rubro.mesProgramado}>{rubro.mesProgramado}</option>
                                )}
                                {MES_PROGRAMADO_OPTIONS.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatThousands(rubro.valorPresupuestado)}
                                onChange={(e) =>
                                  updateRubroField(catIdx, rubroIdx, 'valorPresupuestado', stripThousands(e.target.value))
                                }
                                placeholder="0"
                                className={`${TABLE_CELL_INPUT_CLASS} text-right font-mono`}
                              />
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formatThousands(rubro.valorEjecutado)}
                                onChange={(e) =>
                                  updateRubroField(catIdx, rubroIdx, 'valorEjecutado', stripThousands(e.target.value))
                                }
                                placeholder="0"
                                className={`${TABLE_CELL_INPUT_CLASS} text-right font-mono`}
                              />
                            </td>
                            <td className="py-1 px-2 text-right font-mono text-amber-700">{formatCOP(rubro.desviacion)}</td>
                            <td className="py-1 px-2">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-[11px] font-semibold w-11 text-right shrink-0">
                                  {(rubro.pctEjecucion * 100).toFixed(1)}%
                                </span>
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      rubro.estado === 'Completado'
                                        ? 'bg-emerald-500'
                                        : rubro.estado === 'Pendiente'
                                          ? 'bg-slate-300'
                                          : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${Math.min(100, rubro.pctEjecucion * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </td>
                            <td className="py-1 px-1">
                              <select
                                value={rubro.estadoManual}
                                onChange={(e) => updateRubroField(catIdx, rubroIdx, 'estadoManual', e.target.value)}
                                title="Automático según % de ejecución, o fijar manualmente"
                                className={`${TABLE_CELL_INPUT_CLASS} text-center font-semibold ${
                                  rubro.estado === 'Completado'
                                    ? 'text-emerald-700'
                                    : rubro.estado === 'Pendiente'
                                      ? 'text-slate-600'
                                      : 'text-blue-700'
                                }`}
                              >
                                <option value="">Auto: {rubro.estadoAuto}</option>
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Progreso">En Progreso</option>
                                <option value="Completado">Completado</option>
                              </select>
                            </td>
                            <td className="py-1 px-1">
                              <select
                                value={rubro.areaResponsable}
                                onChange={(e) => updateRubroField(catIdx, rubroIdx, 'areaResponsable', e.target.value)}
                                className={`${TABLE_CELL_INPUT_CLASS} text-center`}
                              >
                                <option value="" disabled>
                                  Seleccionar...
                                </option>
                                {!AREA_RESPONSABLE_OPTIONS.includes(rubro.areaResponsable) && rubro.areaResponsable && (
                                  <option value={rubro.areaResponsable}>{rubro.areaResponsable}</option>
                                )}
                                {AREA_RESPONSABLE_OPTIONS.map((a) => (
                                  <option key={a} value={a}>
                                    {a}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-1 px-1">
                              <input
                                type="text"
                                value={rubro.soporteComprobante}
                                onChange={(e) => updateRubroField(catIdx, rubroIdx, 'soporteComprobante', e.target.value)}
                                placeholder="Factura, Certificado"
                                className={TABLE_CELL_INPUT_CLASS}
                              />
                            </td>
                            <td className="py-1 px-1 text-center no-print">
                              <button
                                type="button"
                                onClick={() =>
                                  setConfirmDelete({
                                    type: 'rubro',
                                    catIdx,
                                    rubroIdx,
                                    label: rubro.concepto || 'este rubro'
                                  })
                                }
                                title="Eliminar rubro"
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {/* Añadir rubro a esta categoría */}
                        <tr className="no-print">
                          <td colSpan={12} className="py-1.5 px-3 bg-slate-50/50">
                            <button
                              type="button"
                              onClick={() => addRubro(catIdx)}
                              className="text-[11px] font-semibold text-brand-700 hover:text-brand-900 hover:underline flex items-center gap-1"
                            >
                              + Añadir Rubro
                            </button>
                          </td>
                        </tr>
                        {/* Subtotal de categoría — solo lectura, recalculado en vivo */}
                        <tr className="bg-slate-100/90 font-bold border-y-2 border-slate-300 text-slate-900">
                          <td colSpan={4} className="py-2 px-3 text-right uppercase tracking-wider text-[11px]">
                            Subtotal {cat.categoriaNombre || `Categoría ${catIdx + 1}`}
                          </td>
                          <td className="py-2 px-2 text-right font-mono">{formatCOP(cat.totalPresupuestado)}</td>
                          <td className="py-2 px-2 text-right font-mono text-emerald-800">{formatCOP(cat.totalEjecutado)}</td>
                          <td
                            className={`py-2 px-2 text-right font-mono ${cat.desviacion < 0 ? 'text-red-600' : 'text-amber-800'}`}
                          >
                            {formatCOP(cat.desviacion)}
                          </td>
                          <td className="py-2 px-2 text-center font-mono">{(cat.pctEjecucion * 100).toFixed(1)}%</td>
                          <td className="py-2 px-2 text-center">
                            <EstadoCategoriaBadge estado={cat.estado} />
                          </td>
                          <td className="py-2 px-2" colSpan={3} />
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-brand-900 text-white font-extrabold text-xs tracking-wide border-t-4 border-blue-600">
                      <td colSpan={4} className="py-3 px-4 text-right uppercase">
                        Total General Presupuesto SG-SST
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm text-blue-200">
                        {formatCOP(grandTotal.totalPresupuestado)}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-sm text-emerald-400">
                        {formatCOP(grandTotal.totalEjecutado)}
                      </td>
                      <td
                        className={`py-3 px-2 text-right font-mono text-sm ${
                          grandTotal.desviacion < 0 ? 'text-red-400' : 'text-amber-300'
                        }`}
                      >
                        {formatCOP(grandTotal.desviacion)}
                      </td>
                      <td className="py-3 px-2 text-center font-mono text-sm">
                        {(grandTotal.pctEjecucion * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-2 text-center">
                        <EstadoCategoriaBadge estado={grandTotal.estado} />
                      </td>
                      <td colSpan={3} className="py-3 px-3 text-slate-400 text-center text-[11px] font-normal">
                        Cumplimiento Dec. 1072/2015
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>
            {/* END: Matriz Consolidada de Recursos Presupuestados */}

            <button
              type="button"
              onClick={addCategoria}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-sm font-semibold text-slate-500 hover:border-brand-600 hover:text-brand-700 transition-colors no-print"
            >
              + Añadir Categoría
            </button>
          </div>
          {/* END: Tab 1 */}

          {/* BEGIN: Tab 2 - Resumen Ejecutivo */}
          <div className={activeTab === 'resumen' ? 'space-y-6' : 'hidden'}>
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-brand-900 px-6 py-3.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Encabezado Institucional</h3>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1">Empresa</span>
                  <span className="font-semibold text-slate-800">{tenantData?.razonSocial || tenantData?.name || '—'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1">NIT</span>
                  <span className="font-semibold text-slate-800">{tenantData?.nitRuc || '—'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1">Responsable SG-SST</span>
                  <span className="font-semibold text-slate-800">{formData.responsableSgSstNombre || '—'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1">Aprobado por</span>
                  <span className="font-semibold text-slate-800">{formData.representanteLegalNombre || '—'}</span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1">Fecha Aprobación</span>
                  <span className="font-semibold text-slate-800">
                    {currentPlan?.representanteLegalFechaHora
                      ? new Date(currentPlan.representanteLegalFechaHora).toLocaleDateString('es-CO')
                      : 'Pendiente de radicación'}
                  </span>
                </div>
                <div>
                  <span className="block font-bold text-slate-500 uppercase tracking-wider text-[11px] mb-1">Vigencia</span>
                  <span className="font-semibold text-slate-800">{vigencia || '—'}</span>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Presupuesto Proyectado"
                value={formatCOP(grandTotal.totalPresupuestado)}
                subtitle={`100% Asignación ${vigencia || '—'}`}
                accent="brand"
              />
              <KpiCard
                label="Presupuesto Ejecutado"
                value={formatCOP(grandTotal.totalEjecutado)}
                subtitle={`${(grandTotal.pctEjecucion * 100).toFixed(1)}% de avance acumulado`}
                accent="blue"
              />
              <KpiCard
                label="Saldo Disponible (Variación)"
                value={formatCOP(grandTotal.desviacion)}
                subtitle={
                  grandTotal.totalPresupuestado > 0
                    ? `${(100 - grandTotal.pctEjecucion * 100).toFixed(1)}% margen restante`
                    : undefined
                }
                accent={grandTotal.desviacion >= 0 ? 'emerald' : 'red'}
              />
              <KpiCard
                label="Categorías en Estado Crítico"
                value={grandTotal.categoriasCriticas > 0 ? `${grandTotal.categoriasCriticas} Categoría(s)` : '0 Categorías'}
                subtitle={
                  grandTotal.categoriasCriticas > 0
                    ? computedCategories
                        .filter((c) => c.estado === 'Crítico')
                        .map((c) => c.categoriaNombre || 'Sin nombre')
                        .join(', ')
                    : 'Sin rubros críticos'
                }
                accent={grandTotal.categoriasCriticas > 0 ? 'red' : 'emerald'}
              />
            </div>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-brand-900 px-6 py-3.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Control Presupuestal por Categoría</h3>
              </div>
              <div className="p-6 overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200 uppercase tracking-wider">
                      <th className="py-2.5 px-3">Categoría</th>
                      <th className="py-2.5 px-3 text-right">Presupuestado</th>
                      <th className="py-2.5 px-3 text-right">Ejecutado</th>
                      <th className="py-2.5 px-3 text-right">Variación</th>
                      <th className="py-2.5 px-3 w-40">% Ejecución</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    {computedCategories.map((cat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-semibold text-slate-800 flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: categoryColor(idx) }}
                          />
                          {cat.categoriaNombre || `Categoría ${idx + 1}`}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{formatCOP(cat.totalPresupuestado)}</td>
                        <td className="py-3 px-3 text-right font-mono">{formatCOP(cat.totalEjecutado)}</td>
                        <td className={`py-3 px-3 text-right font-mono font-semibold ${cat.desviacion < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                          {formatCOP(cat.desviacion)}
                        </td>
                        <td className="py-3 px-3">
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                cat.estado === 'Crítico' ? 'bg-red-500' : cat.estado === 'Completado' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${Math.min(100, Math.round(cat.pctEjecucion * 100))}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-slate-500">{Math.round(cat.pctEjecucion * 100)}%</span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <EstadoCategoriaBadge estado={cat.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-300 font-bold text-slate-900">
                      <td className="py-3 px-3 uppercase text-xs tracking-wider">TOTAL GENERAL</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCOP(grandTotal.totalPresupuestado)}</td>
                      <td className="py-3 px-3 text-right font-mono">{formatCOP(grandTotal.totalEjecutado)}</td>
                      <td className={`py-3 px-3 text-right font-mono ${grandTotal.desviacion < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCOP(grandTotal.desviacion)}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900 w-10 text-right shrink-0">
                            {Math.round(grandTotal.pctEjecucion * 100)}%
                          </span>
                          <div className="w-full bg-slate-300 rounded-full h-2.5">
                            <div
                              className="bg-brand-800 h-2.5 rounded-full"
                              style={{ width: `${Math.min(100, Math.round(grandTotal.pctEjecucion * 100))}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <EstadoCategoriaBadge estado={grandTotal.estado} />
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </section>

            <section className="bg-slate-50 border border-slate-300 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-brand-900 px-6 py-3.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Distribución del Presupuesto por Categoría</h3>
              </div>
              <div className="p-6">
                {grandTotal.totalPresupuestado <= 0 ? (
                  <p className="text-xs text-slate-500 text-justify">
                    Aún no hay valores presupuestados registrados en la Pestaña &quot;Detalle Presupuestal&quot; para mostrar la
                    distribución por categoría.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Gráfico circular SVG — arcos calculados dinámicamente según el peso de cada categoría */}
                    <div className="lg:col-span-6 flex justify-center items-center py-2">
                      <svg className="w-64 h-64 sm:w-72 sm:h-72 drop-shadow-md transition-transform duration-300 hover:scale-105" viewBox="0 0 100 100">
                        {pieSlices.map((slice) =>
                          slice.isFullCircle ? (
                            <circle key={slice.idx} cx={50} cy={50} r={44} fill={categoryColor(slice.idx)} stroke="#ffffff" strokeWidth={0.75} />
                          ) : (
                            <path
                              key={slice.idx}
                              d={pieSlicePath(slice.startAngle, slice.endAngle)}
                              fill={categoryColor(slice.idx)}
                              stroke="#ffffff"
                              strokeWidth={0.75}
                            />
                          )
                        )}
                        <circle cx={50} cy={50} r={1.5} fill="#ffffff" />
                      </svg>
                    </div>
                    {/* Leyenda y proporciones */}
                    <div className="lg:col-span-6 space-y-4 bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
                      <h4 className="text-xs uppercase font-bold text-slate-500 tracking-wider">Leyenda y Proporciones</h4>
                      <div className="space-y-3">
                        {computedCategories.map((cat, idx) => {
                          const share = (cat.totalPresupuestado / grandTotal.totalPresupuestado) * 100
                          const color = categoryColor(idx)
                          return (
                            <div
                              key={idx}
                              className="flex items-start justify-between p-2 rounded hover:bg-slate-50 border-l-4"
                              style={{ borderLeftColor: color }}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-3.5 h-3.5 inline-block rounded-sm shrink-0" style={{ backgroundColor: color }} />
                                <span className="text-xs sm:text-sm font-semibold text-slate-800 truncate">
                                  {cat.categoriaNombre || `Categoría ${idx + 1}`}
                                </span>
                              </div>
                              <div className="text-right shrink-0 pl-2">
                                <span className="text-xs font-bold text-slate-900 block">{share.toFixed(1)}%</span>
                                <span className="text-[11px] text-slate-500 font-mono">{formatCOP(cat.totalPresupuestado)}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                      <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed text-justify">
                        <p>
                          <strong>Nota técnica de cumplimiento:</strong> la distribución presupuestal debe reflejar de manera
                          proporcional los recursos financieros, técnicos y humanos requeridos por cada categoría para el
                          cumplimiento de los Estándares Mínimos del SG-SST (Resolución 0312 de 2019 y Decreto 1072 de 2015).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-brand-900 px-6 py-3.5">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Firmas de Aprobación</h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Firma Autorizada 1</span>
                    <h4 className="text-sm font-bold text-brand-900 uppercase">Representante Legal — Aprobación Presupuestal</h4>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500 font-medium">Espacio de Firma Digital / Electrónica:</span>
                      <button
                        type="button"
                        onClick={() => clearSignature(representanteLegalCanvasRef)}
                        className="text-[11px] text-red-600 hover:underline no-print"
                      >
                        Limpiar Firma
                      </button>
                    </div>
                    <canvas ref={representanteLegalCanvasRef} className="signature-pad w-full" height={110} />
                  </div>
                  <div className="space-y-3 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Nombre del Representante Legal:</label>
                      <input
                        type="text"
                        value={formData.representanteLegalNombre}
                        onChange={(e) => handleInputChange('representanteLegalNombre', e.target.value)}
                        placeholder="Nombre completo"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Documento de Identidad (C.C.):</label>
                      <input
                        type="text"
                        value={formData.representanteLegalDocumento}
                        onChange={(e) => handleInputChange('representanteLegalDocumento', e.target.value)}
                        placeholder="C.C. N°"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-4">
                  <div className="border-b border-slate-200 pb-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Firma Autorizada 2</span>
                    <h4 className="text-sm font-bold text-brand-900 uppercase">Responsable SG-SST — Elaborado / Certificado</h4>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-slate-500 font-medium">Espacio de Firma Digital / Electrónica:</span>
                      <button
                        type="button"
                        onClick={() => clearSignature(responsableSgSstCanvasRef)}
                        className="text-[11px] text-red-600 hover:underline no-print"
                      >
                        Limpiar Firma
                      </button>
                    </div>
                    <canvas ref={responsableSgSstCanvasRef} className="signature-pad w-full" height={110} />
                  </div>
                  <div className="space-y-3 text-xs pt-1">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Nombre del Responsable SG-SST:</label>
                      <input
                        type="text"
                        value={formData.responsableSgSstNombre}
                        onChange={(e) => handleInputChange('responsableSgSstNombre', e.target.value)}
                        placeholder="Nombre completo"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-0.5">Documento de Identidad (C.C.):</label>
                      <input
                        type="text"
                        value={formData.responsableSgSstDocumento}
                        onChange={(e) => handleInputChange('responsableSgSstDocumento', e.target.value)}
                        placeholder="C.C. N°"
                        className="w-full text-xs rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-brand-600 focus:ring-brand-600"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {history.length > 0 && (
              <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-brand-900 px-6 py-3.5">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Control de Cambios</h3>
                </div>
                <div className="p-6 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 font-bold border-y border-slate-200 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-20 text-center">Versión</th>
                        <th className="py-2.5 px-3 w-32">Vigencia</th>
                        <th className="py-2.5 px-4">Descripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {history.map((record) => (
                        <tr key={record.id} className={record.status === 'Active' ? 'hover:bg-slate-50 bg-blue-50/30' : 'hover:bg-slate-50'}>
                          <td className={`py-3 px-3 text-center font-mono font-semibold ${record.status === 'Active' ? 'font-bold text-brand-900' : ''}`}>
                            {String(record.version).padStart(2, '0')}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-600">{record.vigencia}</td>
                          <td className="py-3 px-4">
                            Presupuesto radicado por {record.representanteLegalNombre}
                            {record.status !== 'Active' && ' (versión reemplazada).'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <footer className="pt-2 text-center text-xs text-slate-400 space-y-1.5">
              <div className="flex justify-between items-center text-[11px] text-slate-500 px-1 font-medium">
                <span>SISTEMA INTEGRADO DE GESTIÓN (ISO 9001 / ISO 45001)</span>
                <span>Formato Oficial SG-SST</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Documento confidencial propiedad de la organización. Su reproducción parcial o total no autorizada constituye una
                violación a las políticas de seguridad de la información.
              </p>
              <SSTerraFooterCredit />
            </footer>
          </div>
          {/* END: Tab 2 */}
        </form>
      </main>

      {/* BEGIN: Sticky Floating Action Bar */}
      <aside className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-slate-200 py-3 sm:py-3.5 px-4 sm:px-8 shadow-lg z-50 no-print">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <div className="hidden sm:flex items-center gap-2.5 text-xs text-slate-600">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>{saveStatus}</span>
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
              onClick={() => requestExport('pdf')}
              disabled={isExporting || !currentPlan}
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
              form="budgetForm"
              disabled={isSubmitting}
              className="col-span-2 sm:col-span-1 px-5 py-2 text-xs font-bold text-white bg-brand-900 rounded-lg hover:bg-brand-800 transition-all shadow hover:shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Spinner className="w-4 h-4" />
              ) : (
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
            <h4 className="text-lg font-bold text-brand-900 mb-1">¡Presupuesto SG-SST Radicado Exitosamente!</h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              El documento <span className="font-mono font-semibold text-brand-900">{DOC_META.code} (Versión {DOC_META.version})</span>{' '}
              ha sido formalizado y archivado en el Sistema Integrado de Gestión bajo los lineamientos ISO 45001 y Decreto 1072.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => requestExport('pdf')}
                disabled={isExporting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isExporting ? 'Generando PDF...' : 'Descargar PDF Oficial'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false)
                  window.location.reload()
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-brand-900 rounded-lg hover:bg-brand-800"
              >
                Cerrar Notificación
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: Modal Success Confirmation Notification */}

      {/* BEGIN: Modal Confirmación de Eliminación */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 3h6a1 1 0 011 1v3H8V4a1 1 0 011-1z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-brand-900 mb-1">
              {confirmDelete.type === 'categoria' ? '¿Eliminar esta categoría?' : '¿Eliminar este rubro?'}
            </h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              {confirmDelete.type === 'categoria' ? (
                <>
                  Se eliminará la categoría <span className="font-semibold text-slate-800">&quot;{confirmDelete.label}&quot;</span> y
                  todos sus rubros presupuestales. Esta acción no se puede deshacer.
                </>
              ) : (
                <>
                  Se eliminará el rubro <span className="font-semibold text-slate-800">&quot;{confirmDelete.label}&quot;</span>. Esta
                  acción no se puede deshacer.
                </>
              )}
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: Modal Confirmación de Eliminación */}

      {/* BEGIN: Modal Confirmación de Exportación con Presupuesto Incompleto */}
      {pendingExportAction && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform transition-all">
            <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-brand-900 mb-1">El presupuesto aún no está Completado</h4>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Todavía hay categorías que no llegan al estado <span className="font-semibold text-slate-800">&quot;Completado&quot;</span>.
              ¿Deseas{' '}
              {pendingExportAction === 'excel'
                ? 'descargar el Excel'
                : pendingExportAction === 'pdf'
                  ? 'descargar el PDF'
                  : 'imprimir el documento'}{' '}
              de todas formas?
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => setPendingExportAction(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = pendingExportAction
                  setPendingExportAction(null)
                  if (action) runExportAction(action)
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-amber-600 rounded-lg hover:bg-amber-700"
              >
                Sí, continuar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* END: Modal Confirmación de Exportación con Presupuesto Incompleto */}

      <style jsx global>{`
        @media print {
          @page {
            size: landscape;
            margin: 10mm;
          }
          .no-print {
            display: none !important;
          }
          body {
            background-color: #ffffff;
          }
          /* El contenedor principal deja de estar acotado a max-w-5xl y usa el ancho completo de
             la hoja impresa en horizontal, en vez de quedar recortado por el ancho fijo de pantalla. */
          main {
            max-width: 100% !important;
            padding: 0 !important;
          }
          /* La matriz de "Detalle Presupuestal" es más ancha que la pantalla (min-w-[1650px])
             para permitir scroll horizontal en el navegador; al imprimir se libera ese ancho
             mínimo y la tabla se reduce con table-layout fijo para caber dentro de la hoja
             horizontal en vez de cortarse por los márgenes. */
          .overflow-x-auto {
            overflow: visible !important;
          }
          table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed;
            font-size: 6.5pt !important;
          }
          th,
          td {
            padding: 2px 3px !important;
            overflow-wrap: break-word;
          }
          /* Los inputs/selects embebidos en la matriz se muestran como texto plano al imprimir
             (sin bordes ni fondos) para que no compitan por espacio ni se vean cortados. */
          input,
          select,
          textarea {
            border: none !important;
            background: transparent !important;
            box-shadow: none !important;
            padding: 0 !important;
            -webkit-appearance: none;
            appearance: none;
            color: inherit !important;
          }
          .shadow-sm,
          .shadow,
          .shadow-md,
          .shadow-lg,
          .shadow-xl,
          .shadow-2xl {
            box-shadow: none !important;
          }
          .rounded-xl,
          .rounded-lg,
          .rounded-2xl {
            border-radius: 0 !important;
          }
          section {
            break-inside: avoid;
          }
          tr {
            break-inside: avoid;
          }
        }
        .signature-pad {
          touch-action: none;
          background-color: #ffffff;
          border: 1px dashed #94a3b8;
          border-radius: 0.5rem;
          cursor: crosshair;
        }
      `}</style>
    </div>
  )
}
