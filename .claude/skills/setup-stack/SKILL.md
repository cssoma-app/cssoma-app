---
name: setup-stack
description: "Scaffold the decoupled stack: Next.js frontend + ASP.NET Core API backend. Presents exact commands for approval BEFORE running anything."
argument-hint: "[project-name] [--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
agent: technical-director
---

Bootstrap the decoupled SaaS Studio stack: Next.js App Router for frontend, ASP.NET Core Web API for backend. Non-autonomous: every command and every generated file is shown to the user for approval before execution.

## Phases
1. **Confirm prerequisites** — check that Node.js >= 18, `npm`/`pnpm`, y el `.NET SDK` (dotnet CLI) están disponibles. Si falta alguno, advertir al usuario.
2. **Present the scaffold plan** — show the exact sequence of commands that will be run. For frontend: `npx create-next-app@latest frontend ...` and `npx shadcn@latest init`. For backend: `dotnet new webapi -n BackendAPI -o backend`.
3. **Run scaffold** — execute the approved commands with `Bash`. Stream output; stop and surface any error immediately.
4. **Write `.env.example`** — create `.env.example` at the root and appsettings.json placeholders for the backend. Valores falsos, nunca secretos reales.
5. **Verify the scaffold** — run `tsc --noEmit` on frontend and `dotnet build` on backend. If it fails, diagnose and propose a fix.
6. **Next step** — point to `/design-architecture` or `/design-schema`.

## Output
Project scaffold with separate `/frontend` and `/backend` directories. Runs no command and writes no file without explicit approval.
