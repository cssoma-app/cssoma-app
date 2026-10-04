import { cookies } from 'next/headers'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import PresupuestoRecursosForm from './PresupuestoRecursosForm'
import type { BudgetPlanDto, TenantData } from './PresupuestoRecursosForm'

export default async function PresupuestoRecursosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5166'

  let currentPlan: BudgetPlanDto | null = null
  let draft: BudgetPlanDto | null = null
  let history: BudgetPlanDto[] = []
  let tenantData: TenantData | null = null
  let error: string | null = null

  if (!token) {
    error = 'No estás autenticado. Por favor, inicia sesión.'
  } else {
    try {
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

      // Cargar plan presupuestal vigente, historial y borrador en progreso
      const [currentRes, historyRes, draftRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/sgsst/budget-plans/current`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }),
        fetch(`${apiBaseUrl}/api/sgsst/budget-plans/history`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }),
        fetch(`${apiBaseUrl}/api/sgsst/budget-plans/draft`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        })
      ])

      if (currentRes.ok) {
        const currentText = await currentRes.text()
        if (currentText) {
          currentPlan = JSON.parse(currentText)
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

      <PresupuestoRecursosForm
        currentPlan={currentPlan}
        draft={draft}
        history={history}
        tenantData={tenantData}
      />
    </DashboardLayout>
  )
}
