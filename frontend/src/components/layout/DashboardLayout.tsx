"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Home, FileText, LogOut, Building, User as UserIcon, Menu, Briefcase, GitBranch, UserCog, ShieldCheck, ChevronDown, Code2, LayoutDashboard, Bell, Check, Trash2, HardHat, ClipboardList } from "lucide-react"
import Image from "next/image"

interface AlertItem {
  id: string
  title: string
  message: string
  isAccepted: boolean
  createdAt: string
  senderName: string
}

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [user, setUser] = useState<{ name: string; email: string; role: string; isPlatformOwner: boolean; tenantName: string } | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [myServices, setMyServices] = useState<{ all: boolean; keys: string[] } | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isAlertsOpen, setIsAlertsOpen] = useState(false)
  const pendingAlertsCount = alerts.filter((a) => !a.isAccepted).length

  const isSuperAdmin = user?.role === "SuperAdmin"
  const hasBroadAccess = isSuperAdmin || (user?.role === "Admin" && user?.isPlatformOwner)
  const canSeeUsers = isSuperAdmin || user?.role === "Admin"

  // El servicio es un filtro ADICIONAL sobre lo que el rol ya permite — nunca otorga más acceso.
  // Mientras myServices no cargó, se oculta por defecto (evita un flash de ítems sin permiso real).
  const canSeeService = (key: string) => myServices !== null && (myServices.all || myServices.keys.includes(key))

  const adminGroupPaths = ["/dashboard/admin", "/dashboard/users", "/dashboard/profile", "/dashboard/services", "/dashboard/dashboard-cards", "/dashboard/tenants"]
  const devGroupPaths = ["/dashboard/pipeline"]
  const sstGroupPaths = ["/dashboard/sgsst-diseno"]

  const [isAdminGroupOpen, setIsAdminGroupOpen] = useState(false)
  const [isDevGroupOpen, setIsDevGroupOpen] = useState(false)
  const [isSstGroupOpen, setIsSstGroupOpen] = useState(false)

  useEffect(() => {
    if (adminGroupPaths.includes(pathname)) setIsAdminGroupOpen(true)
    if (devGroupPaths.includes(pathname)) setIsDevGroupOpen(true)
    if (sstGroupPaths.includes(pathname)) setIsSstGroupOpen(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  // Con <Link> (navegación cliente, sin recarga completa) el árbol viejo de DashboardLayout
  // sigue montado hasta que la página nueva está lista, así que basta con prender esta bandera
  // al click — se apaga sola cuando esta instancia se desmonta al completar la navegación.
  // El timeout es solo una red de seguridad por si algo falla y la navegación nunca termina.
  const handleNavClick = (targetPath: string) => {
    if (targetPath !== pathname) {
      setIsNavigating(true)
    }
  }

  useEffect(() => {
    if (!isNavigating) return
    const timeout = setTimeout(() => setIsNavigating(false), 8000)
    return () => clearTimeout(timeout)
  }, [isNavigating])

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5166";

  const fetchAlerts = () => {
    const token = getCookie("token");
    if (!token) return;
    fetch(`${apiBaseUrl}/api/alerts/mine`, {
      method: "GET",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setAlerts(data);
      })
      .catch((e) => console.error("Error loading alerts", e));
  };

  const handleAcceptAlert = async (id: string) => {
    const token = getCookie("token");
    try {
      const response = await fetch(`${apiBaseUrl}/api/alerts/${id}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Idempotency-Key": crypto.randomUUID()
        }
      });
      if (!response.ok) return;
      setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, isAccepted: true } : a)));
    } catch (e) {
      console.error("Error accepting alert", e);
    }
  };

  const handleDeleteAlert = async (id: string) => {
    const token = getCookie("token");
    try {
      const response = await fetch(`${apiBaseUrl}/api/alerts/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) return;
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      console.error("Error deleting alert", e);
    }
  };

  useEffect(() => {
    const token = getCookie("token");
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        const payloadDecoded = JSON.parse(atob(payloadBase64));

        const name = payloadDecoded.FullName || payloadDecoded.email?.split("@")[0] || "Usuario";
        const email = payloadDecoded.email || "";
        const role = payloadDecoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payloadDecoded.role || "Client";
        const isPlatformOwner = payloadDecoded.IsPlatformOwner === "true";
        const tenantName = payloadDecoded.TenantName || "";

        setUser({ name, email, role, isPlatformOwner, tenantName });
      } catch (e) {
        console.error("Error decoding token", e);
      }

      fetch(`${apiBaseUrl}/api/auth/my-services`, {
        method: "GET",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) setMyServices({ all: data.all ?? data.All ?? false, keys: data.keys ?? data.Keys ?? [] });
        })
        .catch((e) => console.error("Error loading my-services", e));

      fetchAlerts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      {/* Barra de progreso: única señal visible de "hay un proceso corriendo" mientras cambia de pantalla */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-primary/10 overflow-hidden">
          <div className="h-full w-1/3 bg-primary rounded-full animate-[nav-progress_1s_ease-in-out_infinite]" />
          <style>{`
            @keyframes nav-progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(300%); }
            }
          `}</style>
        </div>
      )}

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
            <Link href="/dashboard" onClick={() => handleNavClick("/dashboard")} className={getLinkClass("/dashboard")}>
              <Home size={18} />
              Dashboard
            </Link>
            {canSeeService("documents") && (
              <a href="#" className={getLinkClass("/dashboard/documents")}>
                <FileText size={18} />
                Documentos
              </a>
            )}
            {/* Grupo Administrar */}
            <div>
              <button
                onClick={() => setIsAdminGroupOpen(!isAdminGroupOpen)}
                className={`flex items-center justify-between w-full gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${adminGroupPaths.includes(pathname) ? "text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck size={18} />
                  Administrar
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isAdminGroupOpen ? "rotate-180" : ""}`} />
              </button>
              {isAdminGroupOpen && (
                <div className="flex flex-col gap-1 mt-1 pl-4 border-l border-border/50 ml-4">
                  {hasBroadAccess && canSeeService("tenants") && (
                    <Link href="/dashboard/tenants" onClick={() => handleNavClick("/dashboard/tenants")} className={getLinkClass("/dashboard/tenants")}>
                      <Building size={16} />
                      Administración Empresas
                    </Link>
                  )}
                  {hasBroadAccess && canSeeService("roles") && (
                    <Link href="/dashboard/admin" onClick={() => handleNavClick("/dashboard/admin")} className={getLinkClass("/dashboard/admin")}>
                      <ShieldCheck size={16} />
                      Roles
                    </Link>
                  )}
                  {canSeeUsers && canSeeService("users") && (
                    <Link href="/dashboard/users" onClick={() => handleNavClick("/dashboard/users")} className={getLinkClass("/dashboard/users")}>
                      <UserCog size={16} />
                      Usuarios
                    </Link>
                  )}
                  <Link href="/dashboard/profile" onClick={() => handleNavClick("/dashboard/profile")} className={getLinkClass("/dashboard/profile")}>
                    <UserIcon size={16} />
                    Datos Personales
                  </Link>
                  {hasBroadAccess && canSeeService("services") && (
                    <Link href="/dashboard/services" onClick={() => handleNavClick("/dashboard/services")} className={getLinkClass("/dashboard/services")}>
                      <Briefcase size={16} />
                      Servicios
                    </Link>
                  )}
                  {hasBroadAccess && canSeeService("dashboard-cards") && (
                    <Link href="/dashboard/dashboard-cards" onClick={() => handleNavClick("/dashboard/dashboard-cards")} className={getLinkClass("/dashboard/dashboard-cards")}>
                      <LayoutDashboard size={16} />
                      Tarjetas del Dashboard
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Grupo Seguridad y Salud (SST) */}
            <div>
              <button
                onClick={() => setIsSstGroupOpen(!isSstGroupOpen)}
                className={`flex items-center justify-between w-full gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${sstGroupPaths.includes(pathname) ? "text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                <span className="flex items-center gap-3">
                  <HardHat size={18} />
                  Seguridad y Salud (SST)
                </span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isSstGroupOpen ? "rotate-180" : ""}`} />
              </button>
              {isSstGroupOpen && (
                <div className="flex flex-col gap-1 mt-1 pl-4 border-l border-border/50 ml-4">
                  <Link href="/dashboard/sgsst-diseno" onClick={() => handleNavClick("/dashboard/sgsst-diseno")} className={getLinkClass("/dashboard/sgsst-diseno")}>
                    <ClipboardList size={16} />
                    Diseño e implementación SG-SST (PYME Riesgo 1-3)
                  </Link>
                </div>
              )}
            </div>

            {/* Grupo Desarrollo */}
            {hasBroadAccess && canSeeService("pipeline") && (
              <div>
                <button
                  onClick={() => setIsDevGroupOpen(!isDevGroupOpen)}
                  className={`flex items-center justify-between w-full gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${devGroupPaths.includes(pathname) ? "text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <span className="flex items-center gap-3">
                    <Code2 size={18} />
                    Desarrollo
                  </span>
                  <ChevronDown size={16} className={`transition-transform duration-200 ${isDevGroupOpen ? "rotate-180" : ""}`} />
                </button>
                {isDevGroupOpen && (
                  <div className="flex flex-col gap-1 mt-1 pl-4 border-l border-border/50 ml-4">
                    <Link href="/dashboard/pipeline" onClick={() => handleNavClick("/dashboard/pipeline")} className={getLinkClass("/dashboard/pipeline")}>
                      <GitBranch size={16} />
                      Pipeline CI/CD
                    </Link>
                  </div>
                )}
              </div>
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
          
          <div className="w-full flex-1" />

          <div className="flex items-center gap-4">
            {user?.tenantName && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-border/50 bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground">
                <Building size={14} className="text-primary shrink-0" />
                <span className="max-w-[160px] truncate">{user.tenantName}</span>
              </div>
            )}
            {/* Campana de Alertas */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!isAlertsOpen) fetchAlerts();
                  setIsAlertsOpen(!isAlertsOpen);
                }}
                className="relative p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
                aria-label="Alertas"
              >
                <Bell size={20} />
                {pendingAlertsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">
                    {pendingAlertsCount > 9 ? "9+" : pendingAlertsCount}
                  </span>
                )}
              </button>

              {isAlertsOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsAlertsOpen(false)} />
                  <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-xl z-40 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-semibold text-foreground">Alertas</p>
                      <p className="text-xs text-muted-foreground">{pendingAlertsCount} pendiente{pendingAlertsCount === 1 ? "" : "s"}</p>
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-border/50">
                      {alerts.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-muted-foreground">Sin alertas por ahora.</p>
                      ) : (
                        alerts.map((a) => (
                          <div key={a.id} className={`px-4 py-3 ${a.isAccepted ? "opacity-50" : ""}`}>
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{a.message}</p>
                                <p className="text-[11px] text-muted-foreground/70 mt-1">De {a.senderName} · {new Date(a.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {!a.isAccepted && (
                                  <button
                                    onClick={() => handleAcceptAlert(a.id)}
                                    className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors"
                                    aria-label="Aceptar"
                                  >
                                    <Check size={14} />
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeleteAlert(a.id)}
                                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                                  aria-label="Eliminar"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

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
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted transition-all"
                      onClick={() => {
                        setIsDropdownOpen(false)
                        handleNavClick("/dashboard/profile")
                      }}
                    >
                      <UserIcon size={16} />
                      Mi Perfil
                    </Link>
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
