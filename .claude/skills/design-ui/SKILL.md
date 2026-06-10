---
name: design-ui
description: "For each screen in flows.md, select shadcn/ui components and layout, note empty/loading/error states, and document basic accessibility. Drafts ui.md then awaits approval."
argument-hint: "[screen-name] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: ux-designer
---

Define the component-level UI specification for every screen in the approved screen list, grounded in shadcn/ui and Tailwind conventions, so that frontend-engineer can build with minimal back-and-forth. Non-autonomous: component choices are proposed and confirmed before the spec is written.

## Phases
1. **Load flows** — read `docs/specs/flows.md`. If missing, stop and direct to `/map-flows`. If a specific screen name was passed as an argument, scope this run to that screen only; otherwise process all screens.
2. **Propose layout and components** — for each screen, suggest: overall layout pattern (full-page, split-panel, modal, drawer), the primary shadcn/ui components (`Card`, `DataTable`, `Form`, `Dialog`, etc.), and any Tailwind utility patterns. Reference shadcn/ui component names exactly so the frontend-engineer can look them up directly.
3. **Specify interaction states** — for every screen, explicitly call out: empty state (what the user sees before any data), loading state (skeleton or spinner approach), and error state (inline error, toast, or full-page). Missing these is a common source of rework — do not skip.
4. **Note accessibility** — for each screen note the required ARIA landmarks, focus-trap requirements (for modals/drawers), and any keyboard navigation considerations. Flag any component where shadcn defaults need augmentation.
5. **Approval gate** — under `full` review, walk through each screen's spec with the user; under `lean` or `solo`, present a summary table and ask for a single sign-off. Do not write until approved.
6. **Write the spec** — write `docs/specs/ui.md` with the approved component decisions. Next step: point to `/setup-stack` (if scaffold not yet created) or `/build-feature`.

## Output
`docs/specs/ui.md` — per-screen component spec. Writes nothing else without approval.
