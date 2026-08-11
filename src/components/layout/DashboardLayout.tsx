"use client"

import { useState } from "react"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Home, FileText, Users, Settings, ShieldAlert, CheckCircle2, Menu } from "lucide-react"
import Image from "next/image"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 bg-gradient-to-br from-slate-100 via-slate-50 to-primary/5 dark:bg-background dark:from-background dark:via-background dark:to-primary/10 transition-colors duration-500 overflow-x-hidden">
      
      {/* Sidebar with Glassmorphism */}
      <aside 
        className={`fixed inset-y-0 left-0 z-20 flex-col border-r border-border/50 bg-background/60 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out
          ${isSidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"}
        `}
      >
        <div className="flex h-16 items-center border-b border-border/50 px-6">
          <Image 
            src="/logocsoma.png" 
            alt="CSOMA Logo" 
            width={140} 
            height={40} 
            className="object-contain"
            priority
          />
        </div>
        <nav className="grid items-start px-4 text-sm font-medium mt-6 gap-2">
          <a href="#" className="flex items-center gap-3 rounded-xl bg-primary/10 px-4 py-3 text-primary font-semibold transition-all shadow-sm shadow-primary/5">
            <Home size={18} />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
            <FileText size={18} />
            Documentos
          </a>
          <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:bg-muted hover:text-foreground">
            <Users size={18} />
            Empleados
          </a>
          <a href="#" className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all hover:bg-muted hover:text-foreground mt-auto">
            <Settings size={18} />
            Configuración
          </a>
        </nav>
      </aside>
      
      {/* Main Content Area */}
      <div 
        className={`flex flex-col min-h-screen relative transition-all duration-300 ease-in-out ${isSidebarOpen ? "pl-64" : "pl-0"}`}
      >
        
        {/* Header with Glassmorphism */}
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/60 backdrop-blur-xl px-4 sm:px-8 transition-all duration-300">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 -ml-2 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          
          <div className="w-full flex-1">
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Resumen Ejecutivo
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="group relative">
              <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-emerald-400 opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
              <div className="relative rounded-full h-10 w-10 bg-background border border-border/50 flex items-center justify-center text-primary font-bold text-sm shadow-md cursor-pointer hover:scale-105 transition-transform">
                JD
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 items-start p-4 sm:px-8 sm:py-6 relative z-0">
          {children}
        </main>
      </div>
    </div>
  )
}
