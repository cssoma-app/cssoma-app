## Applies to
`**/*.test.*`, `**/*.spec.*`, `tests/**`, `e2e/**`, `**/__tests__/**`

## Standards
- MUST keep tests deterministic: no real network calls, no live API keys, no real Stripe/Supabase secrets.
- MUST write an RLS/tenant-isolation test for every table holding tenant data.
- MUST test Stripe webhook handlers with signed fixtures (Stripe CLI), covering signature failure and idempotent replay.
- SHOULD name tests by behavior (`it("rejects a cross-tenant read", …)`), not by implementation.
- SHOULD isolate state: set up and tear down per test; no order dependence.
