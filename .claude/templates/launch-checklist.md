# Launch Checklist: <name>

## Security
- [ ] No secrets committed to the repository
- [ ] `.env.example` present with placeholder values only
- [ ] Row Level Security enabled and verified on all tenant data tables
- [ ] Service-role key is server-only; not exposed to client bundles

## Billing
- [ ] Stripe live-mode keys configured in production environment
- [ ] Webhook endpoint registered in Stripe live-mode dashboard
- [ ] Webhook signature verification tested with live events
- [ ] Webhook handlers confirmed idempotent (duplicate event re-delivery handled)

## Observability
- [ ] Error monitoring configured (e.g. Sentry) and alerts active
- [ ] Uptime monitoring in place with on-call notification
- [ ] Key user actions and billing events are logged

## Legal
- [ ] Terms of Service published and linked in product
- [ ] Privacy policy published and linked in product
- [ ] Cookie/tracking consent in place if required

## Performance
- [ ] Core Web Vitals within acceptable thresholds on production build
- [ ] Database indexes verified for primary query patterns
- [ ] Rate limiting applied to public-facing API routes

## Rollback
- [ ] Rollback plan documented (previous deployment or feature flag)
- [ ] Database migration rollback script tested
- [ ] On-call runbook accessible to the team

---

Verdict: <PASS · BLOCK>
