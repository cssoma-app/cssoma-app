## Applies to
`app/**`

## Standards
- MUST use Server Components by default and add `"use client"` only when interactivity requires it.
- MUST NOT embed secrets or API keys in client components.
- MUST validate all inputs at the boundary (e.g. zod) before use.
- SHOULD keep data-fetching in server components/actions, not client.
- MUST mark server actions with `"use server"` (file- or function-level), and MUST NOT expose secret-bearing logic to client components.
- MUST NOT prefix secret environment variables with `NEXT_PUBLIC_` — that prefix bundles the value into the client.
- Route handlers under `app/api/**` MUST validate inputs at the boundary, same as other server code.
