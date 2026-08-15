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
                Role = UserRole.SST_Manager,
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
                Role = UserRole.SST_Manager,
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
                Role = UserRole.General_Manager
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
                Role = UserRole.SST_Manager
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
                Role = UserRole.SST_Manager
            };
            _dbContext.Users.Add(user);
            await _dbContext.SaveChangesAsync();

            // Act & Assert
            await Assert.ThrowsAsync<ArgumentException>(() => 
                _authService.SetPasswordAsync(email, weakPassword));
        }
    }
}
