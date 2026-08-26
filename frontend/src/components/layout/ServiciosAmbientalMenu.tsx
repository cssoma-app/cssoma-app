"use client"

import { Leaf, Scale, Recycle, Ruler } from "lucide-react"
import { ServiceCatalogMenu, type ServiceCategory } from "@/components/layout/ServiceCatalogMenu"

const CATEGORIES: ServiceCategory[] = [
  {
    key: "gestion-ambiental",
    label: "Gestión Ambiental",
    icon: Leaf,
    colorClass: "bg-emerald-500/10 text-emerald-500",
    services: [
      "Diagnóstico ambiental inicial (GAP Analysis ISO 14001)",
      "Diseño del sistema de gestión ambiental (ISO 14001)",
      "Plan de manejo ambiental",
      "Matriz de requisitos legales ambientales",
    ],
  },
  {
    key: "cumplimiento-ambiental",
    label: "Cumplimiento Ambiental",
    icon: Scale,
    colorClass: "bg-lime-500/10 text-lime-600",
    services: [
      "Auditoría interna ambiental ISO 14001",
      "Autorizaciones ambientales",
      "Permisos ambientales",
      "Trámites ambientales",
    ],
  },
  {
    key: "gestion-residuos",
    label: "Gestión de Residuos",
    icon: Recycle,
    colorClass: "bg-green-500/10 text-green-600",
    services: [
      "Plan de manejo de residuos sólidos (PMRS)",
    ],
  },
  {
    key: "evaluacion-mediciones",
    label: "Evaluación y Mediciones",
    icon: Ruler,
    colorClass: "bg-teal-500/10 text-teal-500",
    services: [
      "Matriz de compatibilidad (riesgo químico)",
      "Mediciones ambientales",
    ],
  },
]

export function ServiciosAmbientalMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <ServiceCatalogMenu
      isOpen={isOpen}
      onClose={onClose}
      title="Ingeniería Ambiental"
      subtitle="Servicios especializados en gestión y cumplimiento ambiental."
      searchPlaceholder="Buscar servicio..."
      categories={CATEGORIES}
    />
  )
}
