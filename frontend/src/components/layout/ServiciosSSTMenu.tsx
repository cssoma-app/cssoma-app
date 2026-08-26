"use client"

import { Shield, ShieldAlert, Siren, ClipboardList, Users, Brain, GraduationCap, Car } from "lucide-react"
import { ServiceCatalogMenu, type ServiceCategory, type FeaturedService } from "@/components/layout/ServiceCatalogMenu"

// Único servicio con pantalla propia hoy — el resto se muestra como catálogo informativo.
const LINKED_SERVICES: Record<string, string> = {
  "Diseño e implementación SG-SST PYME": "/dashboard/sgsst-diseno",
}

const CATEGORIES: ServiceCategory[] = [
  {
    key: "sgsst",
    label: "SG-SST",
    icon: Shield,
    colorClass: "bg-blue-500/10 text-blue-500",
    services: [
      "Diseño e implementación SG-SST PYME",
      "Implementación SG-SST",
      "Administración SG-SST",
      "Seguimiento y mejora continua",
      "Diagnóstico inicial y evaluación de estándares mínimos",
      "Actualización documental",
      "Elaboración del plan anual de trabajo",
      "Indicadores de gestión",
    ],
  },
  {
    key: "riesgos",
    label: "Gestión de riesgos",
    icon: ShieldAlert,
    colorClass: "bg-amber-500/10 text-amber-500",
    services: [
      "Matriz de riesgos IPERC",
      "Mapas de riesgos",
      "Análisis de riesgos por oficios",
      "Evaluaciones ergonómicas",
      "Identificación de agentes químicos, físicos y biológicos",
      "Inspecciones planeadas",
      "Programas de tareas críticas",
      "Planes de intervención",
      "Permisos de trabajo",
    ],
  },
  {
    key: "emergencias",
    label: "Accidentes y emergencias",
    icon: Siren,
    colorClass: "bg-red-500/10 text-red-500",
    services: [
      "Investigación de accidentes de trabajo",
      "Plan de emergencia para alturas",
      "Formación de brigadas",
      "Acompañamiento en tareas de alto riesgo",
    ],
  },
  {
    key: "auditoria",
    label: "Auditoría y cumplimiento",
    icon: ClipboardList,
    colorClass: "bg-indigo-500/10 text-indigo-500",
    services: [
      "Auditoría interna de cumplimiento SG-SST",
      "Auditoría",
      "Preparación para visitas del Ministerio de Trabajo",
      "Planes de acción por incumplimientos",
    ],
  },
  {
    key: "personas",
    label: "Gestión de personas y contratistas",
    icon: Users,
    colorClass: "bg-pink-500/10 text-pink-500",
    services: [
      "Gestión de contratistas",
      "Acompañamiento SST",
      "Acompañamiento permanente",
      "Acompañamiento mensual COPASST",
      "Acompañamiento Comité de Convivencia",
    ],
  },
  {
    key: "psicosocial",
    label: "Bienestar y riesgo psicosocial",
    icon: Brain,
    colorClass: "bg-purple-500/10 text-purple-500",
    services: [
      "Programas de bienestar y prevención del estrés",
      "Aplicación de baterías de riesgo psicosocial",
      "Implementación del programa de riesgo psicosocial",
    ],
  },
  {
    key: "capacitacion",
    label: "Capacitación",
    icon: GraduationCap,
    colorClass: "bg-teal-500/10 text-teal-500",
    services: [
      "Capacitaciones",
      "Procedimientos y manuales",
      "Programas específicos",
    ],
  },
  {
    key: "otros",
    label: "Otros sistemas",
    icon: Car,
    colorClass: "bg-slate-500/10 text-slate-500",
    services: [
      "PESV",
      "SGA",
    ],
  },
]

const FEATURED: FeaturedService[] = [
  { label: "Diseño e implementación SG-SST PYME", categoryKey: "sgsst" },
  { label: "Auditoría interna de cumplimiento SG-SST", categoryKey: "auditoria" },
  { label: "Matriz de riesgos IPERC", categoryKey: "riesgos" },
]

export function ServiciosSSTMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <ServiceCatalogMenu
      isOpen={isOpen}
      onClose={onClose}
      title="Servicios SST"
      subtitle="Soluciones de Seguridad y Salud en el Trabajo"
      searchPlaceholder="¿Qué servicio estás buscando?"
      categories={CATEGORIES}
      linkedServices={LINKED_SERVICES}
      featured={FEATURED}
    />
  )
}
