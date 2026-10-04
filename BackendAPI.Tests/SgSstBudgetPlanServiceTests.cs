using BackendAPI.Data;
using BackendAPI.Models;
using BackendAPI.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Moq;

namespace BackendAPI.Tests
{
    public class SgSstBudgetPlanServiceTests : IDisposable
    {
        // SQLite en memoria (no el proveedor InMemory de EF) porque SaveDraftAsync/CreateAsync usan
        // ExecuteDeleteAsync — un DELETE masivo por filtro, necesario para que un guardado de
        // borrador no dependa de que las filas sigan trackeadas (ver comentario en
        // SgSstBudgetPlanService.SaveDraftAsync). El proveedor InMemory de EF Core no soporta
        // ExecuteDelete/ExecuteUpdate; SQLite sí, y al ser una base relacional real ejercita el mismo
        // camino de código que Postgres en producción. La conexión debe mantenerse abierta durante
        // todo el test — una base ":memory:" de SQLite se destruye en cuanto la conexión se cierra.
        private readonly SqliteConnection _connection;
        private readonly ApplicationDbContext _dbContext;
        private readonly Mock<ICurrentUserService> _mockCurrentUser;

        private readonly Guid _tenantAId = Guid.NewGuid();
        private readonly Guid _tenantBId = Guid.NewGuid();
        private readonly Guid _userId = Guid.NewGuid();

        public SgSstBudgetPlanServiceTests()
        {
            _connection = new SqliteConnection("Filename=:memory:");
            _connection.Open();

            var options = new DbContextOptionsBuilder<ApplicationDbContext>()
                .UseSqlite(_connection)
                .Options;

            _mockCurrentUser = new Mock<ICurrentUserService>();
            _dbContext = new ApplicationDbContext(options, _mockCurrentUser.Object);
            _dbContext.Database.EnsureCreated();

            _dbContext.Tenants.AddRange(
                new Tenant { Id = _tenantAId, Name = "Empresa A", RazonSocial = "A S.A.S.", NitRuc = "1", IsActive = true, NumeroTrabajadores = 30, ClaseRiesgo = "I" },
                new Tenant { Id = _tenantBId, Name = "Empresa B", RazonSocial = "B S.A.S.", NitRuc = "2", IsActive = true, NumeroTrabajadores = 30, ClaseRiesgo = "I" }
            );
            _dbContext.SaveChanges();
        }

        public void Dispose()
        {
            _dbContext.Dispose();
            _connection.Dispose();
        }

        private void SetActingTenant(Guid tenantId)
        {
            _mockCurrentUser.Setup(c => c.TenantId).Returns(tenantId);
            _mockCurrentUser.Setup(c => c.IsAdmin).Returns(true);
            _mockCurrentUser.Setup(c => c.IsSuperAdmin).Returns(false);
        }

        private SgSstBudgetPlanService BuildService() => new(_dbContext, _mockCurrentUser.Object);

        private static CreateSgSstBudgetPlanInput BuildValidInput(int vigencia = 2026) => new()
        {
            Vigencia = vigencia,
            RepresentanteLegalNombre = "Maria Lopez",
            RepresentanteLegalDocumento = "987654",
            ResponsableSgSstNombre = "Juan Perez",
            ResponsableSgSstDocumento = "123456",
            LineItems = new List<BudgetLineItemInput>
            {
                new()
                {
                    CategoriaNombre = "1. RECURSOS HUMANOS",
                    CategoriaOrder = 1,
                    DisplayOrder = 1,
                    Codigo = "RH-01",
                    Concepto = "Contratación de responsable SG-SST",
                    FasePhva = SstPhvaPhase.Planear,
                    MesProgramado = "Enero - Diciembre",
                    ValorPresupuestado = 12000000m,
                    ValorEjecutado = 6000000m,
                    AreaResponsable = "Talento Humano",
                    SoporteComprobante = "Factura"
                },
                new()
                {
                    CategoriaNombre = "2. RECURSOS TÉCNICOS Y FÍSICOS",
                    CategoriaOrder = 2,
                    DisplayOrder = 1,
                    Codigo = "RT-01",
                    Concepto = "Compra de elementos de protección personal",
                    FasePhva = SstPhvaPhase.Hacer,
                    MesProgramado = "Trimestral",
                    ValorPresupuestado = 5000000m,
                    ValorEjecutado = 0m,
                    AreaResponsable = "Compras",
                    SoporteComprobante = "Factura"
                }
            }
        };

        [Fact]
        public async Task CreateAsync_FirstPlan_IsVersion1AndActive()
        {
            SetActingTenant(_tenantAId);
            var service = BuildService();

            var result = await service.CreateAsync(BuildValidInput(), _userId);

            Assert.Equal(ServiceOutcome.Ok, result.Outcome);
            Assert.Equal(1, result.Data!.Version);
            Assert.Equal(SgSstDesignationStatus.Active, result.Data.Status);
        }

        [Fact]
        public async Task CreateAsync_SecondPlan_SupersedesFirstAndIncrementsVersion()
        {
            SetActingTenant(_tenantAId);
            var service = BuildService();

            await service.CreateAsync(BuildValidInput(), _userId);
            var second = await service.CreateAsync(BuildValidInput(2027), _userId);

            Assert.Equal(2, second.Data!.Version);
            Assert.Equal(SgSstDesignationStatus.Active, second.Data.Status);

            var history = await service.GetHistoryAsync();
            Assert.Equal(2, history.Data!.Count);
            Assert.Single(history.Data, p => p.Status == SgSstDesignationStatus.Superseded && p.Version == 1);
            Assert.Single(history.Data, p => p.Status == SgSstDesignationStatus.Active && p.Version == 2);
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

        [Fact]
        public async Task CreateAsync_NoLineItems_IsBadRequest()
        {
            SetActingTenant(_tenantAId);
            var service = BuildService();
            var input = BuildValidInput();
            input.LineItems = new List<BudgetLineItemInput>();

            var result = await service.CreateAsync(input, _userId);

            Assert.Equal(ServiceOutcome.BadRequest, result.Outcome);
        }

        // Prueba de aislamiento por tenant (obligatoria — regla tests.md): un presupuesto creado
        // para el Tenant A nunca debe ser visible ni afectable desde el contexto del Tenant B.
        [Fact]
        public async Task TenantIsolation_PlanCreatedForTenantA_IsInvisibleToTenantB()
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
            var raw = await _dbContext.SgSstBudgetPlans.IgnoreQueryFilters().ToListAsync();
            Assert.Single(raw);
            Assert.Equal(_tenantAId, raw[0].TenantId);
        }

        [Fact]
        public async Task MapToDto_TwoCategoriesOneWithZeroExecution_ComputesCriticalCategoryCorrectly()
        {
            SetActingTenant(_tenantAId);
            var service = BuildService();

            var result = await service.CreateAsync(BuildValidInput(), _userId);

            Assert.Equal(ServiceOutcome.Ok, result.Outcome);
            Assert.Equal(1, result.Data!.GrandTotal.CategoriasCriticas);

            var criticalCategory = result.Data.CategorySummaries.Single(c => c.CategoriaNombre == "2. RECURSOS TÉCNICOS Y FÍSICOS");
            Assert.Equal("Crítico", criticalCategory.Estado);

            var inProgressCategory = result.Data.CategorySummaries.Single(c => c.CategoriaNombre == "1. RECURSOS HUMANOS");
            Assert.Equal("En Progreso", inProgressCategory.Estado);
        }

        // Regresión: guardar el mismo borrador dos veces seguidas (el flujo real de "Guardar
        // Borrador" repetido) no debe lanzar DbUpdateConcurrencyException, y el segundo guardado
        // debe reemplazar por completo los rubros del primero, no acumularlos.
        [Fact]
        public async Task SaveDraftAsync_CalledTwiceInARow_ReplacesLineItemsWithoutThrowing()
        {
            SetActingTenant(_tenantAId);
            var service = BuildService();

            var first = await service.SaveDraftAsync(BuildValidInput(), _userId);
            Assert.Equal(ServiceOutcome.Ok, first.Outcome);
            Assert.Equal(2, first.Data!.LineItems.Count);

            var secondInput = BuildValidInput(2027);
            secondInput.LineItems = new List<BudgetLineItemInput>
            {
                new()
                {
                    CategoriaNombre = "1. RECURSOS HUMANOS",
                    CategoriaOrder = 1,
                    DisplayOrder = 1,
                    Concepto = "Capacitación anual",
                    FasePhva = SstPhvaPhase.Hacer,
                    MesProgramado = "Marzo",
                    ValorPresupuestado = 3000000m,
                    ValorEjecutado = 0m,
                    AreaResponsable = "Talento Humano"
                }
            };

            var second = await service.SaveDraftAsync(secondInput, _userId);

            Assert.Equal(ServiceOutcome.Ok, second.Outcome);
            Assert.Single(second.Data!.LineItems);
            Assert.Equal("Capacitación anual", second.Data.LineItems[0].Concepto);
            Assert.Equal(2027, second.Data.Vigencia);

            var draftResult = await service.GetDraftAsync();
            Assert.Equal(ServiceOutcome.Ok, draftResult.Outcome);
            Assert.Single(draftResult.Data!.LineItems);
        }
    }
}
