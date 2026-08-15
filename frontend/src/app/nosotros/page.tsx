import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { WhatsAppButton } from "@/components/layout/WhatsAppButton"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { SiteFooter } from "@/components/layout/SiteFooter"
import { Target, Rocket, Sparkles, Cpu, TrendingUp, Users, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Nosotros | SSTerra Consultores",
  description: "Misión y visión de SSTerra Consultores: consultoría en SST y Medio Ambiente potenciada con inteligencia artificial para PYMES.",
}

export default function NosotrosPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 font-sans relative">
      <WhatsAppButton />
      <SiteHeader />

      <main className="flex-1">

        {/* Hero */}
        <section className="relative py-24 lg:py-36 overflow-hidden border-b border-border/50">
          <div className="absolute inset-0 z-0">
            <Image src="/sst_login_bg.png" alt="" fill priority className="object-cover opacity-60 dark:opacity-35" />
            <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/40 to-background"></div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-primary/15 blur-[140px] rounded-full opacity-60 dark:opacity-20 pointer-events-none z-0"></div>

          <div className="container mx-auto px-6 relative z-10 text-center">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8">
              <Users className="h-4 w-4 mr-2" />
              Quiénes somos
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              El aliado estratégico de las PYMES en SST y Medio Ambiente
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              Consultoría técnica humana, potenciada con software propio.
            </p>
          </div>
        </section>

        {/* Misión */}
        <section id="mision" className="py-24 sm:py-32 scroll-mt-24">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="order-2 lg:order-1">
                <span className="text-orange-500 font-semibold uppercase tracking-wider text-sm mb-4 block">Propósito</span>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">Misión</h2>
                <p className="text-xl text-muted-foreground font-light leading-relaxed text-justify">
                  En <strong className="text-foreground">SSTerra Consultores</strong> ofrecemos servicios especializados de consultoría, auditoría y asesoría técnica en Seguridad, Salud en el Trabajo y Medio Ambiente. Respaldados por software de desarrollo propio y expertos en tecnología, integramos la <strong className="text-foreground">Inteligencia Artificial</strong> como una aliada estratégica para facilitar a las PYMES la implementación de sistemas de gestión ágiles, adaptados a su escala, orientados a la mejora continua y al control inteligente de riesgos.
                </p>
              </div>

              <div className="order-1 lg:order-2 relative">
                <div className="rounded-[2.5rem] border border-border/50 shadow-xl relative overflow-hidden aspect-square">
                  <Image src="/nosotros-mision.jpg" alt="Consultor de SSTerra presentando el dashboard de gestión SST a un equipo de trabajo" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-orange-950/70 via-orange-950/5 to-transparent"></div>
                  <div className="absolute top-6 right-6 h-14 w-14 rounded-2xl bg-background/90 backdrop-blur-xl border border-border/50 flex items-center justify-center text-orange-500 shadow-lg">
                    <Target size={26} />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl bg-background/90 backdrop-blur-xl border border-border/50 px-5 py-4 shadow-lg">
                    <div className="h-11 w-11 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0"><Cpu size={20} /></div>
                    <div>
                      <p className="font-bold leading-tight">Gestión ágil y a la medida</p>
                      <p className="text-xs text-muted-foreground">Tecnología propia + IA aplicada</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Visión */}
        <section id="vision" className="py-24 sm:py-32 bg-muted/30 border-y border-border/50 scroll-mt-24">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
              <div className="relative">
                <div className="rounded-[2.5rem] border border-border/50 shadow-xl relative overflow-hidden aspect-square">
                  <Image src="/nosotros-vision.jpg" alt="Consultor de SSTerra proyectando el futuro de la gestión SST y medio ambiente" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/70 via-emerald-950/5 to-transparent"></div>
                  <div className="absolute top-6 right-6 h-14 w-14 rounded-2xl bg-background/90 backdrop-blur-xl border border-border/50 flex items-center justify-center text-emerald-500 shadow-lg">
                    <Rocket size={26} />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl bg-background/90 backdrop-blur-xl border border-border/50 px-5 py-4 shadow-lg">
                    <div className="shrink-0">
                      <p className="text-2xl font-extrabold text-emerald-500 leading-none">2031</p>
                    </div>
                    <div className="border-l border-border/50 pl-3">
                      <p className="font-bold leading-tight">Horizonte estratégico</p>
                      <p className="text-xs text-muted-foreground">Aliado preferido de las PYMES</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-emerald-500 font-semibold uppercase tracking-wider text-sm mb-4 block">Horizonte 2031</span>
                <h2 className="text-4xl sm:text-5xl font-bold tracking-tight mb-8">Visión</h2>
                <p className="text-xl text-muted-foreground font-light leading-relaxed text-justify">
                  En el <strong className="text-foreground">2031</strong>, SSTerra Consultores será reconocida como el aliado estratégico preferido por las PYMES para la transición hacia una gestión de SST y medio ambiente inteligente. Nos proyectamos como una empresa de vanguardia que combina la excelencia técnica humana con herramientas de IA y tecnología propia, facilitando la toma de decisiones preventivas y maximizando la productividad de nuestros clientes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values strip */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-8 max-w-5xl mx-auto text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><TrendingUp size={26} /></div>
                <h3 className="font-bold text-lg">Mejora continua</h3>
                <p className="text-sm text-muted-foreground font-light">Sistemas de gestión que evolucionan con tu empresa, no informes que quedan en un cajón.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Sparkles size={26} /></div>
                <h3 className="font-bold text-lg">IA agentica</h3>
                <p className="text-sm text-muted-foreground font-light">Automatizamos el control de riesgos y el cumplimiento sin perder el criterio experto humano.</p>
              </div>
              <div className="flex flex-col items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><Users size={26} /></div>
                <h3 className="font-bold text-lg">Hechos a la medida de la PYME</h3>
                <p className="text-sm text-muted-foreground font-light">Soluciones ágiles y escalables, adaptadas al tamaño y presupuesto real de tu empresa.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-muted/30 border-t border-border/50 text-center">
          <div className="container mx-auto px-6 max-w-3xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">¿Listo para dar el siguiente paso?</h2>
            <p className="text-lg text-muted-foreground font-light leading-relaxed mb-10">
              Conocé nuestro portafolio de servicios o escribinos directamente por WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/#servicios" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-primary-foreground shadow-xl shadow-primary/25 hover:bg-primary/90 hover:-translate-y-1 transition-all duration-300">
                Ver Portafolio de Servicios <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <a href="tel:+573108465617" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border border-border px-8 py-4 text-base font-semibold hover:bg-muted transition-all">
                Llámanos al +57 310 8465617
              </a>
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  )
}
