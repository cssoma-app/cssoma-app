using System;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace BackendAPI.Services
{
    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IOTPService _otpService;
        private readonly IEmailService _emailService;
        private readonly ITokenService _tokenService;
        private readonly IPasswordHasher<User> _passwordHasher;

        public AuthService(
            ApplicationDbContext dbContext,
            IOTPService otpService,
            IEmailService emailService,
            ITokenService tokenService,
            IPasswordHasher<User> passwordHasher)
        {
            _dbContext = dbContext;
            _otpService = otpService;
            _emailService = emailService;
            _tokenService = tokenService;
            _passwordHasher = passwordHasher;
        }

        public async Task<bool> RequestCodeAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            var cleanedEmail = email.ToLower().Trim();

            var userExists = await _dbContext.Users
                .IgnoreQueryFilters()
                .AnyAsync(u => u.Email.ToLower() == cleanedEmail);

            if (!userExists)
                return false;

            // Generar y almacenar el código
            var code = _otpService.GenerateCode(cleanedEmail);

            // Enviar correo
            await _emailService.SendSecurityCodeAsync(cleanedEmail, code);

            return true;
        }

        public async Task<string?> VerifyCodeAsync(string email, string code)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(code))
                return null;

            var cleanedEmail = email.ToLower().Trim();

            // Validar el código
            var isValid = _otpService.ValidateCode(cleanedEmail, code);
            if (!isValid)
                return null;

            // Obtener el usuario correspondiente
            var user = await _dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanedEmail);

            if (user == null)
                return null;

            // Retornar un token temporal o simplemente JWT de éxito
            return _tokenService.GenerateToken(user);
        }

        public async Task<string?> LoginWithPasswordAsync(string email, string password)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                return null;

            var cleanedEmail = email.ToLower().Trim();

            var user = await _dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanedEmail);

            if (user == null)
                return null;

            // Si el usuario no ha configurado una contraseña
            if (string.IsNullOrWhiteSpace(user.PasswordHash))
                return null;

            // Verificar la contraseña
            var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
            if (verificationResult == PasswordVerificationResult.Failed)
                return null;

            // Generar y retornar JWT
            return _tokenService.GenerateToken(user);
        }

        public async Task<bool> SetPasswordAsync(string email, string newPassword)
        {
            if (string.IsNullOrWhiteSpace(email))
                return false;

            if (string.IsNullOrWhiteSpace(newPassword))
                throw new ArgumentException("La contraseña no puede estar vacía.");

            // Validación de robustez de contraseña
            if (newPassword.Length < 8)
                throw new ArgumentException("La contraseña debe tener al menos 8 caracteres.");

            bool hasUpper = false;
            bool hasLower = false;
            bool hasDigit = false;
            bool hasSpecial = false;

            foreach (char c in newPassword)
            {
                if (char.IsUpper(c)) hasUpper = true;
                else if (char.IsLower(c)) hasLower = true;
                else if (char.IsDigit(c)) hasDigit = true;
                else if (!char.IsLetterOrDigit(c)) hasSpecial = true;
            }

            if (!hasUpper || !hasLower)
                throw new ArgumentException("La contraseña debe contener letras mayúsculas y minúsculas.");
            if (!hasDigit)
                throw new ArgumentException("La contraseña debe contener al menos un número.");
            if (!hasSpecial)
                throw new ArgumentException("La contraseña debe contener al menos un carácter especial (ej. @, $, !, %, *, ?, &).");

            var cleanedEmail = email.ToLower().Trim();

            var user = await _dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanedEmail);

            if (user == null)
                return false;

            // Hashear y guardar contraseña
            user.PasswordHash = _passwordHasher.HashPassword(user, newPassword);
            user.IsTemporaryPassword = false;
            
            _dbContext.Users.Update(user);
            await _dbContext.SaveChangesAsync();

            return true;
        }

        public async Task<string?> UpdateProfileAndGetTokenAsync(string currentEmail, string newName, string newEmail)
        {
            if (string.IsNullOrWhiteSpace(currentEmail) || string.IsNullOrWhiteSpace(newName) || string.IsNullOrWhiteSpace(newEmail))
                throw new ArgumentException("El nombre y el correo electrónico son requeridos.");

            var cleanCurrent = currentEmail.ToLower().Trim();
            var cleanNewEmail = newEmail.ToLower().Trim();

            var user = await _dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanCurrent);

            if (user == null)
                return null;

            if (cleanCurrent != cleanNewEmail)
            {
                var emailTaken = await _dbContext.Users
                    .IgnoreQueryFilters()
                    .AnyAsync(u => u.Email.ToLower() == cleanNewEmail && u.Id != user.Id);

                if (emailTaken)
                    throw new ArgumentException("El correo electrónico ya está en uso por otro usuario.");

                user.Email = cleanNewEmail;
            }

            user.FullName = newName.Trim();

            _dbContext.Users.Update(user);
            await _dbContext.SaveChangesAsync();

            return _tokenService.GenerateToken(user);
        }

        public async Task<LoginResult?> LoginWithPasswordDetailsAsync(string email, string password)
        {
            if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
                return null;

            var cleanedEmail = email.ToLower().Trim();

            var user = await _dbContext.Users
                .IgnoreQueryFilters()
                .Include(u => u.Tenant)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanedEmail);

            if (user == null)
                return null;

            if (user.Tenant != null && !user.Tenant.IsActive)
                throw new ArgumentException("Tu empresa se encuentra desactivada temporalmente. Comunícate con el administrador de SSTerra.");

            if (string.IsNullOrWhiteSpace(user.PasswordHash))
                return null;

            var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, password);
            if (verificationResult == PasswordVerificationResult.Failed)
                return null;

            return new LoginResult
            {
                Token = _tokenService.GenerateToken(user),
                MustChangePassword = user.IsTemporaryPassword
            };
        }

        public async Task<string?> ChangeTempPasswordAndGetTokenAsync(string email, string newPassword)
        {
            var success = await SetPasswordAsync(email, newPassword);
            if (!success) return null;

            var cleanedEmail = email.ToLower().Trim();
            var user = await _dbContext.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(u => u.Email.ToLower() == cleanedEmail);

            if (user == null) return null;

            return _tokenService.GenerateToken(user);
        }
    }
}
