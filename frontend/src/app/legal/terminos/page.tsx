import type { Metadata } from "next"
import Link from "next/link"
import { LegalLayout } from "@/components/layout/LegalLayout"

export const metadata: Metadata = {
  title: "Términos y Condiciones | SSTerra Consultores",
  description: "Términos y condiciones de uso del sitio web y la plataforma SSTerra Consultores.",
}

export default function TerminosPage() {
  return (
    <LegalLayout title="Términos y Condiciones" updatedAt="15 de agosto de 2026">
      <div>
        <h2>1. Aceptación de los términos</h2>
        <p className="text-justify">
          Al acceder o usar el sitio web y la plataforma digital de <strong>SSTerra Consultores</strong>, operada por <strong>TECHNOLO-GIS S.A.S.</strong> (NIT 900.985.000-1), aceptas estos Términos y Condiciones. Si no estás de acuerdo, por favor no uses el sitio ni la plataforma.
        </p>
      </div>

      <div>
        <h2>2. Descripción del servicio</h2>
        <p className="text-justify">
          SSTerra Consultores presta servicios de consultoría, auditoría y asesoría técnica en Seguridad y Salud en el Trabajo (SST) e Ingeniería Ambiental, complementados por una plataforma digital propia para la gestión documental y de cumplimiento de tu empresa. El alcance específico de los servicios contratados se define en la propuesta o contrato comercial correspondiente.
        </p>
      </div>

      <div>
        <h2>3. Cuentas de usuario</h2>
        <p className="text-justify">
          El acceso al Portal de Clientes requiere una cuenta asociada a tu empresa. Eres responsable de mantener la confidencialidad de tus credenciales y de toda actividad realizada bajo tu cuenta. Notifícanos de inmediato ante cualquier uso no autorizado.
        </p>
      </div>

      <div>
        <h2>4. Uso aceptable</h2>
        <p className="text-justify">Te comprometes a no usar el sitio o la plataforma para:</p>
        <ul>
          <li>Cargar información falsa, engañosa o que infrinja derechos de terceros.</li>
          <li>Intentar acceder a datos de otras empresas (tenants) distintas a la tuya.</li>
          <li>Interferir con el funcionamiento normal de la plataforma o intentar vulnerar su seguridad.</li>
        </ul>
      </div>

      <div>
        <h2>5. Propiedad intelectual</h2>
        <p className="text-justify">
          El software, diseño, marca SSTerra/CSOMA y contenidos de este sitio son propiedad de TECHNOLO-GIS S.A.S. o de sus licenciantes. Los documentos y datos que tu empresa carga en la plataforma siguen siendo de tu propiedad; nosotros los procesamos únicamente para prestarte el servicio.
        </p>
      </div>

      <div>
        <h2>6. Disponibilidad del servicio</h2>
        <p className="text-justify">
          Hacemos esfuerzos razonables para mantener la plataforma disponible, pero no garantizamos operación ininterrumpida. Podemos realizar mantenimientos programados o correctivos que afecten temporalmente el acceso.
        </p>
      </div>

      <div>
        <h2>7. Limitación de responsabilidad</h2>
        <p className="text-justify">
          SSTerra Consultores no será responsable por daños indirectos derivados del uso o la imposibilidad de uso de la plataforma, en la medida permitida por la ley aplicable. Nuestra responsabilidad frente a servicios de consultoría contratados se rige por los términos específicos del contrato o propuesta comercial correspondiente.
        </p>
      </div>

      <div>
        <h2>8. Protección de datos</h2>
        <p className="text-justify">
          El tratamiento de los datos personales que nos suministras se rige por nuestra <Link href="/legal/tratamiento-datos">Política de Tratamiento de Datos</Link> y nuestras <Link href="/legal/privacidad">Políticas de Privacidad</Link>.
        </p>
      </div>

      <div>
        <h2>9. Ley aplicable</h2>
        <p className="text-justify">
          Estos términos se rigen por las leyes de la República de Colombia. Cualquier controversia se someterá a los jueces competentes de Medellín, Colombia, salvo que el contrato comercial específico indique otra cosa.
        </p>
      </div>

      <div>
        <h2>10. Cambios a estos términos</h2>
        <p className="text-justify">
          Podemos actualizar estos Términos y Condiciones ocasionalmente. La fecha de &ldquo;Última actualización&rdquo; en la parte superior indica la versión vigente.
        </p>
      </div>
    </LegalLayout>
  )
}
