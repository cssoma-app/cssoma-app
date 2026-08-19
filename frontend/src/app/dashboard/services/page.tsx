"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { getErrorMessage } from "@/lib/utils"
import { Briefcase, ToggleLeft, ToggleRight, CheckCircle2, AlertCircle, ShieldAlert } from "lucide-react"

interface SassService {
  id: number
  name: string
  description: string
  isEnabled: boolean
}

export default function ServicesPage() {
  const [services, setServices] = useState<SassService[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")

      const response = await fetch(`${apiBaseUrl}/api/services`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (response.status === 403 || response.status === 401) {
        setIsSuperAdmin(false)
        return
      }

      setIsSuperAdmin(true)
      if (!response.ok) throw new Error("Error al cargar los servicios.")
      const data = await response.json()
      setServices(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleService = async (id: number) => {
    setMessage("")
    setErrorMessage("")

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")

      const response = await fetch(`${apiBaseUrl}/api/services/toggle/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al alterar el estado del servicio.")
      }

      const data = await response.json()
      setMessage(data.message)
      
      // Actualizar estado local
      setServices(prev => prev.map(s => s.id === id ? { ...s, isEnabled: data.service.isEnabled } : s))
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Error al procesar la solicitud."))
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

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

  return (
    <DashboardLayout>
      <div className="space-y-6 mt-4">
        {/* Header Title */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Servicios Globales</h2>
          <p className="text-sm text-muted-foreground">Monitorea y habilita/deshabilita los módulos del SaaS activos en la plataforma para todas las empresas</p>
        </div>

        {message && (
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
            <CheckCircle2 size={18} />
            <span>{message}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in duration-200">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Loading / Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Cargando módulos de servicios...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((service) => (
              <div 
                key={service.id} 
                className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
              >
                {/* Visual indicator bar */}
                <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-300 ${service.isEnabled ? "bg-primary" : "bg-muted-foreground/30"}`} />

                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${service.isEnabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Briefcase size={20} />
                      </div>
                      <h3 className="font-bold text-lg text-foreground">{service.name}</h3>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${service.isEnabled ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted-foreground/15 text-muted-foreground"}`}>
                      {service.isEnabled ? "Activo" : "Inactivo"}
                    </span>
                  </div>

                  <p className="text-sm text-muted-foreground font-light leading-relaxed">{service.description}</p>
                </div>

                <div className="border-t border-border/30 mt-6 pt-4 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Estado Módulo</span>
                  <button
                    onClick={() => handleToggleService(service.id)}
                    className="flex items-center gap-1.5 text-foreground hover:text-primary transition-colors focus:outline-none"
                    aria-label={`Toggle ${service.name}`}
                  >
                    {service.isEnabled ? (
                      <ToggleRight size={38} className="text-primary hover:scale-105 transition-transform" />
                    ) : (
                      <ToggleLeft size={38} className="text-muted-foreground hover:scale-105 transition-transform" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
