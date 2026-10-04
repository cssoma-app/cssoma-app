using BackendAPI.Models;
using BackendAPI.Services;
using ClosedXML.Excel;

namespace BackendAPI.Tests
{
    public class SgSstBudgetPlanExcelServiceTests
    {
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

        private static TenantListItemDto BuildTenant() => new()
        {
            Id = Guid.NewGuid(),
            Name = "Empresa Diagnostico",
            RazonSocial = "Empresa Diagnostico S.A.S.",
            NitRuc = "900123456",
            DigitoVerificacion = "7",
            Direccion = "Calle 123 # 45-67",
            LogoUrl = null
        };

        private static SgSstBudgetPlanDto BuildPlan(bool withLineItems)
        {
            return new SgSstBudgetPlanDto
            {
                Id = Guid.NewGuid(),
                Version = 1,
                Status = SgSstDesignationStatus.Active,
                Vigencia = 2026,
                RepresentanteLegalNombre = "Maria Lopez",
                RepresentanteLegalDocumento = "987654321",
                RepresentanteLegalFechaHora = DateTime.UtcNow,
                ResponsableSgSstNombre = "Juan Perez",
                ResponsableSgSstDocumento = "123456789",
                ResponsableSgSstFechaHora = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                LineItems = withLineItems ? BuildLineItems() : new List<BudgetLineItemDto>(),
                CategorySummaries = withLineItems ? BuildCategorySummaries() : new List<BudgetCategorySummaryDto>(),
                GrandTotal = withLineItems
                    ? new BudgetGrandTotalDto
                    {
                        TotalPresupuestado = 17000000m,
                        TotalEjecutado = 12000000m,
                        Desviacion = 5000000m,
                        PctEjecucion = 12000000.0 / 17000000.0,
                        CategoriasCriticas = 1
                    }
                    : new BudgetGrandTotalDto()
            };
        }

        [Fact]
        public void GenerateExcel_WithLineItems_CreatesBothSheetsWithExpectedHeadersAndTotal()
        {
            var service = new SgSstBudgetPlanExcelService();
            var bytes = service.GenerateExcel(BuildTenant(), BuildPlan(withLineItems: true));

            Assert.NotNull(bytes);
            Assert.True(bytes.Length > 0);

            using var workbook = new XLWorkbook(new MemoryStream(bytes));

            Assert.Equal(2, workbook.Worksheets.Count);
            Assert.True(workbook.Worksheets.TryGetWorksheet("Detalle Presupuestal", out var detalle));
            Assert.True(workbook.Worksheets.TryGetWorksheet("Resumen Ejecutivo", out var resumen));

            // La fila de encabezados de columna del detalle debe contener "Código" y "Estado" en
            // algún lugar de la hoja (después del bloque institucional).
            var detalleHeaderCells = detalle!.CellsUsed(c => c.GetString() == "Código");
            Assert.NotEmpty(detalleHeaderCells);
            var estadoHeaderCells = detalle.CellsUsed(c => c.GetString() == "Estado");
            Assert.NotEmpty(estadoHeaderCells);

            // Fila de TOTAL GENERAL presente en ambas hojas con el valor agregado correcto.
            var detalleTotalCell = detalle.CellsUsed(c => c.GetString() == "TOTAL GENERAL").Single();
            var detalleTotalRow = detalleTotalCell.Address.RowNumber;
            var detalleTotalPresupuestado = detalle.Cell(detalleTotalRow, 5).GetValue<decimal>();
            Assert.Equal(17000000m, detalleTotalPresupuestado);
            Assert.Equal("$#,##0", detalle.Cell(detalleTotalRow, 5).Style.NumberFormat.Format);

            var resumenTotalCell = resumen!.CellsUsed(c => c.GetString() == "TOTAL GENERAL").Single();
            var resumenTotalRow = resumenTotalCell.Address.RowNumber;
            var resumenTotalPresupuestado = resumen.Cell(resumenTotalRow, 2).GetValue<decimal>();
            Assert.Equal(17000000m, resumenTotalPresupuestado);

            // Formato de porcentaje explícito en la columna "% Ejecución" del resumen.
            var pctHeaderCell = resumen.CellsUsed(c => c.GetString() == "% Ejecución").Single();
            var firstDataRow = pctHeaderCell.Address.RowNumber + 1;
            Assert.Equal("0.0%", resumen.Cell(firstDataRow, pctHeaderCell.Address.ColumnNumber).Style.NumberFormat.Format);
        }

        [Fact]
        public void GenerateExcel_WithoutLineItems_DoesNotThrowAndShowsEmptyState()
        {
            var service = new SgSstBudgetPlanExcelService();

            byte[]? bytes = null;
            Exception? caught = null;
            try
            {
                bytes = service.GenerateExcel(BuildTenant(), BuildPlan(withLineItems: false));
            }
            catch (Exception ex)
            {
                caught = ex;
            }

            if (caught != null)
            {
                throw new Exception($"Excel generation threw: {caught}", caught);
            }

            Assert.NotNull(bytes);
            Assert.True(bytes!.Length > 0);

            using var workbook = new XLWorkbook(new MemoryStream(bytes));
            Assert.True(workbook.Worksheets.TryGetWorksheet("Detalle Presupuestal", out var detalle));
            Assert.NotEmpty(detalle!.CellsUsed(c => c.GetString() == "Sin rubros registrados."));
        }
    }
}
