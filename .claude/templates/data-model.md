# Data Model: <name>

## Entities
- <entity name> — <brief description>

## Fields & types

### <entity name>
| Field | Type | Notes |
|-------|------|-------|
| <field> | <type> | <constraint or description> |

## Relations
- <entity A> → <entity B>: <relationship type and cardinality>

## Tenancy strategy
<how org/tenant scoping is enforced — e.g. every table has an org_id column referencing orgs>

## RLS policies

### <table name>
- <policy name>: <select/insert/update/delete> — <policy expression>

## Indexes
- `<table>(<columns>)` — <purpose>

## Migration
- <supabase/migrations/{timestamp}_<name>.sql>
