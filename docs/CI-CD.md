# CI/CD — SSTerra CSOMA

Cómo funciona el pipeline completo: qué corre en cada push, qué gatea qué, y qué variables de entorno hacen falta en cada lado. Repo: [`cssoma-app/cssoma-app`](https://github.com/cssoma-app/cssoma-app).

## 1. Panorama general

```
Push a develop                         Push a main (solo vía PR + merge)
      │                                        │
      ▼                                        ▼
┌─────────────────┐                  ┌─────────────────┐
│ GitHub Actions   │                  │ GitHub Actions   │
│ CI (.github/     │                  │ CI (mismo        │
│ workflows/ci.yml)│                  │ workflow)         │
│ - frontend job    │                  │ - frontend job    │
│ - backend job      │                  │ - backend job      │
└─────────┬─────────┘                  └─────────┬─────────┘
          │ (siempre, pase o falle el CI)         │ solo si frontend+backend
          ▼                                        │ pasan Y viene de push
┌──────────────────┐                              ▼
│ Render (staging)  │                  ┌──────────────────┐
│ Auto-Deploy: Yes   │                  │ deploy-prod job    │
│ srv-d9vv0ak9v7es… │                  │ dispara deploy vía  │
└──────────────────┘                  │ API de Render        │
                                        └─────────┬────────┘
Vercel: auto-deploy                              ▼
Preview en cada push                 ┌──────────────────┐
a cualquier rama                      │ Render (prod)      │
                                        │ Auto-Deploy: No     │
Vercel: Production                    │ srv-da0vemmgekts…  │
deploya en cada push                  └──────────────────┘
a main
```

Puntos clave:
- **Render staging** se auto-despliega en cada push a `develop`, sin esperar a que el CI pase (es el comportamiento nativo de Render con GitHub, independiente de nuestro workflow).
- **Render producción** tiene `Auto-Deploy: No` — el **único** disparador es el job `deploy-prod` del CI, y ese job **solo corre si build+test+lint+audit pasaron** en el push a `main`.
- **Vercel** (frontend) se autogestiona: cada push a cualquier rama genera un Preview deployment; push a `main` genera un deployment de Production. Esto es independiente del CI de GitHub Actions.
- **`main` está protegida**: nadie puede pushear directo. Todo cambio a producción pasa por PR desde `develop`, con al menos 1 aprobación y el CI en verde como requisito obligatorio.

## 2. El workflow de GitHub Actions

Archivo: `.github/workflows/ci.yml`. Se dispara en `push` y `pull_request` sobre `develop` y `main`.

### Job `frontend` — Frontend (build, lint, typecheck, audit)
Corre en `frontend/`:
1. `npm ci`
2. `npm run lint` (ESLint)
3. `npx tsc --noEmit` (typecheck)
4. `npm audit --omit=dev --audit-level=high` (falla si hay vulnerabilidades High/Critical)
5. `npm run build` (build de producción de Next.js)

### Job `backend` — Backend (build, test)
1. `dotnet restore SSTerraSaaS.sln`
2. `dotnet build SSTerraSaaS.sln --configuration Release`
3. `dotnet test BackendAPI.Tests` con cobertura (`coverlet`), resultados subidos como artifact descargable desde la corrida

### Job `deploy-prod` — Deploy to Render (prod)
Condición: `github.ref == 'refs/heads/main' && github.event_name == 'push'` y `needs: [frontend, backend]` (ambos en verde).

1. Dispara `POST /v1/services/{serviceId}/deploys` en la API de Render con `RENDER_API_KEY`.
2. **No confía en el body de esa respuesta** (Render puede devolver `202` con body vacío) — hace `GET /v1/services/{serviceId}/deploys?limit=1` inmediatamente después para obtener el ID real del deploy recién creado.
3. Hace polling del estado (`GET /deploys/{deployId}`) cada 10s, hasta 8 minutos:
   - `live` → éxito.
   - `build_failed` / `update_failed` / `canceled` / `deactivated` → falla el job.
   - timeout a los 8 min → warning, no falla (recomienda revisar Render directo).

El Service ID de producción (`srv-da0vemmgekts73fttp8g`) está hardcodeado en el workflow — no es secreto, es solo un identificador.

## 3. Branch protection en `main`

Configurado vía API de GitHub (`repos/.../branches/main/protection`):
- **Required status checks** (deben pasar antes de mergear): `Frontend (build, lint, typecheck, audit)`, `Backend (build, test)`. `strict: true` (la rama debe estar actualizada con `main`).
- **Required pull request reviews**: mínimo 1 aprobación.
- Sin force-push, sin borrado de la rama.
- `enforce_admins: false` (los admins del repo pueden saltarse la regla en una emergencia real — úsalo con criterio).

Flujo real para llevar algo a producción:
```
git push origin develop
gh pr create --base main --head develop --repo cssoma-app/cssoma-app
# esperar CI verde + que alguien con acceso de escritura apruebe
gh pr merge <numero> --repo cssoma-app/cssoma-app --merge
```

## 4. Variables de entorno

Ningún valor real va en este documento ni en el repo — **solo nombres**. Los valores viven en Render, Vercel, GitHub Secrets, o `dotnet user-secrets` en local.

### 4.1 Backend — Render (staging y producción)

Mismos **nombres** en los dos servicios, valores distintos. Referencia completa con comentarios: `Backend/.env.development.example` y `Backend/.env.production.example` (no los lee .NET automáticamente — son checklist).

| Variable | Notas |
|---|---|
| `ASPNETCORE_ENVIRONMENT` | `Development` en staging, `Production` en prod |
| `ConnectionStrings__DefaultConnection` | Cadena de conexión a Postgres (Supabase) |
| `Jwt__Secret` | ≥32 caracteres (HS256 exige 256 bits mínimo). **Nunca reutilizar el mismo valor entre staging y prod.** Generar con `openssl rand -base64 48` |
| `Jwt__Issuer` | `SSTerraAPI` |
| `Jwt__Audience` | `SSTerraApp` |
| `AllowedOrigins__0` (y `__1`, `__2`…) | Origen(es) exactos permitidos por CORS — el dominio del frontend correspondiente, sin `/` final |
| `SuperAdmin__Email` | Sembrado como SuperAdmin al arrancar la app si no existe |
| `SuperAdmin__SupabaseAuthId` | Idem |
| `Resend__ApiKey` | Envío de emails transaccionales (OTP, bienvenida) |
| `Resend__FromEmail` | `info@ssterraconsultores.com` |
| `Resend__FromName` | `SSTerra Consultores` |
| `Sentry__Dsn` | Monitoreo de errores del backend. Vacío = Sentry no hace nada (no rompe) |

`PORT` **no se setea a mano** — Render lo inyecta solo y el `ENTRYPOINT` del `Backend/Dockerfile` ya lo lee (`${PORT:-8080}`).

### 4.2 Frontend — Vercel

Referencia completa: `frontend/.env.example`.

| Variable | Scope | Notas |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | build-time, pública | URL del backend (Render) correspondiente al ambiente |
| `NEXT_PUBLIC_APP_URL` | build-time, pública | URL pública del propio frontend |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | — | Reservadas para cuando se integre Supabase Auth de verdad; **hoy no se usan en el código** |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | — | Reservadas para cuando se implemente cobro; **hoy no se usan en el código** |
| `GITHUB_TOKEN` | server-only | Fine-grained PAT, permiso **Actions: Read-only** sobre `cssoma-app/cssoma-app`. Usado por `/dashboard/pipeline` |
| `RENDER_API_KEY` | server-only | API key de cuenta de Render (misma key sirve para todos los servicios de la cuenta). Usado por `/dashboard/pipeline` |
| `NEXT_PUBLIC_SENTRY_DSN` | build-time, pública | Los DSN de Sentry están diseñados para ser públicos |
| `SENTRY_AUTH_TOKEN` | server-only | Auth Token de Sentry, scope `project:read`. Usado por `/dashboard/pipeline` para el conteo de issues |
| `SENTRY_ORG` | server-only | Slug de la organización en Sentry (no la URL completa) |

**Cualquier cambio de env var en Vercel exige un Redeploy manual** (Deployments → ⋯ → Redeploy) — guardar la variable sola no alcanza, y las builds viejas no la heredan retroactivamente. Verificá también que esté tildada para el **Environment** correcto (Production vs Preview) según qué URL estés probando.

### 4.3 GitHub Actions Secrets

Repo → Settings → Secrets and variables → Actions:

| Secret | Uso |
|---|---|
| `RENDER_API_KEY` | Usado por el job `deploy-prod` para disparar el deploy real a producción |

### 4.4 Local (desarrollo, nunca committeado)

Vía `dotnet user-secrets` (no en `appsettings.json`):
```
dotnet user-secrets set "Jwt:Secret" "..." --project Backend/BackendAPI.csproj
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "..." --project Backend/BackendAPI.csproj
dotnet user-secrets set "SuperAdmin:Email" "..." --project Backend/BackendAPI.csproj
dotnet user-secrets set "SuperAdmin:SupabaseAuthId" "..." --project Backend/BackendAPI.csproj
dotnet user-secrets set "Resend:ApiKey" "..." --project Backend/BackendAPI.csproj
dotnet user-secrets set "Sentry:Dsn" "..." --project Backend/BackendAPI.csproj
```
Frontend local: `frontend/.env.local` (gitignored).

### 4.5 Identificadores que NO son secretos (pueden estar en texto plano)

| Cosa | Valor |
|---|---|
| Render service ID — staging | `srv-d9vv0ak9v7es73870e00` |
| Render service ID — producción | `srv-da0vemmgekts73fttp8g` |
| Root Directory (ambos servicios Render) | `Backend` |
| Dockerfile Path (ambos, campo de Render) | `./Dockerfile` — **relativo a la raíz del repo, no al Root Directory**, aunque el Root Directory sí define el build context |

## 5. Dashboard de estado — `/dashboard/pipeline`

Página protegida (rol `SuperAdmin`) dentro del Portal Clientes. Muestra en vivo, para `develop` y `main` por separado, las 9 etapas: Code Commit, Build, Test, Code Analysis, Artifact, Deploy Staging/Approval, Deploy Prod, Monitor.

- Los datos de Build/Test/Code Analysis salen de la API de GitHub Actions (`GITHUB_TOKEN`).
- Deploy Staging/Prod sale de la API de Render (`RENDER_API_KEY`), consultando el último deploy de cada servicio.
- Approval sale de la API de GitHub: busca el PR asociado al último commit de `main` y su estado de review.
- Monitor sale de la API de Sentry (`SENTRY_AUTH_TOKEN` + `SENTRY_ORG`): cantidad de issues sin resolver de las últimas 24h, combinado entre el proyecto frontend y backend (**todavía no separa staging de producción** — es una limitación conocida, pendiente de agregar tag de `environment`).
- Cualquier integración sin configurar se muestra honestamente como "Sin configurar", nunca se inventa un estado.
- El endpoint (`/api/pipeline-status`) está forzado a `dynamic = "force-dynamic"` para que Next.js no lo cachee — si no, puede quedar pegado a datos viejos.

## 6. Problemas reales que ya pasamos (para no repetirlos)

- **Vercel no redeploya solo con un cambio de env var.** Siempre hace falta Redeploy manual después de guardar.
- **Los API keys de Render son de cuenta, no por servicio.** Lo que distingue staging de prod es el Service ID en la URL, no la key.
- **`Jwt__Secret` corto rompe el arranque**: HS256 exige ≥256 bits (32+ caracteres). Generar con `openssl rand -base64 48`.
- **`libgssapi_krb5.so.2` faltante** en la imagen `aspnet:10.0` (Debian-slim) rompe la conexión TLS de Npgsql contra el pooler de Supabase. Se instala con `apt-get install libgssapi-krb5-2` en el stage final del `Dockerfile`.
- **Renombrar una carpeta solo de mayúscula/minúscula** (`backend` → `Backend`) falla en un solo paso en Windows/NTFS — hace falta un nombre intermedio.
- **El campo "Dockerfile Path" de Render es relativo a la raíz del repo**, no al "Root Directory" configurado — aunque el Root Directory sí controla el build context de las instrucciones `COPY` de adentro del Dockerfile.
- **El POST de creación de deploy de Render puede devolver `202` con body vacío.** No confiar en ese body para sacar el `deploy_id` — pedirlo con un `GET /deploys?limit=1` aparte.
- **`.gitignore` con `.env*` también bloquea `.env.example`** a menos que se agregue `!.env*.example` — casi nunca se commiteaba el archivo de ejemplo del frontend.
- **Instancias de `inotify` agotadas** en contenedores con límites bajos: si .NET tira ese error, setear `DOTNET_USE_POLLING_FILE_WATCHER=true`.

## 7. Cómo regenerar cosas

**Schema de base de datos** (`Backend/migration.sql`, idempotente, pegable en el SQL Editor de Supabase):
```
cd Backend
dotnet ef migrations script --idempotent -o migration.sql --project BackendAPI.csproj
```

**Un `Jwt:Secret` nuevo:**
```
openssl rand -base64 48
```

**Secret de GitHub Actions:**
```
gh secret set RENDER_API_KEY --repo cssoma-app/cssoma-app
```
(se ejecuta interactivo, el valor nunca queda en el historial de la terminal ni del chat)
