---
name: setup-billing
description: "Implement Stripe billing end-to-end: products/prices from config, checkout session, webhook handler with signature verification and idempotency, and customer portal. Present plan then implement."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, Task, AskUserQuestion
model: sonnet
agent: billing-engineer
---

Wire up the full Stripe billing integration based on the approved pricing spec: create Stripe products and prices programmatically from a config file, implement the checkout and portal flows, and build a webhook handler that is safe to deploy to production. Non-autonomous: implementation plan is presented and approved before any code is written.

## Phases
1. **Load pricing spec** — read `docs/specs/pricing.md`. If it is missing or incomplete, stop and direct to `/design-pricing`. Confirm the Stripe account mode (test vs. live) and that `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` are present in `.env.example`.
2. **Present implementation plan** — show the files that will be created: `lib/stripe/config.ts` (plan definitions), `lib/stripe/client.ts` (server-side Stripe instance), `app/api/stripe/checkout/route.ts` (checkout session endpoint), `app/api/stripe/portal/route.ts` (customer portal endpoint), `app/api/stripe/webhook/route.ts` (webhook handler), and any UI components for pricing and upgrade buttons. Get approval before writing.
3. **Implement config and client** — write `lib/stripe/config.ts` with plan definitions loaded from environment variables or a static config object (no hardcoded price IDs in business logic). Write `lib/stripe/client.ts` exporting a server-only Stripe instance. Show files before writing.
4. **Implement checkout and portal** — write the checkout session route handler (creating or retrieving the Stripe Customer, setting `success_url` and `cancel_url`, attaching metadata for tenant/user ID) and the customer portal handler. Both must validate that the requesting user is authenticated via Supabase Auth.
5. **Implement webhook handler** — write `app/api/stripe/webhook/route.ts` that: (a) reads the raw request body using `request.text()`, (b) calls `stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`, (c) handles `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted` events, (d) uses an `upsert` or idempotency key pattern in Supabase to prevent duplicate processing, and (e) returns 200 immediately — any heavy processing is deferred.
6. **Verify and review** — run `tsc --noEmit` to confirm no TypeScript errors. Invoke `/code-review` on the billing files. Update `docs/specs/pricing.md` with any implementation notes. Next step: point to `/setup-deploy`. Honor the review intensity: under `full`, walk through each implementation file for sign-off; under `lean`, get a single confirmation before writing; under `solo`, proceed and summarize after.

## Output
Billing code across `lib/stripe/` and `app/api/stripe/`. Updates `docs/specs/pricing.md` with implementation notes. Writes nothing without approval.
