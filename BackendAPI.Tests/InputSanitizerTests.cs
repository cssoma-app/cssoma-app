using System;
using BackendAPI.Helpers;
using Xunit;

namespace BackendAPI.Tests
{
    public class InputSanitizerTests
    {
        [Theory]
        [InlineData("test<script>@csoma.com", "test@csoma.com")]
        // El guion y el signo igual ya NO se eliminan (regla 5 solo exige remover <, >, ", ', ; y --;
        // un guion suelto es texto legítimo, ej. "SG-SST" — ver InputSanitizer).
        [InlineData("admin'OR'1'='1@ssterra.com", "adminor1=1@ssterra.com")]
        [InlineData("  user;DROP;TABLE@csoma.com.co  ", "userdroptable@csoma.com.co")]
        [InlineData("CORREO_CON_MAYUSCULAS@CSOMA.COM", "correo_con_mayusculas@csoma.com")]
        public void SanitizeEmail_ShouldCleanAndNormalizeEmail(string input, string expected)
        {
            // Act
            var result = InputSanitizer.SanitizeEmail(input);

            // Assert
            Assert.Equal(expected, result);
        }

        [Theory]
        [InlineData("NormalPass123!", "NormalPass123!")]
        [InlineData("pass<script>alert('xss')</script>word", "password")]
        [InlineData("adminPassword-- Comment", "adminPassword Comment")]
        [InlineData("myPass/*comment*/word", "myPassword")]
        public void SanitizePassword_ShouldRemoveDangerousSqlAndHtmlTags(string input, string expected)
        {
            // Act
            var result = InputSanitizer.SanitizePassword(input);

            // Assert
            Assert.Equal(expected, result);
        }
    }
}
