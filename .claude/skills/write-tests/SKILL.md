---
name: write-tests
description: "Author tests for one PRD user story: unit, integration, and e2e cases plus any RLS policy or Stripe webhook fixture tests required. Run after test-setup is complete. Produces passing test files."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion, Task
model: sonnet
agent: qa-engineer
---

Author a complete, passing test suite for one user story, covering every layer the QA plan prescribes for that story's risk profile. Non-autonomous: identify the target, propose cases, get approval, write, then prove green. Never use real secrets or live network calls in tests.

## Phases
1. **Load context** — read `docs/specs/qa-plan.md` to understand the pyramid and conventions; read `docs/specs/prd.md` to list available stories. Ask the user which story or feature to target. If `qa-plan.md` is missing, stop and direct to `/qa-plan`; if the test scaffold is absent (no `vitest.config.ts`), stop and direct to `/test-setup`.
2. **Propose cases** — for the chosen story, enumerate the specific test cases at each layer: (a) unit tests for pure functions/helpers; (b) integration tests for server actions, route handlers, and API routes (using mocked DB/Stripe calls); (c) e2e tests for the critical user path in Playwright; (d) RLS policy tests asserting that other-tenant rows are inaccessible; (e) Stripe webhook tests using `stripe.webhooks.generateTestHeaderString` (or the Stripe CLI `stripe trigger`) with a signed test payload — never real keys. Present the list with a note on what each case catches. Under `full`, confirm each layer separately; under `lean`, one confirmation for the full list; under `solo`, proceed and summarize. Get explicit approval before writing any test code.
3. **Write** — on approval, author the test files in the locations prescribed by the QA plan (e.g. `src/__tests__/`, `e2e/`). Follow conventions from `docs/specs/qa-plan.md` and, if present, the `.claude/rules/tests.md` rule. Reference secrets by env-var name only (e.g. `process.env.STRIPE_WEBHOOK_SECRET`) — never embed literal secret-shaped strings. Use seeded or in-memory test data, not production data.
4. **Run green** — execute `npm test` (or `vitest run`) for unit/integration tests and `npm run test:e2e` for Playwright tests; show the output. If any test fails, diagnose the root cause, fix the test or the fixture, and re-run. Repeat until the full suite for this story is green; if the suite cannot be made green within the session, surface the remaining failures for the user to resolve and still point to `/code-review`. Under `full`, show each failure and proposed fix before applying; under `lean` or `solo`, fix and re-run, then show the final result.
5. **Next step** — once the suite is green, point to `/code-review` to review the new tests alongside the feature code.

## Output
Passing test files (unit, integration, e2e, and fixture tests as applicable) for one user story. No application code is modified beyond test utilities.
