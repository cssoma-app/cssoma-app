# Arquitectura de Sistema: SSTerra SaaS

## Resumen
El sistema adopta una arquitectura desacoplada y orientada a microservicios/Background Jobs para asegurar un alto rendimiento en la carga masiva de datos (archivos Excel).

## Diagrama de Capas

1. **Frontend Web (Next.js App Router)**
   - Renderizado React Server Components (RSC) y Client Components.
   - Capa de presentación con Tailwind CSS + shadcn/ui.
   - Comunica de manera segura con el Backend a través de llamadas HTTP protegidas por JWT.

2. **Backend API (ASP.NET Core Web API)**
   - API RESTful o GraphQL que expone los servicios de negocio.
   - Actúa como la única puerta de enlace autorizada para modificar datos en la base de datos principal.
   - EF Core actúa como ORM, implementando Global Query Filters para seguridad multi-tenant estricta.

3. **Autenticación e Identidad (Supabase Auth)**
   - Provee los JWT (JSON Web Tokens) cuando los usuarios (Responsables de SST / Gerentes) inician sesión.
   - Estos tokens son enviados desde el Frontend al Backend API para la autorización (Role-Based Access Control).

4. **Persistencia (Supabase PostgreSQL + Supabase Storage)**
   - PostgreSQL como motor de base de datos relacional primario.
   - Storage para los archivos PDFs y Excels.

5. **Colas de Mensajes y Background Jobs (RabbitMQ + Redis)**
   - La API recibe un archivo Excel, lo guarda en Supabase Storage, y emite un mensaje a RabbitMQ para ser procesado por un `BackgroundService` en .NET.
   - Redis actúa como caché distribuido para guardar estado temporal, métricas ejecutivas pre-calculadas para el Dashboard, y SignalR Backplane si requerimos WebSockets.

## Directorios y Módulos de Repositorios

- `/frontend` (Next.js): Vistas, componentes UI, hooks de cliente.
- `/backend` (ASP.NET Core): Controladores, Servicios de Dominio, DbContext (EF Core), Modelos, Migraciones.

## Registro de Decisiones Arquitectónicas (ADR)
- [0001: Arquitectura Backend Desacoplada (ASP.NET Core + Microservicios)](./adr/0001-backend-stack.md)
