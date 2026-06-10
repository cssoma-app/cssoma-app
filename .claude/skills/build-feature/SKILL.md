---
name: build-feature
description: "Implement one vertical slice (UI → server action/route handler → DB) for a single PRD user story. Obeys path-scoped rules. Ends by invoking /code-review. Draft/approve at every boundary."
argument-hint: "<user-story-id-or-description> [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
agent: backend-engineer
---

Implement a complete, shippable vertical slice for exactly one user story: from the UI component through the server action or route handler down to the database query, including error handling and loading states. Non-autonomous: a draft plan is approved before any code is written, and each layer boundary is a checkpoint.

## Phases
1. **Scope the story** — read `docs/specs/prd.md` to identify the target user story and its acceptance criteria. If no argument was given, ask the user to specify. Confirm the story is IN_SCOPE (run `/scope-check` mentally) and that relevant schema tables exist in `supabase/migrations/`. If tables are missing, stop and direct to `/design-schema`.
2. **Draft implementation plan** — propose the files that will be created or modified: the Next.js page/component (path under `app/`), any shared components under `components/`, the server action or route handler, and the database query. Show the plan as a file tree with a one-line description for each file. Get approval before writing anything.
3. **Implement UI layer** — write the React server and/or client components using shadcn/ui components as defined in `docs/specs/ui.md`. Include empty, loading, and error states. Under `full` review, show each component before writing; under `lean`/`solo`, write after the plan is approved.
4. **Implement server layer** — write the server action (preferred for mutations) or route handler. Validate all inputs with Zod. Enforce tenant scoping by reading the tenant ID from the authenticated session — never accept tenant ID from client input. Handle errors explicitly and return typed results.
5. **Implement data layer** — write the Supabase query using the server-side client (`createServerClient` from `@supabase/ssr`). Confirm that RLS policies cover the operation; if a service-role bypass is needed, document why in a code comment and flag for review.
6. **Invoke code review** — after all files are written, invoke `/code-review` automatically. Do not declare the feature done until the review passes or all findings are acknowledged by the user. Once core features exist, design monetization with `/design-pricing` then `/setup-billing`.

## Output
Code changes across `app/`, `components/`, and `lib/` for the targeted user story. Nothing is written without the plan being approved.
