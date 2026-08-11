# Data Model: SSTerra SaaS

## Entities
- `Tenant` — Representa una PYME o cliente corporativo del sistema.
- `User` — Un usuario que puede iniciar sesión (Responsable de SST, Gerente, o SuperAdmin).
- `Employee` — Trabajador de un Tenant para control de asistencia o capacitaciones.
- `Document` — Requisito normativo o matriz de riesgo.

## Fields & types

### Tenant
| Field | Type | Notes |
|-------|------|-------|
| Id | Guid | PK |
| Name | string | Max 100 |
| CreatedAt | DateTime | |

### User
| Field | Type | Notes |
|-------|------|-------|
| Id | Guid | PK |
| TenantId | Guid? | FK -> Tenant, Nullable (null para SuperAdmins) |
| SupabaseAuthId | string | Unique, vincula con el auth de Supabase |
| Role | UserRole | Enum: SST_Manager, General_Manager, SuperAdmin |
| Email | string | |

### Employee
| Field | Type | Notes |
|-------|------|-------|
| Id | Guid | PK |
| TenantId | Guid | FK -> Tenant |
| FullName | string | |
| Email | string | |
| Position | string | |

### Document
| Field | Type | Notes |
|-------|------|-------|
| Id | Guid | PK |
| TenantId | Guid | FK -> Tenant |
| Title | string | |
| FileUrl | string | Ruta Supabase Storage |
| ExpirationDate | DateTime? | |
| Status | DocStatus | Enum: Valid, Expiring, Expired |
| Type | DocType | Enum: Normative, Matrix, TrainingRecord |

## Relations
- `Tenant` → `User`: 1 a N
- `Tenant` → `Employee`: 1 a N
- `Tenant` → `Document`: 1 a N

## Tenancy strategy
Se utiliza EF Core Global Query Filters en lugar de Supabase RLS. Cada tabla (excepto `Tenant` y potencialmente administradores nulos) tiene una columna `TenantId`. El `ApplicationDbContext` intercepta todas las consultas e inyecta `WHERE TenantId = @currentTenant` mediante `.HasQueryFilter(e => e.TenantId == _tenantId || _isSuperAdmin)`.

## RLS policies
*Sustituido por Políticas de EF Core Global Query Filters según ADR 0001.*

## Indexes
- `User(SupabaseAuthId)` — Para búsquedas rápidas durante la autenticación.
- `Document(TenantId, ExpirationDate)` — Optimiza el dashboard de cumplimiento y alertas de vencimiento.

## Migration
- `backend/Migrations/*_InitialSchema.cs` (EF Core Migrations)
