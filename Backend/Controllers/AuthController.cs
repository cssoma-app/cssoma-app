using System.Threading.Tasks;
using BackendAPI.Helpers;
using BackendAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using BackendAPI.Filters;
using Microsoft.AspNetCore.RateLimiting;

namespace BackendAPI.Controllers
{
    [Idempotent]
    [EnableRateLimiting("AuthLimit")]
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IOTPService _otpService;

        public AuthController(IAuthService authService, IOTPService otpService)
        {
            _authService = authService;
            _otpService = otpService;
        }

        [HttpPost("request-code")]
        public async Task<IActionResult> RequestCode([FromBody] RequestCodeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email))
            {
                return BadRequest(new { Message = "El correo electrónico es requerido." });
            }

            // Sanitizar entrada
            request.Email = InputSanitizer.SanitizeEmail(request.Email);

            var result = await _authService.RequestCodeAsync(request.Email);

            if (!result)
            {
                return StatusCode(403, new { Message = "Este correo electrónico no está autorizado como cliente." });
            }

            return Ok(new { Message = "Código de seguridad enviado con éxito." });
        }

        [HttpPost("verify-code")]
        public async Task<IActionResult> VerifyCode([FromBody] VerifyCodeRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { Message = "El correo electrónico y el código de verificación son requeridos." });
            }

            // Sanitizar entrada
            request.Email = InputSanitizer.SanitizeEmail(request.Email);
            request.Code = request.Code.Trim();

            var token = await _authService.VerifyCodeAsync(request.Email, request.Code);

            if (string.IsNullOrEmpty(token))
            {
                return BadRequest(new { Message = "Código de acceso inválido, expirado o ya utilizado." });
            }

            return Ok(new { Token = token });
        }

        [HttpPost("login-password")]
        public async Task<IActionResult> LoginWithPassword([FromBody] LoginPasswordRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new { Message = "El correo electrónico y la contraseña son requeridos." });
            }

            // Sanitizar entradas
            request.Email = InputSanitizer.SanitizeEmail(request.Email);
            request.Password = InputSanitizer.SanitizePassword(request.Password);

            try
            {
                var result = await _authService.LoginWithPasswordDetailsAsync(request.Email, request.Password);

                if (result == null)
                {
                    return Unauthorized(new { Message = "Correo electrónico o contraseña incorrectos." });
                }

                return Ok(new { Token = result.Token, MustChangePassword = result.MustChangePassword });
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [HttpPost("set-password")]
        public async Task<IActionResult> SetPassword([FromBody] SetPasswordRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Email) || 
                string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.Code))
            {
                return BadRequest(new { Message = "Todos los campos (correo, código y contraseña) son requeridos." });
            }

            // Sanitizar entradas
            request.Email = InputSanitizer.SanitizeEmail(request.Email);
            request.Password = InputSanitizer.SanitizePassword(request.Password);
            request.Code = request.Code.Trim();

            // Validar código de seguridad primero
            var isCodeValid = _otpService.ValidateCode(request.Email, request.Code);
            if (!isCodeValid)
            {
                return BadRequest(new { Message = "El código de seguridad es inválido o ha expirado." });
            }

            // Actualizar contraseña
            try
            {
                var result = await _authService.SetPasswordAsync(request.Email, request.Password);
                if (!result)
                {
                    return BadRequest(new { Message = "No se pudo establecer la contraseña del usuario." });
                }
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }

            // Iniciar sesión automáticamente
            var token = await _authService.LoginWithPasswordAsync(request.Email, request.Password);

            return Ok(new { Message = "Contraseña configurada con éxito.", Token = token });
        }

        [Authorize]
        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.NewName) || string.IsNullOrWhiteSpace(request.NewEmail))
            {
                return BadRequest(new { Message = "El nombre y el correo electrónico son requeridos." });
            }

            var currentEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                               ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(currentEmail))
            {
                return Unauthorized(new { Message = "No se pudo identificar el usuario autenticado." });
            }

            try
            {
                var newEmailSanitized = InputSanitizer.SanitizeEmail(request.NewEmail);
                var newNameSanitized = request.NewName.Trim();

                var newToken = await _authService.UpdateProfileAndGetTokenAsync(currentEmail, newNameSanitized, newEmailSanitized);
                if (string.IsNullOrEmpty(newToken))
                {
                    return BadRequest(new { Message = "Usuario no encontrado." });
                }

                return Ok(new { Message = "Perfil actualizado con éxito.", Token = newToken });
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }

        [Authorize]
        [HttpPut("change-temp-password")]
        public async Task<IActionResult> ChangeTempPassword([FromBody] ChangeTempPasswordRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest(new { Message = "La nueva contraseña es requerida." });
            }

            var currentEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value 
                               ?? User.FindFirst("email")?.Value;

            if (string.IsNullOrEmpty(currentEmail))
            {
                return Unauthorized(new { Message = "No se pudo identificar el usuario autenticado." });
            }

            try
            {
                var passwordSanitized = InputSanitizer.SanitizePassword(request.NewPassword);
                var newToken = await _authService.ChangeTempPasswordAndGetTokenAsync(currentEmail, passwordSanitized);
                if (string.IsNullOrEmpty(newToken))
                {
                    return BadRequest(new { Message = "No se pudo actualizar la contraseña. Usuario no encontrado o contraseña inválida." });
                }

                return Ok(new { Message = "Contraseña actualizada exitosamente.", Token = newToken });
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
        }
    }

    public class ChangeTempPasswordRequest
    {
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdateProfileRequest
    {
        public string NewName { get; set; } = string.Empty;
        public string NewEmail { get; set; } = string.Empty;
    }

    public class RequestCodeRequest
    {
        public string Email { get; set; } = string.Empty;
    }

    public class VerifyCodeRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
    }

    public class LoginPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class SetPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }
}
