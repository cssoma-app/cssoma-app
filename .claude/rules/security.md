## Applies to
`**` (cross-cutting)

## Standards
- MUST commit a lockfile and run `npm audit` (or equivalent) in CI; triage High/Critical before release.
- MUST set security headers (CSP, HSTS, X-Content-Type-Options) on the app.
- MUST NOT log secrets, tokens, or full PII; redact before logging.
- MUST return sanitized error responses (no stack traces or internal detail to clients).
- SHOULD keep dependencies current and remove unused ones to shrink attack surface.
