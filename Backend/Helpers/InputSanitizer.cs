using System;
using System.Text;
using System.Text.RegularExpressions;

namespace BackendAPI.Helpers
{
    public static class InputSanitizer
    {
        private static readonly Regex InjectionRegex = new Regex(@"[<>'""`;\-]", RegexOptions.Compiled);

        /// <summary>
        /// Sanitiza un correo electrónico aplicando normalización Unicode FormC,
        /// convirtiendo a minúsculas, recortando espacios y eliminando caracteres maliciosos de inyección.
        /// </summary>
        public static string SanitizeEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return string.Empty;

            // 1. Normalización Unicode FormC
            var normalized = email.Normalize(NormalizationForm.FormC).Trim();

            // 2. Limpieza de caracteres de inyección
            var sanitized = InjectionRegex.Replace(normalized, string.Empty);

            // 3. Forzar minúsculas para correos consistente
            return sanitized.ToLowerInvariant();
        }

        /// <summary>
        /// Sanitiza una contraseña aplicando normalización Unicode FormC
        /// y protegiéndola contra inyecciones de código HTML/Tags y SQL básicos,
        /// sin alterar caracteres especiales válidos de contraseñas.
        /// </summary>
        public static string SanitizePassword(string password)
        {
            if (string.IsNullOrWhiteSpace(password))
                return string.Empty;

            // 1. Normalización Unicode FormC
            var normalized = password.Normalize(NormalizationForm.FormC);

            // 2. Remover etiquetas HTML/XML básicas y tags scripts para evitar XSS
            var sanitized = Regex.Replace(normalized, @"<[^>]*>", string.Empty);

            // 3. Eliminar caracteres específicos de comentarios SQL maliciosos (-- o /*)
            sanitized = sanitized.Replace("--", string.Empty).Replace("/*", string.Empty).Replace("*/", string.Empty);

            return sanitized;
        }
    }
}
