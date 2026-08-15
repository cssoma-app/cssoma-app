"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"
import { Loader2 } from "lucide-react"

interface LoadingContextType {
  isLoading: boolean
  loadingMessage: string
  showLoading: (message?: string) => void
  hideLoading: () => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function useLoading() {
  const context = useContext(LoadingContext)
  if (!context) {
    throw new Error("useLoading debe usarse dentro de un LoadingProvider")
  }
  return context
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState("Procesando...")

  const showLoading = (message: string = "Procesando...") => {
    setLoadingMessage(message)
    setIsLoading(true)
  }

  const hideLoading = () => {
    setIsLoading(false)
  }

  return (
    <LoadingContext.Provider value={{ isLoading, loadingMessage, showLoading, hideLoading }}>
      {children}
      
      {/* Global Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/60 backdrop-blur-md animate-in fade-in duration-200">
          <div className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-background/80 border border-border/50 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200 min-w-[240px]">
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-pulse scale-150"></div>
              <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center relative z-10 border border-primary/20 shadow-inner">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-base font-bold text-foreground animate-pulse tracking-wide">{loadingMessage}</p>
              <p className="text-xs text-muted-foreground">Por favor, espera un momento</p>
            </div>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  )
}
