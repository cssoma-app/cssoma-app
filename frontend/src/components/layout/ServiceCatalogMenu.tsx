"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, X, ChevronLeft, ArrowRight, Circle, type LucideIcon } from "lucide-react"

export interface ServiceCategory {
  key: string
  label: string
  icon: LucideIcon
  colorClass: string
  services: string[]
}

export interface FeaturedService {
  label: string
  categoryKey: string
}

interface ServiceCatalogMenuProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle: string
  searchPlaceholder: string
  categories: ServiceCategory[]
  linkedServices?: Record<string, string>
  featured?: FeaturedService[]
}

export function ServiceCatalogMenu({
  isOpen,
  onClose,
  title,
  subtitle,
  searchPlaceholder,
  categories,
  linkedServices = {},
  featured = [],
}: ServiceCatalogMenuProps) {
  const [search, setSearch] = useState("")
  const [activeCategoryKey, setActiveCategoryKey] = useState<string | null>(null)

  const activeCategory = categories.find((c) => c.key === activeCategoryKey) ?? null

  const searchResults = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return null
    return categories.flatMap((c) =>
      c.services
        .filter((s) => s.toLowerCase().includes(term))
        .map((s) => ({ service: s, category: c }))
    )
  }, [search, categories])

  const close = () => {
    onClose()
    setSearch("")
    setActiveCategoryKey(null)
  }

  const openCategory = (key: string) => {
    setSearch("")
    setActiveCategoryKey(key)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-3xl my-auto rounded-3xl border border-border/50 bg-background shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-border/50 relative">
          <button
            onClick={close}
            aria-label="Cerrar"
            className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={18} />
          </button>

          {activeCategory ? (
            <button
              onClick={() => setActiveCategoryKey(null)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ChevronLeft size={16} />
              Volver a categorías
            </button>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            </>
          )}

          {activeCategory ? (
            <div className="flex items-center gap-3 mt-1">
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${activeCategory.colorClass}`}>
                <activeCategory.icon size={22} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">{activeCategory.label}</h3>
                <p className="text-xs text-muted-foreground">{activeCategory.services.length} servicios</p>
              </div>
            </div>
          ) : (
            <div className="relative mt-5">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-border/50 bg-muted/40 pl-11 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
          {activeCategory ? (
            <ul className="flex flex-col gap-1">
              {activeCategory.services.map((service) => {
                const href = linkedServices[service]
                const rowContent = (
                  <>
                    <Circle size={6} className={`shrink-0 fill-current ${activeCategory.colorClass.split(" ")[1]}`} />
                    <span className="flex-1">{service}</span>
                    {!href && (
                      <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70 bg-muted px-2 py-0.5 rounded-full shrink-0">
                        Próximamente
                      </span>
                    )}
                  </>
                )
                return (
                  <li key={service}>
                    {href ? (
                      <Link
                        href={href}
                        onClick={close}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-foreground hover:bg-muted transition-all"
                      >
                        {rowContent}
                        <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground">
                        {rowContent}
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : searchResults ? (
            searchResults.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">Sin resultados para &quot;{search}&quot;.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {searchResults.map(({ service, category }) => (
                  <li key={service}>
                    <button
                      onClick={() => openCategory(category.key)}
                      className="flex items-center gap-3 w-full rounded-xl px-4 py-3 text-sm text-left text-foreground hover:bg-muted transition-all"
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${category.colorClass}`}>
                        <category.icon size={16} />
                      </div>
                      <span className="flex-1">{service}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{category.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Categorías</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => openCategory(c.key)}
                    className="flex flex-col items-start gap-3 rounded-2xl border border-border/50 p-4 text-left hover:border-primary/40 hover:bg-muted/40 transition-all"
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${c.colorClass}`}>
                      <c.icon size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-tight">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.services.length} servicios</p>
                    </div>
                  </button>
                ))}
              </div>

              {featured.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-7 mb-3">Servicios destacados</p>
                  <ul className="flex flex-col gap-1">
                    {featured.map((f) => (
                      <li key={f.label}>
                        {linkedServices[f.label] ? (
                          <Link
                            href={linkedServices[f.label]}
                            onClick={close}
                            className="flex items-center justify-between rounded-xl px-4 py-3 text-sm text-foreground hover:bg-muted transition-all"
                          >
                            {f.label}
                            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                          </Link>
                        ) : (
                          <button
                            onClick={() => openCategory(f.categoryKey)}
                            className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-sm text-left text-foreground hover:bg-muted transition-all"
                          >
                            {f.label}
                            <ArrowRight size={14} className="text-muted-foreground shrink-0" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
