"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/ThemeToggle"
import { ArrowRight, ShieldCheck, Zap, Mail, ChevronDown, Menu, X, HardHat, Globe2, ClipboardCheck, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 font-sans relative">
      
      {/* WhatsApp Floating Button */}
      <a href="https://wa.me/573108465617?text=Hola,%20quisiera%20solicitar%20información%20sobre%20el%20software%20SST" 
         target="_blank" 
         rel="noopener noreferrer" 
         className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-2xl z-50 hover:bg-[#20ba5a] hover:scale-110 transition-all duration-300 flex items-center justify-center w-14 h-14 group"
         aria-label="Contactar por WhatsApp">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
      </a>

      {/* 1. Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
        <div className="container mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logocsoma.png" alt="CSOMA Logo" width={220} height={60} className="object-contain" priority />
          </div>
          
          <nav className="hidden lg:flex items-center gap-6 text-base font-medium text-muted-foreground">
            <a href="#servicios" className="hover:text-primary transition-colors">Consultoría</a>
            <span className="h-5 w-[2px] bg-foreground/20 rounded-full"></span>
            <a href="#software" className="hover:text-primary transition-colors">Software SST</a>
            <span className="h-5 w-[2px] bg-foreground/20 rounded-full"></span>
            <a href="#nosotros" className="hover:text-primary transition-colors">Enfoque PYMES</a>
          </nav>
          
          <div className="hidden lg:flex items-center gap-5">
            <ThemeToggle />
            <Link href="/login" className="text-base font-medium hover:text-primary transition-colors">
              Iniciar Sesión
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105">
              Portal Clientes
            </Link>
          </div>

          <div className="flex lg:hidden items-center gap-4">
            <ThemeToggle />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-foreground hover:bg-muted rounded-md transition-colors"
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-24 left-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl shadow-xl flex flex-col p-6 gap-6 animate-fade-in-up">
            <a href="#servicios" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Consultoría</a>
            <a href="#software" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Software SST</a>
            <a href="#nosotros" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Enfoque PYMES</a>
            <div className="h-px w-full bg-border/50"></div>
            <Link href="/login" className="text-lg font-medium text-center w-full py-2">
              Iniciar Sesión
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg">
              Portal Clientes
            </Link>
          </div>
        )}
      </header>

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
              className="w-full h-full object-cover opacity-30 dark:opacity-40 pointer-events-none"
            >
              <source src="/videoProm.mp4" type="video/mp4" />
            </video>
            {/* Gradient Overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background"></div>
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
              <a href="#software" className="w-full sm:w-auto inline-flex items-center justify-center rounded-full border-2 border-input bg-transparent px-10 py-5 text-lg font-semibold hover:bg-accent hover:text-accent-foreground transition-all duration-300">
                Ver Software
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
                <ul className="space-y-4 text-lg text-muted-foreground relative z-10 font-light">
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-orange-500 shrink-0" /> <span><strong>SG-SST:</strong> Diagnóstico inicial, diseño, implementación y auditoría (Res 0312).</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-orange-500 shrink-0" /> <span><strong>PESV:</strong> Plan Estratégico de Seguridad Vial.</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-orange-500 shrink-0" /> <span><strong>SGA Químico:</strong> Sistema Globalmente Armonizado.</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-orange-500 shrink-0" /> <span><strong>Tareas Críticas:</strong> Alturas, espacios confinados e izaje de cargas.</span></li>
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
                <ul className="space-y-4 text-lg text-muted-foreground relative z-10 font-light">
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-emerald-500 shrink-0" /> <span><strong>SG Ambiental:</strong> Diseño bajo el ciclo PHVA.</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-emerald-500 shrink-0" /> <span><strong>Permisos Ambientales:</strong> Licencias, vertimientos y emisiones.</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-emerald-500 shrink-0" /> <span><strong>ISO 14001:</strong> Implementación y auditorías internas.</span></li>
                  <li className="flex items-start"><CheckCircle2 className="mr-3 h-6 w-6 text-emerald-500 shrink-0" /> <span><strong>Auditorías Internas:</strong> ISO 17020 (laboratorios) e ISO 19011.</span></li>
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
                      <p className="text-muted-foreground">Arrastra tus Excels históricos y estructuramos la información por ti.</p>
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
                {/* Visual Mockup Dashboard representation */}
                <div className="rounded-3xl border border-border/50 bg-background/50 p-6 shadow-2xl backdrop-blur-xl transform rotate-1 hover:rotate-0 transition-transform duration-500">
                  <div className="flex space-x-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm border-l-4 border-l-emerald-500">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Cumplimiento Ambiental</p>
                      <p className="text-3xl font-bold">92%</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-4">
                        <div className="bg-emerald-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm border-l-4 border-l-orange-500">
                      <p className="text-sm text-muted-foreground mb-2 font-medium">Incidentabilidad SST</p>
                      <p className="text-3xl font-bold">1.2%</p>
                      <div className="w-full bg-muted rounded-full h-2 mt-4">
                        <div className="bg-orange-500 h-2 rounded-full" style={{width: '12%'}}></div>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-background p-6 shadow-sm">
                    <p className="text-sm text-muted-foreground mb-4 font-medium">Tareas Críticas Evaluadas</p>
                    <div className="flex items-end space-x-4 h-32 w-full">
                      <div className="w-1/4 bg-primary/20 rounded-t-lg" style={{height: '40%'}}></div>
                      <div className="w-1/4 bg-primary/40 rounded-t-lg" style={{height: '70%'}}></div>
                      <div className="w-1/4 bg-primary/60 rounded-t-lg" style={{height: '50%'}}></div>
                      <div className="w-1/4 bg-primary rounded-t-lg" style={{height: '90%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* 5. SMEs Section */}
        <section id="nosotros" className="py-24 bg-muted/30 border-t border-border/50 text-center relative">
          <div className="container mx-auto px-6 max-w-4xl">
            <ClipboardCheck size={48} className="mx-auto text-primary mb-8" />
            <h2 className="text-4xl font-bold tracking-tight mb-6">Enfocados en el éxito de las PYMES</h2>
            <p className="text-xl text-muted-foreground font-light leading-relaxed mb-10">
              Sabemos que las pequeñas y medianas empresas enfrentan retos únicos. Ofrecemos soluciones prácticas, escalables y económicamente viables para que cumplas con la normatividad colombiana sin afectar tu productividad.
            </p>
            <a href="tel:+573108465617" className="inline-flex items-center justify-center rounded-full bg-foreground text-background px-10 py-5 text-lg font-semibold shadow-xl hover:scale-105 transition-all">
              Llámanos al +57 310 8465617
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            {/* Logo and About */}
            <div className="flex flex-col gap-6">
              <Image src="/logocsoma.png" alt="CSOMA Logo" width={180} height={50} className="object-contain grayscale hover:grayscale-0 transition-all" />
              <p className="text-sm text-muted-foreground font-light leading-relaxed">
                Consultoría experta en SST y Medio Ambiente, respaldada por tecnología de punta para automatizar el cumplimiento legal de tu empresa.
              </p>
              {/* Social Icons (Inline SVGs) */}
              <div className="flex items-center gap-4 text-muted-foreground">
                <a href="#" className="hover:text-primary transition-colors" aria-label="Facebook">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="hover:text-primary transition-colors" aria-label="Twitter">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                </a>
                <a href="#" className="hover:text-primary transition-colors" aria-label="Instagram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="#" className="hover:text-primary transition-colors" aria-label="LinkedIn">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
              </div>
            </div>

            {/* Nosotros */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Nosotros</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-light">
                <li><a href="#" className="hover:text-primary transition-colors">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Nuestra Misión</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Nuestra Visión</a></li>
                <li><a href="#servicios" className="hover:text-primary transition-colors">Portafolio de Servicios</a></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Legal y Normativa</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-light">
                <li><a href="#" className="hover:text-primary transition-colors">Políticas de Privacidad</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Términos y Condiciones</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Política de Cookies</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Tratamiento de Datos</a></li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h4 className="font-bold mb-6 text-lg">Contacto</h4>
              <ul className="space-y-4 text-sm text-muted-foreground font-light">
                <li className="flex items-center gap-3">
                  <span className="font-medium text-foreground">WhatsApp:</span> 
                  <a href="https://wa.me/573108465617" target="_blank" rel="noopener noreferrer" className="hover:text-[#25D366] transition-colors">(+57) 310 8465617</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-medium text-foreground">Email:</span> 
                  <a href="mailto:contacto@csoma.com.co" className="hover:text-primary transition-colors">contacto@csoma.com.co</a>
                </li>
                <li className="flex items-center gap-3">
                  <span className="font-medium text-foreground">Sede:</span> 
                  <span>Bogotá, Colombia</span>
                </li>
              </ul>
            </div>
            
          </div>
          
          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground font-light flex flex-col md:flex-row justify-between items-center gap-4">
            <p>&copy; {new Date().getFullYear()} CSOMA Consultores SAS. Todos los derechos reservados.</p>
            <p>Diseñado con tecnología y precisión.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
