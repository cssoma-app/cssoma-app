"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { useNotification } from "@/context/NotificationContext"
import {
  Target, Hammer, Search, RefreshCw, FolderArchive, Construction, ChevronDown,
  UserCog, GraduationCap, Layers, AlertTriangle, Table, Wallet, ShieldCheck, Users, Handshake,
  Calendar, Upload, Check, Ban, ClipboardList, UserPlus, Monitor,
  ScrollText, ClipboardCheck, CalendarCheck, Archive, Presentation, MessageSquare, ShoppingCart, Building2,
  BookOpen, ListOrdered, HeartPulse, Siren, AlertOctagon, Briefcase,
  FileText, HardHat, Stethoscope, Lock, Leaf, Droplet, Wrench, Settings, Activity, Megaphone,
} from "lucide-react"

type PhvaTab = "planear" | "hacer" | "verificar" | "actuar" | "registros"
type FieldType = "text" | "textarea" | "date" | "number" | "select" | "file"

interface ItemField {
  key: string
  label: string
  type: FieldType
  required?: boolean
  placeholder?: string
  options?: string[]
}

interface RecursoItem {
  label: string
  icon: typeof UserCog
  fields: ItemField[]
}

interface SubTabGroup {
  key: string
  label: string
  icon: typeof UserCog
  items: RecursoItem[]
}

const TABS: { key: PhvaTab; label: string; icon: typeof Target; description: string }[] = [
  { key: "planear", label: "Planear", icon: Target, description: "Diagnóstico inicial, política y objetivos del SG-SST, y planificación de las actividades para cumplir con la Resolución 0312 de 2019." },
  { key: "hacer", label: "Hacer", icon: Hammer, description: "Ejecución de lo planificado: capacitaciones, gestión de peligros y riesgos, y demás actividades del plan de trabajo anual." },
  { key: "verificar", label: "Verificar", icon: Search, description: "Auditoría e inspección del SG-SST, y revisión por la alta dirección de los resultados obtenidos." },
  { key: "actuar", label: "Actuar", icon: RefreshCw, description: "Acciones preventivas y correctivas para la mejora continua del sistema, con base en lo verificado." },
  { key: "registros", label: "Registros y Evidencias", icon: FolderArchive, description: "Documentos, soportes y evidencias que respaldan el cumplimiento de cada fase del ciclo PHVA." },
]

const ROL_COMITE_OPTIONS = ["Presidente", "Secretario", "Miembro"]
const SOPORTE_FIELD: ItemField = { key: "soporte", label: "Documento Soporte (opcional)", type: "file" }
const SOPORTE_REQUERIDO_FIELD: ItemField = { key: "soporte", label: "Documento Soporte", type: "file", required: true }
const OBSERVACIONES_FIELD: ItemField = { key: "observaciones", label: "Observaciones (opcional)", type: "textarea" }

const RECURSOS_ITEMS: RecursoItem[] = [
  {
    label: "Designación del responsable del SG-SST",
    icon: UserCog,
    fields: [
      { key: "responsable", label: "Nombre del Responsable", type: "text", required: true },
      { key: "cargo", label: "Cargo", type: "text", required: true },
      { key: "fecha", label: "Fecha de Designación", type: "date", required: true },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Matriz de responsabilidades y roles SST",
    icon: Table,
    fields: [
      { key: "cargo", label: "Cargo / Rol", type: "text", required: true },
      { key: "responsabilidad", label: "Responsabilidad SST", type: "textarea", required: true },
      { key: "area", label: "Área (opcional)", type: "text" },
    ],
  },
  {
    label: "Presupuesto y asignación de recursos SG-SST",
    icon: Wallet,
    fields: [
      { key: "concepto", label: "Concepto / Rubro", type: "text", required: true },
      { key: "monto", label: "Monto Asignado (COP)", type: "number", required: true },
      { key: "periodo", label: "Periodo", type: "text", required: true, placeholder: "Ej. 2026" },
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Afiliación al Sistema General de Riesgos Laborales",
    icon: ShieldCheck,
    fields: [
      { key: "arl", label: "ARL (Administradora de Riesgos Laborales)", type: "text", required: true },
      { key: "numeroAfiliacion", label: "Número de Afiliación / Póliza", type: "text", required: true },
      { key: "fecha", label: "Fecha de Afiliación", type: "date", required: true },
      SOPORTE_FIELD,
    ],
  },
  {
    label: "Identificación de trabajadores de alto riesgo y cotización especial",
    icon: AlertTriangle,
    fields: [
      { key: "trabajador", label: "Nombre del Trabajador", type: "text", required: true },
      { key: "cargo", label: "Cargo", type: "text", required: true },
      { key: "tipoRiesgo", label: "Tipo de Riesgo", type: "text", required: true },
      { key: "cotizacion", label: "Cotización Especial (%)", type: "number" },
      { key: "fecha", label: "Fecha", type: "date" },
    ],
  },
  {
    label: "COPASST / Vigía SST: conformación",
    icon: Users,
    fields: [
      { key: "tipo", label: "Tipo de Comité", type: "select", required: true, options: ["COPASST", "Vigía SST"] },
      { key: "miembro", label: "Nombre del Miembro", type: "text", required: true },
      { key: "rolComite", label: "Rol en el Comité", type: "select", options: ROL_COMITE_OPTIONS },
      { key: "fecha", label: "Fecha de Conformación", type: "date", required: true },
      { key: "soporte", label: "Acta de Conformación (opcional)", type: "file" },
    ],
  },
  {
    label: "Capacitación COPASST / Vigía SST",
    icon: GraduationCap,
    fields: [
      { key: "capacitado", label: "Nombre del Capacitado", type: "text", required: true },
      { key: "tema", label: "Tema de la Capacitación", type: "text", required: true },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "intensidad", label: "Intensidad Horaria (horas)", type: "number" },
      { key: "soporte", label: "Certificado (opcional)", type: "file" },
    ],
  },
  {
    label: "Comité de Convivencia Laboral",
    icon: Handshake,
    fields: [
      { key: "miembro", label: "Nombre del Miembro", type: "text", required: true },
      { key: "rolComite", label: "Rol en el Comité", type: "select", options: ROL_COMITE_OPTIONS },
      { key: "fecha", label: "Fecha de Conformación", type: "date", required: true },
      { key: "soporte", label: "Acta de Conformación (opcional)", type: "file" },
    ],
  },
]

const CAPACITACION_ITEMS: RecursoItem[] = [
  {
    label: "Programa anual de capacitación SST",
    icon: ClipboardList,
    fields: [
      { key: "anio", label: "Año del Programa", type: "text", required: true, placeholder: "Ej. 2026" },
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "responsable", label: "Responsable del Programa", type: "text", required: true },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Inducción y reinducción SST",
    icon: UserPlus,
    fields: [
      { key: "trabajador", label: "Nombre del Trabajador", type: "text", required: true },
      { key: "tipo", label: "Tipo", type: "select", required: true, options: ["Inducción", "Reinducción"] },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "intensidad", label: "Intensidad Horaria (horas)", type: "number" },
      { key: "soporte", label: "Certificado / Soporte (opcional)", type: "file" },
    ],
  },
  {
    label: "Curso virtual 50 horas del responsable SG-SST",
    icon: Monitor,
    fields: [
      { key: "responsable", label: "Nombre del Responsable", type: "text", required: true },
      { key: "entidad", label: "Entidad Certificadora", type: "text", required: true },
      { key: "fechaFinalizacion", label: "Fecha de Finalización", type: "date", required: true },
      { key: "soporte", label: "Certificado (50 horas)", type: "file", required: true },
      OBSERVACIONES_FIELD,
    ],
  },
]

const GESTION_ITEMS: RecursoItem[] = [
  {
    label: "Política de SST",
    icon: ScrollText,
    fields: [
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "firmante", label: "Firmada por (Representante Legal)", type: "text", required: true },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Objetivos y metas del SG-SST",
    icon: Target,
    fields: [
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "indicadores", label: "Indicadores de Seguimiento", type: "textarea" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Evaluación inicial / línea base",
    icon: ClipboardCheck,
    fields: [
      { key: "fecha", label: "Fecha de Evaluación", type: "date", required: true },
      { key: "evaluador", label: "Realizada por", type: "text", required: true },
      { key: "porcentaje", label: "% de Cumplimiento Obtenido", type: "number" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Plan anual de trabajo SST",
    icon: CalendarCheck,
    fields: [
      { key: "anio", label: "Año", type: "text", required: true, placeholder: "Ej. 2026" },
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "responsable", label: "Responsable", type: "text", required: true },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Procedimiento/tabla de retención documental SG-SST",
    icon: Archive,
    fields: [
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "version", label: "Versión", type: "text" },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Rendición de cuentas del SG-SST",
    icon: Presentation,
    fields: [
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "responsable", label: "Presentada por", type: "text", required: true },
      { key: "periodo", label: "Periodo Evaluado", type: "text", placeholder: "Ej. 2026" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Matriz de requisitos legales SST",
    icon: Table,
    fields: [
      { key: "fechaActualizacion", label: "Fecha de Última Actualización", type: "date", required: true },
      { key: "responsable", label: "Responsable de Actualización", type: "text" },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Mecanismos de comunicación y autorreporte",
    icon: MessageSquare,
    fields: [
      { key: "mecanismo", label: "Mecanismo Implementado", type: "text", required: true, placeholder: "Ej. Buzón, correo, app" },
      { key: "responsable", label: "Responsable", type: "text" },
      { key: "fecha", label: "Fecha de Implementación", type: "date" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Procedimiento de adquisiciones con criterios SST",
    icon: ShoppingCart,
    fields: [
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "version", label: "Versión", type: "text" },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Evaluación y selección de proveedores y contratistas SST",
    icon: Building2,
    fields: [
      { key: "proveedor", label: "Proveedor / Contratista", type: "text", required: true },
      { key: "fechaEvaluacion", label: "Fecha de Evaluación", type: "date", required: true },
      { key: "resultado", label: "Resultado", type: "select", options: ["Aprobado", "No Aprobado", "Condicional"] },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Procedimiento de gestión del cambio",
    icon: RefreshCw,
    fields: [
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "version", label: "Versión", type: "text" },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
]

const PELIGROS_ITEMS: RecursoItem[] = [
  {
    label: "Metodología para identificación de peligros, evaluación y valoración de riesgos",
    icon: BookOpen,
    fields: [
      { key: "metodologia", label: "Metodología Utilizada", type: "text", required: true, placeholder: "Ej. GTC 45" },
      { key: "fechaAdopcion", label: "Fecha de Adopción", type: "date", required: true },
      { key: "responsable", label: "Responsable", type: "text" },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Matriz de peligros y valoración de riesgos",
    icon: Table,
    fields: [
      { key: "procesoArea", label: "Proceso / Área", type: "text", required: true },
      { key: "peligro", label: "Peligro Identificado", type: "text", required: true },
      { key: "riesgoAsociado", label: "Riesgo Asociado", type: "text", required: true },
      { key: "nivelRiesgo", label: "Nivel de Riesgo", type: "select", options: ["Bajo", "Medio", "Alto", "Crítico"] },
      { key: "fechaEvaluacion", label: "Fecha de Evaluación", type: "date", required: true },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Priorización de riesgos y plan de intervención",
    icon: ListOrdered,
    fields: [
      { key: "riesgoPrioritario", label: "Riesgo Priorizado", type: "text", required: true },
      { key: "medidaIntervencion", label: "Medida de Intervención", type: "textarea", required: true },
      { key: "responsable", label: "Responsable", type: "text", required: true },
      { key: "fechaLimite", label: "Fecha Límite de Ejecución", type: "date" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
]

const CONDICIONES_SALUD_ITEMS: RecursoItem[] = [
  {
    label: "Perfil sociodemográfico y diagnóstico de condiciones de salud",
    icon: Users,
    fields: [
      { key: "fecha", label: "Fecha del Diagnóstico", type: "date", required: true },
      { key: "responsable", label: "Responsable", type: "text", required: true },
      { key: "poblacion", label: "N° de Trabajadores Evaluados", type: "number" },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Evaluaciones médicas ocupacionales",
    icon: Stethoscope,
    fields: [
      { key: "trabajador", label: "Nombre del Trabajador", type: "text", required: true },
      { key: "tipoEvaluacion", label: "Tipo de Evaluación", type: "select", required: true, options: ["Ingreso", "Periódica", "Retiro", "Post-incapacidad"] },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "entidad", label: "Entidad / IPS que Realiza", type: "text" },
      SOPORTE_FIELD,
    ],
  },
  {
    label: "Información al médico sobre perfiles de cargo, riesgos y condiciones de trabajo",
    icon: FileText,
    fields: [
      { key: "cargo", label: "Cargo Evaluado", type: "text", required: true },
      { key: "fechaEnvio", label: "Fecha de Envío", type: "date", required: true },
      { key: "receptor", label: "Médico / Entidad Receptora", type: "text" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Custodia de historias clínicas ocupacionales",
    icon: Lock,
    fields: [
      { key: "custodio", label: "Entidad / Responsable de Custodia", type: "text", required: true },
      { key: "fecha", label: "Fecha de Verificación", type: "date" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Restricciones y recomendaciones médico-laborales",
    icon: ClipboardCheck,
    fields: [
      { key: "trabajador", label: "Nombre del Trabajador", type: "text", required: true },
      { key: "restriccion", label: "Restricción / Recomendación", type: "textarea", required: true },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "soporte", label: "Concepto Médico", type: "file", required: true },
    ],
  },
  {
    label: "Programa de promoción y prevención en salud",
    icon: HeartPulse,
    fields: [
      { key: "programa", label: "Nombre del Programa", type: "text", required: true },
      { key: "fecha", label: "Fecha de Implementación", type: "date", required: true },
      { key: "responsable", label: "Responsable", type: "text" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Programa de estilos de vida y entornos saludables",
    icon: Leaf,
    fields: [
      { key: "programa", label: "Nombre del Programa", type: "text", required: true },
      { key: "fecha", label: "Fecha de Implementación", type: "date", required: true },
      { key: "responsable", label: "Responsable", type: "text" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Agua potable, servicios sanitarios y disposición de basuras",
    icon: Droplet,
    fields: [
      { key: "fecha", label: "Fecha de Verificación", type: "date", required: true },
      { key: "responsable", label: "Responsable", type: "text" },
      { key: "estado", label: "Estado", type: "select", options: ["Cumple", "Cumple Parcialmente", "No Cumple"] },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
]

const HACER_PELIGROS_ITEMS: RecursoItem[] = [
  {
    label: "Programa de mantenimiento de instalaciones, equipos y herramientas",
    icon: Wrench,
    fields: [
      { key: "equipo", label: "Equipo / Instalación", type: "text", required: true },
      { key: "fecha", label: "Fecha de Mantenimiento", type: "date", required: true },
      { key: "responsable", label: "Responsable", type: "text" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Programa de inspecciones de seguridad",
    icon: Search,
    fields: [
      { key: "area", label: "Área Inspeccionada", type: "text", required: true },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "inspector", label: "Inspector", type: "text", required: true },
      { key: "hallazgos", label: "Hallazgos", type: "textarea" },
      SOPORTE_FIELD,
    ],
  },
  {
    label: "Controles de ingeniería y administrativos de riesgos prioritarios",
    icon: Settings,
    fields: [
      { key: "riesgo", label: "Riesgo Priorizado", type: "text", required: true },
      { key: "tipoControl", label: "Tipo de Control", type: "select", required: true, options: ["Ingeniería", "Administrativo"] },
      { key: "descripcion", label: "Descripción del Control", type: "textarea", required: true },
      { key: "fecha", label: "Fecha", type: "date" },
      SOPORTE_FIELD,
    ],
  },
  {
    label: "Procedimientos e instructivos de trabajo seguro",
    icon: BookOpen,
    fields: [
      { key: "nombre", label: "Nombre del Procedimiento", type: "text", required: true },
      { key: "version", label: "Versión", type: "text" },
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      SOPORTE_REQUERIDO_FIELD,
    ],
  },
  {
    label: "Mediciones ambientales ocupacionales",
    icon: Activity,
    fields: [
      { key: "tipoMedicion", label: "Tipo de Medición", type: "text", required: true, placeholder: "Ej. Ruido, iluminación" },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "resultado", label: "Resultado Obtenido", type: "text" },
      { key: "entidad", label: "Entidad que Realiza", type: "text" },
      SOPORTE_FIELD,
    ],
  },
  {
    label: "Entrega y control de EPP",
    icon: HardHat,
    fields: [
      { key: "trabajador", label: "Nombre del Trabajador", type: "text", required: true },
      { key: "epp", label: "Elemento de Protección Personal", type: "text", required: true },
      { key: "fechaEntrega", label: "Fecha de Entrega", type: "date", required: true },
      { key: "soporte", label: "Formato de Entrega (opcional)", type: "file" },
    ],
  },
  {
    label: "Capacitación en uso, cuidado y mantenimiento de EPP",
    icon: GraduationCap,
    fields: [
      { key: "capacitado", label: "Nombre del Capacitado", type: "text", required: true },
      { key: "tema", label: "Tema", type: "text", required: true, placeholder: "Ej. Uso correcto de EPP" },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "soporte", label: "Certificado / Soporte (opcional)", type: "file" },
    ],
  },
]

const EMERGENCIAS_ITEMS: RecursoItem[] = [
  {
    label: "Plan de prevención, preparación y respuesta ante emergencias",
    icon: Siren,
    fields: [
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "version", label: "Versión", type: "text" },
      SOPORTE_REQUERIDO_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Brigada de prevención, preparación y respuesta ante emergencias",
    icon: Users,
    fields: [
      { key: "brigadista", label: "Nombre del Brigadista", type: "text", required: true },
      { key: "rol", label: "Rol en la Brigada", type: "text" },
      { key: "fechaConformacion", label: "Fecha de Conformación", type: "date", required: true },
      SOPORTE_FIELD,
    ],
  },
  {
    label: "Simulacros de emergencia",
    icon: Megaphone,
    fields: [
      { key: "tipoSimulacro", label: "Tipo de Simulacro", type: "text", required: true, placeholder: "Ej. Incendio, sismo" },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "participantes", label: "N° de Participantes", type: "number" },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
  {
    label: "Inspección y mantenimiento de equipos de emergencia",
    icon: Wrench,
    fields: [
      { key: "equipo", label: "Equipo", type: "text", required: true, placeholder: "Ej. Extintor, camilla" },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      { key: "estado", label: "Estado", type: "select", options: ["Operativo", "Requiere Mantenimiento", "Fuera de Servicio"] },
      SOPORTE_FIELD,
    ],
  },
]

const ACCIDENTES_ITEMS: RecursoItem[] = [
  {
    label: "Procedimiento de reporte e investigación de accidentes, incidentes y enfermedades laborales",
    icon: ScrollText,
    fields: [
      { key: "fechaAprobacion", label: "Fecha de Aprobación", type: "date", required: true },
      { key: "version", label: "Versión", type: "text" },
      SOPORTE_REQUERIDO_FIELD,
    ],
  },
  {
    label: "Investigación de accidentes e incidentes",
    icon: AlertOctagon,
    fields: [
      { key: "trabajador", label: "Trabajador Involucrado", type: "text", required: true },
      { key: "fecha", label: "Fecha del Evento", type: "date", required: true },
      { key: "tipo", label: "Tipo", type: "select", required: true, options: ["Accidente", "Incidente"] },
      { key: "descripcion", label: "Descripción", type: "textarea", required: true },
      SOPORTE_FIELD,
    ],
  },
  {
    label: "Investigación de enfermedades laborales",
    icon: HeartPulse,
    fields: [
      { key: "trabajador", label: "Trabajador Involucrado", type: "text", required: true },
      { key: "diagnostico", label: "Diagnóstico", type: "text", required: true },
      { key: "fecha", label: "Fecha", type: "date", required: true },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
]

const CONTRATISTAS_ITEMS: RecursoItem[] = [
  {
    label: "Requisitos SST para contratistas y proveedores",
    icon: Briefcase,
    fields: [
      { key: "contratista", label: "Contratista / Proveedor", type: "text", required: true },
      { key: "fechaVerificacion", label: "Fecha de Verificación", type: "date", required: true },
      { key: "resultado", label: "Resultado", type: "select", options: ["Cumple", "Cumple Parcialmente", "No Cumple"] },
      SOPORTE_FIELD,
      OBSERVACIONES_FIELD,
    ],
  },
]

const PLANEAR_SUBTABS: SubTabGroup[] = [
  { key: "recursos", label: "Recursos y Responsables", icon: UserCog, items: RECURSOS_ITEMS },
  { key: "capacitacion", label: "Capacitación", icon: GraduationCap, items: CAPACITACION_ITEMS },
  { key: "gestion", label: "Gestión Integral", icon: Layers, items: GESTION_ITEMS },
  { key: "peligros", label: "Peligros y Riesgos", icon: AlertTriangle, items: PELIGROS_ITEMS },
]

const HACER_SUBTABS: SubTabGroup[] = [
  { key: "hacer-condiciones", label: "Condiciones de Salud", icon: HeartPulse, items: CONDICIONES_SALUD_ITEMS },
  { key: "hacer-peligros", label: "Peligros y Riesgos", icon: AlertTriangle, items: HACER_PELIGROS_ITEMS },
  { key: "hacer-emergencias", label: "Emergencias", icon: Siren, items: EMERGENCIAS_ITEMS },
  { key: "hacer-accidentes", label: "Accidentes e Incidentes", icon: AlertOctagon, items: ACCIDENTES_ITEMS },
  { key: "hacer-contratistas", label: "Gestión de Contratistas", icon: Briefcase, items: CONTRATISTAS_ITEMS },
]

const SUBTABS_BY_TAB: Partial<Record<PhvaTab, SubTabGroup[]>> = {
  planear: PLANEAR_SUBTABS,
  hacer: HACER_SUBTABS,
}

type ItemStatus = "pendiente" | "cumplido" | "no-obligatorio"

const ESTADO_CONFIG: Record<ItemStatus, { label: string; className: string }> = {
  pendiente: { label: "Pendiente", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  cumplido: { label: "Cumplido", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  "no-obligatorio": { label: "No Obligatorio", className: "bg-muted text-muted-foreground" },
}

function EstadoBadge({ status }: { status: ItemStatus }) {
  const config = ESTADO_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap ${config.className}`}>
      {config.label}
    </span>
  )
}

function ProgressBadge({ pct }: { pct: number }) {
  const className = pct === 100
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
    : pct === 0
      ? "bg-muted text-muted-foreground"
      : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold tabular-nums whitespace-nowrap ${className}`}>
      {pct}%
    </span>
  )
}

function EmptyState() {
  return (
    <div className="h-40 w-full rounded-xl bg-gradient-to-b from-muted/30 to-transparent border border-dashed border-border/60 flex flex-col items-center justify-center gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
        <Construction size={20} className="text-primary" />
      </div>
      <p className="text-muted-foreground font-medium text-sm">Contenido en construcción</p>
    </div>
  )
}

export default function SgSstDisenoPage() {
  const [activeTab, setActiveTab] = useState<PhvaTab>("planear")
  const [openSubTabs, setOpenSubTabs] = useState<Set<string>>(new Set(["recursos"]))
  const active = TABS.find((t) => t.key === activeTab)!
  const activeSubGroups = SUBTABS_BY_TAB[activeTab]
  const { showSuccess } = useNotification()

  const toggleSubTab = (key: string) => {
    setOpenSubTabs((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // TODO: sin backend todavía — esto solo confirma el diseño de cada modal (mockup local,
  // no persiste). Cuando se apruebe el set final de campos por ítem, se modela y persiste
  // vía un endpoint real (Regla 2, AGENTS.md — service layer + migración), igual que Alertas.
  const [openItem, setOpenItem] = useState<RecursoItem | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [fileValues, setFileValues] = useState<Record<string, File | null>>({})
  const [isSavingItem, setIsSavingItem] = useState(false)

  // Estado de cumplimiento por ítem — local por ahora (mismo alcance mockup del resto de la página).
  const [itemStatuses, setItemStatuses] = useState<Record<string, ItemStatus>>({})
  const getItemStatus = (label: string): ItemStatus => itemStatuses[label] ?? "pendiente"
  const setItemStatus = (label: string, status: ItemStatus) => {
    setItemStatuses((prev) => ({ ...prev, [label]: prev[label] === status ? "pendiente" : status }))
  }

  // % cumplido del grupo: los ítems "no obligatorio" no cuentan ni a favor ni en contra.
  const getGroupProgress = (items: RecursoItem[]): number | null => {
    if (items.length === 0) return null
    const applicable = items.filter((it) => getItemStatus(it.label) !== "no-obligatorio")
    if (applicable.length === 0) return 100
    const completed = applicable.filter((it) => getItemStatus(it.label) === "cumplido").length
    return Math.round((completed / applicable.length) * 100)
  }

  const openItemModal = (item: RecursoItem) => {
    setOpenItem(item)
    setFormValues({})
    setFileValues({})
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!openItem) return
    setIsSavingItem(true)
    // Simulado: sin endpoint real todavía.
    await new Promise((resolve) => setTimeout(resolve, 400))
    showSuccess("Registro Guardado", `Se guardó el registro de "${openItem.label}".`)
    setIsSavingItem(false)
    setOpenItem(null)
  }

  const inputClass = "block w-full px-4 py-2.5 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-sm"

  return (
    <DashboardLayout>
      <div className="space-y-6 mt-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Diseño e Implementación SG-SST</h2>
          <p className="text-sm text-muted-foreground">PYME Riesgo 1-3 — ciclo PHVA (Planear, Hacer, Verificar, Actuar)</p>
        </div>

        <div className="border-b border-border/50 flex gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.key ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {activeSubGroups ? (
          <div className="space-y-3">
            {activeSubGroups.map((sub) => {
              const Icon = sub.icon
              const isOpen = openSubTabs.has(sub.key)
              const progress = getGroupProgress(sub.items)
              return (
                <div key={sub.key} className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-sm overflow-hidden">
                  <button
                    onClick={() => toggleSubTab(sub.key)}
                    className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon size={18} />
                      </div>
                      <span className="text-sm font-semibold text-foreground">{sub.label}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      {progress !== null && <ProgressBadge pct={progress} />}
                      <ChevronDown size={18} className={`text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/50">
                      {sub.items.length === 0 ? (
                        <div className="p-6">
                          <EmptyState />
                        </div>
                      ) : (
                        <div className="divide-y divide-border/50">
                          {sub.items.map((item) => {
                            const ItemIcon = item.icon
                            const status = getItemStatus(item.label)
                            return (
                              <div key={item.label} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/40 transition-colors">
                                <button
                                  onClick={() => openItemModal(item)}
                                  className="flex items-center gap-3 text-sm text-foreground text-left flex-1 min-w-0"
                                >
                                  <ItemIcon size={15} className="text-muted-foreground shrink-0" />
                                  <span className="truncate">{item.label}</span>
                                </button>

                                <div className="flex items-center gap-2 shrink-0">
                                  <EstadoBadge status={status} />
                                  <button
                                    onClick={() => setItemStatus(item.label, "cumplido")}
                                    title="Marcar como cumplido"
                                    className={`p-1.5 rounded-lg transition-colors ${status === "cumplido" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400"}`}
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    onClick={() => setItemStatus(item.label, "no-obligatorio")}
                                    title="Marcar como no obligatorio"
                                    className={`p-1.5 rounded-lg transition-colors ${status === "no-obligatorio" ? "bg-muted-foreground/20 text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                                  >
                                    <Ban size={14} />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-border/50 bg-background/40">
              <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <active.icon size={18} className="text-primary" />
                {active.label}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">{active.description}</p>
            </div>
            <div className="p-8">
              <EmptyState />
            </div>
          </div>
        )}

        {openItem && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-10 sm:pt-16 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
            <div className="w-full max-w-md rounded-3xl border border-border/50 bg-background p-6 shadow-2xl space-y-6 my-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <openItem.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-foreground">{openItem.label}</h3>
              </div>

              <form onSubmit={handleSaveItem} className="space-y-4">
                {openItem.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      {field.type === "date" && <Calendar size={12} />}
                      {field.type === "file" && <Upload size={12} />}
                      {field.label}
                    </label>

                    {field.type === "textarea" ? (
                      <textarea
                        rows={3}
                        required={field.required}
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={`${inputClass} resize-none`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="" disabled>Selecciona una opción</option>
                        {field.options!.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === "file" ? (
                      <>
                        <input
                          type="file"
                          required={field.required && !fileValues[field.key]}
                          onChange={(e) => setFileValues((prev) => ({ ...prev, [field.key]: e.target.files?.[0] ?? null }))}
                          className="block w-full text-sm text-muted-foreground file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-semibold hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
                        />
                        {fileValues[field.key] && <p className="text-xs text-muted-foreground truncate">{fileValues[field.key]!.name}</p>}
                      </>
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={formValues[field.key] ?? ""}
                        onChange={(e) => setFormValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className={inputClass}
                      />
                    )}
                  </div>
                ))}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenItem(null)}
                    className="flex-1 rounded-2xl border border-border py-3 font-semibold text-foreground hover:bg-muted transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingItem}
                    className="flex-1 rounded-2xl bg-primary hover:bg-primary/95 py-3 font-semibold text-primary-foreground transition-all shadow-lg shadow-primary/10 disabled:opacity-50"
                  >
                    {isSavingItem ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
