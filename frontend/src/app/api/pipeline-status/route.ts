import { NextRequest, NextResponse } from "next/server"

const OWNER = "cssoma-app"
const REPO = "cssoma-app"
const WORKFLOW_FILE = "ci.yml"

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

function requireSuperAdmin(req: NextRequest): boolean {
  const token = req.cookies.get("token")?.value
  if (!token) return false
  try {
    const payloadB64 = token.split(".")[1]
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf-8"))
    const role = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role
    const exp = payload.exp
    if (exp && Date.now() >= exp * 1000) return false
    return role === "SuperAdmin"
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

async function branchPipeline(branch: string) {
  const runsData = await ghFetch(
    `/repos/${OWNER}/${REPO}/actions/workflows/${WORKFLOW_FILE}/runs?branch=${branch}&per_page=1`
  )
  const run: GhRun | undefined = runsData?.workflow_runs?.[0]
  if (!run) {
    return { branch, configured: true, run: null, jobs: [] }
  }

  const jobsData = await ghFetch(`/repos/${OWNER}/${REPO}/actions/runs/${run.id}/jobs`)
  const jobs: GhJob[] = jobsData?.jobs ?? []

  return {
    branch,
    configured: true,
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
  if (!requireSuperAdmin(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ error: "GITHUB_TOKEN no configurado en el servidor" }, { status: 503 })
  }

  const [develop, main] = await Promise.all([branchPipeline("develop"), branchPipeline("main")])

  return NextResponse.json({
    develop,
    main,
    integrations: {
      render: Boolean(process.env.RENDER_STATUS_ENABLED),
      sentry: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    },
    fetchedAt: new Date().toISOString(),
  })
}
