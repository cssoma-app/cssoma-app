---
name: setup-stack
description: "Scaffold the Next.js + TypeScript + Tailwind + shadcn + Supabase + Stripe project. Presents exact commands and config for approval BEFORE running anything. Writes .env.example with required keys."
argument-hint: "[project-name] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
agent: technical-director
---

Bootstrap the canonical SaaS Studio stack from scratch: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, Supabase client, and Stripe SDK. Non-autonomous: every command and every generated file is shown to the user for approval before execution — nothing runs without sign-off.

## Phases
1. **Confirm prerequisites** — check that Node.js >= 18, `npm`/`pnpm`, and the Supabase CLI are available. Report what is found. If the project directory already contains a `package.json`, warn the user and ask whether to continue or abort.
2. **Present the scaffold plan** — show the exact sequence of commands that will be run: `npx create-next-app@latest` with `--typescript --tailwind --app --eslint`, followed by `npx shadcn@latest init`, then `npm install @supabase/ssr @supabase/supabase-js stripe @stripe/stripe-js`. List the commands verbatim. Do not run until the user approves.
3. **Run scaffold** — execute the approved commands with `Bash`. Stream output; stop and surface any error immediately rather than continuing past a failure.
4. **Write `.env.example`** — create `.env.example` at the project root with all required keys: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_APP_URL`. Values must be placeholders (e.g., `your-supabase-url`), never real secrets. Show the file contents for approval before writing.
5. **Verify the scaffold** — run `tsc --noEmit` to confirm TypeScript compiles. Report the result. If it fails, diagnose and propose a fix before proceeding. Honor the review intensity: under `full`, walk through each scaffold decision for sign-off; under `lean`, get a single confirmation before running commands; under `solo`, proceed and summarize after.
6. **Next step** — point to `/design-architecture` or, if the PRD and architecture docs are already approved, to `/design-schema`.

## Output
Project scaffold in the current directory + `.env.example`. Runs no command and writes no file without explicit approval.
