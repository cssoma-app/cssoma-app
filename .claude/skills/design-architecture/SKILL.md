---
name: design-architecture
description: "Define system structure, module boundaries, and data flow for the SaaS app. Record significant decisions as ADRs. Drafts architecture.md then awaits approval."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: technical-director
---

Produce a lightweight but durable architecture document that records how the Next.js, Supabase, and Stripe layers interact, where the module boundaries sit, and why key decisions were made. Non-autonomous: every significant decision is surfaced as an option before it is recorded.

## Phases
1. **Load context** — read `docs/specs/prd.md` and `docs/specs/flows.md`. If neither exists, stop and direct the user to earlier skills. Identify the top architectural concerns implied by the feature list (e.g., multi-tenancy, file uploads, scheduled jobs, real-time updates).
2. **Propose system layers** — present a concise layer diagram in text: (1) Next.js App Router pages and server components, (2) server actions / route handlers as the API surface, (3) Supabase Postgres with RLS as the data store, (4) Supabase Auth for identity, (5) Stripe for billing. Ask the user to confirm or amend this model.
3. **Define module boundaries** — propose the top-level directory structure under `app/`, `lib/`, `components/`, and `supabase/`. Call out which paths are tenant-scoped and how the tenant ID flows through the request. Present for approval.
4. **Surface and decide ADRs** — for each significant decision (e.g., "use server actions vs. route handlers for mutations", "use Supabase Realtime vs. polling", "row-level security strategy"), present the options with trade-offs, recommend one, and record the user's choice as an ADR using `.claude/templates/adr.md`. Each ADR goes in `docs/specs/adr/NNNN-{slug}.md`.
5. **Write architecture doc** — fill `docs/specs/architecture.md` with the approved layer diagram, module map, and ADR index. Under `full` review, present each section; under `lean` / `solo`, write after a single confirmation.
6. **Next step** — on approval, point to `/design-schema` to translate the architecture into database tables.

## Output
`docs/specs/architecture.md` + one `docs/specs/adr/NNNN-{slug}.md` per decision. Writes nothing without approval.
