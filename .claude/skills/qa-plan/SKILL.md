---
name: qa-plan
description: "Define the test strategy and tooling for the SaaS app before writing tests: the test pyramid, what to cover at each layer, and the security-critical seams. Run after the first feature exists. Produces a qa-plan doc."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: qa-engineer
---

Decide how this SaaS will be tested before scaffolding or writing any tests. Non-autonomous: ask first, present options, get sign-off.

## Phases
1. **Load context** — read `docs/specs/prd.md`, `docs/specs/architecture.md`, and `docs/specs/data-model.md` if present, to learn the features and the tenant model. If the PRD is missing, stop and direct to `/write-prd`.
2. **Choose the pyramid** — propose how much unit vs. integration vs. e2e, and the tools (Vitest + Testing Library, Playwright, Stripe-signed test payloads, Supabase RLS tests). Present 2–3 options with trade-offs.
3. **Identify critical seams** — list the must-test risk areas: tenant isolation (RLS), auth/session, billing webhooks, input validation boundaries.
4. **Draft the plan** — fill `.claude/templates/qa-plan.md` into `docs/specs/qa-plan.md` (draft, await approval). Honor the review intensity: under `full`, confirm each section; under `lean`, one confirmation before writing; under `solo`, write then summarize.
5. **Next step** — on approval, point to `/test-setup`.

## Output
`docs/specs/qa-plan.md`. Writes nothing else without approval.
