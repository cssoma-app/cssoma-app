"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useNotification } from "@/context/NotificationContext"
import { getErrorMessage } from "@/lib/utils"
import { UserCog, Plus, Search, Edit, Trash2, Power, Send, ChevronLeft, ChevronRight, Building2, LayoutGrid, LayoutDashboard } from "lucide-react"

interface UserRow {
  id: string
  fullName: string
  email: string
  tenantId: string | null
  tenantName: string
  roleKey: string
  roleName: string
  isDisabled: boolean
  isTemporaryPassword: boolean
  hasLoggedIn: boolean
  status: "Activo" | "Inactivo"
  serviceIds: number[]
  dashboardCardIds: number[]
}

interface TenantOption {
  id: string
  name: string
}

interface AvailableService {
  id: number
  key: string
  parentKey: string | null
  name: string
}

interface AvailableDashboardCard {
  id: number
  key: string
  tabKey: string
  name: string
}

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
  return null
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [search, setSearch] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [actorRole, setActorRole] = useState<string>("")
  const [isPlatformOwner, setIsPlatformOwner] = useState(false)
  const { showSuccess, showError, showConfirm } = useNotification()

  const isSuperAdmin = actorRole === "SuperAdmin"
  // Admin del tenant propietario de la plataforma: mismo alcance que SuperAdmin sobre
  // empresas y usuarios, salvo eliminar Admins (ver canDelete más abajo).
  const hasBroadAccess = isSuperAdmin || (actorRole === "Admin" && isPlatformOwner)

  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([])

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [roleKey, setRoleKey] = useState("Member")
  const [tenantId, setTenantId] = useState("")
  const [availableServices, setAvailableServices] = useState<AvailableService[]>([])
  const [serviceIds, setServiceIds] = useState<number[]>([])
  const [availableDashboardCards, setAvailableDashboardCards] = useState<AvailableDashboardCard[]>([])
  const [dashboardCardIds, setDashboardCardIds] = useState<number[]>([])

  const [editFullName, setEditFullName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editRoleKey, setEditRoleKey] = useState("Member")
  const [editAvailableServices, setEditAvailableServices] = useState<AvailableService[]>([])
  const [editServiceIds, setEditServiceIds] = useState<number[]>([])
  const [editAvailableDashboardCards, setEditAvailableDashboardCards] = useState<AvailableDashboardCard[]>([])
  const [editDashboardCardIds, setEditDashboardCardIds] = useState<number[]>([])

  useEffect(() => {
    const token = getCookie("token")
    if (token) {
      try {
        const payloadDecoded = JSON.parse(atob(token.split(".")[1]))
        const role = payloadDecoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payloadDecoded.role || ""
        setActorRole(role)
        setIsPlatformOwner(payloadDecoded.IsPlatformOwner === "true")
      } catch (e) {
        console.error("Error decoding token", e)
      }
    }
  }, [])

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getCookie("token")
      const params = new URLSearchParams({ page: String(page) })
      if (search) params.set("search", search)

      const response = await fetch(`${apiBaseUrl}/api/users?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Error al cargar la lista de usuarios.")
      const data = await response.json()
      setUsers(data.items ?? data.Items ?? [])
      setTotalCount(data.totalCount ?? data.TotalCount ?? 0)
    } catch (err) {
      console.error(err)
      showError("Error de Carga", getErrorMessage(err, "No se pudo cargar la lista de usuarios."))
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  useEffect(() => {
    if (!hasBroadAccess) return
    const fetchTenants = async () => {
      try {
        const token = getCookie("token")
        const response = await fetch(`${apiBaseUrl}/api/tenants`, {
          method: "GET",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
        })
        if (!response.ok) return
        const data = await response.json()
        setTenantOptions(data.map((t: { id: string; name: string }) => ({ id: t.id, name: t.name })))
      } catch (err) {
        console.error(err)
      }
    }
    fetchTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBroadAccess])

  const fetchAvailableServices = async (forTenantId?: string): Promise<AvailableService[]> => {
    try {
      const token = getCookie("token")
      const params = forTenantId ? `?tenantId=${forTenantId}` : ""
      const response = await fetch(`${apiBaseUrl}/api/users/available-services${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })
      if (!response.ok) return []
      return await response.json()
    } catch (err) {
      console.error(err)
      return []
    }
  }

  const fetchAvailableDashboardCards = async (forTenantId?: string): Promise<AvailableDashboardCard[]> => {
    try {
      const token = getCookie("token")
      const params = forTenantId ? `?tenantId=${forTenantId}` : ""
      const response = await fetch(`${apiBaseUrl}/api/users/available-dashboard-cards${params}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })
      if (!response.ok) return []
      return await response.json()
    } catch (err) {
      console.error(err)
      return []
    }
  }

  // Sin acceso amplio, la empresa es implícita (la propia) — se puede cargar de una.
  useEffect(() => {
    if (hasBroadAccess) return
    fetchAvailableServices().then((services) => {
      setAvailableServices(services)
      setServiceIds(services.map((s) => s.id))
    })
    fetchAvailableDashboardCards().then((cards) => {
      setAvailableDashboardCards(cards)
      setDashboardCardIds(cards.map((c) => c.id))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasBroadAccess])

  // Con acceso amplio, la empresa se elige en el modal de creación — recargar el checklist al cambiarla.
  useEffect(() => {
    if (!hasBroadAccess || !tenantId) return
    fetchAvailableServices(tenantId).then((services) => {
      setAvailableServices(services)
      setServiceIds(services.map((s) => s.id))
    })
    fetchAvailableDashboardCards(tenantId).then((cards) => {
      setAvailableDashboardCards(cards)
      setDashboardCardIds(cards.map((c) => c.id))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, hasBroadAccess])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = getCookie("token")
      const body: Record<string, unknown> = { fullName, email, serviceIds, dashboardCardIds }
      if (hasBroadAccess) {
        body.roleKey = roleKey
        body.tenantId = tenantId
      }

      const response = await fetch(`${apiBaseUrl}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al crear el usuario.")
      }

      showSuccess("Usuario Creado", `Se ha enviado la invitación con la contraseña temporal a ${email}.`)
      setFullName("")
      setEmail("")
      setRoleKey("Member")
      setTenantId("")
      setServiceIds(availableServices.map((s) => s.id))
      setDashboardCardIds(availableDashboardCards.map((c) => c.id))
      setIsCreateModalOpen(false)
      fetchUsers()
    } catch (err) {
      showError("Error de Creación", getErrorMessage(err, "Hubo un problema al crear el usuario."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = async (user: UserRow) => {
    setSelectedUser(user)
    setEditFullName(user.fullName)
    setEditEmail(user.email)
    setEditRoleKey(user.roleKey)
    setEditServiceIds(user.serviceIds || [])
    setEditDashboardCardIds(user.dashboardCardIds || [])
    setIsEditModalOpen(true)
    const services = await fetchAvailableServices(hasBroadAccess ? (user.tenantId ?? undefined) : undefined)
    setEditAvailableServices(services)
    const cards = await fetchAvailableDashboardCards(hasBroadAccess ? (user.tenantId ?? undefined) : undefined)
    setEditAvailableDashboardCards(cards)
  }

  const toggleServiceId = (id: number, list: number[], setList: (v: number[]) => void) => {
    setList(list.includes(id) ? list.filter((s) => s !== id) : [...list, id])
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setIsSubmitting(true)

    try {
      const token = getCookie("token")
      const body: Record<string, unknown> = { fullName: editFullName, email: editEmail, serviceIds: editServiceIds, dashboardCardIds: editDashboardCardIds }
      if (hasBroadAccess) body.roleKey = editRoleKey

      const response = await fetch(`${apiBaseUrl}/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al actualizar el usuario.")
      }

      showSuccess("Cambios Guardados", `Los datos de "${editFullName}" se actualizaron con éxito.`)
      setIsEditModalOpen(false)
      fetchUsers()
    } catch (err) {
      showError("Error de Modificación", getErrorMessage(err, "No se pudieron aplicar los cambios."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleActive = async (user: UserRow) => {
    try {
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/users/toggle-active/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Idempotency-Key": crypto.randomUUID()
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al alterar el estado del usuario.")
      }

      const data = await response.json()
      showSuccess("Estado Actualizado", data.message || data.Message)
      fetchUsers()
    } catch (err) {
      showError("Error de Transacción", getErrorMessage(err, "Hubo un error al actualizar el estado del usuario."))
    }
  }

  const triggerToggleActive = (user: UserRow) => {
    if (!user.isDisabled) {
      showConfirm(
        "¿Desactivar Usuario?",
        `Al desactivar a "${user.fullName}", perderá el acceso a la plataforma de inmediato. ¿Deseas proceder?`,
        () => handleToggleActive(user)
      )
    } else {
      showConfirm(
        "¿Activar Usuario?",
        `Al activar a "${user.fullName}", recuperará el acceso a la plataforma. ¿Deseas proceder?`,
        () => handleToggleActive(user)
      )
    }
  }

  const handleDeleteUser = async (user: UserRow) => {
    try {
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/users/${user.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al eliminar el usuario.")
      }

      showSuccess("Usuario Eliminado", `"${user.fullName}" ha sido eliminado del sistema.`)
      fetchUsers()
    } catch (err) {
      showError("Error de Eliminación", getErrorMessage(err, "No se pudo eliminar el usuario."))
    }
  }

  const triggerDelete = (user: UserRow) => {
    showConfirm(
      "¿Eliminar Usuario de Forma Definitiva?",
      `ATENCIÓN: Se eliminará permanentemente a "${user.fullName}" y perderá acceso a la plataforma. Esta operación no se puede deshacer.`,
      () => handleDeleteUser(user),
      undefined,
      user.email,
      "Escribe el correo del usuario"
    )
  }

  const handleResendInvitation = async (user: UserRow) => {
    try {
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/users/resend-invitation/${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Idempotency-Key": crypto.randomUUID()
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al reenviar la invitación.")
      }

      showSuccess("Invitación Reenviada", "Se ha generado y enviado una nueva contraseña temporal.")
    } catch (err) {
      showError("Error de Reenvío", getErrorMessage(err, "No se pudo reenviar la invitación en este momento."))
    }
  }

  const triggerResendInvitation = (user: UserRow) => {
    showConfirm(
      "Reenviar Invitación",
      `¿Deseas reenviar la invitación de acceso a "${user.fullName}"? Esto regenerará su contraseña temporal.`,
      () => handleResendInvitation(user)
    )
  }

  // Nadie edita al SuperAdmin desde esta tabla (gestiona su propio perfil aparte).
  // Editar/reenviar/activar-desactivar un Admin requiere acceso amplio (SuperAdmin o Admin
  // del tenant propietario). Eliminar un Admin es más estricto: exige ser el SuperAdmin real.
  const canManageGeneral = (user: UserRow) =>
    user.roleKey !== "SuperAdmin" && (hasBroadAccess || user.roleKey !== "Admin")

  const canDelete = (user: UserRow) =>
    user.roleKey !== "SuperAdmin" && (isSuperAdmin || user.roleKey !== "Admin")

  return (
    <DashboardLayout>
      <div className="space-y-6 mt-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Usuarios</h2>
            <p className="text-sm text-muted-foreground">Administra las cuentas de acceso a la plataforma{hasBroadAccess ? "" : " de tu empresa"}</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/95 px-4 py-3 font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/10"
          >
            <Plus size={18} />
            Nuevo Usuario
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative max-w-md">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Buscar por nombre o correo..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
          />
        </form>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Cargando usuarios...</span>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Usuario</th>
                    {hasBroadAccess && <th className="px-6 py-4">Empresa</th>}
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4 text-center">Estado</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={hasBroadAccess ? 5 : 4} className="px-6 py-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                          <div className="h-16 w-16 rounded-2xl bg-muted/30 border border-dashed border-border/80 flex items-center justify-center text-muted-foreground/60 shadow-inner">
                            <UserCog size={28} />
                          </div>
                          <div className="space-y-1">
                            <p className="font-semibold text-foreground">No hay usuarios registrados</p>
                            <p className="text-xs text-muted-foreground px-4">
                              {search ? "Ningún usuario coincide con tu búsqueda." : "Comienza invitando a tu primer usuario con el botón superior."}
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => {
                      const rowDisabled = user.isDisabled
                      const manageable = canManageGeneral(user)
                      const deletable = canDelete(user)

                      return (
                        <tr
                          key={user.id}
                          className={`transition-all duration-300 ${rowDisabled ? "bg-slate-100/30 dark:bg-slate-900/30 opacity-55" : "hover:bg-muted/10"}`}
                        >
                          <td className="px-6 py-4 font-semibold text-foreground">
                            <div className="flex items-center gap-3">
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${rowDisabled ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}>
                                <UserCog size={16} />
                              </div>
                              <div>
                                <p className="font-bold">{user.fullName}</p>
                                <p className="text-xs text-muted-foreground font-normal">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          {hasBroadAccess && (
                            <td className="px-6 py-4 text-muted-foreground text-xs">
                              <span className="flex items-center gap-1"><Building2 size={12} /> {user.tenantName}</span>
                            </td>
                          )}
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                              {user.roleName || user.roleKey}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {user.status === "Activo" ? (
                              <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                Activo
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-destructive">
                                Inactivo
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="relative group">
                                <button
                                  disabled={!manageable}
                                  onClick={() => handleOpenEdit(user)}
                                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Edit size={16} />
                                </button>
                                {manageable && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30">
                                    Editar Usuario
                                  </div>
                                )}
                              </div>

                              <div className="relative group">
                                <button
                                  disabled={!manageable || !user.isTemporaryPassword}
                                  onClick={() => triggerResendInvitation(user)}
                                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Send size={16} />
                                </button>
                                {manageable && user.isTemporaryPassword && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30">
                                    Reenviar Invitación
                                  </div>
                                )}
                              </div>

                              <div className="relative group">
                                <button
                                  disabled={!manageable}
                                  onClick={() => triggerToggleActive(user)}
                                  className={`p-2 rounded-lg hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none ${user.isDisabled ? "text-emerald-600 hover:text-emerald-700 font-bold" : "text-amber-600 hover:text-amber-700"}`}
                                >
                                  <Power size={16} />
                                </button>
                                {manageable && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30">
                                    {user.isDisabled ? "Activar" : "Desactivar"}
                                  </div>
                                )}
                              </div>

                              <div className="relative group">
                                <button
                                  disabled={!deletable}
                                  onClick={() => triggerDelete(user)}
                                  className="p-2 rounded-lg hover:bg-muted text-destructive hover:text-destructive/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Trash2 size={16} />
                                </button>
                                {deletable && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30 font-semibold">
                                    Eliminar Usuario
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {totalCount > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-border/50 text-sm text-muted-foreground">
                <span>
                  Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} de {totalCount}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-foreground font-medium">Página {page} de {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Plus size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Invitar Nuevo Usuario</h3>
                </div>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nombre y apellido"
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo de Acceso</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@correoempresa.com"
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
                </div>

                {hasBroadAccess && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Empresa</label>
                      <select
                        required
                        value={tenantId}
                        onChange={(e) => setTenantId(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      >
                        <option value="" disabled>Selecciona una empresa</option>
                        {tenantOptions.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rol</label>
                      <select
                        value={roleKey}
                        onChange={(e) => setRoleKey(e.target.value)}
                        className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                      >
                        <option value="Member">Colaborador</option>
                        <option value="Admin">Administrador de Empresa</option>
                      </select>
                    </div>
                  </>
                )}

                {availableServices.length > 0 && (
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <LayoutGrid size={16} className="text-primary" />
                      Servicios que puede ver
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availableServices.map((s) => (
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
                )}

                {availableDashboardCards.length > 0 && (
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <LayoutDashboard size={16} className="text-primary" />
                      Tarjetas del Dashboard que puede ver
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {availableDashboardCards.map((c) => (
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
                )}

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
                    {isSubmitting ? "Creando..." : "Crear Usuario"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditModalOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Edit size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Editar Usuario</h3>
                </div>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Correo de Acceso</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
                </div>

                {hasBroadAccess && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rol</label>
                    <select
                      value={editRoleKey}
                      onChange={(e) => setEditRoleKey(e.target.value)}
                      className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                    >
                      <option value="Member">Colaborador</option>
                      <option value="Admin">Administrador de Empresa</option>
                    </select>
                  </div>
                )}

                {editAvailableServices.length > 0 && (
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <LayoutGrid size={16} className="text-primary" />
                      Servicios que puede ver
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {editAvailableServices.map((s) => (
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
                  </div>
                )}

                {editAvailableDashboardCards.length > 0 && (
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                      <LayoutDashboard size={16} className="text-primary" />
                      Tarjetas del Dashboard que puede ver
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {editAvailableDashboardCards.map((c) => (
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
                  </div>
                )}

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
