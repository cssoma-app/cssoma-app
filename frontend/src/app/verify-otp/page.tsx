"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldCheck, RefreshCw, CheckCircle2, Lock, Eye, EyeOff, AlertTriangle } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { getErrorMessage } from "@/lib/utils"

export default function VerifyOtpPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [code, setCode] = useState<string[]>(["", "", "", ""])
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [timer, setTimer] = useState(59)

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      setEmail(params.get("email") || "")
    }
  }, [])
  
  // Flujo de Creación de Contraseña
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [injectionAlert, setInjectionAlert] = useState("")
  const [isPasswordSuccess, setIsPasswordSuccess] = useState(false)
  
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleVerification = async (codeToVerify: string) => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const response = await fetch(`${apiBaseUrl}/api/auth/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: codeToVerify })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Código de seguridad incorrecto o expirado.")
      }

      setIsSuccess(true)

      // En vez de redireccionar inmediatamente, mostramos el paso de crear contraseña
      setTimeout(() => {
        setIsSuccess(false)
        setShowPasswordForm(true)
      }, 1000)
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "Error al verificar el código de seguridad."))
      setCode(["", "", "", ""])
      inputsRef.current[0]?.focus()
    } finally {
      setIsLoading(false)
    }
  }

  // Cuenta regresiva para reenviar código
  useEffect(() => {
    if (timer > 0 && !showPasswordForm) {
      const interval = setInterval(() => setTimer((prev) => prev - 1), 1000)
      return () => clearInterval(interval)
    }
  }, [timer, showPasswordForm])

  // Verificar automáticamente cuando todos los dígitos estén llenos
  useEffect(() => {
    const fullCode = code.join("")
    if (fullCode.length === 4) {
      handleVerification(fullCode)
    }
  }, [code])

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d+$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.substring(value.length - 1)
    setCode(newCode)

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const newCode = [...code]
      newCode[index - 1] = ""
      setCode(newCode)
      inputsRef.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").trim()
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split("")
      setCode(digits)
      inputsRef.current[3]?.focus()
    }
  }

  const handleResend = async () => {
    if (timer === 0) {
      setTimer(59)
      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
        const response = await fetch(`${apiBaseUrl}/api/auth/request-code`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        })

        if (!response.ok) {
          throw new Error("No se pudo reenviar el código.")
        }
        alert("Se ha enviado un nuevo código de seguridad a tu correo electrónico.")
      } catch (err) {
        alert("Hubo un problema al intentar reenviar el código de seguridad.")
      }
    }
  }

  // Lógica de fuerza de contraseña
  const evaluatePasswordStrength = (pwd: string) => {
    let score = 0
    if (pwd.length === 0) return 0
    if (pwd.length >= 8) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[@$!%*?&.\-#]/.test(pwd)) score++
    return score
  }

  const handlePasswordChange = (val: string) => {
    // 1. Normalización Unicode NFC
    let normalized = val.normalize("NFC")
    
    // 2. Sanitización contra Inyección de Scripts/HTML/SQL básico
    const injectionPattern = /[<>'";`\-]/g
    if (injectionPattern.test(normalized)) {
      setInjectionAlert("Carácter especial bloqueado por seguridad para prevenir inyecciones.")
      normalized = normalized.replace(injectionPattern, "")
    } else {
      setInjectionAlert("")
    }

    setPassword(normalized)
    setPasswordStrength(evaluatePasswordStrength(normalized))
  }

  const handleConfirmPasswordChange = (val: string) => {
    let normalized = val.normalize("NFC")
    const injectionPattern = /[<>'";`\-]/g
    if (injectionPattern.test(normalized)) {
      normalized = normalized.replace(injectionPattern, "")
    }
    setConfirmPassword(normalized)
  }

  const getStrengthBarProperties = () => {
    switch (passwordStrength) {
      case 1:
        return { color: "bg-red-500", width: "w-1/4", label: "Débil", text: "text-red-500" }
      case 2:
        return { color: "bg-orange-500", width: "w-2/4", label: "Media", text: "text-orange-500" }
      case 3:
        return { color: "bg-yellow-500", width: "w-3/4", label: "Buena", text: "text-yellow-500" }
      case 4:
        return { color: "bg-emerald-500", width: "w-full", label: "Fuerte", text: "text-emerald-500" }
      default:
        return { color: "bg-muted", width: "w-0", label: "Muy Débil", text: "text-muted-foreground" }
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.")
      return;
    }

    setIsLoading(true)
    setErrorMessage("")

    try {
      const fullCode = code.join("")
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166"
      const response = await fetch(`${apiBaseUrl}/api/auth/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: fullCode, password })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || "Error al registrar la contraseña.")
      }

      const data = await response.json()
      setIsPasswordSuccess(true)
      
      // Redirigir al dashboard final guardando la sesión real
      setTimeout(() => {
        document.cookie = `token=${data.token}; path=/; max-age=604800; SameSite=Lax`
        router.push("/dashboard")
      }, 1500)
    } catch (err) {
      setErrorMessage(getErrorMessage(err, "No se pudo establecer la contraseña en el servidor."))
    } finally {
      setIsLoading(false)
    }
  }

  const strength = getStrengthBarProperties()

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background text-foreground transition-colors duration-300 font-sans relative overflow-hidden">
      
      {/* Botón de tema flotante */}
      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <ThemeToggle />
      </div>

      {/* Lado Izquierdo: Visual & Branding (Oculto en pantallas pequeñas) */}
      <div className="hidden lg:relative lg:flex flex-col justify-between p-12 bg-muted overflow-hidden">
        {/* Imagen de fondo */}
        <div className="absolute inset-0 z-0">
          <Image 
            src="/sst_login_bg.png" 
            alt="SSTerra Security Check" 
            fill
            className="object-cover"
            priority
          />
          {/* Overlay moderno y traslúcido */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 via-emerald-950/80 to-background/90 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
        </div>

        {/* Logo superior */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/logocsoma.png" alt="CSOMA Logo" width={180} height={50} className="object-contain brightness-0 invert" />
          </Link>
        </div>

        {/* Frase / Propuesta de Valor */}
        <div className="relative z-10 max-w-lg mb-12">
          <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-6 backdrop-blur-md">
            <ShieldCheck className="mr-2 h-4 w-4 text-emerald-400" />
            Acceso de Dos Factores
          </div>
          <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Tu información, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-emerald-500">totalmente protegida</span>.
          </h2>
          <p className="text-lg text-white/80 font-light leading-relaxed">
            Garantizamos la máxima confidencialidad en los datos de SST y medio ambiente de tu empresa con métodos de autenticación ágiles y seguros.
          </p>
        </div>

        {/* Footer del lado izquierdo */}
        <div className="relative z-10 text-sm text-white/50 font-light flex items-center justify-between">
          <p>&copy; {new Date().getFullYear()} CSOMA Consultores SAS.</p>
          <Link href="/login" className="hover:text-white transition-colors flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al Ingreso
          </Link>
        </div>
      </div>

      {/* Lado Derecho: Formulario de Verificación / Contraseña */}
      <div className="flex items-center justify-center p-8 sm:p-12 xl:p-24 relative z-10">
        <div className="w-full max-w-md text-center lg:text-left">
          
          {/* Logo en Mobile */}
          <div className="lg:hidden flex justify-center mb-10">
            <Image src="/logocsoma.png" alt="CSOMA Logo" width={180} height={50} className="object-contain dark:brightness-0 dark:invert" />
          </div>

          <div className="mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight mb-3">
              {showPasswordForm ? "Configura tu Contraseña" : "Verificar Código de Acceso"}
            </h1>
            <p className="text-muted-foreground font-light">
              {showPasswordForm 
                ? "Establece una contraseña segura para los próximos ingresos a la plataforma."
                : "Ingresa el código de 4 dígitos enviado a tu correo corporativo."
              }
            </p>
          </div>

          {/* Tarjeta interactiva */}
          <div className="rounded-3xl border border-border/50 bg-background/50 p-8 shadow-2xl backdrop-blur-xl space-y-8">
            
            {/* 1. Flujo de Código de Seguridad */}
            {!showPasswordForm && (
              isSuccess ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-6 animate-fade-in-up">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={36} className="animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold">Código Correcto</h3>
                  <p className="text-muted-foreground text-sm font-light">
                    Preparando configuración de contraseña...
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {errorMessage && (
                    <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm font-medium">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex justify-center gap-4" onPaste={handlePaste}>
                    {code.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => { inputsRef.current[idx] = el }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        disabled={isLoading}
                        className="w-16 h-20 text-center text-3xl font-extrabold rounded-2xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none disabled:opacity-50"
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleVerification(code.join(""))}
                    disabled={isLoading || code.some(d => d === "")}
                    className="w-full inline-flex items-center justify-center rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    ) : (
                      "Verificar Código"
                    )}
                  </button>
                </div>
              )
            )}

            {/* 2. Flujo de Configuración de Contraseña */}
            {showPasswordForm && (
              isPasswordSuccess ? (
                <div className="flex flex-col items-center justify-center space-y-4 py-6 animate-fade-in-up">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 size={36} className="animate-pulse" />
                  </div>
                  <h3 className="text-2xl font-bold">Contraseña Creada</h3>
                  <p className="text-muted-foreground text-sm font-light">
                    Ingresando al portal corporativo...
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-6 text-left">
                  
                  {errorMessage && (
                    <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-destructive text-sm font-medium">
                      {errorMessage}
                    </div>
                  )}

                  {injectionAlert && (
                    <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-amber-500 text-sm font-medium flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                      <span>{injectionAlert}</span>
                    </div>
                  )}

                  {/* Input Contraseña */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-semibold tracking-wide text-foreground">
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => handlePasswordChange(e.target.value)}
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

                  {/* Barra de seguridad animada */}
                  {password.length > 0 && (
                    <div className="space-y-2 animate-fade-in-up">
                      <div className="flex justify-between text-xs font-semibold">
                        <span>Seguridad:</span>
                        <span className={strength.text}>{strength.label}</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        {/* Animación fluida de ancho y color mediante transiciones */}
                        <div className={`h-full ${strength.color} ${strength.width} transition-all duration-500 ease-out`} />
                      </div>
                      <p className="text-[11px] text-muted-foreground font-light leading-relaxed">
                        Recomendado: 8+ caracteres, mayúsculas, números y caracteres especiales.
                      </p>
                    </div>
                  )}

                  {/* Input Confirmar Contraseña */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold tracking-wide text-foreground">
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-input bg-background/50 focus:bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 outline-none text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex items-center justify-center rounded-2xl bg-primary py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isLoading ? (
                      <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                    ) : (
                      "Crear Contraseña & Entrar"
                    )}
                  </button>
                </form>
              )
            )}

          </div>

          {/* Reenviar Código */}
          {!showPasswordForm && !isSuccess && (
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground font-light">
                ¿No recibiste el código?{" "}
                {timer > 0 ? (
                  <span className="font-semibold text-foreground">
                    Reenviar en {timer}s
                  </span>
                ) : (
                  <button
                    onClick={handleResend}
                    className="font-semibold text-primary hover:underline inline-flex items-center gap-1 transition-all"
                  >
                    <RefreshCw className="h-3 w-3" /> Reenviar código
                  </button>
                )}
              </p>
            </div>
          )}

          {/* Enlace para volver */}
          <div className="mt-8 pt-6 border-t border-border/50 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" /> Cambiar de correo electrónico
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
