using System;
using System.Text;
using System.Text.RegularExpressions;

namespace BackendAPI.Helpers
{
    public static class InputSanitizer
    {
        // Caracteres peligrosos según Regla 5 (AGENTS.md): <, >, ", ', ; y el comentario SQL --.
        // OJO: un guion suelto ("-") NO es peligroso y es parte legítima de texto normal
        // (ej. "SG-SST", "900.123.456-7"); solo se remueve la secuencia "--" (comentario SQL).
        private static readonly Regex InjectionRegex = new Regex(@"[<>'""`;]", RegexOptions.Compiled);
        private static readonly Regex SqlLineCommentRegex = new Regex(@"--", RegexOptions.Compiled);
        private static readonly Regex TagRegex = new Regex(@"<[^>]*>", RegexOptions.Compiled);
        private static readonly Regex ScriptBlockRegex = new Regex(@"<script\b[^>]*>[\s\S]*?</script\s*>", RegexOptions.Compiled | RegexOptions.IgnoreCase);
        private static readonly Regex SqlBlockCommentRegex = new Regex(@"/\*.*?\*/", RegexOptions.Compiled | RegexOptions.Singleline);

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

            // 2. Remover etiquetas HTML/XML completas (incluye el nombre de la etiqueta)
            var sanitized = TagRegex.Replace(normalized, string.Empty);

            // 3. Limpieza de caracteres de inyección
            sanitized = InjectionRegex.Replace(sanitized, string.Empty);
            sanitized = SqlLineCommentRegex.Replace(sanitized, string.Empty);

            // 4. Forzar minúsculas para correos consistente
            return sanitized.ToLowerInvariant();
        }

        /// <summary>
        /// Sanitiza texto libre ingresado por el usuario (ej. nombres) aplicando
        /// normalización Unicode FormC y removiendo etiquetas/caracteres de inyección,
        /// sin forzar minúsculas.
        /// </summary>
        public static string SanitizeText(string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                return string.Empty;

            var normalized = text.Normalize(NormalizationForm.FormC).Trim();
            var sanitized = TagRegex.Replace(normalized, string.Empty);
            sanitized = InjectionRegex.Replace(sanitized, string.Empty);
            sanitized = SqlLineCommentRegex.Replace(sanitized, string.Empty);

            return sanitized;
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

            // 2. Remover bloques <script>...</script> completos (incluye el contenido)
            var sanitized = ScriptBlockRegex.Replace(normalized, string.Empty);

            // 3. Remover cualquier otra etiqueta HTML/XML restante
            sanitized = TagRegex.Replace(sanitized, string.Empty);

            // 4. Remover bloques de comentario SQL /* ... */ completos (incluye el contenido)
            sanitized = SqlBlockCommentRegex.Replace(sanitized, string.Empty);

            // 5. Eliminar comentarios de línea SQL (--)
            sanitized = sanitized.Replace("--", string.Empty);

            return sanitized;
        }
    }
}
