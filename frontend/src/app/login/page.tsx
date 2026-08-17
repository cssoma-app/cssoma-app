"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, ShieldCheck, AlertCircle, ArrowRight, Lock, Eye, EyeOff, KeyRound } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { getErrorMessage } from "@/lib/utils"

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<"password" | "code">("password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  // Estados para el flujo de cambio obligatorio de contraseña temporal
  const [mustChangePassword, setMustChangePassword] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [tempToken, setTempToken] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMessage("")
    setIsSuccess(false)

    try {
      const sanitizedEmail = email.normalize("NFC").trim().toLowerCase().replace(/[<>'";`\-]/g, "")
      const sanitizedPassword = password.normalize("NFC").replace(/[<>;`]/g, "")

      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      
      if (activeTab === "password") {
        const response = await fetch(`${apiBaseUrl}/api/auth/login-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sanitizedEmail, password: sanitizedPassword })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "Correo electrónico o contraseña incorrectos.")
        }

        const data = await response.json()
        
        if (data.mustChangePassword) {
          setTempToken(data.token)
          setMustChangePassword(true)
        } else {
          document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`
          router.push("/dashboard")
        }
      } else {
        const response = await fetch(`${apiBaseUrl}/api/auth/request-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: sanitizedEmail })
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.message || "Este correo electrónico no está registrado en el sistema. Solicita acceso a tu asesor de CSOMA.")
        }

        setIsSuccess(true)
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Hubo un problema al conectar con el servidor de autenticación."))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeTempPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.")
      return
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const response = await fetch(`${apiBaseUrl}/api/auth/change-temp-password`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tempToken}`
        },
        body: JSON.stringify({ newPassword: newPassword.normalize("NFC").replace(/[<>;`]/g, "") })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al actualizar la contraseña.")
      }

      const data = await response.json()
      
      document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`
      router.push("/dashboard")
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Hubo un error al redefinir tu contraseña."))
    } finally {
      setIsLoading(false)
    }
  }

  // Vista obligatoria de cambio de contraseña temporal
  if (mustChangePassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 bg-gradient-to-br from-slate-100 via-slate-50 to-primary/5 dark:bg-background dark:from-background dark:via-background dark:to-primary/10 transition-colors duration-500 overflow-x-hidden p-6">
        <div className="w-full max-w-md rounded-3xl border border-border/50 bg-background/50 backdrop-blur-xl p-8 shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          
          <div className="flex flex-col items-center text-center space-y-3 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/5">
              <KeyRound size={24} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Cambio de Contraseña Obligatorio</h2>
            <p className="text-sm text-muted-foreground">
              Esta es la primera vez que ingresas al sistema. Por seguridad, debes redefinir tu contraseña temporal por una nueva de tu elección.
            </p>
          </div>

          <form onSubmit={handleChangeTempPassword} className="space-y-4 relative z-10">
            {errorMessage && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm font-medium flex items-start gap-3 animate-fade-in-up">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-foreground">Nueva Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Mínimo 8 caracteres, números y especiales"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold tracking-wide text-foreground">Confirmar Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:underline font-medium"
              >
                {showPassword ? "Ocultar Contraseñas" : "Mostrar Contraseñas"}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
              ) : (
                "Establecer Contraseña Definitiva"
              )}
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground transition-colors duration-300 font-sans relative overflow-hidden">
      
      {/* Botón de tema flotante */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeToggle />
      </div>

      {/* Lado Izquierdo: Visual & Branding */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-12 bg-muted overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image 
            src="/sst_login_bg.png" 
            alt="SSTerra Occupational Health" 
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-emerald-950/80 to-background/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logocsoma.png" alt="CSOMA Logo" width={180} height={50} className="object-contain brightness-0 invert" />
          </Link>
        </div>

        <div className="relative z-10 max-w-lg mb-12">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-6 backdrop-blur-md">
            <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
            Portal Exclusivo para Clientes
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Lleva la gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">SST y Medio Ambiente</span> al siguiente nivel.
          </h2>
          <p className="text-lg text-white/80 font-light leading-relaxed">
            Centraliza tus matrices de riesgo, controla vencimientos con semáforos inteligentes y gestiona tus empleados desde una plataforma única respaldada por nuestros especialistas.
          </p>
        </div>

        <div className="relative z-10 text-sm text-white/50 font-light flex items-center justify-between">
          <p>&copy; {new Date().getFullYear()} CSOMA Consultores SAS.</p>
          <Link href="/" className="hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver a Inicio
          </Link>
        </div>
      </div>

      {/* Lado Derecho: Formulario de Autenticación */}
      <div className="flex items-center justify-center p-8 sm:p-12 xl:p-24 relative z-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-10">
            <Image src="/logocsoma.png" alt="CSOMA Logo" width={180} height={50} className="object-contain dark:brightness-0 dark:invert" />
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h1 className="text-3xl font-extrabold tracking-tight mb-3">
              Ingreso de Clientes
            </h1>
            <p className="text-muted-foreground font-light">
              Bienvenido al portal corporativo de CSOMA. Selecciona tu método de ingreso preferido.
            </p>
          </div>

          {!isSuccess && (
            <div className="grid grid-cols-2 p-1.5 bg-muted rounded-2xl mb-8 border border-border/40">
              <button
                type="button"
                onClick={() => { setActiveTab("password"); setErrorMessage(""); }}
                className={`py-3 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "password" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Lock size={16} /> Tengo Contraseña
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab("code"); setErrorMessage(""); }}
                className={`py-3 text-sm font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                  activeTab === "code" 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <KeyRound size={16} /> Primer Ingreso
              </button>
            </div>
          )}

          {isSuccess ? (
            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 text-center space-y-4 animate-fade-in-up">
              <div className="h-12 w-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold">Código de Seguridad Enviado</h3>
              <p className="text-muted-foreground text-sm font-light leading-relaxed">
                Hemos enviado un código de acceso único a <strong className="text-foreground">{email}</strong> para que configures tu contraseña.
              </p>
              <div className="pt-4">
                <Link href={`/verify-otp?email=${encodeURIComponent(email)}`} className="w-full inline-flex items-center justify-center rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all">
                  Ingresar Código de Seguridad <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-destructive text-sm font-medium flex items-start gap-3 animate-fade-in-up">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p>{errorMessage}</p>
                    <a 
                      href="https://wa.me/573108465617?text=Hola,%20quisiera%20solicitar%20el%20alta%20de%20mi%20cuenta%20en%20el%20portal%20de%20clientes" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="inline-flex items-center mt-3 text-primary hover:underline font-semibold"
                    >
                      Contactar Asesor por WhatsApp <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-semibold tracking-wide text-foreground">
                  Correo Electrónico Autorizado
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="empresa@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                  />
                </div>
              </div>

              {activeTab === "password" && (
                <div className="space-y-2 animate-fade-in-up">
                  <div className="flex justify-between items-center">
                    <label htmlFor="password" className="text-sm font-semibold tracking-wide text-foreground">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab("code");
                        setErrorMessage("");
                      }}
                      className="text-xs text-primary hover:underline font-medium"
                    >
                      ¿Olvidó su contraseña?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 rounded-2xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                ) : (
                  activeTab === "password" ? "Iniciar Sesión" : "Solicitar Código de Seguridad"
                )}
              </button>
            </form>
          )}

          {!isSuccess && (
            <div className="mt-10 p-6 rounded-2xl bg-muted/40 border border-border/50 text-center">
              <p className="text-sm text-muted-foreground font-light mb-4">
                ¿Tu empresa aún no es cliente de CSOMA o deseas habilitar tu portal?
              </p>
              <a 
                href="https://wa.me/573108465617?text=Hola,%20me%20gustaría%20agendar%20un%20diagnóstico%20inicial%20para%20conocer%20el%20software%20de%20SST" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-6 py-2.5 text-xs font-semibold shadow-sm hover:scale-105 transition-all"
              >
                Agenda un Diagnóstico Inicial
              </a>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-border/50 text-center lg:hidden">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Volver al Inicio
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
