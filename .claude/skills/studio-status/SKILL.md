---
name: studio-status
description: "Report where the project stands: which spec artifacts exist, what's missing, and which skill to run next. Run at the start of any session to re-orient."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Task
model: sonnet
agent: producer
---

Provide a concise health-check of the project's current state by scanning for the canonical spec artifacts and recommending the logical next skill. Non-autonomous and read-only: presents findings and a recommendation, then waits for the user to decide what to do.

## Phases
1. **Scan artifacts** — check for the existence and non-emptiness of: `docs/specs/idea-validation.md`, `docs/specs/prd.md`, `docs/specs/flows.md`, `docs/specs/ui.md`, `docs/specs/architecture.md`, `docs/specs/data-model.md`, `docs/specs/pricing.md`, `docs/specs/launch-checklist.md`. Mark each PRESENT, DRAFT (file exists but contains placeholders), or MISSING.
2. **Detect gaps** — identify which required artifacts are missing or incomplete relative to the project's apparent stage (e.g., prd.md missing but idea-validation.md present → gap). List gaps in priority order.
3. **Scan code state** — briefly check whether a Next.js project scaffold exists (`package.json`, `app/` directory), whether Supabase migrations are present, and whether a CI workflow exists under `.github/workflows/`. Note what's found without deep analysis.
4. **Summarize status** — produce a clear table or bulleted list: artifact → status, code scaffold → yes/no, gaps identified. Keep it scannable.
5. **Recommend next step** — based on the largest gap, name the single most valuable next skill to run and explain why in one sentence. Present this as a suggestion; the user decides.

## Output
Text status report only — no files written.
