## Applies to
`**/stripe/**`, `**/billing/**`, `**/payments/**`, `**/subscriptions/**`

## Standards
- MUST verify Stripe webhook signatures with `stripe.webhooks.constructEvent` and the raw body.
- MUST make webhook handlers idempotent (guard on event id).
- MUST read price/product IDs from env/config, never hardcode them.
- MUST NOT trust client-sent amounts or price IDs — derive them server-side.
