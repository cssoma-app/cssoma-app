/**
 * Sanitiza una contraseña aplicando normalización Unicode FormC
 * y eliminando vectores de inyección (scripts, tags, comentarios SQL y caracteres de inyección directa),
 * preservando caracteres especiales válidos como guiones individuales (-), @, $, !, %, *, ?, &, #, ., etc.
 */
export function sanitizePassword(password: string): string {
  if (!password) return ""

  // 1. Normalización Unicode FormC (NFC)
  let sanitized = password.normalize("NFC")

  // 2. Remover bloques <script>...</script> completos
  sanitized = sanitized.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")

  // 3. Remover etiquetas HTML/XML restantes
  sanitized = sanitized.replace(/<[^>]*>/g, "")

  // 4. Remover bloques de comentario SQL /* ... */
  sanitized = sanitized.replace(/\/\*[\s\S]*?\*\//g, "")

  // 5. Remover comentarios de línea SQL (--)
  sanitized = sanitized.replace(/--+/g, "")

  // 6. Remover caracteres peligrosos sueltos (<, >, ;, `)
  sanitized = sanitized.replace(/[<>;`]/g, "")

  return sanitized
}

/**
 * Sanitiza un correo electrónico aplicando normalización Unicode FormC (NFC),
 * convirtiendo a minúsculas, recortando espacios y eliminando caracteres maliciosos de inyección.
 * Preserva caracteres legítimos de correos como guiones (-), puntos (.) y subguiones (_).
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ""

  // 1. Normalización Unicode FormC y recorte
  let sanitized = email.normalize("NFC").trim().toLowerCase()

  // 2. Remover etiquetas HTML/XML
  sanitized = sanitized.replace(/<[^>]*>/g, "")

  // 3. Remover caracteres de inyección (<, >, ', ", ;, `, y comentarios SQL --)
  // OJO: El guión suelto (-) NO se elimina porque es parte legítima de correos electrónicos.
  sanitized = sanitized.replace(/[<>'";`]/g, "")
  sanitized = sanitized.replace(/--+/g, "")

  return sanitized
}
