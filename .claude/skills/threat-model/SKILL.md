---
name: threat-model
description: "Produce a STRIDE-lite threat model for the SaaS app: enumerate assets, trust boundaries, and entry points, then name the top threat and mitigation for each STRIDE category, focused on multi-tenant SaaS."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: security-engineer
---

Systematically surface what could go wrong before a line of security code is written. Working from the PRD and architecture doc, the skill enumerates valuable assets (user data, tenant data, billing records, secrets) and every surface where an attacker could interact with the system (public routes, the auth boundary, Stripe webhook endpoints, admin surfaces), then applies a STRIDE-lite analysis to name the most important threat and a concrete mitigation for each category in the context of a multi-tenant Next.js + Supabase + Stripe SaaS. The result is a structured threat model doc that the `/security-audit` skill can use to verify whether the mitigations are actually implemented. Non-autonomous: drafts are presented before writing; the user approves before the file is saved.

## Phases
1. **Load context** — read `docs/specs/prd.md` and `docs/specs/architecture.md`. If either file is missing, stop: direct the user to `/write-prd` or `/design-architecture` as appropriate before proceeding.
2. **Enumerate assets & entry points** — identify and list: (a) data assets (per-tenant user records, tenant configuration, billing/subscription data, session tokens, service secrets); (b) entry points and trust boundaries (unauthenticated public routes, the authentication boundary and session layer, API route handlers and server actions, Stripe webhook endpoints, admin/internal surfaces, third-party OAuth callbacks). Present the list to the user for any additions or corrections before continuing.
3. **Threats (STRIDE-lite)** — for each of the six categories, name the top threat in the context of this multi-tenant SaaS and state a specific mitigation: **Spoofing** (e.g., session or OAuth token forgery → mitigation); **Tampering** (e.g., RLS bypass or unvalidated input → mitigation); **Repudiation** (e.g., missing audit log for destructive tenant actions → mitigation); **Information disclosure** (e.g., cross-tenant data leak via missing tenant scope filter → mitigation); **Denial of service** (e.g., unauthenticated endpoint abuse or webhook flood → mitigation); **Elevation of privilege** (e.g., insecure direct object reference or missing membership check → mitigation). Under `full` review, confirm each category's finding with the user; under `lean`, present all six and confirm once; under `solo`, write then summarize.
4. **Draft** — fill `.claude/templates/threat-model.md` into `docs/specs/threat-model.md` with the assets list, entry-point/trust-boundary map, and the STRIDE-lite table. Present the draft and await explicit approval before writing the file.
5. **Next step** — once the file is saved, point the user to `/security-audit` to verify that the stated mitigations are actually implemented in the codebase.

## Output
`docs/specs/threat-model.md` — a threat model document covering assets, entry points, trust boundaries, and a STRIDE-lite finding-and-mitigation table.
