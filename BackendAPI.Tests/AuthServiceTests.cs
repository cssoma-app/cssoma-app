using System;
using System.Threading.Tasks;
using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Moq;
using Xunit;

namespace BackendAPI.Tests
{
    public class AuthServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<IOTPService> _mockOtpService;
        private readonly Mock<IEmailService> _mockEmailService;
        private readonly Mock<ITokenService> _mockTokenService;
        private readonly Mock<IPasswordHasher<User>> _mockPasswordHasher;
        private readonly AuthService _authService;

        public AuthServiceTests()
        {
            // Configurar base de datos en memoria para pruebas
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _dbContext = new ApplicationDbContext(options);

            // Sembrar los roles del sistema (mismo patrón que DatabaseInitializer) para que
            // los Include(u => u.Role) resuelvan correctamente sobre la FK requerida.
            _dbContext.Roles.AddRange(
                new Role { Id = RoleKeys.SuperAdminId, Key = RoleKeys.SuperAdmin, DisplayName = "Super Administrador" },
                new Role { Id = RoleKeys.AdminId, Key = RoleKeys.Admin, DisplayName = "Administrador de Empresa" },
                new Role { Id = RoleKeys.MemberId, Key = RoleKeys.Member, DisplayName = "Colaborador" }
            );
            _dbContext.SaveChanges();

            _mockOtpService = new Mock<IOTPService>();
            _mockEmailService = new Mock<IEmailService>();
            _mockTokenService = new Mock<ITokenService>();
            _mockPasswordHasher = new Mock<IPasswordHasher<User>>();

            _authService = new AuthService(
                _dbContext,
                _mockOtpService.Object,
                _mockEmailService.Object,
                _mockTokenService.Object,
                _mockPasswordHasher.Object
            );
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        [Fact]
        public async Task RequestCodeAsync_WithUnregisteredEmail_ReturnsFalse()
        {
            // Arrange
            var unregisteredEmail = "notregistered@csoma.com";

            // Act
            var result = await _authService.RequestCodeAsync(unregisteredEmail);

            // Assert
            Assert.False(result);
            _mockOtpService.Verify(o => o.GenerateCode(It.IsAny<string>()), Times.Never);
            _mockEmailService.Verify(e => e.SendSecurityCodeAsync(It.IsAny<string>(), It.IsAny<string>()), Times.Never);
        }

        [Fact]
        public async Task RequestCodeAsync_WithRegisteredEmail_GeneratesAndSendsCode()
        {
            // Arrange
            var registeredEmail = "cliente@csoma.com.co";
            var mockCode = "9876";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = registeredEmail,
                RoleId = RoleKeys.AdminId,
                SupabaseAuthId = "auth-id-1"
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockOtpService.Setup(o => o.GenerateCode(registeredEmail)).Returns(mockCode);
            _mockEmailService.Setup(e => e.SendSecurityCodeAsync(registeredEmail, mockCode)).Returns(Task.CompletedTask);

            // Act
            var result = await _authService.RequestCodeAsync(registeredEmail);

            // Assert
            Assert.True(result);
            _mockOtpService.Verify(o => o.GenerateCode(registeredEmail), Times.Once);
            _mockEmailService.Verify(e => e.SendSecurityCodeAsync(registeredEmail, mockCode), Times.Once);
        }

        [Fact]
        public async Task VerifyCodeAsync_WithInvalidCode_ReturnsNull()
        {
            // Arrange
            var email = "cliente@csoma.com.co";
            var invalidCode = "0000";

            _mockOtpService.Setup(o => o.ValidateCode(email, invalidCode)).Returns(false);

            // Act
            var token = await _authService.VerifyCodeAsync(email, invalidCode);

            // Assert
            Assert.Null(token);
            _mockTokenService.Verify(t => t.GenerateToken(It.IsAny<User>()), Times.Never);
        }

        [Fact]
        public async Task VerifyCodeAsync_WithValidCodeAndUser_ReturnsJwtToken()
        {
            // Arrange
            var email = "cliente@csoma.com.co";
            var validCode = "1234";
            var expectedToken = "mocked-jwt-token";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                RoleId = RoleKeys.AdminId,
                SupabaseAuthId = "auth-id-2"
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockOtpService.Setup(o => o.ValidateCode(email, validCode)).Returns(true);
            _mockTokenService.Setup(t => t.GenerateToken(It.IsAny<User>())).Returns(expectedToken);

            // Act
            var token = await _authService.VerifyCodeAsync(email, validCode);

            // Assert
            Assert.Equal(expectedToken, token);
            _mockTokenService.Verify(t => t.GenerateToken(It.Is<User>(u => u.Email == email)), Times.Once);
        }

        [Fact]
        public async Task LoginWithPasswordAsync_WithValidCredentials_ReturnsToken()
        {
            // Arrange
            var email = "active@csoma.com";
            var rawPassword = "SecurePass123!";
            var hashedPassword = "hashed-representation";
            var expectedToken = "jwt-password-success";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = hashedPassword,
                RoleId = RoleKeys.MemberId
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, hashedPassword, rawPassword))
                .Returns(PasswordVerificationResult.Success);
            _mockTokenService.Setup(t => t.GenerateToken(user)).Returns(expectedToken);

            // Act
            var token = await _authService.LoginWithPasswordAsync(email, rawPassword);

            // Assert
            Assert.Equal(expectedToken, token);
        }

        [Fact]
        public async Task SetPasswordAsync_WithValidUser_HashesAndSavesPassword()
        {
            // Arrange
            var email = "newuser@csoma.com";
            var rawPassword = "MyNewPassword99!";
            var hashedPassword = "securely-hashed-new-pass";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                RoleId = RoleKeys.AdminId
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockPasswordHasher.Setup(h => h.HashPassword(user, rawPassword)).Returns(hashedPassword);

            // Act
            // Act
            var result = await _authService.SetPasswordAsync(email, rawPassword);

            // Assert
            Assert.True(result);
            _mockPasswordHasher.Verify(h => h.HashPassword(user, rawPassword), Times.Once);
            
            var updatedUser = await _dbContext.Users.IgnoreQueryFilters().FirstAsync(u => u.Email == email);
            Assert.Equal(hashedPassword, updatedUser.PasswordHash);
        }

        [Fact]
        public async Task SetPasswordAsync_WithWeakPassword_ThrowsArgumentException()
        {
            // Arrange
            var email = "weak@csoma.com";
            var weakPassword = "123";

            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                RoleId = RoleKeys.AdminId
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() =>
                _authService.SetPasswordAsync(email, weakPassword));
        }

        [Fact]
        public async Task LoginWithPasswordDetailsAsync_WithWrongPassword_IncrementsFailedAttempts()
        {
            var email = "lockout-test@csoma.com";
            var user = new User { Id = Guid.NewGuid(), Email = email, PasswordHash = "hash", RoleId = RoleKeys.MemberId };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hash", "wrong"))
                .Returns(PasswordVerificationResult.Failed);

            var result = await _authService.LoginWithPasswordDetailsAsync(email, "wrong");

            Assert.Null(result);
            var updated = await _dbContext.Users.IgnoreQueryFilters().FirstAsync(u => u.Email == email);
            Assert.Equal(1, updated.FailedLoginAttempts);
            Assert.Null(updated.LockedUntil);
        }

        [Fact]
        public async Task LoginWithPasswordDetailsAsync_AfterFiveFailedAttempts_LocksAccount()
        {
            var email = "lockme@csoma.com";
            var user = new User { Id = Guid.NewGuid(), Email = email, PasswordHash = "hash", RoleId = RoleKeys.MemberId };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hash", "wrong"))
                .Returns(PasswordVerificationResult.Failed);

            for (var i = 0; i < 5; i++)
            {
                await _authService.LoginWithPasswordDetailsAsync(email, "wrong");
            }

            var updated = await _dbContext.Users.IgnoreQueryFilters().FirstAsync(u => u.Email == email);
            Assert.Equal(5, updated.FailedLoginAttempts);
            Assert.NotNull(updated.LockedUntil);
            Assert.True(updated.LockedUntil > DateTime.UtcNow);
        }

        [Fact]
        public async Task LoginWithPasswordDetailsAsync_WhenLockedOut_ReturnsNullEvenWithCorrectPassword()
        {
            var email = "locked-correct-pw@csoma.com";
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = "hash",
                RoleId = RoleKeys.MemberId,
                LockedUntil = DateTime.UtcNow.AddMinutes(10)
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Ni siquiera se llega a verificar la contraseña: bloqueado corta antes.
            _mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hash", "correct"))
                .Returns(PasswordVerificationResult.Success);

            var result = await _authService.LoginWithPasswordDetailsAsync(email, "correct");

            Assert.Null(result);
        }

        [Fact]
        public async Task LoginWithPasswordDetailsAsync_WithCorrectPassword_ResetsFailedAttempts()
        {
            var email = "recovers@csoma.com";
            var expectedToken = "jwt-after-recovery";
            var user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                PasswordHash = "hash",
                RoleId = RoleKeys.MemberId,
                FailedLoginAttempts = 3
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hash", "correct"))
                .Returns(PasswordVerificationResult.Success);
            _mockTokenService.Setup(t => t.GenerateToken(It.IsAny<User>())).Returns(expectedToken);

            var result = await _authService.LoginWithPasswordDetailsAsync(email, "correct");

            Assert.NotNull(result);
            Assert.Equal(expectedToken, result!.Token);
            var updated = await _dbContext.Users.IgnoreQueryFilters().FirstAsync(u => u.Email == email);
            Assert.Equal(0, updated.FailedLoginAttempts);
            Assert.Null(updated.LockedUntil);
        }

        [Fact]
        public async Task LoginWithPasswordDetailsAsync_DisabledAccount_WithWrongPassword_ReturnsGenericNull()
        {
            // Antes del fix, una cuenta deshabilitada tiraba un mensaje específico ANTES de
            // verificar la contraseña, filtrando el estado de la cuenta a cualquiera que
            // probara ese email. Ahora la contraseña incorrecta siempre da null genérico.
            var email = "disabled-wrong-pw@csoma.com";
            var user = new User { Id = Guid.NewGuid(), Email = email, PasswordHash = "hash", RoleId = RoleKeys.MemberId, IsDisabled = true };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hash", "wrong"))
                .Returns(PasswordVerificationResult.Failed);

            var result = await _authService.LoginWithPasswordDetailsAsync(email, "wrong");

            Assert.Null(result);
        }

        [Fact]
        public async Task LoginWithPasswordDetailsAsync_DisabledAccount_WithCorrectPassword_ThrowsSpecificMessage()
        {
            // Recién con la contraseña correcta (ownership probado) es seguro revelar el motivo.
            var email = "disabled-correct-pw@csoma.com";
            var user = new User { Id = Guid.NewGuid(), Email = email, PasswordHash = "hash", RoleId = RoleKeys.MemberId, IsDisabled = true };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            _mockPasswordHasher.Setup(h => h.VerifyHashedPassword(user, "hash", "correct"))
                .Returns(PasswordVerificationResult.Success);

            await Assert.ThrowsAsync<ArgumentException>(() =>
                _authService.LoginWithPasswordDetailsAsync(email, "correct"));
        }
    }
}
