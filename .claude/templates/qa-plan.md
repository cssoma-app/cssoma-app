# QA Plan: <name>

## Test pyramid

| Layer | Scope | Tooling | Target share |
|-------|-------|---------|-------------|
| Unit | <pure functions, server actions, validators> | Vitest | <e.g. 70%> |
| Integration | <API routes, DB queries, auth flows> | Vitest + Supabase RLS tests | <e.g. 20%> |
| E2E | <critical user journeys> | Playwright | <e.g. 10%> |

## Tooling

- **Unit / integration**: Vitest + Testing Library
- **E2E**: Playwright
- **Billing**: Stripe-signed test payloads (Stripe CLI `stripe trigger`)
- **Database / multi-tenancy**: Supabase RLS tests (per-role policy assertions)

## Critical seams to test

- **RLS / tenant isolation**: every table holding tenant data must have a cross-tenant read/write rejection test.
- **Auth / session**: unauthenticated and wrong-tenant requests MUST be rejected at protected routes.
- **Billing webhooks**: signature validation failure, happy-path processing, and idempotent replay (duplicate event id).
- **Input-validation boundaries**: invalid / malformed payloads rejected with a 400 before reaching business logic.

## Coverage targets

| Layer | Target |
|-------|--------|
| Unit (statements) | <e.g. 80%> |
| Integration (critical paths) | <e.g. 100% of RLS policies> |
| E2E (happy paths) | <e.g. 3 critical journeys — all green in CI> |

## Out of scope

- <third-party SDKs — tested by their own suites>
- <infrastructure / cloud-provider internals>
- <list any explicit exclusions>
