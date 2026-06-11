---
name: code-review
description: "Review the current diff against path-scoped rules (secrets, RLS/tenant scoping, Stripe webhook verification, input validation, scope), flag changed code lacking tests, and run a quick security pass. Reports findings; nothing auto-fixed without approval."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, AskUserQuestion, Task
model: sonnet
agent: producer
---

Perform a structured, rule-driven review of the current working-tree diff, checking for the most critical SaaS security and correctness properties. Non-autonomous: all findings are reported as a prioritized list; nothing is changed without the user's explicit sign-off on each fix.

## Phases
1. **Get the diff** — read the current unstaged and staged changes. If no diff exists, ask the user which files or commits to review. Summarize the scope of the review (N files, N lines changed) before proceeding.
2. **Check for secrets** — scan all changed files for patterns that look like hardcoded secrets: API keys, JWTs, connection strings, private keys, and Stripe secret keys. Any match is a BLOCKING finding. Cross-check that `.env.example` uses placeholders and that `.gitignore` covers `.env*`.
3. **Verify RLS and tenant scoping** — for any server action or route handler, confirm that: (a) the Supabase client is initialized with the session cookie (not the service role key unless justified), (b) all queries that touch tenant data include a tenant-scoping filter, and (c) tenant ID is never sourced from unvalidated client input.
4. **Validate Stripe handling** — for any webhook handler, verify: (a) `stripe.webhooks.constructEvent` is called with the raw request body and `STRIPE_WEBHOOK_SECRET`, (b) event types are handled with idempotency (check for a processed-event record or Supabase upsert pattern), and (c) the handler returns 200 quickly and does heavy work asynchronously if needed.
5. **Check input validation** — confirm that all server actions and route handlers validate inputs with Zod (or equivalent) before any database or Stripe call. Note any handler that accepts `any` typed input or skips validation.
6. **QA coverage advisory (qa-engineer perspective)** — scan the list of changed source files and check whether each has a corresponding test file (`*.test.*`, `*.spec.*`, or a matching path under `e2e/`). For every changed file with no accompanying test, note it as a NOTE-level finding with the suggestion: "Consider running `/write-tests` to add coverage for this file." This check is advisory only — it does not block the review verdict.
7. **Security pass advisory (security-engineer perspective)** — perform a quick, targeted scan of the diff for the following patterns, each reported as a WARNING unless it overlaps with an already-BLOCKING finding from earlier phases: (a) any token-shaped string that looks like a committed secret not caught by phase 2, (b) server actions or route handlers that read tenant data without an explicit RLS or tenant-scoping guard, (c) server actions or route handlers that accept inputs without Zod validation, and (d) Stripe webhook handlers missing `stripe.webhooks.constructEvent`. Skip any issue already reported in phases 2–5; this advisory only surfaces NEW test-coverage or security observations not already covered. Close this phase with: "For a comprehensive security review run `/security-audit`." This advisory does not auto-fix or block; all findings are reported for human review.
8. **Report findings** — present findings grouped by severity: BLOCKING (must fix before ship), WARNING (should fix), and NOTE (consider fixing). For each finding, include the file path, line reference, and a one-sentence fix suggestion. Under `full` review, discuss each finding; under `lean`/`solo`, present the list and ask for a single go/no-go to apply suggested fixes. Once all findings are resolved or acknowledged, return to the skill that invoked this review (e.g., `/build-feature`) or continue the current phase.

## Output
Review findings report (text only). Applies no fixes without explicit per-finding approval from the user.
