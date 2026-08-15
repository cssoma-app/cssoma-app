## Applies to
`**/Backend/Controllers/**`, `**/frontend/src/app/**`, y cualquier archivo que maneje autenticación o llamadas a API.

## Standards
- MUST usar Supabase Auth en el cliente web (Next.js) para iniciar sesión y recuperar el JSON Web Token (JWT).
- MUST enviar el JWT en la cabecera HTTP `Authorization: Bearer <token>` en todas las llamadas desde el frontend hacia la API ASP.NET Core.
- MUST configurar el middleware de autenticación en ASP.NET Core (`AddJwtBearer`) para validar los tokens de Supabase verificando la firma, la fecha de expiración y la audiencia.
- MUST usar el atributo `[Authorize]` en todos los endpoints de la API, excepto en los explícitamente públicos.
- MUST asegurar que los roles y permisos del usuario se lean y verifiquen en el servidor ASP.NET Core basándose en la identidad del token.
