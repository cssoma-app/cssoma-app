---
name: compliance-check
description: "Check GDPR and SOC 2-lite readiness: inventory PII, verify privacy policy and data-subject rights, list subprocessors, and produce a PASS/GAP report."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: security-engineer
---

Prevent the common mistake of shipping a SaaS with real user data before the minimum legal and trust foundations are in place. By reading the PRD, architecture, and data-model docs, the skill builds an inventory of every data item collected or stored, flags which items are PII, traces where each item lives (Supabase, Stripe, Vercel, or a third party), and checks whether the app has the policy documents and code paths needed to honor GDPR data-subject rights (export and delete). It then scores each compliance item as PASS or GAP and produces a prioritized list of the open gaps to close before onboarding real users. Non-autonomous: drafts are presented and require explicit approval before any file is written.

## Phases
1. **Load context** — read `docs/specs/prd.md` and `docs/specs/architecture.md`; also read `docs/specs/data-model.md` if it exists. If the PRD is missing, stop and direct the user to `/write-prd`. Extract what data the app collects, from whom, and for what purpose.
2. **Data inventory** — build a table of every data item collected or stored, with columns: Item, Is PII (yes/no), Storage location (Supabase / Stripe / Vercel / other), Retention period (known or TBD). Present the table to the user for corrections and additions before proceeding.
3. **Policies & rights** — check for the presence of: (a) a privacy policy stub and Terms of Service; (b) a DPA / subprocessors list covering at minimum Supabase, Stripe, and Vercel; (c) a data-export path that lets a user or tenant download their data; (d) a data-deletion path that removes or anonymizes PII on request; (e) cookie consent if any tracking cookies are used; (f) *(SOC 2-lite)* an audit trail — key events (authentication, billing changes, and destructive admin actions) are logged to a tamper-evident log or append-only `audit_events` table. For each item, mark PASS (exists and adequate), GAP (missing or incomplete), or N/A (not applicable). Under `full` review, confirm each item with the user; under `lean`, present the full checklist and confirm once; under `solo`, write then summarize.
4. **Draft** — fill `.claude/templates/compliance.md` into `docs/specs/compliance.md` with the data inventory table and the PASS/GAP checklist. Present the draft and await explicit approval before writing the file.
5. **Verdict** — list all open GAPs in priority order (blocking: items that affect real-user data handling; important: items needed before public launch; advisory: best-practice items). Make clear which GAPs must be closed before the app can handle real user data.

## Output
`docs/specs/compliance.md` — a compliance readiness document with a data inventory table and a PASS/GAP checklist of GDPR and SOC 2-lite requirements.
