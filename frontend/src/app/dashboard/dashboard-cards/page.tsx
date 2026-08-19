"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useNotification } from "@/context/NotificationContext"
import { getErrorMessage } from "@/lib/utils"
import { LayoutDashboard, ToggleLeft, ToggleRight, Edit, ShieldAlert } from "lucide-react"

interface DashboardCard {
  id: number
  key: string
  tabKey: string
  name: string
  description: string
  isEnabled: boolean
}

const TAB_LABELS: Record<string, string> = {
  tab1: "Pestaña: Análisis de Riesgos",
  tab2: "Pestaña: Visión de Empresas",
}

export default function DashboardCardsPage() {
  const [cards, setCards] = useState<DashboardCard[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { showSuccess, showError } = useNotification()

  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
  const [selectedCard, setSelectedCard] = useState<DashboardCard | null>(null)
  const [renameValue, setRenameValue] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(";").shift()
    return null
  }

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

  const fetchCards = async () => {
    setIsLoading(true)
    try {
      const token = getCookie("token")

      const response = await fetch(`${apiBaseUrl}/api/dashboard-cards`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })

      if (response.status === 403 || response.status === 401) {
        setIsSuperAdmin(false)
        return
      }

      setIsSuperAdmin(true)
      if (!response.ok) throw new Error("Error al cargar las tarjetas del dashboard.")
      const data = await response.json()
      setCards(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleToggleCard = async (id: number) => {
    try {
      const token = getCookie("token")

      const response = await fetch(`${apiBaseUrl}/api/dashboard-cards/toggle/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al alterar el estado de la tarjeta.")
      }

      const data = await response.json()
      setCards((prev) => prev.map((c) => (c.id === id ? { ...c, isEnabled: data.isEnabled } : c)))
      showSuccess("Tarjeta Actualizada", `La tarjeta "${data.name}" fue ${data.isEnabled ? "habilitada" : "deshabilitada"} con éxito.`)
    } catch (err) {
      showError("Error de Actualización", getErrorMessage(err, "No se pudo actualizar la tarjeta."))
    }
  }

  const handleOpenRename = (card: DashboardCard) => {
    setSelectedCard(card)
    setRenameValue(card.name)
    setIsRenameModalOpen(true)
  }

  const handleRenameCard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCard) return
    setIsSubmitting(true)

    try {
      const token = getCookie("token")

      const response = await fetch(`${apiBaseUrl}/api/dashboard-cards/rename/${selectedCard.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: renameValue })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al renombrar la tarjeta.")
      }

      const data = await response.json()
      setCards((prev) => prev.map((c) => (c.id === selectedCard.id ? { ...c, name: data.name } : c)))
      showSuccess("Tarjeta Renombrada", `La tarjeta ahora se llama "${data.name}".`)
      setIsRenameModalOpen(false)
    } catch (err) {
      showError("Error de Renombrado", getErrorMessage(err, "No se pudo renombrar la tarjeta."))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isSuperAdmin && !isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-16 text-center space-y-6 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-8 shadow-xl">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Acceso Denegado</h2>
            <p className="text-sm text-muted-foreground mt-2">Esta sección está reservada para la administración global de la plataforma.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const cardsByTab = cards.reduce<Record<string, DashboardCard[]>>((acc, card) => {
    acc[card.tabKey] = acc[card.tabKey] || []
    acc[card.tabKey].push(card)
    return acc
  }, {})

  return (
    <DashboardLayout>
      <div className="space-y-8 mt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Tarjetas del Dashboard</h2>
          <p className="text-sm text-muted-foreground">Habilita, deshabilita o renombra las tarjetas visibles en el dashboard principal de toda la plataforma</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Cargando tarjetas...</span>
          </div>
        ) : (
          Object.entries(cardsByTab).map(([tabKey, tabCards]) => (
            <div key={tabKey} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{TAB_LABELS[tabKey] || tabKey}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tabCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-300 ${card.isEnabled ? "bg-primary" : "bg-muted-foreground/30"}`} />

                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${card.isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            <LayoutDashboard size={20} />
                          </div>
                          <h4 className="font-bold text-lg text-foreground">{card.name}</h4>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${card.isEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted-foreground/15 text-muted-foreground"}`}>
                          {card.isEnabled ? "Activa" : "Inactiva"}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground font-light leading-relaxed">{card.description}</p>
                    </div>

                    <div className="border-t border-border/30 mt-6 pt-4 flex justify-between items-center">
                      <button
                        onClick={() => handleOpenRename(card)}
                        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Edit size={14} />
                        Renombrar
                      </button>
                      <button
                        onClick={() => handleToggleCard(card.id)}
                        className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors focus:outline-none"
                        aria-label={`Toggle ${card.name}`}
                      >
                        {card.isEnabled ? (
                          <ToggleRight size={38} className="text-primary hover:scale-105 transition-transform" />
                        ) : (
                          <ToggleLeft size={38} className="text-muted-foreground hover:scale-105 transition-transform" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {isRenameModalOpen && selectedCard && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-16 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Edit size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Renombrar Tarjeta</h3>
                </div>
              </div>

              <form onSubmit={handleRenameCard} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre de la Tarjeta</label>
                  <input
                    type="text"
                    required
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsRenameModalOpen(false)}
                    className="flex-1 rounded-2xl border border-border py-3 font-semibold text-foreground hover:bg-muted transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl bg-primary hover:bg-primary/95 py-3 font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                  >
                    {isSubmitting ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
