import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { ShieldCheck, AlertTriangle, Users, TrendingUp } from "lucide-react"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Welcome Banner */}
      <div className="mb-8 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/5 to-background border border-primary/20 shadow-lg shadow-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">¡Hola, Juan! 👋</h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl">
          El nivel de riesgo de la empresa ha disminuido un 4% esta semana. 
          Tienes <span className="text-destructive font-semibold">3 documentos</span> que requieren tu revisión inmediata.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* Card 1 */}
        <div className="group relative rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
          <div className="flex flex-row items-center justify-between space-y-0 mb-4">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Cumplimiento General</h3>
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <ShieldCheck size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-emerald-500 to-emerald-700 dark:to-emerald-400">94.2%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp size={12} className="text-emerald-500" />
              <span className="text-emerald-500 font-medium">+2%</span> vs mes anterior
            </p>
          </div>
        </div>
        
        {/* Card 2 */}
        <div className="group relative rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md hover:border-destructive/30 transition-all duration-300">
          <div className="flex flex-row items-center justify-between space-y-0 mb-4">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Alertas Críticas</h3>
            <div className="p-2 bg-destructive/10 text-destructive rounded-lg group-hover:scale-110 group-hover:bg-destructive group-hover:text-white transition-all">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-3xl font-bold text-destructive">3</div>
            <p className="text-xs text-muted-foreground">Documentos vencidos</p>
          </div>
        </div>
        
        {/* Card 3 */}
        <div className="group relative rounded-2xl border border-border/50 bg-background/50 backdrop-blur-sm p-6 shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all duration-300">
          <div className="flex flex-row items-center justify-between space-y-0 mb-4">
            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Plantilla Capacitada</h3>
            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all">
              <Users size={20} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-3xl font-bold">128</div>
            <p className="text-xs text-muted-foreground">85% del total de empleados</p>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-border/50 bg-background/40">
          <h3 className="text-lg font-semibold tracking-tight">Actividad de Inspecciones</h3>
          <p className="text-sm text-muted-foreground mt-1">Evolución del nivel de riesgo en las últimas 4 semanas.</p>
        </div>
        <div className="p-8">
          <div className="h-[250px] w-full rounded-xl bg-gradient-to-b from-muted/30 to-transparent border border-dashed border-border/60 flex flex-col items-center justify-center gap-3 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <TrendingUp size={24} className="text-primary" />
            </div>
            <p className="text-muted-foreground font-medium text-sm">El gráfico analítico interactivo se renderizará aquí</p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
