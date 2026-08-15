"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Menu, X } from "lucide-react"

export function SiteHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl transition-all">
      <div className="container mx-auto px-4 sm:px-6 h-24 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logocsoma.png" alt="CSOMA Logo" width={220} height={60} className="object-contain" priority />
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-base font-medium text-muted-foreground">
          <Link href="/#servicios" className="hover:text-primary transition-colors">Consultoría</Link>
          <span className="h-5 w-[2px] bg-foreground/20 rounded-full"></span>
          <Link href="/#software" className="hover:text-primary transition-colors">Software SST</Link>
          <span className="h-5 w-[2px] bg-foreground/20 rounded-full"></span>
          <Link href="/#nosotros" className="hover:text-primary transition-colors">Enfoque PYMES</Link>
        </nav>

        <div className="hidden lg:flex items-center gap-5">
          <ThemeToggle />
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

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-24 left-0 w-full border-b border-border/40 bg-background/95 backdrop-blur-xl shadow-xl flex flex-col p-6 gap-6 animate-fade-in-up">
          <Link href="/#servicios" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Consultoría</Link>
          <Link href="/#software" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Software SST</Link>
          <Link href="/#nosotros" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Enfoque PYMES</Link>
          <Link href="/login" className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg">
            Portal Clientes
          </Link>
        </div>
      )}
    </header>
  )
}
