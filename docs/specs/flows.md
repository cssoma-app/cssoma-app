# Mapa de Flujos de Usuario (User Journeys) v2

Basado en la validación y el PRD, estos son los flujos principales y el inventario de pantallas para la v1 del SaaS de SSTerra.

## 1. Viajes Propuestos (Journeys)

### Journey A: Landing Page (Marketing y SEO)
1. Un cliente potencial busca en Google y llega a `/` (Landing Page de alta conversión).
2. Lee la propuesta de valor con un SEO altamente optimizado.
3. Hace clic en "Empezar Gratis" o "Registrarse" y es llevado a `/login`.

### Journey B: Autenticación con OTP y Onboarding
1. El usuario entra a `/login` e ingresa su correo.
2. El sistema envía un correo con un **OTP (Código de 4 dígitos)** usando un servicio genérico de envío de correos (ej. Resend o SendGrid).
3. El usuario ingresa el OTP en la pantalla de verificación.
4. Si es exitoso y es primera vez, se crea su `Tenant` (Empresa) y es redirigido al Dashboard.

### Journey C: Importación de Excel y Repositorio de Documentos
1. El Responsable SST entra a la vista de Importación.
2. Arrastra y suelta un archivo `.xlsx`.
3. **Paso Dual:** 
   - El sistema almacena físicamente el archivo original en el Repositorio de Documentos (Supabase Storage).
   - El sistema extrae los datos del Excel y los inserta en la base de datos relacional.
4. Muestra un resumen de éxito y errores de formato.

### Journey D: Gestión Documental y Semáforo de Cumplimiento
1. En el Dashboard, el usuario ve los indicadores clave: 
   - **Verde**: Al día.
   - **Amarillo**: Vencimiento próximo / Revisión pendiente.
   - **Rojo**: Faltante por cumplir / Vencido.
2. Navega a "Documentos" donde puede filtrar por estos estados.
3. Para solventar un estado Rojo, el usuario carga el documento en PDF (el cual también se subirá a Supabase Storage).

### Journey E: Gestión de Empleados y Recordatorios Masivos
1. En "Empleados", se seleccionan múltiples trabajadores.
2. El sistema utiliza el servicio genérico de correos para despachar en masa los recordatorios de exámenes y capacitaciones.

---

## 2. Lista de Pantallas (Screen Inventory)

| Nombre de Pantalla | Ruta | Auth Requerida | Propósito y Estados Clave |
|--------------------|------|----------------|---------------------------|
| Landing Page       | `/` | No | Marketing, SEO muy alto, Call-to-action principal. |
| Login / Registro   | `/login` | No | Ingreso de correo electrónico. |
| Verificación OTP   | `/verify-otp` | No | Pantalla para ingresar los 4 dígitos enviados al correo. |
| Dashboard          | `/dashboard` | Sí | Semáforo de cumplimiento global. |
| Documentos         | `/documents` | Sí | Lista filtrable. Subida de PDFs. |
| Empleados          | `/employees` | Sí | Selección múltiple y botón de envíos masivos. |
| Configuración / Importación | `/settings/import` | Sí | Carga de archivos y listado de Excel históricos guardados en Storage. |
