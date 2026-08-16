"use client"

import { useCallback, useEffect, useState } from "react"
import { DashboardLayout } from "@/components/layout/DashboardLayout"
import { getErrorMessage } from "@/lib/utils"
import {
  GitCommitHorizontal, Hammer, FlaskConical, ScanSearch, Package,
  Server, UserCheck, Rocket, Activity, RefreshCw, ExternalLink, AlertTriangle,
} from "lucide-react"

type StepStatus = "success" | "failure" | "running" | "pending" | "unconfigured"

type Job = {
  id: number
  name: string
  status: string
  conclusion: string | null
  url: string
  steps: { name: string; status: string; conclusion: string | null; number: number }[]
}

type RunInfo = {
  id: number
  status: string
  conclusion: string | null
  sha: string
  event: string
  title: string
  url: string
  startedAt: string
  updatedAt: string
  actor: string
}

type RenderDeploy = {
  id: string
  status: string
  createdAt: string
  finishedAt: string | null
  commitId?: string
  url: string
}

type BranchPipeline = {
  branch: string
  configured: boolean
  renderDeploy: RenderDeploy | null
  run: RunInfo | null
  jobs: Job[]
}

type SentryIssue = { id: string; title: string; count: string; culprit: string; permalink: string }
type SentrySummary = { unresolvedCount: number; issues: SentryIssue[] } | null

type ApiResponse = {
  develop: BranchPipeline
  main: BranchPipeline
  sentry: SentrySummary
  integrations: { render: boolean; sentry: boolean }
  fetchedAt: string
}

function sentryStep(sentry: SentrySummary, sentryConfigured: boolean): StepStatus {
  if (!sentryConfigured) return "unconfigured"
  if (!sentry) return "pending"
  return sentry.unresolvedCount > 0 ? "failure" : "success"
}

function findStep(jobs: Job[], jobHint: string, stepHint: string): StepStatus {
  const job = jobs.find((j) => j.name.toLowerCase().includes(jobHint))
  if (!job) return "pending"
  const step = job.steps.find((s) => s.name.toLowerCase().includes(stepHint))
  if (!step) return "pending"
  if (step.status !== "completed") return "running"
  if (step.conclusion === "success") return "success"
  if (step.conclusion === "skipped") return "pending"
  return "failure"
}

function renderDeployStep(deploy: RenderDeploy | null, renderConfigured: boolean): StepStatus {
  if (!renderConfigured) return "unconfigured"
  if (!deploy) return "pending"
  switch (deploy.status) {
    case "live":
      return "success"
    case "build_failed":
    case "update_failed":
    case "canceled":
    case "deactivated":
    case "pre_deploy_failed":
      return "failure"
    case "created":
    case "build_in_progress":
    case "update_in_progress":
    case "pre_deploy_in_progress":
      return "running"
    default:
      return "pending"
  }
}

function worstOf(statuses: StepStatus[]): StepStatus {
  if (statuses.includes("failure")) return "failure"
  if (statuses.includes("running")) return "running"
  if (statuses.every((s) => s === "success")) return "success"
  return "pending"
}

const STATUS_STYLE: Record<StepStatus, { border: string; bg: string; text: string; dot: string; label: string }> = {
  success: { border: "border-emerald-500/50", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500", label: "OK" },
  failure: { border: "border-red-500/50", bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500", label: "Falló" },
  running: { border: "border-amber-500/50", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500 animate-pulse", label: "Corriendo" },
  pending: { border: "border-border/50", bg: "bg-muted/40", text: "text-muted-foreground", dot: "bg-muted-foreground/40", label: "Pendiente" },
  unconfigured: { border: "border-border/50", bg: "bg-muted/20", text: "text-muted-foreground", dot: "bg-muted-foreground/20", label: "Sin configurar" },
}

function Stage({ n, icon: Icon, label, status, hint }: { n: number; icon: typeof Hammer; label: string; status: StepStatus; hint?: string }) {
  const s = STATUS_STYLE[status]
  return (
    <div className={`flex flex-col items-center text-center gap-2 rounded-2xl border ${s.border} ${s.bg} p-4 min-w-[132px] flex-1`}>
      <div className="flex items-center gap-1.5">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-bold">{n}</span>
        <Icon size={18} className={s.text} />
      </div>
      <p className="text-xs font-semibold leading-tight">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className={`h-2 w-2 rounded-full ${s.dot}`} />
        <span className={`text-[11px] font-medium ${s.text}`}>{s.label}</span>
      </div>
      {hint && <p className="text-[10px] text-muted-foreground leading-tight">{hint}</p>}
    </div>
  )
}

function BranchTrack({ title, subtitle, data, sentry, sentryConfigured, renderConfigured, isProd }: {
  title: string
  subtitle: string
  data: BranchPipeline
  sentry: SentrySummary
  sentryConfigured: boolean
  renderConfigured: boolean
  isProd: boolean
}) {
  const build = worstOf([
    findStep(data.jobs, "frontend", "build"),
    findStep(data.jobs, "backend", "build"),
  ])
  const test = findStep(data.jobs, "backend", "test")
  const analysis = worstOf([
    findStep(data.jobs, "frontend", "lint"),
    findStep(data.jobs, "frontend", "typecheck"),
    findStep(data.jobs, "frontend", "security audit"),
  ])
  const commit: StepStatus = data.run ? "success" : "pending"
  const artifact: StepStatus = build === "success" ? "success" : build === "failure" ? "failure" : "pending"
  const deploy = renderDeployStep(data.renderDeploy, renderConfigured)
  const deployHint = data.renderDeploy
    ? `${data.renderDeploy.status}${data.renderDeploy.commitId ? ` · ${data.renderDeploy.commitId}` : ""}`
    : "Render + Vercel"
  const monitor = sentryStep(sentry, sentryConfigured)
  const monitorHint = sentryConfigured
    ? (sentry ? `${sentry.unresolvedCount} sin resolver (todo el proyecto)` : "Sentry")
    : "Sentry"

  return (
    <div className="rounded-3xl border border-border/50 bg-background/50 p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {data.run ? (
          <a href={data.run.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            {data.run.sha} · {data.run.actor} <ExternalLink size={14} />
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">Sin runs todavía</span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <Stage n={1} icon={GitCommitHorizontal} label="Code Commit" status={commit} />
        <Stage n={2} icon={Hammer} label="Build" status={build} />
        <Stage n={3} icon={FlaskConical} label="Test" status={test} />
        <Stage n={4} icon={ScanSearch} label="Code Analysis" status={analysis} hint="lint · types · audit" />
        <Stage n={5} icon={Package} label="Artifact" status={artifact} hint="Vercel / Docker" />
        {isProd ? (
          <Stage n={7} icon={UserCheck} label="Approval" status="unconfigured" hint="PR review" />
        ) : (
          <Stage n={6} icon={Server} label="Deploy Staging" status={deploy} hint={deployHint} />
        )}
        {isProd && <Stage n={8} icon={Rocket} label="Deploy Prod" status={deploy} hint={deployHint} />}
        <Stage n={9} icon={Activity} label="Monitor" status={monitor} hint={monitorHint} />
      </div>
    </div>
  )
}

export default function PipelinePage() {
  const [data, setData] = useState<ApiResponse | null>(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setError("")
    try {
      const res = await fetch("/api/pipeline-status", { cache: "no-store" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Error ${res.status}`)
      }
      setData(await res.json())
    } catch (err) {
      setError(getErrorMessage(err, "No se pudo cargar el estado del pipeline."))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          {data ? `Actualizado ${new Date(data.fetchedAt).toLocaleTimeString("es-CO")}` : "Cargando..."}
        </p>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-full border border-border/50 px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
        >
          <RefreshCw size={14} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">{error}</p>
            {error.includes("GITHUB_TOKEN") && (
              <p className="text-red-500/80 mt-1">Configurá la variable de entorno <code>GITHUB_TOKEN</code> (PAT con permiso <code>actions:read</code> sobre el repo) en Vercel — nunca en el código.</p>
            )}
          </div>
        </div>
      )}

      {isLoading && !data && <p className="text-muted-foreground">Cargando estado del pipeline...</p>}

      {data && (
        <div className="flex flex-col gap-6">
          <BranchTrack
            title="Staging (develop)"
            subtitle="Rama de trabajo — Render (staging) + Vercel Preview"
            data={data.develop}
            sentry={data.sentry}
            sentryConfigured={data.integrations.sentry}
            renderConfigured={data.integrations.render}
            isProd={false}
          />
          <BranchTrack
            title="Producción (main)"
            subtitle="Rama de release — Render (prod) + Vercel Production"
            data={data.main}
            sentry={data.sentry}
            sentryConfigured={data.integrations.sentry}
            renderConfigured={data.integrations.render}
            isProd={true}
          />
        </div>
      )}
    </DashboardLayout>
  )
}
