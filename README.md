# Claude Code SaaS Studio

**Turn one Claude Code session into a SaaS studio. 10 agents. 17 skills. One coordinated team.**

---

## What it is

Claude Code SaaS Studio is a template repository that transforms a single Claude Code session into a structured, multi-agent team for building SaaS products. Instead of pasting the same prompts over and over or managing a sprawl of ad-hoc instructions, you get a pre-built studio with specialized agents, opinionated slash-command skills, protective hooks, and shared conventions — all wired together and ready to use.

**The problem it solves:** AI-assisted development often drifts into autonomous mode — the model starts writing code, making architectural decisions, and changing files without sufficient human input. This template enforces a disciplined flow: the agents ask before they act, present options before they build, and require your sign-off before writing anything. You stay in control at every step.

The workflow is: **ask → present options → user decides → draft → approve**. No file is created or changed without that loop.

---

## Default stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js (App Router) + TypeScript |
| Database / Auth / Storage | Supabase (Postgres, Auth, Storage) |
| Payments | Stripe |
| UI | Tailwind CSS + shadcn/ui |
| Hosting | Vercel |

---

## Getting started

```bash
git clone https://github.com/<your-org>/Claude-Code-SaaS-Studio my-saas  # replace <your-org> with your fork/repo URL
cd my-saas
claude
```

Once inside the Claude Code session, run:

```
/start
```

The `/start` skill detects where you are in the build lifecycle and routes you to the right phase automatically.

---

## The team

Ten agents organized in three tiers handle everything from idea validation to production launch.

### Directors (Claude Opus) — strategy, gates, sign-off
| Agent | Role |
|-------|------|
| `product-director` | Owns product vision, validates ideas, approves PRDs and pricing strategy |
| `technical-director` | Owns architecture and engineering standards, approves technical decisions |
| `producer` | Orchestrates the full studio session, routes tasks, tracks phase progress |

### Specialists (Claude Sonnet) — execution
| Agent | Role |
|-------|------|
| `product-manager` | Writes PRDs, user stories, acceptance criteria |
| `ux-designer` | Maps user flows, designs screens, produces UI specs |
| `frontend-engineer` | Builds Next.js pages, components, and client logic |
| `backend-engineer` | Builds API routes, server actions, and business logic |
| `database-engineer` | Designs Supabase schema, migrations, and RLS policies |
| `billing-engineer` | Integrates Stripe, builds billing portal and webhook handlers |
| `devops-engineer` | Configures Vercel deployments, env vars, CI, and monitoring |

---

## Workflow

The studio runs in four sequential phases plus cross-cutting utilities.

```
/start  →  detects stage, routes to the right phase

1. Product & UX
   /validate-idea      Pressure-test the idea; produce a confidence report
   /write-prd          Draft a full Product Requirements Document
   /map-flows          Map user journeys and key screen flows
   /design-ui          Produce Tailwind/shadcn UI component specs

2. Engineering
   /setup-stack        Scaffold Next.js + Supabase + Stripe project
   /design-architecture  Document system architecture and ADRs
   /design-schema      Design Supabase Postgres schema and migrations
   /build-feature      Implement a scoped feature end-to-end
   /code-review        Review staged changes against project rules

3. Billing
   /design-pricing     Design pricing tiers and entitlement model
   /setup-billing      Integrate Stripe checkout, webhooks, and portal

4. Infra & Launch
   /setup-deploy       Configure Vercel project, env vars, and CI
   /launch-checklist   Run the full pre-launch checklist

Cross-cutting (available any time)
   /studio-status      Show current phase, open decisions, and blockers
   /scope-check        Verify a proposed change is in-scope for the active phase
   /help               List all skills and agents with descriptions
```

Each skill is an explicit, user-invocable command. Nothing runs automatically. You invoke what you need, when you need it.

---

## Swapping the stack

The default stack (Next.js, Supabase, Stripe, Tailwind/shadcn, Vercel) lives primarily in the path-scoped rules and the setup skills, but the engineering agents also contain stack-specific guidance — update those too for a full stack swap.

| What to change | File(s) to edit |
|----------------|-----------------|
| Database / auth provider (e.g. PlanetScale, Neon, Firebase) | `.claude/rules/data.md`, `.claude/skills/design-schema/SKILL.md`, `.claude/agents/` (database-engineer, backend-engineer) |
| Payment provider (e.g. Paddle, LemonSqueezy) | `.claude/rules/billing.md`, `.claude/skills/setup-billing/SKILL.md`, `.claude/skills/design-pricing/SKILL.md`, `.claude/agents/` (billing-engineer) |
| Framework / hosting | `.claude/skills/setup-stack/SKILL.md`, `.claude/skills/setup-deploy/SKILL.md`, `.claude/agents/` (frontend-engineer, devops-engineer) |

Edit those files to describe your preferred tools and conventions.

---

## Review intensity

Every skill that produces artifacts accepts a `--review` flag controlling how many director gates fire:

| Mode | Behavior |
|------|----------|
| `full` | All director gates active — product-director and technical-director approve every phase transition (default for production work) |
| `lean` | Phase gates only — directors approve at phase boundaries, not within phases (good for iteration sprints) |
| `solo` | No gates — skills run straight through without approval pauses (for experienced users who know what they want) |

Pass it on any skill invocation:

```
/build-feature auth --review lean
/design-schema --review full
/write-prd --review solo
```

If omitted, the producer agent picks a sensible default based on the current phase.

---

## License

MIT — see [LICENSE](LICENSE).
