using System;
using System.Linq;

namespace BackendAPI.Helpers
{
    // Valida imágenes recibidas como data URL en base64 (logos de empresa, firmas digitales, etc.)
    // antes de persistirlas. Centraliza el límite de tamaño y los formatos permitidos para que
    // todos los puntos de entrada de imágenes del sistema apliquen la misma política (Regla 2
    // AGENTS.md — evitar lógica duplicada entre servicios).
    public static class ImageValidationHelper
    {
        // ~500KB de archivo real (base64 agrega ~33% de overhead sobre el tamaño binario).
        private const int MaxDataUrlLength = 700_000;

        private static readonly string[] AllowedPrefixes =
        {
            "data:image/png;base64,",
            "data:image/jpeg;base64,",
            "data:image/webp;base64,"
        };

        /// <summary>
        /// Devuelve el data URL si cumple el formato y tamaño permitido, o null si no es válido
        /// (silencioso a propósito: la imagen nunca es un campo obligatorio, así que un valor
        /// inválido simplemente se descarta en vez de bloquear el guardado del resto del recurso).
        /// </summary>
        public static string? SanitizeImageDataUrl(string? dataUrl)
        {
            if (string.IsNullOrWhiteSpace(dataUrl))
                return null;

            if (dataUrl.Length > MaxDataUrlLength)
                return null;

            if (!AllowedPrefixes.Any(prefix => dataUrl.StartsWith(prefix, StringComparison.Ordinal)))
                return null;

            return dataUrl;
        }
    }
}
