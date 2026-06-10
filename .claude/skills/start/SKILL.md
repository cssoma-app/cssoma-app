---
name: start
description: "Detect the project's current stage and route to the right first skill. Run at the very beginning of any new session. Shows the studio map and recommends the next action."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Task
model: sonnet
agent: producer
---

Orient the user within the SaaS Studio and route them to the correct starting skill based on where they are in the product lifecycle. Non-autonomous: asks one scoped question, presents options, waits for the user's choice before doing anything else.

## Phases
1. **Probe stage** — ask the user which best describes their situation: (a) no idea yet, (b) vague concept / rough idea, (c) clear design / written spec, (d) existing codebase to extend. Wait for their answer before continuing.
2. **Detect artifacts** — check whether `docs/specs/idea-validation.md`, `docs/specs/prd.md`, `docs/specs/architecture.md` already exist to refine the routing; do not assume a stage if evidence contradicts the user's answer.
3. **Route** — apply routing logic: (a/b) no idea or vague → recommend `/validate-idea`; (c) clear design → recommend `/write-prd` if no PRD exists, or `/setup-stack` if PRD exists; (d) existing code → recommend `/studio-status` first, then `/write-prd` if no PRD exists, else `/design-architecture`.
4. **Show the studio map** — print a concise phase overview: Navigation skills → Product & UX → Engineering → Billing (`/design-pricing → /setup-billing`) → Infra & Launch, with a one-line description of each phase. Highlight where the user is right now.
5. **Confirm next step** — present the recommended skill as a suggestion, not a command. Let the user accept, override, or ask questions.

## Output
Routing guidance only — this skill writes no files. Ends by naming the exact slash command the user should run next.
