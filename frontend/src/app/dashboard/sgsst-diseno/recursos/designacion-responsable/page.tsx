import { cookies } from 'next/headers'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import DesignacionResponsableForm from './DesignacionResponsableForm'

interface TenantData {
  id: string
  name: string
  razonSocial: string
  nitRuc: string
  direccion: string
  ciiu: string
  numeroTrabajadores: number
  centrosTrabajo: number
  claseRiesgo: string
  arl: string
  logoUrl?: string | null
}

interface CurrentDesignation {
  id: string
  version: number
  status: string
  responsableNombreCompleto: string
  responsableCargo: string
  nivelCompetencia: string
  suscripcionFecha: string
  complianceStatus: string
  complianceNota?: string
  functionAcceptances: Array<{
    functionId: number
    functionTitle: string
    isAccepted: boolean
  }>
}

interface Function {
  id: number
  code: string
  title: string
  description: string
  displayOrder: number
}

export default async function DesignacionResponsablePage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'

  let currentDesignation: CurrentDesignation | null = null
  let draft: CurrentDesignation | null = null
  let history: CurrentDesignation[] = []
  let functions: Function[] = []
  let tenantData: TenantData | null = null
  let error: string | null = null

  if (!token) {
    error = 'No estás autenticado. Por favor, inicia sesión.'
  } else {
    try {
      // Cargar funciones de catálogo primero (no requiere datos de tenant previos)
      const functionsRes = await fetch(`${apiBaseUrl}/api/sgsst/responsible-designations/functions-catalog`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })

      if (functionsRes.ok) {
        const functionsText = await functionsRes.text()
        if (functionsText) {
          functions = JSON.parse(functionsText)
        }
      } else {
        error = `Error al cargar funciones (${functionsRes.status})`
      }

      // Cargar datos del tenant
      const tenantRes = await fetch(`${apiBaseUrl}/api/tenants/current`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      })

      if (tenantRes.ok) {
        const tenantText = await tenantRes.text()
        if (tenantText) {
          tenantData = JSON.parse(tenantText)
        }
      } else {
        error = `Error al cargar tenant (${tenantRes.status})`
      }

      // Cargar designación actual, historial y borrador en progreso
      const [currentRes, historyRes, draftRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/sgsst/responsible-designations/current`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }),
        fetch(`${apiBaseUrl}/api/sgsst/responsible-designations/history`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }),
        fetch(`${apiBaseUrl}/api/sgsst/responsible-designations/draft`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        })
      ])

      if (currentRes.ok) {
        const currentText = await currentRes.text()
        if (currentText) {
          currentDesignation = JSON.parse(currentText)
        }
      }

      if (historyRes.ok) {
        const historyText = await historyRes.text()
        if (historyText) {
          history = JSON.parse(historyText)
        }
      }

      if (draftRes.ok) {
        const draftText = await draftRes.text()
        if (draftText) {
          draft = JSON.parse(draftText)
        }
      }
    } catch (err) {
      error = `Error cargando datos: ${err instanceof Error ? err.message : 'Error desconocido'}`
    }
  }

  return (
    <DashboardLayout>
      {error && (
        <div className="max-w-6xl mx-auto pt-6 px-4">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <DesignacionResponsableForm
        currentDesignation={currentDesignation}
        draft={draft}
        history={history}
        functions={functions}
        tenantData={tenantData}
      />
    </DashboardLayout>
  )
}
