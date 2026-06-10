---
name: setup-deploy
description: "Set up the Vercel project, wire environment variables across environments, and add a GitHub Actions CI workflow (lint, typecheck, build). Presents the full config plan before touching anything."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
agent: devops-engineer
---

Configure the project for production deployment on Vercel and add a GitHub Actions CI pipeline that catches regressions before merge. Non-autonomous: the full configuration plan is presented and approved before any files are written or CLI commands are run.

## Phases
1. **Check prerequisites** — verify the Vercel CLI is installed (`vercel --version`) and the user is logged in (`vercel whoami`). Check that a GitHub remote exists (`git remote -v`). Confirm the target Vercel team/org and project name. If any prerequisite is missing, provide the exact setup command and wait for the user to resolve it.
2. **Present the deployment plan** — describe what will be done: (a) `vercel link` to create or connect the Vercel project, (b) environment variable wiring for `development`, `preview`, and `production` environments using the keys from `.env.example`, (c) a GitHub Actions workflow file at `.github/workflows/ci.yml` with lint, typecheck, and build jobs. Show the proposed workflow YAML verbatim for approval before writing.
3. **Write the CI workflow** — write `.github/workflows/ci.yml` with three jobs: `lint` (runs `eslint`), `typecheck` (runs `tsc --noEmit`), and `build` (runs `next build`). Use `actions/checkout@v4`, `actions/setup-node@v4` with `node-version-file: .nvmrc` or `package.json` engines. Cache `node_modules` with `actions/cache`. Show the file before writing.
4. **Configure Vercel project** — run `vercel link` (non-interactive if possible), then walk the user through setting each required environment variable in Vercel for each environment. Provide the exact `vercel env add` commands; the user must supply the actual secret values — never prompt the user to paste secrets into the conversation.
5. **Verify CI** — present the exact `git commit` and `git push` commands that will be run (including branch name and commit message) and wait for the user's explicit approval before executing either. Only after approval: commit the workflow file, push to a branch, and confirm the GitHub Actions run appears. If it fails, diagnose and propose a fix. Honor the review intensity: under `full`, walk through each configuration step for sign-off; under `lean`, get a single confirmation before running commands; under `solo`, proceed and summarize after.
6. **Next step** — point to `/launch-checklist` as the final gate before going live.

## Output
`.github/workflows/ci.yml` + Vercel project configuration. No command runs without approval.
