import { NextRequest, NextResponse } from "next/server"

// This route reads the session cookie off `request` directly (not the
// `cookies()` helper from next/headers), so Next.js doesn't automatically
// treat it as dynamic — force it, otherwise the response can get cached and
// "stick" to whatever Render/GitHub/Sentry returned on the first request.
export const dynamic = "force-dynamic"

const OWNER = "cssoma-app"
const REPO = "cssoma-app"
const WORKFLOW_FILE = "ci.yml"

const RENDER_SERVICE_IDS: Record<"develop" | "main", string> = {
  develop: "srv-d9vv0ak9v7es73870e00",
  main: "srv-da0vemmgekts73fttp8g",
}

// Project IDs parsed straight from the DSNs (the numeric suffix after the last "/").
// Sentry's issues endpoint accepts the numeric internal project id directly.
const SENTRY_PROJECT_IDS = ["4511922384076800", "4511922388336640"]

type GhStep = { name: string; status: string; conclusion: string | null; number: number }
type GhJob = { id: number; name: string; status: string; conclusion: string | null; steps: GhStep[]; html_url: string }
type GhRun = {
  id: number
  status: string
  conclusion: string | null
  head_branch: string
  head_sha: string
  event: string
  display_title: string
  html_url: string
  run_started_at: string
  updated_at: string
  actor: { login: string; avatar_url: string }
}

// SuperAdmin o Admin del tenant propietario de la plataforma: mismo criterio que
// HasBroadAccess en el backend (ver TenantService/UserService/ServicesService).
function requireBroadAccess(req: NextRequest): boolean {
  const token = req.cookies.get("token")?.value
  if (!token) return false
  try {
    const payloadB64 = token.split(".")[1]
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"))
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role
    const isPlatformOwner = payload.IsPlatformOwner === "true"
    const exp = payload.exp
    if (exp && Date.now() >= exp * 1000) return false
    return role === "SuperAdmin" || (role === "Admin" && isPlatformOwner)
  } catch {
    return false
  }
}

async function ghFetch(path: string) {
  const token = process.env.GITHUB_TOKEN
  if (!token) return null
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

type RenderDeploy = {
  id: string
  status: string
  createdAt: string
  finishedAt: string | null
  commitId?: string
  url: string
}

async function renderFetch(path: string): Promise<{ ok: true; data: unknown } | { ok: false; error: string }> {
  const key = process.env.RENDER_API_KEY
  if (!key) return { ok: false, error: "RENDER_API_KEY no está seteada" }
  try {
    const res = await fetch(`https://api.render.com/v1${path}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: "application/json",
      },
      cache: "no-store",
    })
    if (!res.ok) {
      const body = await res.text().catch(() => "")
      return { ok: false, error: `HTTP ${res.status}${body ? `: ${body.slice(0, 200)}` : ""}` }
    }
    return { ok: true, data: await res.json() }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "fetch falló" }
  }
}

async function renderLatestDeploy(serviceId: string): Promise<{ deploy: RenderDeploy | null; error?: string }> {
  const result = await renderFetch(`/services/${serviceId}/deploys?limit=1`)
  if (!result.ok) return { deploy: null, error: result.error }

  const data = result.data
  const entry = Array.isArray(data) ? data[0] : null
  const deploy = (entry?.deploy ?? entry) as Record<string, unknown> | null
  if (!deploy?.id) return { deploy: null, error: "Respuesta de Render sin deploys (array vacío o forma inesperada)" }
  return {
    deploy: {
      id: deploy.id as string,
      status: deploy.status as string,
      createdAt: deploy.createdAt as string,
      finishedAt: (deploy.finishedAt as string) ?? null,
      commitId: (deploy.commit as Record<string, unknown> | undefined)?.id
        ? String((deploy.commit as Record<string, unknown>).id).substring(0, 7)
        : undefined,
      url: `https://dashboard.render.com/web/${serviceId}/deploys/${deploy.id}`,
    },
  }
}

type SentryIssue = { id: string; title: string; count: string; culprit: string; permalink: string }
type SentrySummary = { unresolvedCount: number; issues: SentryIssue[] } | null

async function sentryFetch(path: string) {
  const token = process.env.SENTRY_AUTH_TOKEN
  const org = process.env.SENTRY_ORG
  if (!token || !org) return null
  const res = await fetch(`https://sentry.io/api/0${path.replace("{org}", org)}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })
  if (!res.ok) return null
  return res.json()
}

async function sentrySummary(): Promise<SentrySummary> {
  if (!process.env.SENTRY_AUTH_TOKEN || !process.env.SENTRY_ORG) return null

  const results = await Promise.all(
    SENTRY_PROJECT_IDS.map((id) =>
      sentryFetch(`/organizations/{org}/issues/?project=${id}&query=is:unresolved&statsPeriod=24h&limit=10`)
    )
  )

  const issues: SentryIssue[] = results
    .filter((r): r is unknown[] => Array.isArray(r))
    .flat()
    .map((raw) => {
      const i = raw as { id: string; title: string; count: string; culprit: string; permalink: string }
      return { id: i.id, title: i.title, count: i.count, culprit: i.culprit, permalink: i.permalink }
    })

  return { unresolvedCount: issues.length, issues: issues.slice(0, 5) }
}

type ApprovalStatus = { approved: boolean | null; reviewer?: string; prNumber?: number }

async function mainApprovalStatus(sha: string): Promise<ApprovalStatus> {
  const prsData = await ghFetch(`/repos/${OWNER}/${REPO}/commits/${sha}/pulls`)
  const pr = Array.isArray(prsData) ? prsData[0] : null
  if (!pr) return { approved: null }

  const reviewsData = await ghFetch(`/repos/${OWNER}/${REPO}/pulls/${pr.number}/reviews`)
  const reviews: { state: string; user?: { login: string } }[] = Array.isArray(reviewsData) ? reviewsData : []
  const approval = [...reviews].reverse().find((r) => r.state === "APPROVED")

  return { approved: Boolean(approval), reviewer: approval?.user?.login, prNumber: pr.number }
}

async function branchPipeline(branch: string) {
  const renderResult = process.env.RENDER_API_KEY
    ? await renderLatestDeploy(RENDER_SERVICE_IDS[branch as "develop" | "main"])
    : { deploy: null, error: undefined }
  const renderDeploy = renderResult.deploy
  const renderError = renderResult.error

  const runsData = await ghFetch(
    `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/runs?branch=${branch}&per_page=1`
  )
  const run: GhRun | undefined = runsData?.workflow_runs?.[0]
  if (!run) {
    return { branch, configured: true, renderDeploy, renderError, approval: null as ApprovalStatus | null, run: null, jobs: [] }
  }

  const approval = branch === "main" ? await mainApprovalStatus(run.head_sha) : null

  const jobsData = await ghFetch(`/repos/${OWNER}/${REPO}/actions/runs/${run.id}/jobs`)
  const jobs: GhJob[] = jobsData?.jobs ?? []

  return {
    branch,
    configured: true,
    renderDeploy,
    renderError,
    approval,
    run: {
      id: run.id,
      status: run.status,
      conclusion: run.conclusion,
      sha: run.head_sha.substring(0, 7),
      event: run.event,
      title: run.display_title,
      url: run.html_url,
      startedAt: run.run_started_at,
      updatedAt: run.updated_at,
      actor: run.actor?.login,
    },
    jobs: jobs.map((j) => ({
      id: j.id,
      name: j.name,
      status: j.status,
      conclusion: j.conclusion,
      url: j.html_url,
      steps: j.steps.map((s) => ({ name: s.name, status: s.status, conclusion: s.conclusion, number: s.number })),
    })),
  }
}

export async function GET(req: NextRequest) {
  if (!requireBroadAccess(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN no configurado en el servidor" }, { status: 503 })
  }

  const [develop, main, sentry] = await Promise.all([
    branchPipeline("develop"),
    branchPipeline("main"),
    sentrySummary(),
  ])

  return NextResponse.json({
    develop,
    main,
    sentry,
    integrations: {
      render: Boolean(process.env.RENDER_API_KEY),
      sentry: Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG),
    },
    fetchedAt: new Date().toISOString(),
  })
}
