// Validación y lectura de imágenes pequeñas (logos de empresa, etc.) en el cliente antes de
// enviarlas al backend como data URL en base64. Mantiene los archivos livianos por diseño —
// nunca se sube nada más pesado de lo que necesita un encabezado de formulario.
export const MAX_LOGO_SIZE_BYTES = 500 * 1024 // 500KB
export const MAX_LOGO_DIMENSION = 1000 // px
export const MIN_LOGO_DIMENSION = 32 // px
export const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export interface ImageValidationResult {
  ok: boolean
  error?: string
  dataUrl?: string
}

export function validateAndReadImage(file: File): Promise<ImageValidationResult> {
  return new Promise((resolve) => {
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      resolve({ ok: false, error: 'Formato no permitido. Usa PNG, JPEG o WebP.' })
      return
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      resolve({
        ok: false,
        error: `El archivo pesa ${(file.size / 1024).toFixed(0)}KB. El máximo permitido es ${MAX_LOGO_SIZE_BYTES / 1024}KB.`
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const img = new window.Image()
      img.onload = () => {
        if (img.width < MIN_LOGO_DIMENSION || img.height < MIN_LOGO_DIMENSION) {
          resolve({ ok: false, error: `La imagen es muy pequeña (mínimo ${MIN_LOGO_DIMENSION}x${MIN_LOGO_DIMENSION}px).` })
          return
        }
        if (img.width > MAX_LOGO_DIMENSION || img.height > MAX_LOGO_DIMENSION) {
          resolve({
            ok: false,
            error: `La imagen es muy grande (máximo ${MAX_LOGO_DIMENSION}x${MAX_LOGO_DIMENSION}px). Redúcela e inténtalo de nuevo.`
          })
          return
        }
        resolve({ ok: true, dataUrl })
      }
      img.onerror = () => resolve({ ok: false, error: 'No se pudo leer la imagen. Verifica que el archivo no esté dañado.' })
      img.src = dataUrl
    }
    reader.onerror = () => resolve({ ok: false, error: 'No se pudo leer el archivo.' })
    reader.readAsDataURL(file)
  })
}
