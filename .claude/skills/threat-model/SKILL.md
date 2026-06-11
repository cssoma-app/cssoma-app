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
3. **Threats (STRIDE-lite)** — for each of the six categories, name the top threat in the context of this multi-tenant SaaS and state a specific mitigation. The examples below are guidance the agent adapts to the actual system; the agent must produce a real finding for every category:
   - **Spoofing** — e.g., session or OAuth token forgery. Example mitigations: verify the Supabase JWT server-side on every protected request; enforce short-lived sessions; add CSRF protection on all state-mutating routes.
   - **Tampering** — e.g., RLS bypass or unvalidated input reaching the database. Example mitigations: zod-validate all inputs at the boundary; never trust a client-supplied tenant id; derive authorization and tenant scope server-side.
   - **Repudiation** — e.g., a destructive tenant action (data delete, plan change) that leaves no trace. Example mitigations: append-only `audit_events` table capturing tenant_id, actor_id, action, and timestamp; ensure the table itself is not deletable by tenants.
   - **Information disclosure** — e.g., cross-tenant data leak via a missing tenant scope filter. Example mitigations: RLS on every table holding tenant data; explicit column selects instead of `*`; automated tests that verify cross-tenant isolation.
   - **Denial of service** — e.g., unauthenticated endpoint abuse or a webhook flood that starves the database. Example mitigations: rate-limit and paginate expensive or unauthenticated endpoints; verify the Stripe webhook signature before performing any work.
   - **Elevation of privilege** — e.g., insecure direct object reference or a missing membership check letting a user access another tenant's resources. Example mitigations: enforce server-side membership and role checks on every protected route; keep the Supabase service-role key server-only and never expose it to client code.
   Under `full` review, confirm each category's finding with the user; under `lean`, present all six and confirm once; under `solo`, write then summarize.
4. **Draft** — fill `.claude/templates/threat-model.md` into `docs/specs/threat-model.md` with the assets list, entry-point/trust-boundary map, and the STRIDE-lite table. Present the draft and await explicit approval before writing the file.
5. **Next step** — once the file is saved, point the user to `/security-audit` to verify that the stated mitigations are actually implemented in the codebase.

## Output
`docs/specs/threat-model.md` — a threat model document covering assets, entry points, trust boundaries, and a STRIDE-lite finding-and-mitigation table.
