---
name: design-pricing
description: "Define plans/tiers, metered units, trial period, and upgrade/downgrade rules using the pricing template. Map each plan to Stripe products and prices. Drafts pricing.md then awaits approval."
argument-hint: "[--review full|lean|solo]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion, Task
model: sonnet
agent: billing-engineer
---

Design a pricing model that is both commercially sound and implementable with Stripe's product/price/subscription primitives. Non-autonomous: every tier, limit, and Stripe mapping is proposed and confirmed before being written to the spec.

## Phases
1. **Load context** — read `docs/specs/prd.md` for the target user personas and success metrics, and `docs/specs/idea-validation.md` for willingness-to-pay signals. If neither exists, ask the user to describe the intended audience and rough price sensitivity.
2. **Propose tier structure** — suggest 2–4 plan tiers (e.g., Free/Starter/Pro/Enterprise) with names, monthly and annual prices, and the key differentiating limits (seats, usage units, feature gates). Present the tiers as a comparison table. Ask the user to adjust before moving on.
3. **Define metered units and feature gates** — for each tier, specify: which features are gated (boolean), which are metered (unit name, included allowance, overage price), and the upgrade trigger (what makes a user need the next tier). This informs which Stripe Price objects will be `recurring` vs. `metered`.
4. **Design upgrade/downgrade and trial rules** — propose: trial length (days), trial-to-paid conversion behavior, proration strategy on plan changes, and what happens to data when a user downgrades below a current-usage limit. Get explicit sign-off on these rules — they have customer-experience implications.
5. **Map to Stripe objects** — for each tier, define the Stripe Product name, Price ID naming convention (e.g., `price_starter_monthly`), billing interval, and any metered price configuration. Note that actual Stripe objects will be created in `/setup-billing`; this phase produces the spec only.
6. **Write the spec** — fill `.claude/templates/pricing.md` into `docs/specs/pricing.md`. Under `full` review, present each section; under `lean`/`solo`, write after a single confirmation. Next step: point to `/setup-billing`.

## Output
`docs/specs/pricing.md` — tier definitions, Stripe object mapping, and upgrade/downgrade rules. Writes nothing without approval.
