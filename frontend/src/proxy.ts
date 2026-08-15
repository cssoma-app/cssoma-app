import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value
  const { pathname } = request.nextUrl

  // Proteger rutas del Dashboard y configuraciones privadas
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/documents") || pathname.startsWith("/employees") || pathname.startsWith("/settings"))) {
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Redireccionar al dashboard si un usuario autenticado intenta entrar al login
  if (token && pathname === "/login") {
    const dashboardUrl = new URL("/dashboard", request.url)
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
}
