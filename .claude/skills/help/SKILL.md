---
name: help
description: "List all 23 studio skills grouped by phase, each with a one-line description. Run any time you need a map of what the studio can do."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, AskUserQuestion
model: sonnet
agent: producer
---

Display the complete skill catalog for the SaaS Studio, organized by lifecycle phase, so the user can orient themselves and choose the right next action. Non-autonomous and read-only: it never writes files.

## Phases
1. **Gather skill list** — read all `SKILL.md` files under `.claude/skills/*/` to collect live `name:` and `description:` values; use these rather than hardcoded text so the listing is always accurate.
2. **Group by phase** — organize skills into six groups: (1) Navigation (`start`, `help`, `studio-status`, `scope-check`), (2) Product & UX (`validate-idea`, `write-prd`, `map-flows`, `design-ui`), (3) Engineering (`setup-stack`, `design-architecture`, `design-schema`, `build-feature`, `code-review`), (4) Billing (`design-pricing`, `setup-billing`), (5) Harden (`qa-plan`, `test-setup`, `write-tests`, `security-audit`, `threat-model`, `compliance-check`), (6) Infra & Launch (`setup-deploy`, `launch-checklist`).
3. **Format output** — print each group as a heading with a numbered list of `/skill-name — description` entries. Keep descriptions to one line each. Indicate which skills write files vs. produce text-only output.
4. **Highlight current state** — if `docs/specs/` artifacts exist, note which phase the project appears to be in and which skills are most relevant right now.
5. **Invite action** — ask if the user wants to jump to a specific skill or needs more detail on any entry.

## Output
Formatted text listing only — no files written.
