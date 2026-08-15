import type { Metadata } from "next"
import Link from "next/link"
import { LegalLayout } from "@/components/layout/LegalLayout"

export const metadata: Metadata = {
  title: "Política de Cookies | SSTerra Consultores",
  description: "Qué cookies usa el sitio y la plataforma SSTerra Consultores.",
}

export default function CookiesPage() {
  return (
    <LegalLayout title="Política de Cookies" updatedAt="15 de agosto de 2026">
      <div>
        <h2>1. Qué es una cookie</h2>
        <p className="text-justify">
          Una cookie es un pequeño archivo que un sitio web guarda en tu navegador para recordar información entre visitas o durante una sesión.
        </p>
      </div>

      <div>
        <h2>2. Qué cookies usamos</h2>
        <p className="text-justify">
          Usamos únicamente <strong>cookies estrictamente necesarias</strong> para el funcionamiento del Portal de Clientes: una cookie de sesión que mantiene tu inicio de sesión activo mientras usas la plataforma. Sin esta cookie no es posible acceder al portal.
        </p>
        <p className="text-justify">
          Actualmente <strong>no usamos cookies de analítica, publicidad ni de terceros con fines de rastreo</strong> (por ejemplo, Google Analytics o píxeles publicitarios) en el sitio.
        </p>
      </div>

      <div>
        <h2>3. Cookies de terceros</h2>
        <p className="text-justify">
          Si haces clic en el botón de WhatsApp o en enlaces a redes sociales, esos sitios externos pueden establecer sus propias cookies conforme a sus propias políticas, ajenas a SSTerra Consultores.
        </p>
      </div>

      <div>
        <h2>4. Cómo controlar las cookies</h2>
        <p className="text-justify">
          Puedes eliminar o bloquear cookies desde la configuración de tu navegador. Ten en cuenta que bloquear la cookie de sesión te impedirá iniciar sesión en el Portal de Clientes.
        </p>
      </div>

      <div>
        <h2>5. Cambios a esta política</h2>
        <p className="text-justify">
          Si en el futuro incorporamos herramientas de analítica o mercadeo, actualizaremos esta página para reflejarlo antes de activarlas. Para más contexto sobre el uso de tus datos, revisa nuestra <Link href="/legal/privacidad">Política de Privacidad</Link>.
        </p>
      </div>
    </LegalLayout>
  )
}
