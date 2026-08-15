"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Home, FileText, Users, Settings, LogOut, Building, User as UserIcon, Menu, Briefcase } from "lucide-react"
import Image from "next/image"

// Patrón Map/Registry para mapear de manera escalable las rutas de Next.js a sus títulos correspondientes
const ROUTE_TITLES: Record<string, string> = {
  "/dashboard": "Resumen Ejecutivo",
  "/dashboard/profile": "Datos Personales",
  "/dashboard/tenants": "Administración de Empresas",
  "/dashboard/services": "Servicios Globales",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Resolver el título activo dinámicamente usando el registro de rutas
  const activeTitle = ROUTE_TITLES[pathname] || "Dashboard";

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
        
        const name = payloadDecoded.FullName || payloadDecoded.email?.split("@")[0] || "Usuario";
        const email = payloadDecoded.email || "";
        const role = payloadDecoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payloadDecoded.role || "Client";
        
        setUser({ name, email, role });
      } catch (e) {
        console.error("Error decoding token", e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()

    document.cookie.split(";").forEach((cookie) => {
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname};`
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname};`
    })

    window.location.href = "/"
  }

  // Helper para determinar si un enlace está activo y aplicar estilos correspondientes de forma dinámica
  const getLinkClass = (path: string) => {
    const baseClass = "flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ";
    const isActive = pathname === path;
    return isActive 
      ? `${baseClass} bg-primary/10 text-primary font-semibold shadow-sm shadow-primary/5` 
      : `${baseClass} text-muted-foreground hover:bg-muted hover:text-foreground`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 bg-gradient-to-br from-slate-100 via-slate-50 to-primary/5 dark:bg-background dark:from-background dark:via-background dark:to-primary/10 transition-colors duration-500 overflow-x-hidden">
      
      {/* Sidebar with Glassmorphism */}
      <aside 
        className={`fixed inset-y-0 left-0 z-20 flex flex-col border-r border-border/50 bg-background/60 backdrop-blur-xl shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-[4px_0_24px_rgba(0,0,0,0.2)] transition-all duration-300 ease-in-out
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
        
        {/* Flex layout for sidebar options */}
        <div className="flex flex-col flex-1 justify-between px-4 pb-6 mt-6">
          <nav className="flex flex-col gap-2">
            <a href="/dashboard" className={getLinkClass("/dashboard")}>
              <Home size={18} />
              Dashboard
            </a>
            <a href="#" className={getLinkClass("/dashboard/documents")}>
              <FileText size={18} />
              Documentos
            </a>
            <a href="#" className={getLinkClass("/dashboard/employees")}>
              <Users size={18} />
              Empleados
            </a>
            <a href="/dashboard/profile" className={getLinkClass("/dashboard/profile")}>
              <UserIcon size={18} />
              Datos Personales
            </a>
            {user?.role === "SuperAdmin" && (
              <>
                <a href="/dashboard/tenants" className={getLinkClass("/dashboard/tenants")}>
                  <Building size={18} />
                  Administración Empresas
                </a>
                <a href="/dashboard/services" className={getLinkClass("/dashboard/services")}>
                  <Briefcase size={18} />
                  Servicios
                </a>
              </>
            )}
          </nav>
          
          <div className="flex flex-col gap-2">
            <div className="border-t border-border/50 my-2" />
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-destructive hover:bg-destructive/10 transition-all font-medium text-left border border-transparent hover:border-destructive/20"
            >
              <LogOut size={18} />
              Cerrar Sesión
            </button>
          </div>
        </div>
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
              {activeTitle}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle />
            
            {/* Interactive Profile Dropdown Submenu */}
            <div className="relative">
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="group relative"
              >
                <div className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-primary to-emerald-400 opacity-75 blur-sm group-hover:opacity-100 transition duration-300"></div>
                <div className="relative rounded-full h-10 w-10 bg-background border border-border/50 flex items-center justify-center text-primary font-bold text-sm shadow-md cursor-pointer hover:scale-105 transition-transform select-none">
                  {user ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                </div>
              </div>
              
              {isDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl p-4 shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col gap-1 pb-3 border-b border-border/50">
                      <p className="text-sm font-semibold text-foreground">{user?.name || "Cargando..."}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || "Cargando..."}</p>
                    </div>
                    <div className="flex items-center justify-between pt-3">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol</span>
                      <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        {user?.role || "Cliente"}
                      </span>
                    </div>
                    <div className="border-t border-border/50 my-3" />
                    <a 
                      href="/dashboard/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-all"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <UserIcon size={16} />
                      Mi Perfil
                    </a>
                  </div>
                </>
              )}
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
