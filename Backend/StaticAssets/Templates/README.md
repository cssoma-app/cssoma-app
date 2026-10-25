# Plantillas descargables (Backend/StaticAssets/Templates)

Acá van los archivos físicos de las plantillas SG-SST en blanco (Word/PDF) que
Admin/SuperAdmin pueden descargar desde la app.

**Esta carpeta NO se sirve como estática** (no está en `wwwroot`, no hay
`UseStaticFiles` apuntando acá) — el único acceso es a través de
`GET /api/document-templates/{code}/download`, protegido con
`[Authorize(Roles = "SuperAdmin,Admin")]`. Nunca expongas esta ruta directo.

## Cómo agregar una plantilla nueva

1. Copiá el archivo (`.docx`, `.pdf`, etc.) en esta carpeta.
2. Insertá una fila en la tabla `DocumentTemplates` con:
   - `Code`: identificador corto y estable (ej. `FOR-SST-001`), solo
     letras/números/guiones — es lo que recibe el endpoint de descarga.
   - `Title`, `Description`: lo que ve el usuario en el listado.
   - `FileName`: el nombre exacto del archivo que pusiste en esta carpeta.
   - `ContentType`: el MIME type correcto (ej.
     `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     para `.docx`, `application/pdf` para PDF).
   - `IsActive`: `true`.

   Se puede sembrar en `Backend/Data/DatabaseInitializer.cs` (mismo patrón que
   `SgSstFunctionCatalogs`) o insertarse directo si más adelante se agrega un
   endpoint de administración.

La ruta base de esta carpeta es configurable vía `DocumentTemplates:StoragePath`
en `appsettings.json` (por defecto `StaticAssets/Templates`, relativo a la raíz
del proyecto Backend).
