import type { Metadata } from "next"
import { LegalLayout } from "@/components/layout/LegalLayout"

export const metadata: Metadata = {
  title: "Tratamiento de Datos | SSTerra Consultores",
  description: "Política de tratamiento de datos personales de SSTerra Consultores, conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.",
}

export default function TratamientoDatosPage() {
  return (
    <LegalLayout title="Política de Tratamiento de Datos Personales" updatedAt="15 de agosto de 2026">
      <div>
        <h2>1. Responsable del tratamiento</h2>
        <p className="text-justify">
          <strong>TECHNOLO-GIS S.A.S.</strong>, identificada con NIT <strong>900.985.000-1</strong>, operadora de la marca comercial <strong>SSTerra Consultores</strong> (CSOMA), con domicilio en Medellín, Colombia, es responsable del tratamiento de los datos personales recolectados a través de este sitio web y de la plataforma digital SSTerra.
        </p>
        <p className="text-justify">
          Canal de contacto para asuntos de protección de datos: <a href="mailto:info@ssterraconsultores.com">info@ssterraconsultores.com</a> · WhatsApp <a href="https://wa.me/573108465617" target="_blank" rel="noopener noreferrer">+57 310 8465617</a>.
        </p>
      </div>

      <div>
        <h2>2. Marco normativo</h2>
        <p className="text-justify">
          Esta política se rige por la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas que los reglamenten, modifiquen o sustituyan, que regulan el derecho constitucional de todas las personas a conocer, actualizar y rectificar la información que se haya recolectado sobre ellas (Habeas Data).
        </p>
      </div>

      <div>
        <h2>3. Datos que recolectamos</h2>
        <p className="text-justify">Según el servicio que utilices, podemos recolectar:</p>
        <ul>
          <li>Datos de identificación y contacto: nombre completo, correo electrónico, teléfono, empresa y cargo.</li>
          <li>Credenciales de acceso a la plataforma: correo electrónico y contraseña (almacenada siempre cifrada, nunca en texto plano).</li>
          <li>Información propia de la gestión de Seguridad y Salud en el Trabajo (SST) que tu empresa registra en la plataforma: datos de empleados, documentos, matrices de riesgo y registros de cumplimiento asociados a tu organización (tenant).</li>
          <li>Comunicaciones que nos envíes por WhatsApp, correo electrónico o formularios de contacto.</li>
        </ul>
      </div>

      <div>
        <h2>4. Finalidad del tratamiento</h2>
        <p className="text-justify">Los datos se usan para:</p>
        <ul>
          <li>Crear y administrar tu cuenta y la de tu empresa en la plataforma SSTerra.</li>
          <li>Prestar los servicios de consultoría, auditoría y gestión SST/ambiental contratados.</li>
          <li>Enviar códigos de acceso, credenciales y notificaciones operativas del servicio (por ejemplo, vencimiento de documentos).</li>
          <li>Responder solicitudes, cotizaciones y consultas comerciales.</li>
          <li>Cumplir obligaciones legales y contractuales aplicables a nuestra actividad.</li>
        </ul>
        <p className="text-justify">No usamos tus datos personales con fines publicitarios de terceros ni los vendemos.</p>
      </div>

      <div>
        <h2>5. A quién podemos compartir tus datos</h2>
        <p className="text-justify">
          Para operar la plataforma trabajamos con proveedores tecnológicos que procesan datos en nuestro nombre, bajo acuerdos de confidencialidad: proveedor de infraestructura de base de datos, y proveedor de envío de correo transaccional (códigos de acceso y notificaciones). No transferimos tus datos a terceros para fines comerciales ajenos a la prestación del servicio.
        </p>
      </div>

      <div>
        <h2>6. Derechos del titular</h2>
        <p className="text-justify">Como titular de tus datos personales, tienes derecho a:</p>
        <ul>
          <li>Conocer, actualizar y rectificar tus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada para el tratamiento.</li>
          <li>Ser informado sobre el uso que se le ha dado a tus datos.</li>
          <li>Revocar la autorización y/o solicitar la supresión de tus datos, cuando no exista un deber legal o contractual que impida eliminarlos.</li>
          <li>Acceder gratuitamente a tus datos personales.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley de protección de datos.</li>
        </ul>
      </div>

      <div>
        <h2>7. Procedimiento para ejercer tus derechos</h2>
        <p className="text-justify">
          Las solicitudes de consulta, actualización, rectificación o supresión de datos deben enviarse a <a href="mailto:info@ssterraconsultores.com">info@ssterraconsultores.com</a>, indicando tu nombre completo, documento de identidad y una descripción clara de la solicitud. Las consultas se atienden en un máximo de diez (10) días hábiles, prorrogable por cinco (5) días hábiles adicionales; los reclamos se resuelven en un máximo de quince (15) días hábiles, prorrogable por ocho (8) días hábiles adicionales.
        </p>
      </div>

      <div>
        <h2>8. Vigencia</h2>
        <p className="text-justify">
          Los datos personales se conservarán durante el tiempo en que sean necesarios para las finalidades descritas y, posteriormente, durante los plazos exigidos por la ley aplicable. Esta política puede actualizarse; los cambios sustanciales se comunicarán por los canales oficiales de SSTerra Consultores.
        </p>
      </div>
    </LegalLayout>
  )
}
