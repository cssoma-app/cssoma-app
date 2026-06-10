---
name: design-schema
description: "Design Postgres tables, relations, RLS policies, and tenant scoping using the data-model template. Produce a draft Supabase migration. Get approval before applying anything."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
agent: database-engineer
---

Translate the architecture and PRD into a concrete Postgres schema with Row-Level Security policies, tenant isolation, and a ready-to-apply Supabase migration file. Non-autonomous: the full schema draft is presented and approved before any migration is applied.

## Phases
1. **Load context** — read `docs/specs/architecture.md`, `docs/specs/prd.md`, and any existing migration files under `supabase/migrations/`. If the architecture doc is missing, stop and direct to `/design-architecture`.
2. **Draft tables and relations** — propose each table with columns, data types, primary keys, foreign keys, and indexes. Note which tables are tenant-scoped (include a `tenant_id` column referencing an `organizations` or `tenants` table). Present the entity-relation summary for the user's review.
3. **Design RLS policies** — for every tenant-scoped table, write the RLS `ENABLE ROW LEVEL SECURITY` statement and at least a SELECT, INSERT, UPDATE, and DELETE policy using `auth.uid()` and tenant scoping. Explain each policy in plain language. Flag any table that is intentionally public-read or service-role-only.
4. **Review edge cases** — check for: missing indexes on foreign keys, cascade-delete implications, enum vs. text trade-offs, and any table that stores PII (flag for encryption or masking consideration). Surface findings; get the user's decisions before locking the schema.
5. **Write migration draft** — fill `.claude/templates/data-model.md` into `docs/specs/data-model.md` and write the migration SQL to `supabase/migrations/{timestamp}_initial_schema.sql`. Show both files for approval. Do NOT run `supabase db push` or any database command until the user explicitly approves. Honor the review intensity: under `full`, walk through each table and policy for sign-off; under `lean`, get a single confirmation before writing; under `solo`, proceed and summarize after.
6. **Apply (optional)** — if the user approves application, run `supabase db push` and verify success. Report the output. Next step: point to `/build-feature`.

## Output
`docs/specs/data-model.md` + `supabase/migrations/{timestamp}_initial_schema.sql`. Applies nothing to the database without explicit approval.
