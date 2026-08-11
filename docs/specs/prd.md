# PRD: SSTerra SaaS - MVP V1

## Goals
- Desarrollar una plataforma SaaS ágil que permita a las PYMES centralizar, organizar y gestionar la documentación de Seguridad, Salud en el Trabajo (SST) y Medio Ambiente, reemplazando el uso de Excel.
- Minimizar el riesgo de multas mediante alertas de cumplimiento visuales.
- Lograr una fricción casi nula en el abordaje de nuevos usuarios mediante la importación fácil de datos.

## Target users
- **Responsable de SST / RRHH:** Persona encargada de velar por el cumplimiento normativo. Job-to-be-done: Saber rápidamente qué documentos/procesos están pendientes y actualizar el estado sin perder horas en Excel.
- **Gerente / Dueño de PYME:** Visualizar métricas de un vistazo para asegurar que la empresa cumple y no está expuesta a riesgos legales o financieros.

## User stories
- As a **Responsable de SST**, I want **subir de forma masiva mis datos desde un archivo Excel**, so that **no tener que registrar la información uno a uno y empezar a usar la plataforma rápidamente**. (Acceptance: El sistema lee .xlsx o .csv básico y alerta visualmente de errores de formato).
- As a **Responsable de SST**, I want **un panel centralizado con la lista de documentos y requisitos normativos**, so that **saber exactamente qué documentos están al día, próximos a vencer o vencidos**. (Acceptance: Indicadores visuales verde/amarillo/rojo por fecha; opción de cargar PDF asociado).
- As a **Responsable de SST**, I want **enviar recordatorios por correo a los empleados**, so that **solicitar firmas, exámenes médicos o asistencia a capacitaciones**. (Acceptance: Envío de alertas o correos pre-diseñados desde la plataforma).
- As a **Gerente / Dueño**, I want **acceder a un dashboard de métricas clave**, so that **conocer el nivel de riesgo y cumplimiento sin leer documentos técnicos**. (Acceptance: Vista de solo lectura enfocada en gráficas y % de cumplimiento).

## Non-goals (v1 scope line)
- No se incluirá integración nativa con sistemas ERP o contables de terceros (SAP, Oracle, etc.).
- No se incluirá una aplicación móvil nativa (solo web responsiva).
- No se incluirá Inteligencia Artificial avanzada de redacción (solo gestión y alertas inteligentes estructuradas).
- No habrá control de pagos ni facturación automática compleja para clientes B2C.

## Success metrics
- 80% de las PYMES que prueban la herramienta logran importar su primer Excel sin necesidad de contactar a soporte.
- Reducción del 50% en el tiempo promedio que un usuario invierte en buscar el estado de un documento vencido frente a su método anterior.
- Al menos un 30% de los gerentes ingresan a ver el dashboard al menos 1 vez a la semana.

## Open questions
- ¿Existen plantillas predeterminadas de Excel que deberíamos proveer a los usuarios para que su importación sea perfecta desde el día 1?
