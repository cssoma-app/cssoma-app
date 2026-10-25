using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace BackendAPI.Tests
{
    public class SgSstResponsibleDesignationServiceTests : IDisposable
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;
        private readonly IResolucion0312ComplianceValidator _validator = new Resolucion0312ComplianceValidator();

        private readonly Guid _tenantAId = Guid.NewGuid();
        private readonly Guid _tenantBId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();

        public SgSstResponsibleDesignationServiceTests()
        {
            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _mockCurrentUser = new Mock<ICurrentUserService>();
            _dbContext = new ApplicationDbContext(options, _mockCurrentUser.Object);

            _dbContext.Tenants.AddRange(
                new Tenant { Id = _tenantAId, Name = "Empresa A", RazonSocial = "A S.A.S.", NitRuc = "1", IsActive = true, NumeroTrabajadores = 30, ClaseRiesgo = "I" },
                new Tenant { Id = _tenantBId, Name = "Empresa B", RazonSocial = "B S.A.S.", NitRuc = "2", IsActive = true, NumeroTrabajadores = 30, ClaseRiesgo = "I" }
            );
            _dbContext.SgSstFunctionCatalogs.Add(new SgSstFunctionCatalog { Id = 1, Code = "F01", Title = "Función 1", Description = "Desc", DisplayOrder = 1, IsActive = true });
            _dbContext.SaveChanges();
        }

        public void Dispose()
        {
            _dbContext.Database.EnsureDeleted();
            _dbContext.Dispose();
        }

        private void SetActingTenant(Guid tenantId)
        {
            _mockCurrentUser.Setup(c => c.TenantId).Returns(tenantId);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
        }

        private SgSstResponsibleDesignationService BuildService() =>
            new(_dbContext, _mockCurrentUser.Object, _validator);

        private static CreateSgSstResponsibleDesignationInput BuildValidInput(string nombre = "Juan Perez") => new()
        {
            CoberturaCentroTrabajo = "Sede Central",
            ResponsableNombreCompleto = nombre,
            ResponsableCargo = "Coordinador SST",
            ResponsableTipoDocumento = DocumentIdType.Cc,
            ResponsableNumeroDocumento = "123456",
            NivelCompetencia = SstCompetencyLevel.TecnicoSst,
            LicenciaSstNumero = "L-123",
            LicenciaSstExpedidaPor = "Secretaria de Salud",
            EmpleadorAceptaNombre = "Maria Lopez",
            EmpleadorAceptaCargo = "Representante Legal",
            EmpleadorAceptaDocumento = "987654",
            ResponsableAceptaNombre = nombre,
            ResponsableAceptaLicencia = "L-123",
            ResponsableAceptaDocumento = "123456",
            SuscripcionCiudad = "Bogota",
            SuscripcionFecha = DateTime.UtcNow,
            FunctionAcceptances = new List<FunctionAcceptanceInput>
            {
                new() { FunctionId = 1, IsAccepted = true }
            }
        };

        [Fact]
        public async Task CreateAsync_FirstDesignation_IsVersion1AndActive()
        {
            SetActingTenant(_tenantAId);
            var service = BuildService();

            var result = await service.CreateAsync(BuildValidInput(), _userId);

            Assert.Equal(ServiceOutcome.Ok, result.Outcome);
            Assert.Equal(1, result.Data!.Version);
            Assert.Equal(SgSstDesignationStatus.Active, result.Data.Status);
        }

        [Fact]
        public async Task CreateAsync_SecondDesignation_SupersedesFirstAndIncrementsVersion()
        {
            SetActingTenant(_tenantAId);
            var service = BuildService();

            await service.CreateAsync(BuildValidInput("Primero"), _userId);
            var second = await service.CreateAsync(BuildValidInput("Segundo"), _userId);

            Assert.Equal(2, second.Data!.Version);
            Assert.Equal(SgSstDesignationStatus.Active, second.Data.Status);

            var history = await service.GetHistoryAsync();
            Assert.Equal(2, history.Data!.Count);
            Assert.Single(history.Data, d => d.Status == SgSstDesignationStatus.Superseded && d.Version == 1);
            Assert.Single(history.Data, d => d.Status == SgSstDesignationStatus.Active && d.Version == 2);
        }

        // Prueba de aislamiento por tenant (obligatoria — regla tests.md): una designación creada
        // para el Tenant A nunca debe ser visible ni afectable desde el contexto del Tenant B.
        [Fact]
        public async Task TenantIsolation_DesignationCreatedForTenantA_IsInvisibleToTenantB()
        {
            SetActingTenant(_tenantAId);
            var serviceAsA = BuildService();
            await serviceAsA.CreateAsync(BuildValidInput(), _userId);

            SetActingTenant(_tenantBId);
            var serviceAsB = BuildService();

            var currentForB = await serviceAsB.GetCurrentAsync();
            var historyForB = await serviceAsB.GetHistoryAsync();

            Assert.Null(currentForB.Data);
            Assert.Empty(historyForB.Data!);
        }

        [Fact]
        public async Task TenantIsolation_RawQueryIgnoringFilters_ConfirmsRowIsTenantScoped()
        {
            SetActingTenant(_tenantAId);
            var serviceAsA = BuildService();
            await serviceAsA.CreateAsync(BuildValidInput(), _userId);

            // Sin filtro de tenant (IgnoreQueryFilters), la fila sigue existiendo con el TenantId
            // correcto — confirma que el aislamiento lo aplica el query filter y no un borrado real.
            var raw = await _dbContext.SgSstResponsibleDesignations.IgnoreQueryFilters().ToListAsync();
            Assert.Single(raw);
            Assert.Equal(_tenantAId, raw[0].TenantId);
        }

        [Fact]
        public async Task CreateAsync_NonAdminNonSuperAdmin_IsForbidden()
        {
            _mockCurrentUser.Setup(c => c.TenantId).Returns(_tenantAId);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(false);
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
            var service = BuildService();

            var result = await service.CreateAsync(BuildValidInput(), _userId);

            Assert.Equal(ServiceOutcome.Forbidden, result.Outcome);
        }
    }
}
