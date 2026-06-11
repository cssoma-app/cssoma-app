---
name: launch-checklist
description: "Run the pre-launch gate: verify secrets not committed, RLS enforced, Stripe in live mode with webhooks, error monitoring configured, and legal stubs present. Outputs PASS or BLOCK with blocking items."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
agent: devops-engineer
---

Execute a comprehensive pre-launch gate check against the canonical checklist, surfacing every blocking issue that must be resolved before the product goes live. Non-autonomous: presents a full findings report; nothing is auto-fixed — the user decides how to address each item.

## Phases
1. **Load checklist template** — read `.claude/templates/launch-checklist.md` to get the canonical item list. If the template is missing, fall back to the built-in checklist defined in this skill. Check whether a previous run exists at `docs/specs/launch-checklist.md` and note any items already marked PASS.
2. **Security: secrets check** — run `git log --all --full-history -- '.env' '.env.*'` and grep the working tree for patterns matching real API keys (`sk_live_`, `sk_test_`, `eyJ`, `-----BEGIN`). Verify `.gitignore` covers `.env`, `.env.local`, and `.env.*.local`. Any real secret found in version control is an immediate BLOCK.
3. **Security: RLS verification** — read all migration files under `supabase/migrations/` and all Supabase query code under `lib/` and `app/`. Confirm that every tenant-scoped table has `ENABLE ROW LEVEL SECURITY` and at least one policy. Flag any table that is missing RLS as a BLOCK unless it is explicitly documented as public or service-role-only.
4. **Billing: Stripe live-mode check** — verify that the production environment's `STRIPE_SECRET_KEY` starts with `sk_live_` (check `.env.example` notes or ask the user to confirm). Verify that the Stripe webhook endpoint is registered for the production URL with the correct event types. Verify that `STRIPE_WEBHOOK_SECRET` is set for production. Flag test-mode keys in production as a BLOCK.
5. **Operational readiness** — check for: (a) an error monitoring integration (Sentry, Axiom, or equivalent — look for SDK imports in `lib/` or `app/`), (b) the existence of `/privacy` and `/terms` routes or static pages (legal stubs), (c) a working health-check endpoint or Vercel deployment health, and (d) the CI workflow in `.github/workflows/` is present and passing. Mark each as PASS, WARNING, or BLOCK.
6. **Security audit gate (BLOCKING)** — read the `## Verdict` section of `docs/specs/security-audit.md`. Apply the following logic: (a) if the file is missing → BLOCK and instruct the user to run `/security-audit`; (b) if the `## Verdict` section reads `BLOCK` (open High/Critical findings) → BLOCK and instruct the user to resolve all High/Critical findings listed there before proceeding; (c) if the `## Verdict` section reads `PASS` → this gate is satisfied.
7. **Tests green gate (BLOCKING)** — apply the following logic: (a) if no `vitest.config.ts` exists in the project root → BLOCK and instruct the user to run `/test-setup` to scaffold the test suite before launch; (b) if `vitest.config.ts` exists, run the project's `npm test` script (Vitest unit/integration) and, if a Playwright config exists, `npx playwright test`; if either command exits non-zero → BLOCK and instruct the user to fix failures and run `/write-tests` for any files lacking coverage.
8. **Write report and verdict** — fill `docs/specs/launch-checklist.md` with each item's status and a one-line note. Output a final verdict: PASS (all items PASS or WARNING only) or BLOCK (one or more BLOCK items remain, including the security audit gate or the tests green gate). Under BLOCK, list the blocking items in priority order with remediation steps — security audit failures and test suite failures must appear first. Show the report for approval before writing the file. Honor the review intensity: under `full`, walk through each checklist section for sign-off; under `lean`, get a single confirmation before writing the report; under `solo`, proceed and summarize after.

## Output
`docs/specs/launch-checklist.md` + a PASS or BLOCK verdict with itemized findings. Writes nothing without approval.
