# Implementación: Designación del Responsable SG-SST (E1.1.1)

## Status: 85% Backend Complete, Frontend Structure Ready

### ✅ Backend Implementado (Listo para tests)

#### Modelos (Backend/Models/)
- ✅ `Enums.cs` — agregados DocumentIdType, SstCompetencyLevel, SgSstDesignationStatus, ComplianceStatus
- ✅ `SgSstFunctionCatalog.cs` — catálogo maestro de las 11 funciones
- ✅ `SgSstResponsibleDesignation.cs` — entidad principal versionada por tenant
- ✅ `SgSstDesignationFunction.cs` — join normalizado

#### Servicios (Backend/Services/)
- ✅ `IResolucion0312ComplianceValidator.cs` + `Resolucion0312ComplianceValidator.cs` — Patrón Strategy, valida perfil vs Resolución 0312
- ✅ `ISgSstFunctionCatalogReader.cs` + `SgSstFunctionCatalogReader.cs` — lectura del catálogo
- ✅ `ISgSstResponsibleDesignationService.cs` + `SgSstResponsibleDesignationService.cs` — orquestación CRUD + lógica de versionado

#### Controller (Backend/Controllers/)
- ✅ `SgSstResponsibleDesignationsController.cs` — 4 endpoints:
  - `GET /api/sgsst/responsible-designations/current` — obtiene designación vigente
  - `GET /api/sgsst/responsible-designations/history` — historial de versiones
  - `GET /api/sgsst/responsible-designations/functions-catalog` — las 11 funciones
  - `POST /api/sgsst/responsible-designations` (Idempotent) — crear nueva (requiere Admin)

#### Contracts (Backend/Contracts/)
- ✅ `SgSstResponsibleDesignationRequests.cs` — DTO HTTP

#### DbContext (Backend/Data/)
- ✅ 3 DbSet nuevos + índices + global query filter de tenant-scoping + relationships

#### Program.cs
- ✅ 3 servicios registrados (1 Singleton, 2 Scoped)

#### Migración (Backend/Migrations/)
- ✅ `20260919000000_AddSgSstResponsibleDesignations.cs` — crea tablas + seed de 11 funciones

### ⚠️ Pasos Finales Backend (antes de tests/frontend)

1. **Build & Migrate**
   ```bash
   cd Backend
   dotnet build
   dotnet ef database update
   ```

2. **Tests** (usar patrón `TenantsControllerTests` como referencia en `BackendAPI.Tests/`)
   - `Resolucion0312ComplianceValidatorTests.cs` — pruebas unitarias del validador (xUnit + InlineData)
   - `SgSstResponsibleDesignationsControllerTests.cs` — pruebas integración (InMemory DB + Moq + controller real)
     - Create → version 1 Active
     - Create again → anterior Superseded, nueva version 2 Active
     - GET /current solo devuelve Active
     - GET /history devuelve todas ordenadas
     - Test de tenant-scoping (A no ve B)
     - Rol non-Admin recibe 403

### Frontend (Next.js) — Estructura

**Ubicación**: `frontend/src/app/dashboard/sgsst-diseno/recursos/designacion-responsable/`

#### Archivos a Crear

**1. `page.tsx`** (Server Component — data fetcher)
```typescript
// - Lee cookies (token)
// - Hace 3 fetch paralelos: GET /current, GET /history, GET /functions-catalog
// - Pasa datos al Client Component
// - Renderiza DashboardLayout wrapper
```

**2. `DesignacionResponsableForm.tsx`** (Client Component — formulario interactivo)
```typescript
// - useClient
// - 3 sections: Perfil responsable, 11 funciones (checklist), Aceptación/firma digital
// - State por cada campo (responsableName, responsableCargo, nivelCompetencia, etc.)
// - Submit handler: fetch POST con Idempotency-Key: crypto.randomUUID()
// - isSubmitting, error handling via getErrorMessage() de @/lib/utils
// - Banner de compliance status (Cumple/NoCumple/RequiereRevision)
// - Historial en pestaña collapsible (versiones anteriores read-only)
```

#### Validación con Zod (regla .claude/rules/app.md)
```bash
npm install zod
```

Crear `@/lib/validations/designacion-responsable.ts`:
```typescript
import { z } from 'zod'
import { DocumentIdType, SstCompetencyLevel } from '@/lib/types' // enums del backend

export const designacionResponsableSchema = z.object({
  coberturaCentroTrabajo: z.string().min(1, 'Cobertura requerida'),
  responsableNombreCompleto: z.string().min(3, 'Nombre requerido'),
  responsableCargo: z.string().min(2, 'Cargo requerido'),
  responsableTipoDocumento: z.enum(['Cc', 'Ce', 'Pasaporte']),
  responsableNumeroDocumento: z.string().min(3),
  nivelCompetencia: z.enum(['TecnicoSst', 'TecnologoSst', 'ProfesionalSst', 'EspecialistaSst']),
  licenciaSstNumero: z.string().min(1),
  licenciaSstExpedidaPor: z.string().min(1),
  curso50HorasAprobado: z.boolean(),
  empleadorAceptaNombre: z.string().min(1),
  empleadorAceptaCargo: z.string().min(1),
  empleadorAceptaDocumento: z.string().min(1),
  responsableAceptaNombre: z.string().min(1),
  responsableAceptaLicencia: z.string().min(1),
  responsableAceptaDocumento: z.string().min(1),
  suscripcionCiudad: z.string().min(1),
  suscripcionFecha: z.date().or(z.string().transform(s => new Date(s))),
  functionAcceptances: z.array(z.object({
    functionId: z.number(),
    isAccepted: z.boolean()
  }))
})
```

#### Datos Preflenados desde Tenant
La página GET `/current` devuelve la designación actual más los datos de Tenant (no se repiten en el formulario, solo mostrados read-only).

#### Conexión en Modal Existente
En `frontend/src/app/dashboard/sgsst-diseno/page.tsx`, cambiar el ítem "Designación del responsable":
```typescript
// ANTES (mock):
{
  label: "Designación del responsable del SG-SST",
  icon: UserCog,
  fields: [...5 campos...],
  // se abre en modal genérico
}

// DESPUÉS:
const desigacionItem = {
  label: "Designación del responsable del SG-SST",
  icon: UserCog,
  href: "/dashboard/sgsst-diseno/recursos/designacion-responsable", // <-- Navigate, no modal
  // Quitar 'fields' — es una página real ahora
}

// En la UI del recurso, verificar si el ítem tiene href → render <Link>
```

### Seguridad Checklist

- ✅ InputSanitizer.SanitizeText() + .Normalize(FormC) en todo campo libre (backend)
- ✅ Validación en borde con zod (frontend, antes de fetch)
- ✅ Idempotency-Key en POST
- ✅ [Authorize(Roles = "SuperAdmin,Admin")] en POST
- ✅ Global Query Filter de tenant-scoping en modelo
- ✅ No hardcodes (env vars para API_URL)
- ✅ Error responses genéricas (ServiceResult pattern)

### Próximos Pasos

1. **Build backend**:
   ```bash
   cd Backend && dotnet build && dotnet ef database update
   ```

2. **Instalar zod en frontend**:
   ```bash
   cd frontend && npm install zod
   ```

3. **Crear archivos frontend** (page.tsx, DesignacionResponsableForm.tsx, schema de validación)

4. **Escribir tests**:
   - Backend unit tests (Resolucion0312ComplianceValidator)
   - Backend integration tests (controller + service)

5. **Verificación e2e**:
   - `dotnet run` (backend)
   - `npm run dev` (frontend)
   - Navegar: Servicios SST → Planear → Recursos y Responsables → Designación del responsable
   - Llenar formulario, guardar, verificar compliance status banner
   - Crear segunda designación, verificar versionado e historial
   - Verificar aislamiento tenant (Admin de tenant A no ve datos de tenant B)

### Notas de Arquitectura

- **3FN Normalización**: Tablas separadas (Catalog, Designation, DesignationFunctions) — no denormalizar.
- **Versionado Inmutable**: Nunca UPDATE destructivo — Superseded + nueva versión = auditoría completa.
- **Patrón Strategy**: Validador intercambiable → sustituible si cambia Resolución 0312.
- **SOLID aplicado**: SRP (cada servicio una responsabilidad), DIP (inyección por constructor), ISP (interfaces específicas).
- **Tenant-Scoping**: Query filter global + index compuesto (TenantId, Status) = seguridad + perf.
- **Compliance Auditeable**: ComplianceStatus + ComplianceNota persistent → trazabilidad de cumplimiento.

---

**Generado por**: Claude Sonnet 5 / Claude Haiku 4.5  
**Fecha**: 2026-09-19  
**Repositorio**: https://github.com/[owner]/cssoma-app
