## Applies to
`**/Backend/**/*.cs`, `**/DbContext/**`, `**/Models/**` (cualquier archivo de backend que interactúe con datos).

## Standards
- MUST usar Entity Framework Core (EF Core) como ORM principal.
- MUST habilitar Global Query Filters en el `DbContext` para asegurar que todas las consultas SQL estén aisladas por tenant (`TenantId`).
- MUST scoped de inyección de dependencias para resolver el `TenantId` a partir del usuario autenticado (desde el JWT).
- MUST crear migraciones de EF Core (`dotnet ef migrations add`) para cualquier cambio de esquema.
- SHOULD usar Repositories o Services para encapsular la lógica de negocio y aislar los controladores del DbContext directamente.
- MUST evitar consultas asíncronas bloqueantes (`.Result` o `.Wait()`). Siempre usar `await`.
