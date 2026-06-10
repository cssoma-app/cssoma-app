# Threat Model: <name>

## Assets

- <e.g. user PII and credentials>
- <e.g. tenant billing data>
- <e.g. service-role database keys>
- <list all assets worth protecting>

## Entry points & trust boundaries

- <e.g. public Next.js API routes — untrusted input>
- <e.g. Stripe webhook endpoint — signed but must be verified>
- <e.g. Supabase client in browser — row-level security enforced>
- <e.g. internal server actions — authenticated session required>

## Threats (STRIDE-lite)

| Category | Threat | Mitigation |
|----------|--------|------------|
| Spoofing | <e.g. attacker forges another user's session> | <e.g. Supabase JWT validation on every request> |
| Tampering | <e.g. client-side price manipulation> | <e.g. derive price server-side from env config> |
| Repudiation | <e.g. no record of billing events> | <e.g. audit log of all Stripe webhook events> |
| Information disclosure | <e.g. cross-tenant data leak> | <e.g. RLS policies scoped by org_id> |
| Denial of service | <e.g. expensive unauthenticated queries> | <e.g. rate-limiting and auth gates on routes> |
| Elevation of privilege | <e.g. regular user accesses admin endpoint> | <e.g. role check in server action before execution> |

## Residual risks

- <risk 1 — accepted or deferred with rationale>
- <risk 2>
