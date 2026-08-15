"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { User, Mail, Shield, CheckCircle2, AlertCircle, Save } from "lucide-react"

export default function ProfilePage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const token = getCookie("token");
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        const payloadDecoded = JSON.parse(atob(payloadBase64));
        
        setName(payloadDecoded.FullName || "");
        setEmail(payloadDecoded.email || "");
        setRole(payloadDecoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payloadDecoded.role || "Client");
      } catch (e) {
        console.error("Error decoding token", e);
      }
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop()?.split(';').shift();
        return null;
      };
      
      const token = getCookie("token");

      const response = await fetch(`${apiBaseUrl}/api/auth/profile`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ newName: name, newEmail: email })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al actualizar los datos personales.")
      }

      const data = await response.json()
      
      if (data.token) {
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`
      }

      setSuccessMessage("Tus datos personales se han actualizado con éxito.")
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Hubo un error al guardar los cambios.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Centered container both vertically and horizontally */}
      <div className="min-h-[calc(100vh-12rem)] flex items-center justify-center p-4">
        {/* constrained card to max-w-md (448px) */}
        <div className="w-full max-w-md rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-8 shadow-xl relative overflow-hidden">
          
          {/* Subtle gradient light background decorative element */}
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          
          <div className="flex items-center gap-4 mb-8 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/5">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Datos Personales</h2>
              <p className="text-sm text-muted-foreground">Actualiza tu información de perfil</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6 relative z-10">
            {errorMessage && (
              <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive animate-in fade-in duration-200">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-600 dark:text-emerald-400 animate-in fade-in duration-200">
                <CheckCircle2 size={18} />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Input Nombre with separated Prefix Icon */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre Completo</label>
              <div className="flex rounded-2xl border border-border bg-background/30 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300">
                <div className="flex items-center justify-center px-4 bg-muted/20 border-r border-border/50 text-muted-foreground select-none">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="block w-full px-4 py-3 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 transition-all"
                />
              </div>
            </div>

            {/* Input Correo with separated Prefix Icon */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correo Electrónico</label>
              <div className="flex rounded-2xl border border-border bg-background/30 overflow-hidden focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all duration-300">
                <div className="flex items-center justify-center px-4 bg-muted/20 border-r border-border/50 text-muted-foreground select-none">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="block w-full px-4 py-3 bg-transparent outline-none text-foreground placeholder:text-muted-foreground/60 transition-all"
                />
              </div>
            </div>

            {/* Input Rol (disabled) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Rol Asignado</label>
              <div className="flex rounded-2xl border border-border/30 bg-muted/10 overflow-hidden">
                <div className="flex items-center justify-center px-4 bg-muted/20 border-r border-border/30 text-muted-foreground/50 select-none">
                  <Shield size={18} />
                </div>
                <input
                  type="text"
                  disabled
                  value={role}
                  className="block w-full px-4 py-3 bg-transparent outline-none text-muted-foreground/60 cursor-not-allowed select-none"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">El rol es gestionado por la empresa y no puede ser alterado directamente.</p>
            </div>

            {/* Taller Save Button (h-14) */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold transition-all shadow-lg shadow-primary/10 hover:shadow-primary/20 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] duration-300"
            >
              <Save size={18} />
              {isLoading ? "Guardando Cambios..." : "Guardar Cambios"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
