import Link from "next/link"
import { WhatsAppButton } from "@/components/layout/WhatsAppButton"
import { SiteHeader } from "@/components/layout/SiteHeader"
import { SiteFooter } from "@/components/layout/SiteFooter"
import { ArrowLeft } from "lucide-react"

const legalLinks = [
  { href: "/legal/privacidad", label: "Políticas de Privacidad" },
  { href: "/legal/terminos", label: "Términos y Condiciones" },
  { href: "/legal/cookies", label: "Política de Cookies" },
  { href: "/legal/tratamiento-datos", label: "Tratamiento de Datos" },
]

export function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-hidden selection:bg-primary/20 font-sans relative">
      <WhatsAppButton />
      <SiteHeader />

      <main className="flex-1">
        <section className="py-16 sm:py-20 border-b border-border/50 bg-muted/30">
          <div className="container mx-auto px-6 max-w-3xl">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-8">
              <ArrowLeft size={16} /> Volver al inicio
            </Link>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">{title}</h1>
            <p className="text-sm text-muted-foreground">Última actualización: {updatedAt}</p>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-6 max-w-3xl">
            <div className="space-y-10 text-muted-foreground font-light leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-4 [&_h2]:tracking-tight [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:mb-4 [&_strong]:text-foreground [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2">
              {children}
            </div>

            <div className="mt-16 pt-8 border-t border-border/50">
              <p className="text-sm font-medium text-foreground mb-4">Otros documentos legales</p>
              <div className="flex flex-wrap gap-3">
                {legalLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-sm rounded-full border border-border/50 px-4 py-2 hover:bg-muted hover:text-primary transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
