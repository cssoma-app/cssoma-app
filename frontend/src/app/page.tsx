import Image from "next/image"
import Link from "next/link"
import { WhatsAppButton } from "@/components/layout/WhatsAppButton"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { SiteFooter } from "@/components/layout/SiteFooter"
import { ArrowRight, ShieldCheck, Zap, HardHat, Globe2, ClipboardCheck, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 font-sans relative">
      <WhatsAppButton />
      <SiteHeader />

      <main className="flex-1">
        
        {/* 2. Hero Section */}
        <section className="relative pt-12 pb-32 lg:pt-20 lg:pb-48 overflow-hidden">
          {/* Video Background */}
          <div className="absolute inset-0 z-0">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover opacity-65 dark:opacity-40 pointer-events-none"
            >
              <source src="/videoProm.mp4" type="video/mp4" />
            </video>
            {/* Gradient Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/50 to-background"></div>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/20 blur-[140px] rounded-full opacity-50 dark:opacity-20 pointer-events-none z-0"></div>
          
          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-10 animate-fade-in-up">
              <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              Especialistas en la Normatividad de Colombia
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 max-w-5xl mx-auto leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              Consultoría & Software de <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-400">SST y Medio Ambiente</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Implementamos Sistemas de Gestión bajo estándares <strong>ISO 45001</strong> e <strong>ISO 14001</strong>, y te entregamos una plataforma digital para automatizar el cumplimiento (Res 0312 de 2019).
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <a href="https://wa.me/573108465617?text=Hola,%20quisiera%20solicitar%20un%20diagnóstico%20inicial" target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300">
                Agenda un Diagnóstico Inicial <ArrowRight className="ml-3 h-5 w-5" />
              </a>
            </div>
          </div>
        </section>

        {/* 3. Consulting Services Section */}
        <section id="servicios" className="py-24 sm:py-32 bg-muted/30 border-y border-border/50 relative">
          <div className="container mx-auto px-6">
            <div className="text-center mb-20">
              <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6">Nuestro Portafolio de Servicios</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                Expertos en normatividad técnica y legal para proteger a tu equipo y optimizar tus procesos operativos.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* SST */}
              <div className="rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-xl p-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
                <div className="flex items-center mb-8 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mr-6">
                    <HardHat size={32} strokeWidth={2} />
                  </div>
                  <h3 className="text-3xl font-bold">Seguridad y Salud (SST)</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground relative z-10 font-light">
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Diseño e implementación SG-SST </span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Diseño e implementación SG-SST (Empresa Riesgo 4-5)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Auditoría interna de cumplimiento SG-SST</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Elaboración y actualización de matriz de riesgos IPERC</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Investigación de accidentes de trabajo</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Acompañamiento SST</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Acompañamiento en tareas de alto riesgo (trabajos en caliente, alturas, espacios confinados, izaje)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Implementación SG-SST</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>PESV (Plan Estratégico de Seguridad Vial)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>SGA (Sistema Globalmente Armonizado)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Capacitaciones</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Administración SG-SST</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Seguimiento y mejora continua del SG-SST</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Preparación para visitas del Ministerio de Trabajo</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Elaboración de planes de acción por incumplimientos</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Identificación de agentes químicos, físicos y biológicos, y coordinación de mediciones ambientales con laboratorios acreditados e interpretación de resultados</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Planes de intervención</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Procedimientos y manuales</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Programas de tareas críticas</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Permisos de trabajo</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Plan de emergencia para alturas</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Formación de brigadas</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Mapas de riesgos</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Análisis de riesgos por oficios</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Inspecciones planeadas</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Elaboración del plan anual de trabajo</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Indicadores de gestión</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Programas específicos</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Acompañamiento permanente mediante planes mensuales, anuales y por horas</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Programas de bienestar y prevención del estrés</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Aplicación de baterías de riesgo psicosocial</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Implementación del programa de riesgo psicosocial</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Gestión de contratistas</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Evaluaciones ergonómicas</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Actualización documental</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Auditoría</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Diagnóstico inicial y evaluación de estándares mínimos</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-orange-500 shrink-0" /> <span>Acompañamiento mensual COPASST / Comité de Convivencia</span></li>
                </ul>
              </div>

              {/* Ambiental */}
              <div className="rounded-[2rem] border border-border/50 bg-background/50 backdrop-blur-xl p-10 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="flex items-center mb-8 relative z-10">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mr-6">
                    <Globe2 size={32} strokeWidth={2} />
                  </div>
                  <h3 className="text-3xl font-bold">Ingeniería Ambiental</h3>
                </div>
                <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground relative z-10 font-light">
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Diagnóstico ambiental inicial (GAP Analysis ISO 14001)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Diseño del sistema de gestión ambiental (ISO 14001)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Matriz de requisitos legales ambientales</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Plan de manejo de residuos sólidos (PMRS)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Auditoría interna ambiental ISO 14001</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Plan de manejo ambiental</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Autorizaciones ambientales</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Permisos ambientales</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Trámites ambientales</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Matriz de compatibilidad (riesgo químico)</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-2 h-4 w-4 mt-0.5 text-emerald-500 shrink-0" /> <span>Mediciones ambientales</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Software Section */}
        <section id="software" className="py-24 sm:py-32 relative">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16 max-w-7xl mx-auto">
              <div className="lg:w-1/2">
                <span className="text-primary font-semibold uppercase tracking-wider text-sm mb-4 block">Gestión Tecnológica</span>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">Software Integrado de SST y Medio Ambiente</h2>
                <p className="text-xl text-muted-foreground font-light leading-relaxed mb-10">
                  Lleva tu sistema de gestión al siguiente nivel con nuestra plataforma digital diseñada exclusivamente para nuestros clientes. Centraliza la información y toma decisiones basadas en datos.
                </p>
                <div className="space-y-6 mb-12">
                  <div className="flex items-start">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mr-5 shrink-0">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">Importación Automática</h4>
                      <p className="text-muted-foreground">Arrastra tus históricos y estructuramos la información por ti.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mr-5 shrink-0">
                      <ShieldCheck size={24} />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold mb-1">Semáforo de Cumplimiento</h4>
                      <p className="text-muted-foreground">Alertas de colores para documentos vencidos (Resolución 0312).</p>
                    </div>
                  </div>
                </div>
                <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-primary px-10 py-5 text-lg font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 transition-all hover:scale-105">
                  Ingresar al Portal Web
                </Link>
              </div>
              <div className="lg:w-1/2 w-full">
                <div className="rounded-3xl overflow-hidden shadow-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <Image
                    src="/gestiontecnologica.png"
                    alt="Dashboard de gestión SSTMA mostrando cumplimiento general, semáforo de cumplimiento y documentos vencidos, en laptop y móvil"
                    width={1536}
                    height={1024}
                    className="w-full h-auto"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 5. SMEs Section */}
        <section id="nosotros" className="py-24 bg-muted/30 border-t border-border/50 relative">
          <div className="container mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16 max-w-7xl mx-auto">
              <div className="lg:w-1/2 w-full">
                <div className="rounded-3xl overflow-hidden shadow-2xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                  <Image
                    src="/pyme.jpg"
                    alt="Equipo de una PYME trabajando con equipo de protección personal en un taller industrial"
                    width={1408}
                    height={768}
                    className="w-full h-auto"
                    sizes="(min-width: 1024px) 50vw, 100vw"
                  />
                </div>
              </div>
              <div className="lg:w-1/2 text-center lg:text-left">
                <ClipboardCheck size={48} className="mx-auto lg:mx-0 text-primary mb-8" />
                <h2 className="text-4xl font-bold tracking-tight mb-6">Enfocados en el éxito de las PYMES</h2>
                <p className="text-xl text-muted-foreground font-light leading-relaxed mb-10 text-justify">
                  Sabemos que las pequeñas y medianas empresas enfrentan retos únicos. Ofrecemos soluciones prácticas, escalables y económicamente viables para que cumplas con la normatividad colombiana sin afectar tu productividad.
                </p>
                <a href="tel:+573108465617" className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-10 py-5 text-lg font-semibold shadow-xl hover:scale-105 transition-all">
                  Llámanos al +57 310 8465617
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
