---
name: validate-idea
description: "Pressure-test a SaaS idea before any PRD: problem, target user, market, willingness to pay. Run right after /start. Produces an idea-validation doc and a PROCEED/PIVOT/KILL verdict."
argument-hint: "[idea-description] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: product-director
---

Validate that a SaaS idea is worth building before investing in specs and code. Non-autonomous: ask first, present options, get sign-off.

## Phases
1. **Frame the bet** — restate the idea as: target user, problem, and the painful status quo. Confirm with the user.
2. **Probe demand** — who pays, how much, what they use today, why they'd switch. Ask one question at a time.
3. **Assess fit & moat** — why this team/stack, what's defensible, what's the riskiest assumption.
4. **Draft the canvas** — fill `.claude/templates/idea-validation.md` into `docs/specs/idea-validation.md` (draft, await approval). Honor the review intensity: under `full`, walk through each canvas section for sign-off; under `lean`, get a single confirmation before writing; under `solo`, proceed and summarize after.
5. **Director gate** — product-director gives a PROCEED / PIVOT / KILL verdict with the single biggest risk to de-risk next.
6. **Next step** — on PROCEED, point to `/write-prd`.

## Output
`docs/specs/idea-validation.md` + a clear verdict. Writes nothing else without approval.
