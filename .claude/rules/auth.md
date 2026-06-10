## Applies to
`**/auth/**`, `middleware.*`, `app/**/layout.*`, `app/(protected)/**`

## Standards
- MUST enforce a session check on every protected route.
- MUST verify tenant/org membership before returning tenant data.
- MUST NOT duplicate or re-implement auth logic in client components.
- SHOULD centralize auth helpers server-side.
