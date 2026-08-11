# ADR 0001: Arquitectura Backend Desacoplada (ASP.NET Core + Microservicios)

## Contexto
El SaaS está orientado a PYMES para la gestión de Seguridad, Salud en el Trabajo y Medio Ambiente. Procesar archivos grandes de Excel (importación masiva de datos) y orquestar recordatorios y alertas requiere un procesamiento asíncrono fuerte. Adicionalmente, el proyecto tiene proyecciones de escalar rápidamente, por lo que la arquitectura monolítica estándar de Next.js con Server Actions puede quedarse corta en separación de responsabilidades y tareas pesadas en segundo plano.

## Opciones Consideradas
1. **Next.js + Server Actions + Supabase (Por defecto):** Rápido desarrollo, pero acopla fuertemente el frontend con el backend y depende de Serverless Functions que tienen límites de tiempo (timeout) al procesar archivos grandes.
2. **Next.js Frontend + ASP.NET Core Backend + Supabase Auth/DB + Redis/RabbitMQ:** Separación estricta de repositorios. El backend se desarrolla en C# (Enterprise-grade), usando EF Core para conectarse a PostgreSQL en Supabase, Supabase Auth para identidad (Validación JWT), Redis para caché, y RabbitMQ (o Azure Service Bus) para colas de trabajo pesado (ej. parseo de Excel).

## Decisión
Se ha decidido implementar la **Opción 2 (Arquitectura Desacoplada)**. 
- **Frontend:** Next.js (Repositorio separado).
- **Backend:** ASP.NET Core Web API (Repositorio separado).
- **Base de datos / Identidad:** Supabase (PostgreSQL + Auth).
- **Background Jobs:** RabbitMQ / Azure Service Bus + Redis.

## Consecuencias
- **Positivas:** Mayor escalabilidad, separación clara de responsabilidades, mejor manejo de tareas asíncronas pesadas (archivos Excel). Código de backend fuertemente tipado e independiente.
- **Negativas:** Mayor sobrecarga de infraestructura (se necesitan contenedores/App Services para la API y la cola de mensajes). Las políticas de RLS de Supabase ya no se gestionarán directamente desde el cliente web de manera general, sino que el Backend actuará como orquestador seguro con su propio DbContext multi-tenant usando Global Query Filters de EF Core.
