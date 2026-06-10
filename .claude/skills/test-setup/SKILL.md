---
name: test-setup
description: "Scaffold the test stack for the SaaS app: install and configure Vitest + Testing Library, Playwright, and a CI test step. Run after qa-plan is approved. Produces a runnable test harness."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, AskUserQuestion, Task
model: sonnet
agent: qa-engineer
---

Scaffold the project's test infrastructure from the approved QA plan before any feature tests are written. Non-autonomous: present the full plan, get approval, then execute. Never install packages or write config files without sign-off.

## Phases
1. **Load context** — read `docs/specs/qa-plan.md` to understand the chosen pyramid and tooling decisions. If the file is missing, stop and direct to `/qa-plan`. Also read `package.json` and any existing test config files to avoid duplicating setup.
2. **Present the plan** — show the user the EXACT commands and files that will be created, including: install commands for Vitest, `@testing-library/react`, `@testing-library/jest-dom`, `@playwright/test`, and any supporting packages (`jsdom`, `@vitejs/plugin-react`, etc.); config files to be written (`vitest.config.ts`, `vitest.setup.ts`, `playwright.config.ts`); `package.json` scripts to be added (`test`, `test:watch`, `test:e2e`); and the CI test step (e.g. a GitHub Actions job snippet). Under `full`, confirm each category; under `lean`, one confirmation for the whole plan; under `solo`, proceed directly. Get explicit approval before running anything.
3. **Apply** — on approval, run the install commands, write the config files, and add the `package.json` scripts. Then add one trivial smoke test (`src/__tests__/smoke.test.ts` rendering a minimal component) and one Playwright homepage test (`e2e/smoke.spec.ts` visiting `/`) to verify the harness end-to-end.
4. **Verify** — run `npm test` (or equivalent) and `npm run test:e2e` against the smoke tests; show the output. If anything fails, diagnose and fix before proceeding. Under `full`, confirm each suite result; under `lean` or `solo`, summarize the combined result.
5. **Next step** — on a green run, point to `/write-tests`.

## Output
A runnable test scaffold: Vitest + Testing Library config, Playwright config, two smoke tests, updated `package.json` scripts, and a CI test step snippet. No application code is modified.
