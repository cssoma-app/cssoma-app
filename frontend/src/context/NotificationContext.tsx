"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { CheckCircle2, AlertTriangle, AlertCircle, HelpCircle, X } from "lucide-react"

type NotificationType = "success" | "warning" | "error" | "confirm"

interface NotificationOptions {
  title: string
  message: string
  onConfirm?: () => void
  onCancel?: () => void
  verifyValue?: string
  verifyPlaceholder?: string
}

interface NotificationContextType {
  showSuccess: (title: string, message: string) => void
  showWarning: (title: string, message: string) => void
  showError: (title: string, message: string) => void
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void, verifyValue?: string, verifyPlaceholder?: string) => void
  closeNotification: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotification debe usarse dentro de un NotificationProvider")
  }
  return context
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [type, setType] = useState<NotificationType>("success")
  const [options, setOptions] = useState<NotificationOptions | null>(null)
  const [verificationInput, setVerificationInput] = useState("")

  const showSuccess = (title: string, message: string) => {
    setType("success")
    setOptions({ title, message })
    setIsOpen(true)
  }

  const showWarning = (title: string, message: string) => {
    setType("warning")
    setOptions({ title, message })
    setIsOpen(true)
  }

  const showError = (title: string, message: string) => {
    setType("error")
    setOptions({ title, message })
    setIsOpen(true)
  }

  const showConfirm = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    onCancel?: () => void,
    verifyValue?: string,
    verifyPlaceholder?: string
  ) => {
    setType("confirm")
    setOptions({ title, message, onConfirm, onCancel, verifyValue, verifyPlaceholder })
    setVerificationInput("")
    setIsOpen(true)
  }

  const closeNotification = () => {
    if (options?.onCancel) {
      options.onCancel()
    }
    setIsOpen(false)
  }

  const handleConfirm = () => {
    if (options?.onConfirm) {
      options.onConfirm()
    }
    setIsOpen(false)
  }

  return (
    <NotificationContext.Provider value={{ showSuccess, showWarning, showError, showConfirm, closeNotification }}>
      {children}

      {/* Reusable Modal Dialog Overlay */}
      {isOpen && options && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Corner Close Button (Only for non-confirm dialogs) */}
            {type !== "confirm" && (
              <button 
                onClick={closeNotification}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            )}

            <div className="flex items-start gap-4">
              {/* Type Indicator Icon */}
              {(() => {
                const titleLower = options.title.toLowerCase();
                const isDangerConfirm = type === "confirm" && (titleLower.includes("eliminar") || titleLower.includes("borrar"));
                const isWarningConfirm = type === "confirm" && titleLower.includes("desactivar");

                let iconColorClass = "bg-primary/10 text-primary";
                let iconElement = <HelpCircle size={24} />;
                let containerClass = "h-12 w-12 rounded-2xl";

                if (type === "success") {
                  iconColorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
                  iconElement = <CheckCircle2 size={28} />;
                  containerClass = "h-14 w-14 rounded-2xl";
                } else if (type === "warning" || isWarningConfirm) {
                  iconColorClass = "bg-amber-500/10 text-amber-500 dark:text-amber-400";
                  iconElement = <AlertTriangle size={28} />;
                  containerClass = "h-14 w-14 rounded-2xl";
                } else if (type === "error" || isDangerConfirm) {
                  iconColorClass = "bg-destructive/10 text-destructive";
                  iconElement = <AlertCircle size={36} />;
                  containerClass = "h-16 w-16 rounded-[24px] shadow-lg shadow-destructive/20 border border-destructive/20";
                }

                return (
                  <div className={`${containerClass} flex items-center justify-center shrink-0 ${iconColorClass}`}>
                    {iconElement}
                  </div>
                );
              })()}

              {/* Message Details */}
              <div className="space-y-1 w-full pt-1">
                <h3 className="text-lg font-bold text-foreground pr-6">{options.title}</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">{options.message}</p>
              </div>
            </div>

            {/* Input de Verificación de Seguridad */}
            {options.verifyValue && (
              <div className="space-y-3 mt-4 animate-in fade-in duration-300 bg-muted/30 p-4 rounded-2xl border border-border/50">
                <p className="text-xs text-foreground font-semibold">
                  Para continuar, por favor escribe: <br/>
                  <span className="inline-block mt-1.5 font-mono text-destructive font-bold select-all bg-destructive/10 px-2 py-1 rounded-lg border border-destructive/20">{options.verifyValue}</span>
                </p>
                <input
                  type="text"
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  placeholder={options.verifyPlaceholder || "Escribe el texto exacto aquí"}
                  className="block w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:ring-4 focus:ring-destructive/10 focus:border-destructive transition-all outline-none text-sm font-mono text-foreground font-medium"
                />
              </div>
            )}

            {/* Action Buttons with increased height */}
            <div className={`flex gap-3 pt-2 ${type === "confirm" ? "justify-end" : "justify-center"}`}>
              {type === "confirm" ? (
                <>
                  <button
                    onClick={closeNotification}
                    className="flex items-center justify-center h-12 px-6 rounded-2xl border border-border bg-transparent text-sm font-semibold hover:bg-muted text-foreground transition-all select-none focus:outline-none"
                  >
                    Cancelar
                  </button>
                  {(() => {
                    const titleLower = options.title?.toLowerCase() || "";
                    const messageLower = options.message?.toLowerCase() || "";
                    const isDanger = titleLower.includes("eliminar") || titleLower.includes("borrar") || messageLower.includes("eliminar") || messageLower.includes("borrar");
                    const isVerifyDisabled = options.verifyValue ? verificationInput !== options.verifyValue : false;

                    return (
                      <button
                        onClick={handleConfirm}
                        disabled={isVerifyDisabled}
                        style={{ 
                          backgroundColor: isDanger ? 'var(--destructive)' : 'var(--primary)',
                          color: '#ffffff'
                        }}
                        className="flex items-center justify-center h-12 px-8 rounded-2xl text-sm font-semibold shadow-lg transition-all select-none focus:outline-none hover:scale-[1.02] active:scale-[0.98] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
                      >
                        {isDanger ? 'Eliminar' : 'Confirmar'}
                      </button>
                    );
                  })()}
                </>
              ) : (
                <button
                  onClick={closeNotification}
                  className="flex items-center justify-center h-12 px-8 rounded-2xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/30 transition-all select-none focus:outline-none hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Entendido
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  )
}
