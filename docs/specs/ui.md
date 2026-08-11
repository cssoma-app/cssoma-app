# Especificaciones de Interfaz de Usuario (UI Specs)

Basado en los flujos aprobados (`flows.md`), este documento mapea cada pantalla a los componentes de **shadcn/ui** y define los estados de interacción y accesibilidad.

## 1. Landing Page (`/`)
- **Patrón de Diseño:** Full-page scroll continuo.
- **Componentes shadcn/ui:** 
  - `NavigationMenu` (Menú superior).
  - `Button` (CTAs principales: "Empezar Gratis").
  - `Card` (Testimonios y planes).
  - `Accordion` (FAQ).
- **Estados de Interacción:** 
  - **Loading:** Skeleton en el primer renderizado de imágenes pesadas.
- **Accesibilidad:** Uso de `<header>`, `<main>`, `<section>`. Navegación por teclado en `NavigationMenu`.

## 2. Login / Registro (`/login`)
- **Patrón de Diseño:** Split-panel (mitad branding, mitad formulario).
- **Componentes shadcn/ui:** 
  - `Form`, `Input`, `Label`, `Button`.
- **Estados de Interacción:** 
  - **Loading:** El botón "Continuar" cambia a *disabled* y muestra un spinner.
  - **Error:** Texto destructivo debajo del `Input` y `Toast` para errores de red.
- **Accesibilidad:** `autoFocus` en el campo de email.

## 3. Verificación OTP (`/verify-otp`)
- **Patrón de Diseño:** Tarjeta simple centrada.
- **Componentes shadcn/ui:** 
  - `Card`, `CardHeader`, `CardContent`.
  - `InputOTP` (Especializado para códigos numéricos).
  - `Button`.
- **Estados de Interacción:** 
  - **Loading:** Spinner en el botón de Verificar.
  - **Error:** Animación *shake* y texto rojo si el código es incorrecto.
- **Accesibilidad:** Enfoque automático en el primer bloque del OTP. `aria-live="polite"` para mensajes de error.

## 4. Dashboard (`/dashboard`)
- **Patrón de Diseño:** Dashboard layout (Sidebar estático/toggable, Header sticky).
- **Componentes shadcn/ui:** 
  - `Card` (Métricas).
  - `HoverCard` / `Tooltip` (Ayuda contextual).
  - *Recharts* (Gráficos integrados).
- **Estados de Interacción:** 
  - **Empty State:** Tarjeta grande indicando "Aún no hay datos para graficar" con botón primario.
  - **Loading:** Skeleton cards.
- **Accesibilidad:** `aria-label` descriptivos para todos los gráficos interactivos.

## 5. Documentos (`/documents`)
- **Patrón de Diseño:** Lista de datos con filtros.
- **Componentes shadcn/ui:** 
  - `Tabs` (Todos / Vigentes / Vencidos).
  - `DataTable` (Paginación y ordenamiento).
  - `Badge` (Colores del semáforo).
  - `Dialog` (Modal emergente para subir PDF).
- **Estados de Interacción:** 
  - **Empty State:** Ilustración amigable indicando "No tienes documentos registrados".
  - **Error:** Toast rojo si la subida a Storage falla.
- **Accesibilidad:** Focus-trap dentro del `Dialog` de subida de archivos.

## 6. Empleados (`/employees`)
- **Patrón de Diseño:** Tabla de administración.
- **Componentes shadcn/ui:** 
  - `DataTable` con soporte de `Checkbox`.
  - `DropdownMenu` (Acciones masivas).
  - `Avatar`.
- **Estados de Interacción:** 
  - **Loading:** Skeleton rows en la tabla.
  - **Empty State:** "No hay empleados registrados."
- **Accesibilidad:** Checkboxes accesibles mediante barra espaciadora.

## 7. Configuración / Importación (`/settings/import`)
- **Patrón de Diseño:** Tarjeta con "Dropzone".
- **Componentes shadcn/ui:** 
  - `Card`.
  - Dropzone personalizada con bordes punteados.
  - `Progress` (Barra de progreso de subida).
  - `Alert` (Resumen de importación).
- **Estados de Interacción:** 
  - **Loading:** Cambio visual al hacer drag-and-drop y barra de progreso.
  - **Error:** `Alert` estilo destructivo.
- **Accesibilidad:** `input type="file"` oculto pero accesible por teclado para adjuntar archivos sin mouse.
