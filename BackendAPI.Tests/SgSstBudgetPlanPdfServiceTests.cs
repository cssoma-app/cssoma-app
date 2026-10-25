using BackendAPI.Models;
using BackendAPI.Services;

namespace BackendAPI.Tests
{
    public class SgSstBudgetPlanPdfServiceTests
    {
        static SgSstBudgetPlanPdfServiceTests()
        {
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        }

        private const string TinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

        private static List<BudgetLineItemDto> BuildLineItems()
        {
            return new List<BudgetLineItemDto>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    CategoriaNombre = "1. RECURSOS HUMANOS",
                    CategoriaOrder = 1,
                    DisplayOrder = 1,
                    Codigo = "RH-01",
                    Concepto = "Contratación de responsable SG-SST",
                    FasePhva = SstPhvaPhase.Planear,
                    MesProgramado = "Enero - Diciembre",
                    ValorPresupuestado = 12000000m,
                    ValorEjecutado = 12000000m,
                    Desviacion = 0m,
                    PctEjecucion = 1.0,
                    Estado = "Completado",
                    AreaResponsable = "Talento Humano",
                    SoporteComprobante = "Factura"
                },
                new()
                {
                    Id = Guid.NewGuid(),
                    CategoriaNombre = "2. RECURSOS TÉCNICOS Y FÍSICOS",
                    CategoriaOrder = 2,
                    DisplayOrder = 1,
                    Codigo = "RT-01",
                    Concepto = "Compra de elementos de protección personal",
                    FasePhva = SstPhvaPhase.Hacer,
                    MesProgramado = "Trimestral",
                    ValorPresupuestado = 5000000m,
                    ValorEjecutado = 0m,
                    Desviacion = 5000000m,
                    PctEjecucion = 0.0,
                    Estado = "Crítico",
                    AreaResponsable = "Compras",
                    SoporteComprobante = "Factura"
                }
            };
        }

        private static List<BudgetCategorySummaryDto> BuildCategorySummaries()
        {
            return new List<BudgetCategorySummaryDto>
            {
                new()
                {
                    CategoriaNombre = "1. RECURSOS HUMANOS",
                    CategoriaOrder = 1,
                    TotalPresupuestado = 12000000m,
                    TotalEjecutado = 12000000m,
                    Desviacion = 0m,
                    PctEjecucion = 1.0,
                    Estado = "Completado"
                },
                new()
                {
                    CategoriaNombre = "2. RECURSOS TÉCNICOS Y FÍSICOS",
                    CategoriaOrder = 2,
                    TotalPresupuestado = 5000000m,
                    TotalEjecutado = 0m,
                    Desviacion = 5000000m,
                    PctEjecucion = 0.0,
                    Estado = "Crítico"
                }
            };
        }

        [Fact]
        public void GeneratePdf_WithSignaturesAndLogo_DoesNotThrow()
        {
            var tenant = new TenantListItemDto
            {
                Id = Guid.NewGuid(),
                Name = "Empresa Diagnostico",
                RazonSocial = "Empresa Diagnostico S.A.S.",
                NitRuc = "900123456",
                DigitoVerificacion = "7",
                Direccion = "Calle 123 # 45-67",
                LogoUrl = TinyPng
            };

            var plan = new SgSstBudgetPlanDto
            {
                Id = Guid.NewGuid(),
                Version = 1,
                Status = SgSstDesignationStatus.Active,
                Vigencia = 2026,
                RepresentanteLegalNombre = "Maria Lopez",
                RepresentanteLegalDocumento = "987654321",
                RepresentanteLegalFechaHora = DateTime.UtcNow,
                RepresentanteLegalFirmaImagen = TinyPng,
                ResponsableSgSstNombre = "Juan Perez",
                ResponsableSgSstDocumento = "123456789",
                ResponsableSgSstFechaHora = DateTime.UtcNow,
                ResponsableSgSstFirmaImagen = TinyPng,
                CreatedAt = DateTime.UtcNow,
                LineItems = BuildLineItems(),
                CategorySummaries = BuildCategorySummaries(),
                GrandTotal = new BudgetGrandTotalDto
                {
                    TotalPresupuestado = 17000000m,
                    TotalEjecutado = 12000000m,
                    Desviacion = 5000000m,
                    PctEjecucion = 12000000.0 / 17000000.0,
                    CategoriasCriticas = 1
                }
            };

            var service = new SgSstBudgetPlanPdfService();

            byte[]? bytes = null;
            Exception? caught = null;
            try
            {
                bytes = service.GeneratePdf(tenant, plan);
            }
            catch (Exception ex)
            {
                caught = ex;
            }

            if (caught != null)
            {
                throw new Exception($"PDF generation threw: {caught}", caught);
            }

            Assert.NotNull(bytes);
            Assert.True(bytes!.Length > 0);
        }

        [Fact]
        public void GeneratePdf_WithoutSignaturesOrLogo_DoesNotThrow()
        {
            var tenant = new TenantListItemDto
            {
                Id = Guid.NewGuid(),
                Name = "Empresa Sin Logo",
                RazonSocial = "Empresa Sin Logo S.A.S.",
                NitRuc = "900111222",
                DigitoVerificacion = "1",
                Direccion = "Carrera 1 # 2-3",
                LogoUrl = null
            };

            var plan = new SgSstBudgetPlanDto
            {
                Id = Guid.NewGuid(),
                Version = 1,
                Status = SgSstDesignationStatus.Active,
                Vigencia = 2026,
                RepresentanteLegalNombre = "Maria Lopez",
                RepresentanteLegalDocumento = "987654321",
                RepresentanteLegalFechaHora = null,
                RepresentanteLegalFirmaImagen = null,
                ResponsableSgSstNombre = "Juan Perez",
                ResponsableSgSstDocumento = "123456789",
                ResponsableSgSstFechaHora = null,
                ResponsableSgSstFirmaImagen = null,
                CreatedAt = DateTime.UtcNow,
                LineItems = new List<BudgetLineItemDto>(),
                CategorySummaries = new List<BudgetCategorySummaryDto>(),
                GrandTotal = new BudgetGrandTotalDto()
            };

            var service = new SgSstBudgetPlanPdfService();

            byte[]? bytes = null;
            Exception? caught = null;
            try
            {
                bytes = service.GeneratePdf(tenant, plan);
            }
            catch (Exception ex)
            {
                caught = ex;
            }

            if (caught != null)
            {
                throw new Exception($"PDF generation threw: {caught}", caught);
            }

            Assert.NotNull(bytes);
        }
    }
}
