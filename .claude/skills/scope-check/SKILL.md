---
name: scope-check
description: "Compare current or proposed work against the PRD's non-goals and scope boundaries. Flag scope creep early, recommend cut or keep, and get a user decision before work continues."
argument-hint: "[feature-or-change-description] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: product-director
---

Act as a scope guardian: read the PRD's goals, non-goals, and success metrics, then evaluate whether a proposed piece of work belongs in the current iteration. Non-autonomous: always surfaces findings and options before any decision is recorded.

## Phases
1. **Load the PRD** — read `docs/specs/prd.md`. Extract the stated goals, in-scope user stories, and explicit non-goals. If the PRD does not exist, stop and direct the user to `/write-prd` first.
2. **Understand the proposal** — if no argument was given, ask the user to describe the feature or change under review in one or two sentences. Ask clarifying questions if the proposal is ambiguous.
3. **Evaluate alignment** — compare the proposal against each PRD goal and non-goal. Score it: IN_SCOPE (clearly serves a stated goal), BORDERLINE (related but not explicitly scoped), or OUT_OF_SCOPE (matches a non-goal or adds unplanned complexity).
4. **Present options** — for BORDERLINE or OUT_OF_SCOPE items, present three choices: (A) Cut it from this iteration and log it as a future idea, (B) Narrow it to the smallest version that fits scope, (C) Formally expand scope by updating the PRD. Explain the cost/risk of each option.
5. **Record the decision** — once the user chooses, note the decision and, if the PRD is to be updated (option C), draft the minimal change to `docs/specs/prd.md` and await approval before writing. Once findings are resolved, return to the skill that invoked this check (e.g., `/build-feature`) or continue the current phase.

## Output
Text scope verdict + decision record. Updates `docs/specs/prd.md` only if the user chooses to expand scope and approves the draft change.
