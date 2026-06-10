## Applies to
`**/supabase/**`, `**/db/**`, `**/migrations/**`, `lib/supabase/**`, `lib/db/**` (any file running Supabase queries).

## Standards
- MUST enable Row Level Security on every table holding tenant data.
- MUST scope every query by tenant/org id; never trust a client-supplied tenant id.
- MUST keep the Supabase service-role key server-only; never import it into client code.
- SHOULD define policies alongside the table in a migration, not ad hoc.
- SHOULD prefer `select` of explicit columns over `*` in app code.
