import type { Metadata } from "next"
import Link from "next/link"
import { LegalLayout } from "@/components/layout/LegalLayout"

export const metadata: Metadata = {
  title: "Políticas de Privacidad | SSTerra Consultores",
  description: "Cómo SSTerra Consultores recolecta, usa y protege tu información personal.",
}

export default function PrivacidadPage() {
  return (
    <LegalLayout title="Políticas de Privacidad" updatedAt="15 de agosto de 2026">
      <div>
        <h2>1. Quiénes somos</h2>
        <p className="text-justify">
          Este sitio y la plataforma SSTerra son operados por <strong>TECHNOLO-GIS S.A.S.</strong> (NIT 900.985.000-1), bajo la marca comercial <strong>SSTerra Consultores</strong>. Esta política explica qué información recolectamos, cómo la usamos y qué derechos tienes sobre ella. Para el detalle formal exigido por la ley colombiana de protección de datos, consulta nuestra <Link href="/legal/tratamiento-datos">Política de Tratamiento de Datos</Link>.
        </p>
      </div>

      <div>
        <h2>2. Información que recolectamos</h2>
        <ul>
          <li><strong>Información que nos das directamente:</strong> nombre, correo, teléfono y empresa al contactarnos, registrarte o solicitar un diagnóstico.</li>
          <li><strong>Información de la cuenta:</strong> credenciales de acceso y datos de gestión SST que tu empresa carga en el portal (empleados, documentos, matrices de riesgo).</li>
          <li><strong>Información técnica básica:</strong> la generada automáticamente por tu navegador al usar el sitio (ver nuestra <Link href="/legal/cookies">Política de Cookies</Link>).</li>
        </ul>
      </div>

      <div>
        <h2>3. Cómo usamos tu información</h2>
        <p className="text-justify">
          Usamos tu información para prestarte el servicio contratado (consultoría y/o plataforma digital), enviarte comunicaciones operativas (códigos de acceso, alertas de vencimiento de documentos), responder tus consultas comerciales y cumplir obligaciones legales. No usamos tus datos para publicidad de terceros ni los vendemos a otras empresas.
        </p>
      </div>

      <div>
        <h2>4. Seguridad de la información</h2>
        <p className="text-justify">
          Las contraseñas se almacenan siempre cifradas, nunca en texto plano. El acceso a la plataforma requiere autenticación, y la información de cada empresa (tenant) está aislada del resto de clientes en nuestra base de datos. Ningún sistema es 100% invulnerable, pero aplicamos prácticas estándar de la industria para proteger tu información.
        </p>
      </div>

      <div>
        <h2>5. Con quién compartimos tu información</h2>
        <p className="text-justify">
          Compartimos información únicamente con proveedores tecnológicos necesarios para operar el servicio (hosting de base de datos, envío de correo transaccional), bajo acuerdos de confidencialidad. No compartimos tus datos con fines de mercadeo de terceros.
        </p>
      </div>

      <div>
        <h2>6. Tus derechos</h2>
        <p className="text-justify">
          Puedes solicitar acceso, corrección o eliminación de tu información en cualquier momento escribiendo a <a href="mailto:info@ssterraconsultores.com">info@ssterraconsultores.com</a>. El detalle completo del procedimiento y los plazos de respuesta está en nuestra <Link href="/legal/tratamiento-datos">Política de Tratamiento de Datos</Link>.
        </p>
      </div>

      <div>
        <h2>7. Cambios a esta política</h2>
        <p className="text-justify">
          Podemos actualizar esta política ocasionalmente. La fecha de &ldquo;Última actualización&rdquo; en la parte superior indica la versión vigente.
        </p>
      </div>
    </LegalLayout>
  )
}
