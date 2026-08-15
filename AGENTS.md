<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de Desarrollo del Proyecto (SSTerra SaaS)

Las siguientes reglas son de carácter **MANDATORIO y OBLIGATORIO** para cualquier agente de codificación de inteligencia artificial que trabaje en esta base de código:

## 1. Principios SOLID
- **S (Responsabilidad Única)**: Cada clase, controlador o componente debe tener una única razón para cambiar.
- **O (Abierto/Cerrado)**: El código debe estar abierto para extensión pero cerrado para modificación. Utilizar herencia o composición adecuadamente.
- **L (Sustitución de Liskov)**: Las clases derivadas deben poder ser sustituidas por sus clases base sin alterar el comportamiento.
- **I (Segregación de Interfaces)**: Diseñar interfaces pequeñas, específicas y enfocadas.
- **D (Inversión de Dependencias)**: Depender siempre de abstracciones (interfaces), nunca de implementaciones concretas. Utilizar el contenedor de Inversión de Control (IoC/DI) de .NET.

## 2. Patrones de Diseño de Software
- **Inyección de Dependencias (Dependency Injection)**: Es de carácter obligatorio utilizar inyección por constructor (`Constructor Injection`). Queda prohibido resolver servicios manualmente o utilizar el patrón Service Locator dentro de las clases de negocio.
- **Capa de Servicios (Service Layer)**: Toda la lógica de negocio debe residir en servicios desacoplados y testeables. Los controladores de API deben mantenerse delgados (Thin Controllers) delegando la lógica a los servicios.
- **Patrón Estrategia (Strategy)**: Para comportamientos que puedan variar según configuración (ej. envío de correos, autenticación), se deben definir interfaces y múltiples implementaciones (ej. `MockEmailService` y `ResendEmailService`), seleccionando la adecuada dinámicamente mediante el contenedor IoC.
- **Patrón Fábrica (Factory)**: Utilizar fábricas cuando la creación de objetos requiera lógica dinámica o dependa de recursos externos. Es obligatorio el uso de `IHttpClientFactory` para instanciar clientes HTTP, evitando fugas de sockets por instanciación directa de `HttpClient`.
- **Repository / Unit of Work**: Utilizar EF Core `DbContext` como unidad de trabajo. Cualquier encapsulamiento adicional de persistencia debe seguir patrones limpios y ser registrado en el contenedor DI.

## 3. Seguridad de Software y Datos
- **Sin Valores Quemados**: Nunca guardar contraseñas, secretos, tokens, llaves de API o correos fijos en el código fuente. Todo debe leerse desde la configuración (`appsettings.json`, variables de entorno o almacenes secretos de claves).
- **Haseado de Contraseñas**: Nunca almacenar contraseñas en texto plano. Utilizar siempre implementaciones seguras basadas en algoritmos de derivación de claves resistentes (ej. `IPasswordHasher<T>` de ASP.NET Core que implementa PBKDF2/HMAC-SHA256).
- **Normalización**: Normalizar los textos sensibles de usuario (ej. correos y contraseñas) con estándares Unicode `NFC` en el punto de entrada.
- **Protección contra Inyecciones**: Validar y sanitizar todas las entradas contra inyecciones SQL e inyecciones de código/scripting en el frontend y backend.

## 4. Pruebas Unitarias (Testing)
- Cada nuevo servicio de negocio, validador o lógica crítica debe contar con cobertura de pruebas unitarias correspondientes.
- Las pruebas en el backend deben implementarse en el proyecto de pruebas usando `xUnit` y `Moq`.

## 5. Prevención de Inyecciones y Sanitización de Entradas
- **SQL Injection**: Queda estrictamente prohibida la concatenación de variables en consultas SQL. Toda consulta a la base de datos debe realizarse a través de LINQ parameterizado de Entity Framework Core o pasando parámetros tipados (`NpgsqlParameter`) en consultas SQL personalizadas.
- **Inyección de Scripts y HTML (XSS)**: Cualquier texto proporcionado por el usuario (ej. correos, descripciones, nombres) debe ser normalizado a formato Unicode `FormC` y sanitizado. Se deben codificar o remover caracteres peligrosos (`<`, `>`, `"`, `'`, `;`, `--`) en los puntos de entrada (Controladores).
- **Normalización**: Es obligatorio invocar `.Normalize(NormalizationForm.FormC)` en strings sensibles ingresados por usuarios para evitar ataques de evasión de firmas o fallos de comparación por caracteres compuestos Unicode.

## 6. Idempotencia en APIs Mutantes
- **Idempotencia Obligatoria**: Todo endpoint de creación o modificación de recursos (`POST` o `PATCH` de carácter no idempotente por especificación HTTP) debe admitir la cabecera `Idempotency-Key` (formato UUID/GUID v4).
- **Control de Peticiones Concurrentes**: Si dos peticiones con la misma clave de idempotencia ocurren al mismo tiempo, el servidor debe responder con un código `409 Conflict`.
- **Caché de Respuestas Exitosas**: Si una petición es exitosa (`2xx`), el resultado debe almacenarse en caché (ej. mediante `IMemoryCache` o redis) durante al menos 10 minutos para ser retornado inmediatamente en llamadas duplicadas posteriores, evitando re-ejecuciones costosas en la base de datos o envíos de correo repetidos.

## 7. Flujo de Entrega (Git)
- **Preguntar al terminar una tarea de desarrollo**: Al completar cualquier tarea de desarrollo (feature, fix, refactor), el agente DEBE preguntar al usuario si desea subir los cambios a `origin/develop`. Si la respuesta es sí, invocar el skill `push-develop` (`.claude/skills/push-develop/SKILL.md`) — no reimplementar el flujo de git manualmente.
- **No preguntar** tras tareas puramente exploratorias/de lectura (sin cambios en el árbol de trabajo).
