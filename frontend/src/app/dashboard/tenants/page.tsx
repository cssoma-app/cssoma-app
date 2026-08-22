"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useNotification } from "@/context/NotificationContext"
import { getErrorMessage } from "@/lib/utils"
import { Building, Plus, Calendar, Users, FileText, Lock, PlusCircle, MapPin, Phone, Mail, Edit, Trash2, Power, Send, LayoutGrid, LayoutDashboard, ShieldCheck } from "lucide-react"

interface Tenant {
  id: string
  name: string
  razonSocial: string
  nitRuc: string
  digitoVerificacion: string
  direccion: string
  telefono: string
  isActive: boolean
  isAdminTemporary: boolean
  adminEmail: string
  createdAt: string
  usersCount: number
  employeesCount: number
  documentsCount: number
  serviceIds: number[]
  dashboardCardIds: number[]
  ciiu: string
  numeroTrabajadores: number
  centrosTrabajo: number
  claseRiesgo: string
  arl: string
  responsableSst: string
  tieneCopasst: boolean
  tieneComiteConvivencia: boolean
  tieneBrigada: boolean
  tieneContratistas: boolean
}

const CLASE_RIESGO_OPTIONS = ["I", "II", "III", "IV", "V"]

interface ServiceOption {
  id: number
  name: string
  description: string
  isEnabled: boolean
}

interface DashboardCardOption {
  id: number
  key: string
  tabKey: string
  name: string
  description: string
  isEnabled: boolean
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const { showSuccess, showWarning, showError, showConfirm } = useNotification()

  // Modales locales para formularios
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  // Estados Formulario de Creación
  const [name, setName] = useState("")
  const [razonSocial, setRazonSocial] = useState("")
  const [nitRuc, setNitRuc] = useState("")
  const [digitoVerificacion, setDigitoVerificacion] = useState("")
  const [direccion, setDireccion] = useState("")
  const [telefono, setTelefono] = useState("")
  const [adminEmail, setAdminEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serviceIds, setServiceIds] = useState<number[]>([])
  const [dashboardCardIds, setDashboardCardIds] = useState<number[]>([])
  const [ciiu, setCiiu] = useState("")
  const [numeroTrabajadores, setNumeroTrabajadores] = useState("")
  const [centrosTrabajo, setCentrosTrabajo] = useState("")
  const [claseRiesgo, setClaseRiesgo] = useState("")
  const [arl, setArl] = useState("")
  const [responsableSst, setResponsableSst] = useState("")
  const [tieneCopasst, setTieneCopasst] = useState(false)
  const [tieneComiteConvivencia, setTieneComiteConvivencia] = useState(false)
  const [tieneBrigada, setTieneBrigada] = useState(false)
  const [tieneContratistas, setTieneContratistas] = useState(false)

  // Estados Formulario de Edición
  const [editName, setEditName] = useState("")
  const [editRazonSocial, setEditRazonSocial] = useState("")
  const [editNitRuc, setEditNitRuc] = useState("")
  const [editDigitoVerificacion, setEditDigitoVerificacion] = useState("")
  const [editDireccion, setEditDireccion] = useState("")
  const [editTelefono, setEditTelefono] = useState("")
  const [editServiceIds, setEditServiceIds] = useState<number[]>([])
  const [editDashboardCardIds, setEditDashboardCardIds] = useState<number[]>([])
  const [editCiiu, setEditCiiu] = useState("")
  const [editNumeroTrabajadores, setEditNumeroTrabajadores] = useState("")
  const [editCentrosTrabajo, setEditCentrosTrabajo] = useState("")
  const [editClaseRiesgo, setEditClaseRiesgo] = useState("")
  const [editArl, setEditArl] = useState("")
  const [editResponsableSst, setEditResponsableSst] = useState("")
  const [editTieneCopasst, setEditTieneCopasst] = useState(false)
  const [editTieneComiteConvivencia, setEditTieneComiteConvivencia] = useState(false)
  const [editTieneBrigada, setEditTieneBrigada] = useState(false)
  const [editTieneContratistas, setEditTieneContratistas] = useState(false)

  const [allServices, setAllServices] = useState<ServiceOption[]>([])
  const [allDashboardCards, setAllDashboardCards] = useState<DashboardCardOption[]>([])

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const fetchTenants = async () => {
    setIsLoading(true)
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      
      const response = await fetch(`${apiBaseUrl}/api/tenants`, {
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
      if (!response.ok) throw new Error("Error al cargar la lista de empresas.")
      const data = await response.json()
      setTenants(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllServices = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/services`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      setAllServices(data)
      setServiceIds(data.map((s: ServiceOption) => s.id)) // por defecto, todo habilitado al crear
    } catch (err) {
      console.error(err)
    }
  }

  const fetchAllDashboardCards = async () => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/dashboard-cards`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })
      if (!response.ok) return
      const data = await response.json()
      setAllDashboardCards(data)
      setDashboardCardIds(data.map((c: DashboardCardOption) => c.id)) // por defecto, todo habilitado al crear
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchTenants()
    fetchAllServices()
    fetchAllDashboardCards()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleServiceId = (id: number, list: number[], setList: (v: number[]) => void) => {
    setList(list.includes(id) ? list.filter((s) => s !== id) : [...list, id])
  }

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      
      const response = await fetch(`${apiBaseUrl}/api/tenants`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name,
          razonSocial,
          nitRuc,
          digitoVerificacion,
          direccion,
          telefono,
          adminEmail,
          serviceIds,
          dashboardCardIds,
          ciiu,
          numeroTrabajadores: numeroTrabajadores ? parseInt(numeroTrabajadores, 10) : 0,
          centrosTrabajo: centrosTrabajo ? parseInt(centrosTrabajo, 10) : 0,
          claseRiesgo,
          arl,
          responsableSst,
          tieneCopasst,
          tieneComiteConvivencia,
          tieneBrigada,
          tieneContratistas
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al registrar la empresa.")
      }

      showSuccess("Empresa Registrada", `La empresa comercial "${name}" ha sido creada exitosamente. Se ha enviado la contraseña temporal al correo: ${adminEmail}`)

      // Limpiar campos
      setName("")
      setRazonSocial("")
      setNitRuc("")
      setDigitoVerificacion("")
      setDireccion("")
      setTelefono("")
      setAdminEmail("")
      setServiceIds(allServices.map((s) => s.id))
      setDashboardCardIds(allDashboardCards.map((c) => c.id))
      setCiiu("")
      setNumeroTrabajadores("")
      setCentrosTrabajo("")
      setClaseRiesgo("")
      setArl("")
      setResponsableSst("")
      setTieneCopasst(false)
      setTieneComiteConvivencia(false)
      setTieneBrigada(false)
      setTieneContratistas(false)
      setIsCreateModalOpen(false)
      fetchTenants()
    } catch (err) {
      showError("Error de Registro", getErrorMessage(err, "Hubo un problema al crear la empresa."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setEditName(tenant.name)
    setEditRazonSocial(tenant.razonSocial)
    setEditNitRuc(tenant.nitRuc)
    setEditDigitoVerificacion(tenant.digitoVerificacion || "")
    setEditDireccion(tenant.direccion || "")
    setEditTelefono(tenant.telefono || "")
    setEditServiceIds(tenant.serviceIds || [])
    setEditDashboardCardIds(tenant.dashboardCardIds || [])
    setEditCiiu(tenant.ciiu || "")
    setEditNumeroTrabajadores(tenant.numeroTrabajadores ? String(tenant.numeroTrabajadores) : "")
    setEditCentrosTrabajo(tenant.centrosTrabajo ? String(tenant.centrosTrabajo) : "")
    setEditClaseRiesgo(tenant.claseRiesgo || "")
    setEditArl(tenant.arl || "")
    setEditResponsableSst(tenant.responsableSst || "")
    setEditTieneCopasst(tenant.tieneCopasst || false)
    setEditTieneComiteConvivencia(tenant.tieneComiteConvivencia || false)
    setEditTieneBrigada(tenant.tieneBrigada || false)
    setEditTieneContratistas(tenant.tieneContratistas || false)
    setIsEditModalOpen(true)
  }

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTenant) return
    setIsSubmitting(true)

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      
      const response = await fetch(`${apiBaseUrl}/api/tenants/${selectedTenant.id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editName,
          razonSocial: editRazonSocial,
          nitRuc: editNitRuc,
          digitoVerificacion: editDigitoVerificacion,
          direccion: editDireccion,
          telefono: editTelefono,
          serviceIds: editServiceIds,
          dashboardCardIds: editDashboardCardIds,
          ciiu: editCiiu,
          numeroTrabajadores: editNumeroTrabajadores ? parseInt(editNumeroTrabajadores, 10) : 0,
          centrosTrabajo: editCentrosTrabajo ? parseInt(editCentrosTrabajo, 10) : 0,
          claseRiesgo: editClaseRiesgo,
          arl: editArl,
          responsableSst: editResponsableSst,
          tieneCopasst: editTieneCopasst,
          tieneComiteConvivencia: editTieneComiteConvivencia,
          tieneBrigada: editTieneBrigada,
          tieneContratistas: editTieneContratistas
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al actualizar la empresa.")
      }

      showSuccess("Cambios Guardados", `La información de la empresa "${editName}" ha sido actualizada con éxito en la plataforma.`)
      setIsEditModalOpen(false)
      fetchTenants()
    } catch (err) {
      showError("Error de Modificación", getErrorMessage(err, "No se pudieron aplicar los cambios en la empresa."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (tenant: Tenant) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      
      const response = await fetch(`${apiBaseUrl}/api/tenants/toggle-active/${tenant.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al alterar el estado de la empresa.")
      }

      const data = await response.json()
      showSuccess("Estado Actualizado", data.message)
      fetchTenants()
    } catch (err) {
      showError("Error de Transacción", getErrorMessage(err, "Hubo un error al actualizar el estado de la empresa."))
    }
  }

  const triggerToggleActive = (tenant: Tenant) => {
    if (tenant.isActive) {
      showConfirm(
        "¿Desactivar Empresa?",
        `Al desactivar "${tenant.name}", todos los administradores y colaboradores perderán de forma temporal el acceso a sus cuentas y archivos. ¿Deseas proceder?`,
        () => handleToggleActive(tenant)
      )
    } else {
      showConfirm(
        "¿Activar Empresa?",
        `Al activar "${tenant.name}", se restablecerá el acceso a las cuentas vinculadas a la empresa. ¿Deseas proceder?`,
        () => handleToggleActive(tenant)
      )
    }
  }

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      
      const response = await fetch(`${apiBaseUrl}/api/tenants/${tenant.id}`, {
        method: "DELETE",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al eliminar la empresa.")
      }

      showSuccess("Empresa Eliminada", `La empresa "${tenant.name}" y todos sus archivos asociados se han eliminado del sistema.`)
      fetchTenants()
    } catch (err) {
      showError("Error de Eliminación", getErrorMessage(err, "No se pudo eliminar la empresa."))
    }
  }

  const triggerDelete = (tenant: Tenant) => {
    const verifyText = tenant.adminEmail || tenant.name;
    const placeholderText = tenant.adminEmail ? "Escribe el correo del administrador" : "Escribe el nombre de la empresa";
    showConfirm(
      "¿Eliminar Empresa de Forma Definitiva?",
      `ATENCIÓN: Se eliminará permanentemente la empresa "${tenant.name}" junto a todos sus usuarios de acceso, colaboradores y documentos guardados. Esta operación no se puede deshacer.`,
      () => handleDeleteTenant(tenant),
      undefined,
      verifyText,
      placeholderText
    )
  }

  const handleResendWelcome = async (tenant: Tenant) => {
    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const token = getCookie("token")
      
      const response = await fetch(`${apiBaseUrl}/api/tenants/resend-welcome/${tenant.id}`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al reenviar contraseña.")
      }

      showSuccess("Correo Reenviado", "Se ha generado una nueva contraseña temporal y ha sido enviada con éxito al administrador corporativo.")
    } catch (err) {
      showError("Error de Reenvío", getErrorMessage(err, "No se pudo reenviar la contraseña temporal en este momento."))
    }
  }

  const triggerResendWelcome = (tenant: Tenant) => {
    showConfirm(
      "Regenerar y Reenviar Contraseña",
      `¿Deseas reenviar las credenciales del administrador de la empresa "${tenant.name}"? Esto regenerará su contraseña temporal.`,
      () => handleResendWelcome(tenant)
    )
  }

  if (!isSuperAdmin && !isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-16 text-center space-y-6 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-8 shadow-xl">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
            <Lock size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Acceso Denegado</h2>
            <p className="text-sm text-muted-foreground mt-2">Esta sección está reservada exclusivamente para el Administrador Global (Superadmin) de la plataforma.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 mt-4">
        {/* Header Options */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Administración de Empresas</h2>
            <p className="text-sm text-muted-foreground">Gestiona y supervisa las empresas inquilinas activas en la plataforma</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/95 px-4 py-3 font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/10"
          >
            <Plus size={18} />
            Nueva Empresa
          </button>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Cargando empresas...</span>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Empresa</th>
                    <th className="px-6 py-4">NIT</th>
                    <th className="px-6 py-4">Contacto</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {tenants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                          <div className="h-16 w-16 rounded-2xl bg-muted/30 border border-dashed border-border/80 flex items-center justify-center text-muted-foreground/60 shadow-inner">
                            <Building size={28} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">No hay empresas registradas</p>
                            <p className="text-xs text-muted-foreground px-4">
                              Comienza registrando tu primera empresa utilizando el botón superior.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    tenants.map((tenant) => {
                      const isDisabled = !tenant.isActive;

                      return (
                        <tr 
                          key={tenant.id} 
                          className={`transition-all duration-300 ${isDisabled ? "bg-slate-100/30 dark:bg-slate-900/30 opacity-55" : "hover:bg-muted/10"}`}
                        >
                          <td className="px-6 py-4 font-semibold text-foreground">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${isDisabled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                                <Building size={16} />
                              </div>
                              <div>
                                <p className="font-bold">{tenant.name}</p>
                                <p className="text-xs text-muted-foreground font-normal">{tenant.razonSocial || "Sin razón social"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-medium">
                            {tenant.nitRuc ? `${tenant.nitRuc}${tenant.digitoVerificacion ? "-" + tenant.digitoVerificacion : ""}` : "Sin NIT"}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {tenant.telefono && <p className="flex items-center gap-1"><Phone size={12} /> {tenant.telefono}</p>}
                            {tenant.direccion && <p className="flex items-center gap-1 mt-0.5"><MapPin size={12} className="shrink-0" /> {tenant.direccion}</p>}
                          </td>
                          
                          {/* Estado Label */}
                          <td className="px-6 py-4 text-center">
                            {!tenant.isActive ? (
                              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-destructive">
                                Desactivado
                              </span>
                            ) : tenant.isAdminTemporary ? (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                                En Espera
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Activo
                              </span>
                            )}
                          </td>

                          {/* Acciones CRUD con Tooltips Premium de CSS */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              
                              {/* Botón Editar */}
                              <div className="relative group">
                                <button
                                  disabled={isDisabled}
                                  onClick={() => handleOpenEdit(tenant)}
                                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Edit size={16} />
                                </button>
                                 {!isDisabled && (
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30">
                                     Editar Empresa
                                   </div>
                                 )}
                              </div>

                              {/* Botón Reenviar Correo */}
                              <div className="relative group">
                                <button
                                  disabled={isDisabled || !tenant.isAdminTemporary}
                                  onClick={() => triggerResendWelcome(tenant)}
                                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Send size={16} />
                                </button>
                                 {!isDisabled && tenant.isAdminTemporary && (
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30">
                                     Reenviar Credenciales
                                   </div>
                                 )}
                              </div>

                              {/* Botón Desactivar / Activar */}
                              <div className="relative group">
                                <button
                                  onClick={() => triggerToggleActive(tenant)}
                                  className={`p-2 rounded-lg hover:bg-muted transition-colors ${tenant.isActive ? "text-amber-600 hover:text-amber-700" : "text-emerald-600 hover:text-emerald-700 font-bold"}`}
                                >
                                  <Power size={16} />
                                </button>
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30">
                                   {tenant.isActive ? "Desactivar" : "Activar"}
                                 </div>
                              </div>

                              {/* Botón Eliminar */}
                              <div className="relative group">
                                <button
                                  disabled={isDisabled}
                                  onClick={() => triggerDelete(tenant)}
                                  className="p-2 rounded-lg hover:bg-muted text-destructive hover:text-destructive/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Trash2 size={16} />
                                </button>
                                 {!isDisabled && (
                                   <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30 font-semibold">
                                     Eliminar Empresa
                                   </div>
                                 )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create Company Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-16 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <PlusCircle size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Crear Nueva Empresa</h3>
                </div>
              </div>

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Comercial</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nombre comercial"
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Razón Social</label>
                    <input
                      type="text"
                      required
                      value={razonSocial}
                      onChange={(e) => setRazonSocial(e.target.value)}
                      placeholder="Razón legal"
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NIT</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={nitRuc}
                        onChange={(e) => setNitRuc(e.target.value)}
                        placeholder="900985000"
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                      <span className="text-muted-foreground select-none">-</span>
                      <input
                        type="text"
                        maxLength={1}
                        value={digitoVerificacion}
                        onChange={(e) => setDigitoVerificacion(e.target.value.replace(/\D/g, "").slice(0, 1))}
                        placeholder="DV"
                        aria-label="Dígito de verificación"
                        className="block w-14 shrink-0 px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</label>
                    <input
                      type="text"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                      placeholder="Ej. +57300..."
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección Física</label>
                  <input
                    type="text"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    placeholder="Calle, Ciudad, País"
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
                </div>

                <div className="border-t border-border/50 pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    Perfil SST
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CIIU</label>
                      <input
                        type="text"
                        value={ciiu}
                        onChange={(e) => setCiiu(e.target.value)}
                        placeholder="Ej. 1071"
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clase de Riesgo</label>
                      <select
                        value={claseRiesgo}
                        onChange={(e) => setClaseRiesgo(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      >
                        <option value="">Selecciona una clase</option>
                        {CLASE_RIESGO_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número de Trabajadores</label>
                      <input
                        type="number"
                        min={0}
                        value={numeroTrabajadores}
                        onChange={(e) => setNumeroTrabajadores(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Centros de Trabajo</label>
                      <input
                        type="number"
                        min={0}
                        value={centrosTrabajo}
                        onChange={(e) => setCentrosTrabajo(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ARL</label>
                      <input
                        type="text"
                        value={arl}
                        onChange={(e) => setArl(e.target.value)}
                        placeholder="Ej. Sura, Colmena, Positiva..."
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responsable SST</label>
                      <input
                        type="text"
                        value={responsableSst}
                        onChange={(e) => setResponsableSst(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={tieneCopasst} onChange={(e) => setTieneCopasst(e.target.checked)} className="rounded border-border" />
                      COPASST
                    </label>
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={tieneComiteConvivencia} onChange={(e) => setTieneComiteConvivencia(e.target.checked)} className="rounded border-border" />
                      Comité de Convivencia
                    </label>
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={tieneBrigada} onChange={(e) => setTieneBrigada(e.target.checked)} className="rounded border-border" />
                      Brigada
                    </label>
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={tieneContratistas} onChange={(e) => setTieneContratistas(e.target.checked)} className="rounded border-border" />
                      Contratistas
                    </label>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Mail size={16} className="text-primary" />
                    Usuario Administrador de Empresa
                  </h4>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo de Acceso del Administrador</label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@correoempresa.com"
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <LayoutGrid size={16} className="text-primary" />
                    Servicios Disponibles
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border border-border/50 p-2">
                    {allServices.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={serviceIds.includes(s.id)}
                          onChange={() => toggleServiceId(s.id, serviceIds, setServiceIds)}
                          className="rounded border-border"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-primary" />
                    Tarjetas del Dashboard
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border border-border/50 p-2">
                    {allDashboardCards.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={dashboardCardIds.includes(c.id)}
                          onChange={() => toggleServiceId(c.id, dashboardCardIds, setDashboardCardIds)}
                          className="rounded border-border"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="flex-1 rounded-2xl border border-border py-3 font-semibold text-foreground hover:bg-muted transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-2xl bg-primary hover:bg-primary/95 py-3 font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                  >
                    {isSubmitting ? "Registrando..." : "Registrar Empresa"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Company Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-16 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Edit size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Editar Datos de Empresa</h3>
                </div>
              </div>

              <form onSubmit={handleUpdateTenant} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Comercial</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Nombre comercial"
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Razón Social</label>
                    <input
                      type="text"
                      required
                      value={editRazonSocial}
                      onChange={(e) => setEditRazonSocial(e.target.value)}
                      placeholder="Razón legal"
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">NIT</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={editNitRuc}
                        onChange={(e) => setEditNitRuc(e.target.value)}
                        placeholder="900985000"
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                      <span className="text-muted-foreground select-none">-</span>
                      <input
                        type="text"
                        maxLength={1}
                        value={editDigitoVerificacion}
                        onChange={(e) => setEditDigitoVerificacion(e.target.value.replace(/\D/g, "").slice(0, 1))}
                        placeholder="DV"
                        aria-label="Dígito de verificación"
                        className="block w-14 shrink-0 px-3 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm text-center"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Teléfono</label>
                    <input
                      type="text"
                      value={editTelefono}
                      onChange={(e) => setEditTelefono(e.target.value)}
                      placeholder="Ej. +57300..."
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dirección Física</label>
                  <input
                    type="text"
                    value={editDireccion}
                    onChange={(e) => setEditDireccion(e.target.value)}
                    placeholder="Calle, Ciudad, País"
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
                </div>

                <div className="border-t border-border/50 pt-4 space-y-4">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    Perfil SST
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">CIIU</label>
                      <input
                        type="text"
                        value={editCiiu}
                        onChange={(e) => setEditCiiu(e.target.value)}
                        placeholder="Ej. 1071"
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Clase de Riesgo</label>
                      <select
                        value={editClaseRiesgo}
                        onChange={(e) => setEditClaseRiesgo(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      >
                        <option value="">Selecciona una clase</option>
                        {CLASE_RIESGO_OPTIONS.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Número de Trabajadores</label>
                      <input
                        type="number"
                        min={0}
                        value={editNumeroTrabajadores}
                        onChange={(e) => setEditNumeroTrabajadores(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Centros de Trabajo</label>
                      <input
                        type="number"
                        min={0}
                        value={editCentrosTrabajo}
                        onChange={(e) => setEditCentrosTrabajo(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">ARL</label>
                      <input
                        type="text"
                        value={editArl}
                        onChange={(e) => setEditArl(e.target.value)}
                        placeholder="Ej. Sura, Colmena, Positiva..."
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Responsable SST</label>
                      <input
                        type="text"
                        value={editResponsableSst}
                        onChange={(e) => setEditResponsableSst(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={editTieneCopasst} onChange={(e) => setEditTieneCopasst(e.target.checked)} className="rounded border-border" />
                      COPASST
                    </label>
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={editTieneComiteConvivencia} onChange={(e) => setEditTieneComiteConvivencia(e.target.checked)} className="rounded border-border" />
                      Comité de Convivencia
                    </label>
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={editTieneBrigada} onChange={(e) => setEditTieneBrigada(e.target.checked)} className="rounded border-border" />
                      Brigada
                    </label>
                    <label className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                      <input type="checkbox" checked={editTieneContratistas} onChange={(e) => setEditTieneContratistas(e.target.checked)} className="rounded border-border" />
                      Contratistas
                    </label>
                  </div>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <LayoutGrid size={16} className="text-primary" />
                    Servicios Disponibles
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border border-border/50 p-2">
                    {allServices.map((s) => (
                      <label key={s.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={editServiceIds.includes(s.id)}
                          onChange={() => toggleServiceId(s.id, editServiceIds, setEditServiceIds)}
                          className="rounded border-border"
                        />
                        {s.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Quitar un servicio también lo quita a todos los usuarios de la empresa que lo tuvieran habilitado.</p>
                </div>

                <div className="border-t border-border/50 pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <LayoutDashboard size={16} className="text-primary" />
                    Tarjetas del Dashboard
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto rounded-xl border border-border/50 p-2">
                    {allDashboardCards.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={editDashboardCardIds.includes(c.id)}
                          onChange={() => toggleServiceId(c.id, editDashboardCardIds, setEditDashboardCardIds)}
                          className="rounded border-border"
                        />
                        {c.name}
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Quitar una tarjeta también la quita a todos los usuarios de la empresa que la tuvieran habilitada.</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
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
