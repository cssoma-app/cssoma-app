---
name: security-audit
description: "Audit the SaaS codebase (or a diff) against the path-scoped rules and an OWASP-style SaaS checklist: auth/session, RLS/tenant isolation, secrets, input validation, Stripe webhook verification, dependency vulnerabilities. Produces a severity-ranked findings report."
argument-hint: "[--scope diff|full] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion, Task
model: sonnet
agent: security-engineer
---

Find and rank security risks before launch. Non-autonomous: report findings and proposed fixes; never auto-apply fixes without sign-off.

## Phases
1. **Scope** — Default to `diff` (staged/branch changes vs the base branch). If there is no active diff (nothing staged and no changes vs the base branch), automatically fall back to `full` (whole repo). Confirm the chosen scope with the user before proceeding.
2. **Checklist pass** — review against: auth/session checks on protected routes; Supabase RLS + tenant scoping (no client-supplied tenant id); secrets only in env (cross-check the validate-commit hook); input validation at boundaries (zod); Stripe webhook signature + idempotency; security headers (Content-Security-Policy (CSP), Strict-Transport-Security (HSTS), X-Content-Type-Options: nosniff, X-Frame-Options, Referrer-Policy); error sanitization.
3. **Dependency audit** — run `npm audit --omit=dev` (if a project exists) and note high/critical advisories; confirm a committed lockfile.
4. **Rank findings** — fill `.claude/templates/security-audit.md` into `docs/specs/security-audit.md` with each finding: title, severity (Critical/High/Medium/Low), location, and recommended fix. Honor review intensity.
5. **Verdict** — summarize: PASS (no open High/Critical) or BLOCK (list the blockers). This verdict is what `/launch-checklist` reads.

## Output
`docs/specs/security-audit.md` + a PASS/BLOCK verdict. Proposes fixes; applies nothing without approval.
