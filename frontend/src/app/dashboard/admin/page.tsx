"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useNotification } from "@/context/NotificationContext"
import { getErrorMessage } from "@/lib/utils"
import { ShieldCheck, Plus, Edit, Trash2, Users, Lock } from "lucide-react"

interface RoleRow {
  id: string
  key: string
  displayName: string
  isSystemRole: boolean
  usersCount: number
}

const getCookie = (name: string) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(";").shift()
  return null
}

export default function AdminPage() {
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(true)
  const { showSuccess, showError, showConfirm } = useNotification()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<RoleRow | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [displayName, setDisplayName] = useState("")
  const [editDisplayName, setEditDisplayName] = useState("")

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"

  const fetchRoles = useCallback(async () => {
    setIsLoading(true)
    try {
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/roles`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })

      if (response.status === 403 || response.status === 401) {
        setHasAccess(false)
        return
      }

      setHasAccess(true)
      if (!response.ok) throw new Error("Error al cargar la lista de roles.")
      const data = await response.json()
      setRoles(data)
    } catch (err) {
      console.error(err)
      showError("Error de Carga", getErrorMessage(err, "No se pudo cargar la lista de roles."))
    } finally {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/roles`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Idempotency-Key": crypto.randomUUID()
        },
        body: JSON.stringify({ displayName })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al crear el rol.")
      }

      showSuccess("Rol Creado", `El rol "${displayName}" fue creado con éxito.`)
      setDisplayName("")
      setIsCreateModalOpen(false)
      fetchRoles()
    } catch (err) {
      showError("Error de Creación", getErrorMessage(err, "Hubo un problema al crear el rol."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (role: RoleRow) => {
    setSelectedRole(role)
    setEditDisplayName(role.displayName)
    setIsEditModalOpen(true)
  }

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole) return
    setIsSubmitting(true)

    try {
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/roles/${selectedRole.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ displayName: editDisplayName })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al actualizar el rol.")
      }

      showSuccess("Cambios Guardados", `El rol se renombró a "${editDisplayName}".`)
      setIsEditModalOpen(false)
      fetchRoles()
    } catch (err) {
      showError("Error de Modificación", getErrorMessage(err, "No se pudieron aplicar los cambios."))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteRole = async (role: RoleRow) => {
    try {
      const token = getCookie("token")
      const response = await fetch(`${apiBaseUrl}/api/roles/${role.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.Message || "Error al eliminar el rol.")
      }

      showSuccess("Rol Eliminado", `El rol "${role.displayName}" fue eliminado.`)
      fetchRoles()
    } catch (err) {
      showError("Error de Eliminación", getErrorMessage(err, "No se pudo eliminar el rol."))
    }
  }

  const triggerDelete = (role: RoleRow) => {
    showConfirm(
      "¿Eliminar Rol?",
      `¿Deseas eliminar el rol "${role.displayName}"? Esta operación no se puede deshacer.`,
      () => handleDeleteRole(role)
    )
  }

  if (!hasAccess && !isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-md mx-auto mt-16 text-center space-y-6 rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-8 shadow-xl">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive">
            <Lock size={28} />
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
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Administrar</h2>
          <p className="text-sm text-muted-foreground">Configuración global de la plataforma</p>
        </div>

        {/* Tabs */}
        <div className="border-b border-border/50 flex gap-1">
          <button className="px-4 py-2.5 text-sm font-semibold text-primary border-b-2 border-primary flex items-center gap-2">
            <ShieldCheck size={16} />
            Roles
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary hover:bg-primary/95 px-4 py-3 font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/10"
          >
            <Plus size={18} />
            Nuevo Rol
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="text-sm text-muted-foreground">Cargando roles...</span>
          </div>
        ) : (
          <div className="rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <th className="px-6 py-4">Rol</th>
                    <th className="px-6 py-4 text-center">Usuarios Asignados</th>
                    <th className="px-6 py-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 text-sm">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-32 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center space-y-4 max-w-sm mx-auto">
                          <div className="h-16 w-16 rounded-2xl bg-muted/30 border border-dashed border-border/80 flex items-center justify-center text-muted-foreground/60 shadow-inner">
                            <ShieldCheck size={28} />
                          </div>
                          <p className="font-semibold text-foreground">No hay roles registrados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => {
                      // Renombrar siempre está permitido (no afecta el Key interno). Eliminar
                      // es más estricto: nunca para roles del sistema, ni con usuarios asignados.
                      const isDeleteLocked = role.isSystemRole || role.usersCount > 0

                      return (
                        <tr key={role.id} className="hover:bg-muted/10 transition-all duration-300">
                          <td className="px-6 py-4 font-semibold text-foreground">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary">
                                <ShieldCheck size={16} />
                              </div>
                              <div>
                                <p className="font-bold">{role.displayName}</p>
                                {role.isSystemRole && (
                                  <p className="text-xs text-muted-foreground font-normal">Rol del sistema</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <Users size={14} />
                              {role.usersCount}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="relative group">
                                <button
                                  onClick={() => handleOpenEdit(role)}
                                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  <Edit size={16} />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30">
                                  Editar Rol
                                </div>
                              </div>

                              <div className="relative group">
                                <button
                                  disabled={isDeleteLocked}
                                  onClick={() => triggerDelete(role)}
                                  className="p-2 rounded-lg hover:bg-muted text-destructive hover:text-destructive/80 transition-colors disabled:opacity-30 disabled:pointer-events-none"
                                >
                                  <Trash2 size={16} />
                                </button>
                                {!isDeleteLocked && (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-950 text-slate-50 border border-slate-800 dark:bg-white dark:text-slate-950 dark:border-slate-200 text-[11px] font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-md z-30 font-semibold">
                                    Eliminar Rol
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
          </div>
        )}

        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Plus size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Nuevo Rol</h3>
                </div>
              </div>

              <form onSubmit={handleCreateRole} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre del Rol</label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej. Auditor"
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
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
                    {isSubmitting ? "Creando..." : "Crear Rol"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditModalOpen && selectedRole && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Edit size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Editar Rol</h3>
                </div>
              </div>

              <form onSubmit={handleUpdateRole} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre del Rol</label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"
                  />
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
