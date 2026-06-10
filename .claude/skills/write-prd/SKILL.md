---
name: write-prd
description: "Turn a validated idea into a full PRD: goals, target users, user stories with acceptance criteria, non-goals, and success metrics. Requires idea-validation.md. Drafts then awaits approval."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: product-manager
---

Transform the idea-validation canvas into a structured Product Requirements Document that the engineering team can act on. Non-autonomous: every section is presented for approval before the file is written; review intensity controls how much detail is required before proceeding.

## Phases
1. **Load context** — read `docs/specs/idea-validation.md`. If it is missing or contains a PIVOT/KILL verdict, stop and direct the user to `/validate-idea` first. Summarize the validated bet in two sentences and confirm it is still accurate.
2. **Elicit goals and users** — work through the PRD skeleton from `.claude/templates/prd.md`: confirm the primary goal, secondary goals, and the one or two target user personas. Ask one question at a time; do not over-interview.
3. **Draft user stories** — propose a ranked list of user stories in "As a [persona], I want [action] so that [outcome]" format, each with two or three acceptance criteria. Present the list; let the user add, remove, or reprioritize before proceeding.
4. **Define non-goals and success metrics** — propose explicit non-goals (what will NOT be built in v1) and two to four measurable success metrics tied to the goals. Get the user's sign-off on this list — it becomes the scope boundary for `/scope-check`.
5. **Write the draft** — fill `.claude/templates/prd.md` with everything gathered and write the draft to `docs/specs/prd.md`. Show the draft inline before writing; under `full` review, walk through each section; under `lean` or `solo`, write directly after a single confirmation.
6. **Next step** — on approval, point to `/map-flows` to derive the screen and journey list.

## Output
`docs/specs/prd.md` — a complete PRD. Writes nothing else without approval.
