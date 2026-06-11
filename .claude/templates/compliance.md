# Compliance (GDPR/SOC2-lite): <name>

## Data inventory

| Data | PII? | Stored where | Retention |
|------|------|-------------|-----------|
| <e.g. email address> | Yes | <e.g. Supabase auth.users> | <e.g. until account deletion> |
| <e.g. Stripe customer id> | No | <e.g. Supabase profiles table> | <e.g. lifetime of subscription> |
| <field> | <Yes \| No> | <location> | <policy> |

## Policies

- [ ] Privacy policy published and linked from sign-up and footer
- [ ] Terms of Service published and linked from sign-up
- [ ] Data Processing Agreement (DPA) available for enterprise customers
- [ ] Subprocessors listed: <e.g. Supabase, Stripe, Vercel, Resend>

## Data subject rights

- **Export**: <describe the path — e.g. account settings > Export my data button, triggers server action>
- **Delete**: <describe the path — e.g. account settings > Delete account, cascades to all tenant tables>
- **Correction**: <describe how users can update PII>

## Audit trail

Events that MUST be logged (who, what, when, outcome):

- Auth events: sign-in, sign-out, password reset, MFA changes
- Billing events: plan upgrade/downgrade, payment failure, invoice created
- Admin events: role changes, tenant creation/deletion, data exports

Log schema MUST include: tenant_id, actor_id, action, outcome, timestamp. The table MUST be append-only (no UPDATE/DELETE for tenant roles).

Log storage: <e.g. Supabase audit_logs table, retained 90 days>

## Verdict

| Area | Status |
|------|--------|
| Data inventory complete | <PASS \| GAP> |
| Policies published | <PASS \| GAP> |
| Data subject rights implemented | <PASS \| GAP> |
| Audit trail in place | <PASS \| GAP> |
| Subprocessors listed | <PASS \| GAP> |
