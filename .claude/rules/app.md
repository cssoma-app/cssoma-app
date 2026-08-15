## Applies to
`frontend/src/app/**`

## Standards
- MUST use Server Components by default and add `"use client"` only when interactivity requires it.
- MUST NOT embed secrets or API keys in client components.
- MUST validate all inputs at the boundary (e.g. zod) antes de enviarlos a la API en C#.
- SHOULD keep data-fetching in Server Components realizando peticiones HTTP a la API REST de ASP.NET Core usando `fetch`.
- MUST no usar directamente la base de datos PostgreSQL desde Next.js; todo debe pasar por el backend C#.
- MUST NOT prefix secret environment variables with `NEXT_PUBLIC_` — that prefix bundles the value into the client.
- MUST aplicar `text-justify` (Tailwind) a párrafos de texto largo/multilínea (contenido legal, descripciones, cuerpo de artículos). No aplicar a labels cortos, badges, títulos ni texto centrado de una sola línea.
