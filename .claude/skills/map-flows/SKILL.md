---
name: map-flows
description: "Derive key user journeys and the full screen list from the PRD. Confirm primary flows with the user, then produce flows.md as the UX contract for design-ui and build-feature."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: ux-designer
---

Translate the PRD's user stories into concrete user journeys and a numbered screen inventory that will anchor every subsequent design and engineering decision. Non-autonomous: flows are proposed, discussed, and approved before anything is written.

## Phases
1. **Load PRD** — read `docs/specs/prd.md`. If missing, stop and direct the user to `/write-prd`. Extract each user story and group them into candidate journeys (e.g., Onboarding, Core Loop, Billing & Upgrade, Settings).
2. **Propose journey map** — present each journey as a numbered step sequence (e.g., 1. Land on marketing page → 2. Click "Sign up" → 3. Supabase auth → …). Mark which steps cross authentication or payment boundaries. Ask the user to confirm, adjust, or remove flows.
3. **Derive screen list** — from the approved journeys, enumerate every distinct screen or modal needed. For each screen note: name, owning journey, auth-required (yes/no), and any critical empty/error states that must exist.
4. **Resolve ambiguities** — identify any flows where the user story is underspecified (e.g., "What happens if the user cancels mid-checkout?"). Propose sensible defaults; get the user's confirmation before locking the decision.
5. **Write draft** — fill `docs/specs/flows.md` with the journey map and screen list. Present the draft inline under `full` review; under `lean` / `solo` write immediately after a single confirmation prompt.
6. **Next step** — on approval, point to `/design-ui` to assign components to each screen.

## Output
`docs/specs/flows.md` — journey map + screen inventory. Writes nothing else without approval.
