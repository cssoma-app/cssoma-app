"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import {
  ShieldCheck, AlertTriangle, Users, TrendingUp, FileText, ListChecks,
  Building, Building2, DollarSign, AlertOctagon, PieChart, FileWarning
} from "lucide-react"

interface TenantSummary {
  id: string
  name: string
  isActive: boolean
  usersCount: number
}

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
  return null
}

export default function DashboardPage() {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
  const [activeTab, setActiveTab] = useState<"riesgos" | "global">("riesgos")
  const [hasBroadAccess, setHasBroadAccess] = useState(false)
  const [cardKeys, setCardKeys] = useState<string[] | null>(null)
  const [allCards, setAllCards] = useState(false)
  const [tenants, setTenants] = useState<TenantSummary[]>([])

  const canSeeCard = (key: string) => allCards || (cardKeys !== null && cardKeys.includes(key))

  useEffect(() => {
    const token = getCookie("token")
    if (!token) return

    try {
      const payloadDecoded = JSON.parse(atob(token.split(".")[1]))
      const role = payloadDecoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payloadDecoded.role || ""
      const isPlatformOwner = payloadDecoded.IsPlatformOwner === "true"
      setHasBroadAccess(role === "SuperAdmin" || (role === "Admin" && isPlatformOwner))
    } catch (e) {
      console.error("Error decoding token", e)
    }

    fetch(`${apiBaseUrl}/api/auth/my-dashboard-cards`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setAllCards(data.all ?? data.All ?? false)
          setCardKeys(data.keys ?? data.Keys ?? [])
        }
      })
      .catch((e) => console.error("Error loading my-dashboard-cards", e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!hasBroadAccess) return
    const token = getCookie("token")
    fetch(`${apiBaseUrl}/api/tenants`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setTenants(data.map((t: { id: string; name: string; isActive: boolean; usersCount: number }) => ({
        id: t.id, name: t.name, isActive: t.isActive, usersCount: t.usersCount
      }))))
      .catch((e) => console.error("Error loading tenants", e))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBroadAccess])

  // Datos mock de riesgo/cumplimiento propio — sin backend de compliance todavía.
  const compliance = {
    general: 85,
    documentosTotales: 312,
    vencidos: 28,
    accionesAbiertas: 15,
    semaforo: { cumplidos: 186, porVencer: 54, vencidos: 28, noAplica: 32 },
    porEstandar: [
      { nombre: "Política y Objetivos", porcentaje: 90 },
      { nombre: "Organización", porcentaje: 80 },
      { nombre: "Planificación", porcentaje: 75 },
      { nombre: "Aplicación", porcentaje: 85 },
      { nombre: "Auditoría", porcentaje: 70 },
      { nombre: "Mejora", porcentaje: 95 },
    ],
    documentosVencidos: [
      { nombre: "Programa de Capacitación", diasVencido: 15 },
      { nombre: "Matriz de Identificación de Peligros", diasVencido: 10 },
      { nombre: "Plan de Emergencias", diasVencido: 5 },
      { nombre: "Informe de Revisión por la Dirección", diasVencido: 2 },
    ],
  }

  const semaforoTotal = compliance.semaforo.cumplidos + compliance.semaforo.porVencer + compliance.semaforo.vencidos + compliance.semaforo.noAplica
  const pct = (n: number) => Math.round((n / semaforoTotal) * 100)

  // Datos mock de negocio — sin backend de facturación/riesgo todavía.
  const comprasDelMes = 24500000
  const tiposRiesgo = [
    { nombre: "Físico", porcentaje: 35 },
    { nombre: "Ergonómico", porcentaje: 25 },
    { nombre: "Químico", porcentaje: 20 },
    { nombre: "Locativo", porcentaje: 20 },
  ]
  const empresasPorRiesgo = { alto: 4, medio: 11, bajo: 17 }

  const empresasActivas = tenants.filter((t) => t.isActive).length
  const empresasAsociadas = tenants.length

  return (
    <DashboardLayout>
      <div className="mb-6 border-b border-border/50 flex gap-1">
        <button
          onClick={() => setActiveTab("riesgos")}
          className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "riesgos" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
        >
          <ShieldCheck size={16} />
          Análisis de Riesgos
        </button>
        {hasBroadAccess && (
          <button
            onClick={() => setActiveTab("global")}
            className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${activeTab === "global" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
          >
            <Building2 size={16} />
            Visión de Empresas
          </button>
        )}
      </div>

      {activeTab === "riesgos" && (
        <>
          <div className="mb-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-background border border-primary/20 shadow-lg shadow-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">¡Hola! 👋</h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
              Este es el estado de cumplimiento normativo de tu empresa.
              Tienes <span className="text-destructive font-semibold">{compliance.vencidos} documentos</span> que requieren tu revisión inmediata.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {canSeeCard("cumplimiento-general") && (
              <StatCard
                title="Cumplimiento General"
                icon={<ShieldCheck size={20} />}
                iconClass="bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500"
                value={`${compliance.general}%`}
                valueClass="bg-gradient-to-br from-emerald-500 to-emerald-700 dark:to-emerald-400 bg-clip-text text-transparent"
                footer={<><TrendingUp size={12} className="text-emerald-500" /><span className="text-emerald-500 font-medium">+12%</span> vs mes anterior</>}
              />
            )}
            {canSeeCard("documentos-totales") && (
              <StatCard
                title="Documentos"
                icon={<FileText size={20} />}
                iconClass="bg-blue-500/10 text-blue-500 group-hover:bg-blue-500"
                value={String(compliance.documentosTotales)}
                footer="Total documentos"
              />
            )}
            {canSeeCard("documentos-vencidos") && (
              <StatCard
                title="Vencidos"
                icon={<AlertTriangle size={20} />}
                iconClass="bg-destructive/10 text-destructive group-hover:bg-destructive"
                value={String(compliance.vencidos)}
                valueClass="text-destructive"
                footer="Requieren atención"
              />
            )}
            {canSeeCard("acciones-abiertas") && (
              <StatCard
                title="Acciones Abiertas"
                icon={<ListChecks size={20} />}
                iconClass="bg-amber-500/10 text-amber-500 group-hover:bg-amber-500"
                value={String(compliance.accionesAbiertas)}
                valueClass="text-amber-500"
                footer="En seguimiento"
              />
            )}
          </div>

          {canSeeCard("semaforo-cumplimiento") && (
            <div className="mt-8 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-background/40">
                <h3 className="text-lg font-semibold tracking-tight">Semáforo de Cumplimiento</h3>
                <p className="text-sm text-muted-foreground mt-1">Resolución 0312 de 2019</p>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6">
                <SemaforoTile label="Cumplidos" value={compliance.semaforo.cumplidos} pct={pct(compliance.semaforo.cumplidos)} colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
                <SemaforoTile label="Por Vencer" value={compliance.semaforo.porVencer} pct={pct(compliance.semaforo.porVencer)} colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
                <SemaforoTile label="Vencidos" value={compliance.semaforo.vencidos} pct={pct(compliance.semaforo.vencidos)} colorClass="bg-destructive/10 text-destructive" />
                <SemaforoTile label="No Aplica" value={compliance.semaforo.noAplica} pct={pct(compliance.semaforo.noAplica)} colorClass="bg-muted text-muted-foreground" />
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {canSeeCard("cumplimiento-por-estandar") && (
              <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-background/40">
                  <h3 className="text-lg font-semibold tracking-tight">Cumplimiento por Estándar</h3>
                </div>
                <div className="p-6 space-y-4">
                  {compliance.porEstandar.map((e) => (
                    <div key={e.nombre}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-foreground font-medium">{e.nombre}</span>
                        <span className="text-muted-foreground">{e.porcentaje}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${e.porcentaje}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {canSeeCard("lista-documentos-vencidos") && (
              <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-background/40">
                  <h3 className="text-lg font-semibold tracking-tight">Documentos Vencidos</h3>
                </div>
                <div className="divide-y divide-border/50">
                  {compliance.documentosVencidos.map((d) => (
                    <div key={d.nombre} className="flex items-center gap-3 px-6 py-4">
                      <div className="h-9 w-9 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                        <FileWarning size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{d.nombre}</p>
                        <p className="text-xs text-destructive">Vencido hace {d.diasVencido} días</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "global" && hasBroadAccess && (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {canSeeCard("empresas-activas") && (
              <StatCard
                title="Empresas Activas"
                icon={<Building size={20} />}
                iconClass="bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500"
                value={String(empresasActivas)}
                footer="En operación"
              />
            )}
            {canSeeCard("empresas-asociadas") && (
              <StatCard
                title="Empresas Asociadas"
                icon={<Building2 size={20} />}
                iconClass="bg-blue-500/10 text-blue-500 group-hover:bg-blue-500"
                value={String(empresasAsociadas)}
                footer="Total registradas"
              />
            )}
            {canSeeCard("compras-mes") && (
              <StatCard
                title="Compras del Mes"
                icon={<DollarSign size={20} />}
                iconClass="bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500"
                value={comprasDelMes.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                footer="Ingresos por servicios"
              />
            )}
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            {canSeeCard("usuarios-por-empresa") && (
              <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-background/40">
                  <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2"><Users size={18} /> Usuarios por Empresa</h3>
                </div>
                <div className="p-6 space-y-4">
                  {tenants.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin empresas registradas.</p>
                  ) : (
                    tenants.map((t) => {
                      const maxUsers = Math.max(...tenants.map((x) => x.usersCount), 1)
                      return (
                        <div key={t.id}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-foreground font-medium">{t.name}</span>
                            <span className="text-muted-foreground">{t.usersCount}</span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${(t.usersCount / maxUsers) * 100}%` }} />
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}

            {canSeeCard("tipos-riesgo") && (
              <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-border/50 bg-background/40">
                  <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2"><PieChart size={18} /> Tipos de Riesgo</h3>
                </div>
                <div className="p-6 space-y-4">
                  {tiposRiesgo.map((r) => (
                    <div key={r.nombre}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-foreground font-medium">{r.nombre}</span>
                        <span className="text-muted-foreground">{r.porcentaje}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${r.porcentaje}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {canSeeCard("empresas-por-riesgo") && (
            <div className="mt-8 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-border/50 bg-background/40">
                <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2"><AlertOctagon size={18} /> Empresas por Nivel de Riesgo</h3>
              </div>
              <div className="grid grid-cols-3 gap-4 p-6">
                <SemaforoTile label="Riesgo Alto" value={empresasPorRiesgo.alto} pct={0} showPct={false} colorClass="bg-destructive/10 text-destructive" />
                <SemaforoTile label="Riesgo Medio" value={empresasPorRiesgo.medio} pct={0} showPct={false} colorClass="bg-amber-500/10 text-amber-600 dark:text-amber-400" />
                <SemaforoTile label="Riesgo Bajo" value={empresasPorRiesgo.bajo} pct={0} showPct={false} colorClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}

function StatCard({ title, icon, iconClass, value, valueClass, footer }: {
  title: string
  icon: React.ReactNode
  iconClass: string
  value: string
  valueClass?: string
  footer: React.ReactNode
}) {
  return (
    <div className="group relative rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
      <div className="flex flex-row items-center justify-between space-y-0 mb-4">
        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{title}</h3>
        <div className={`p-2 rounded-lg group-hover:text-white transition-all ${iconClass}`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <div className={`text-3xl font-bold ${valueClass || "text-foreground"}`}>{value}</div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">{footer}</p>
      </div>
    </div>
  )
}

function SemaforoTile({ label, value, pct, colorClass, showPct = true }: {
  label: string
  value: number
  pct: number
  colorClass: string
  showPct?: boolean
}) {
  return (
    <div className={`rounded-xl p-4 ${colorClass}`}>
      <p className="text-xs font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold">{value}</span>
        {showPct && <span className="text-xs font-medium opacity-70">{pct}%</span>}
      </div>
    </div>
  )
}
