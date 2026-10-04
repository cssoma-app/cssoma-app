using System.Globalization;
using BackendAPI.Models;
using ClosedXML.Excel;

namespace BackendAPI.Services
{
    public class SgSstBudgetPlanExcelService : ISgSstBudgetPlanExcelService
    {
        private static readonly XLColor BrandDark = XLColor.FromHtml("#0F172A");
        private static readonly XLColor BrandBlue = XLColor.FromHtml("#1E3A8A");
        private static readonly XLColor CategoryFill = XLColor.FromHtml("#DBEAFE");
        private static readonly XLColor SubtotalFill = XLColor.FromHtml("#F1F5F9");
        private static readonly XLColor LabelFill = XLColor.FromHtml("#F8FAFC");
        private static readonly XLColor White = XLColor.White;
        private static readonly XLColor GreenOk = XLColor.FromHtml("#16A34A");
        private static readonly XLColor AmberWarn = XLColor.FromHtml("#D97706");
        private static readonly XLColor RedCritical = XLColor.FromHtml("#DC2626");

        private const string CurrencyFormat = "$#,##0";
        private const string PercentFormat = "0.0%";

        public byte[] GenerateExcel(TenantListItemDto tenant, SgSstBudgetPlanDto plan)
        {
            using var workbook = new XLWorkbook();

            ComposeDetalleSheet(workbook, tenant, plan);
            ComposeResumenSheet(workbook, tenant, plan);

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }

        // Bloque de encabezado institucional reutilizado en ambas hojas — misma información que
        // el Section 1 del PDF (empresa, NIT, responsable, aprobador, fecha, vigencia).
        private static int WriteInstitutionalHeader(IXLWorksheet ws, TenantListItemDto tenant, SgSstBudgetPlanDto plan, string title, int totalColumns)
        {
            var meta = SgSstDocumentCatalog.PresupuestoRecursos;

            ws.Range(1, 1, 1, totalColumns).Merge();
            var titleCell = ws.Cell(1, 1);
            titleCell.Value = title;
            titleCell.Style.Font.Bold = true;
            titleCell.Style.Font.FontSize = 14;
            titleCell.Style.Font.FontColor = BrandDark;
            titleCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            ws.Row(1).Height = 22;

            ws.Range(2, 1, 2, totalColumns).Merge();
            var codeCell = ws.Cell(2, 1);
            codeCell.Value = $"{meta.Code} — Versión {meta.Version} — Aprobado {meta.ApprovalDate} — {meta.Process}";
            codeCell.Style.Font.FontSize = 8;
            codeCell.Style.Font.FontColor = XLColor.FromHtml("#64748B");
            codeCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;

            var nit = tenant.NitRuc + (string.IsNullOrWhiteSpace(tenant.DigitoVerificacion) ? "" : "-" + tenant.DigitoVerificacion);
            (string Label, string Value)[] infoRows =
            [
                ("Empresa", tenant.RazonSocial),
                ("NIT", nit),
                ("Responsable SG-SST", plan.ResponsableSgSstNombre),
                ("Aprobado por", plan.RepresentanteLegalNombre),
                ("Fecha de Aprobación", plan.CreatedAt.ToString("dd/MM/yyyy")),
                ("Vigencia", plan.Vigencia.ToString())
            ];

            var row = 4;
            foreach (var (label, value) in infoRows)
            {
                var labelCell = ws.Cell(row, 1);
                labelCell.Value = label;
                labelCell.Style.Font.Bold = true;
                labelCell.Style.Fill.BackgroundColor = LabelFill;
                labelCell.Style.Font.FontSize = 9;

                ws.Range(row, 2, row, totalColumns).Merge();
                var valueCell = ws.Cell(row, 2);
                valueCell.Value = string.IsNullOrWhiteSpace(value) ? "-" : value;
                valueCell.Style.Font.FontSize = 9;
                row++;
            }

            return row + 1; // primera fila libre después del bloque institucional
        }

        private static void ComposeDetalleSheet(XLWorkbook workbook, TenantListItemDto tenant, SgSstBudgetPlanDto plan)
        {
            var ws = workbook.Worksheets.Add("Detalle Presupuestal");
            string[] headers =
            [
                "Código", "Concepto", "Fase PHVA", "Mes Programado", "Valor Presupuestado",
                "Valor Ejecutado", "Desviación", "% Ejecución", "Estado", "Área Responsable", "Soporte"
            ];
            var columnCount = headers.Length;

            var nextRow = WriteInstitutionalHeader(ws, tenant, plan, "DESGLOSE DETALLADO DE RECURSOS SG-SST", columnCount);

            var headerRow = nextRow;
            for (var i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cell(headerRow, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = White;
                cell.Style.Fill.BackgroundColor = BrandDark;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                cell.Style.Alignment.WrapText = true;
            }
            ws.Row(headerRow).Height = 26;

            var row = headerRow + 1;
            var grouped = plan.LineItems
                .GroupBy(li => new { li.CategoriaNombre, li.CategoriaOrder })
                .OrderBy(g => g.Key.CategoriaOrder);

            foreach (var group in grouped)
            {
                ws.Range(row, 1, row, columnCount).Merge();
                var categoryCell = ws.Cell(row, 1);
                categoryCell.Value = group.Key.CategoriaNombre;
                categoryCell.Style.Font.Bold = true;
                categoryCell.Style.Fill.BackgroundColor = CategoryFill;
                categoryCell.Style.Font.FontColor = BrandBlue;
                row++;

                decimal subtotalPresupuestado = 0;
                decimal subtotalEjecutado = 0;

                foreach (var item in group.OrderBy(i => i.DisplayOrder))
                {
                    ws.Cell(row, 1).Value = string.IsNullOrWhiteSpace(item.Codigo) ? "-" : item.Codigo;
                    ws.Cell(row, 2).Value = item.Concepto;
                    ws.Cell(row, 3).Value = FasePhvaLabel(item.FasePhva);
                    ws.Cell(row, 4).Value = item.MesProgramado;

                    var presupuestadoCell = ws.Cell(row, 5);
                    presupuestadoCell.Value = item.ValorPresupuestado;
                    presupuestadoCell.Style.NumberFormat.Format = CurrencyFormat;

                    var ejecutadoCell = ws.Cell(row, 6);
                    ejecutadoCell.Value = item.ValorEjecutado;
                    ejecutadoCell.Style.NumberFormat.Format = CurrencyFormat;

                    var desviacionCell = ws.Cell(row, 7);
                    desviacionCell.Value = item.Desviacion;
                    desviacionCell.Style.NumberFormat.Format = CurrencyFormat;

                    var pctCell = ws.Cell(row, 8);
                    pctCell.Value = item.PctEjecucion;
                    pctCell.Style.NumberFormat.Format = PercentFormat;

                    var estadoCell = ws.Cell(row, 9);
                    estadoCell.Value = item.Estado;
                    estadoCell.Style.Font.Bold = true;
                    estadoCell.Style.Font.FontColor = EstadoColor(item.Estado);

                    ws.Cell(row, 10).Value = item.AreaResponsable;
                    ws.Cell(row, 11).Value = string.IsNullOrWhiteSpace(item.SoporteComprobante) ? "-" : item.SoporteComprobante;

                    subtotalPresupuestado += item.ValorPresupuestado;
                    subtotalEjecutado += item.ValorEjecutado;
                    row++;
                }

                var subtotalLabelCell = ws.Cell(row, 1);
                ws.Range(row, 1, row, 4).Merge();
                subtotalLabelCell.Value = $"Subtotal {group.Key.CategoriaNombre}";
                subtotalLabelCell.Style.Font.Bold = true;
                subtotalLabelCell.Style.Fill.BackgroundColor = SubtotalFill;
                subtotalLabelCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

                var subPresupuestadoCell = ws.Cell(row, 5);
                subPresupuestadoCell.Value = subtotalPresupuestado;
                subPresupuestadoCell.Style.NumberFormat.Format = CurrencyFormat;
                subPresupuestadoCell.Style.Font.Bold = true;
                subPresupuestadoCell.Style.Fill.BackgroundColor = SubtotalFill;

                var subEjecutadoCell = ws.Cell(row, 6);
                subEjecutadoCell.Value = subtotalEjecutado;
                subEjecutadoCell.Style.NumberFormat.Format = CurrencyFormat;
                subEjecutadoCell.Style.Font.Bold = true;
                subEjecutadoCell.Style.Fill.BackgroundColor = SubtotalFill;

                var subDesviacionCell = ws.Cell(row, 7);
                subDesviacionCell.Value = subtotalPresupuestado - subtotalEjecutado;
                subDesviacionCell.Style.NumberFormat.Format = CurrencyFormat;
                subDesviacionCell.Style.Font.Bold = true;
                subDesviacionCell.Style.Fill.BackgroundColor = SubtotalFill;

                var subPctCell = ws.Cell(row, 8);
                subPctCell.Value = subtotalPresupuestado > 0 ? (double)(subtotalEjecutado / subtotalPresupuestado) : 0;
                subPctCell.Style.NumberFormat.Format = PercentFormat;
                subPctCell.Style.Font.Bold = true;
                subPctCell.Style.Fill.BackgroundColor = SubtotalFill;

                ws.Range(row, 9, row, columnCount).Merge();
                ws.Cell(row, 9).Style.Fill.BackgroundColor = SubtotalFill;
                row++;
            }

            if (plan.LineItems.Count == 0)
            {
                ws.Range(row, 1, row, columnCount).Merge();
                var emptyCell = ws.Cell(row, 1);
                emptyCell.Value = "Sin rubros registrados.";
                emptyCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                emptyCell.Style.Font.FontColor = XLColor.Gray;
                row++;
            }

            var lastDataRow = row - 1;

            ws.Range(row, 1, row, 4).Merge();
            var totalLabelCell = ws.Cell(row, 1);
            totalLabelCell.Value = "TOTAL GENERAL";
            totalLabelCell.Style.Font.Bold = true;
            totalLabelCell.Style.Font.FontColor = White;
            totalLabelCell.Style.Fill.BackgroundColor = BrandDark;
            totalLabelCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Right;

            var totalPresupuestadoCell = ws.Cell(row, 5);
            totalPresupuestadoCell.Value = plan.GrandTotal.TotalPresupuestado;
            totalPresupuestadoCell.Style.NumberFormat.Format = CurrencyFormat;

            var totalEjecutadoCell = ws.Cell(row, 6);
            totalEjecutadoCell.Value = plan.GrandTotal.TotalEjecutado;
            totalEjecutadoCell.Style.NumberFormat.Format = CurrencyFormat;

            var totalDesviacionCell = ws.Cell(row, 7);
            totalDesviacionCell.Value = plan.GrandTotal.Desviacion;
            totalDesviacionCell.Style.NumberFormat.Format = CurrencyFormat;

            var totalPctCell = ws.Cell(row, 8);
            totalPctCell.Value = plan.GrandTotal.PctEjecucion;
            totalPctCell.Style.NumberFormat.Format = PercentFormat;

            ws.Range(row, 9, row, columnCount).Merge();
            foreach (var cell in ws.Range(row, 5, row, columnCount).Cells())
            {
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = White;
                cell.Style.Fill.BackgroundColor = BrandDark;
            }

            ws.SheetView.FreezeRows(headerRow);
            ws.SheetView.FreezeColumns(2);

            if (lastDataRow >= headerRow)
            {
                ws.Range(headerRow, 1, lastDataRow, columnCount).SetAutoFilter();
            }

            ws.Columns().AdjustToContents();
            ws.Column(2).Width = Math.Min(ws.Column(2).Width, 45);
        }

        private static void ComposeResumenSheet(XLWorkbook workbook, TenantListItemDto tenant, SgSstBudgetPlanDto plan)
        {
            var ws = workbook.Worksheets.Add("Resumen Ejecutivo");
            const int columnCount = 6;

            var nextRow = WriteInstitutionalHeader(ws, tenant, plan, "RESUMEN EJECUTIVO Y CONTROL PRESUPUESTAL", columnCount);

            (string Label, string Value, XLColor Accent)[] kpis =
            [
                ("Presupuesto Proyectado", FormatCurrency(plan.GrandTotal.TotalPresupuestado), BrandBlue),
                ("Presupuesto Ejecutado", FormatCurrency(plan.GrandTotal.TotalEjecutado), GreenOk),
                ("Saldo Disponible", FormatCurrency(plan.GrandTotal.Desviacion), BrandDark),
                ("Categorías en Estado Crítico", plan.GrandTotal.CategoriasCriticas.ToString(), RedCritical)
            ];

            var kpiLabelRow = nextRow;
            var kpiValueRow = nextRow + 1;
            for (var i = 0; i < kpis.Length; i++)
            {
                var (label, value, accent) = kpis[i];
                var col = i + 1;

                var labelCell = ws.Cell(kpiLabelRow, col);
                labelCell.Value = label;
                labelCell.Style.Font.Bold = true;
                labelCell.Style.Font.FontSize = 8;
                labelCell.Style.Fill.BackgroundColor = LabelFill;
                labelCell.Style.Alignment.WrapText = true;

                var valueCell = ws.Cell(kpiValueRow, col);
                valueCell.Value = value;
                valueCell.Style.Font.Bold = true;
                valueCell.Style.Font.FontSize = 12;
                valueCell.Style.Font.FontColor = accent;
            }

            var headerRow = kpiValueRow + 2;
            string[] headers = ["Categoría", "Presupuestado", "Ejecutado", "Desviación", "% Ejecución", "Estado"];
            for (var i = 0; i < headers.Length; i++)
            {
                var cell = ws.Cell(headerRow, i + 1);
                cell.Value = headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = White;
                cell.Style.Fill.BackgroundColor = BrandDark;
                cell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
            }

            var row = headerRow + 1;
            foreach (var category in plan.CategorySummaries)
            {
                ws.Cell(row, 1).Value = category.CategoriaNombre;

                var presupuestadoCell = ws.Cell(row, 2);
                presupuestadoCell.Value = category.TotalPresupuestado;
                presupuestadoCell.Style.NumberFormat.Format = CurrencyFormat;

                var ejecutadoCell = ws.Cell(row, 3);
                ejecutadoCell.Value = category.TotalEjecutado;
                ejecutadoCell.Style.NumberFormat.Format = CurrencyFormat;

                var desviacionCell = ws.Cell(row, 4);
                desviacionCell.Value = category.Desviacion;
                desviacionCell.Style.NumberFormat.Format = CurrencyFormat;

                var pctCell = ws.Cell(row, 5);
                pctCell.Value = category.PctEjecucion;
                pctCell.Style.NumberFormat.Format = PercentFormat;

                var estadoCell = ws.Cell(row, 6);
                estadoCell.Value = category.Estado;
                estadoCell.Style.Font.Bold = true;
                estadoCell.Style.Font.FontColor = EstadoColor(category.Estado);

                row++;
            }

            if (plan.CategorySummaries.Count == 0)
            {
                ws.Range(row, 1, row, columnCount).Merge();
                var emptyCell = ws.Cell(row, 1);
                emptyCell.Value = "Sin categorías registradas.";
                emptyCell.Style.Alignment.Horizontal = XLAlignmentHorizontalValues.Center;
                emptyCell.Style.Font.FontColor = XLColor.Gray;
                row++;
            }

            var lastDataRow = row - 1;

            var totalLabelCell = ws.Cell(row, 1);
            totalLabelCell.Value = "TOTAL GENERAL";
            var totalPresupuestadoCell = ws.Cell(row, 2);
            totalPresupuestadoCell.Value = plan.GrandTotal.TotalPresupuestado;
            totalPresupuestadoCell.Style.NumberFormat.Format = CurrencyFormat;
            var totalEjecutadoCell = ws.Cell(row, 3);
            totalEjecutadoCell.Value = plan.GrandTotal.TotalEjecutado;
            totalEjecutadoCell.Style.NumberFormat.Format = CurrencyFormat;
            var totalDesviacionCell = ws.Cell(row, 4);
            totalDesviacionCell.Value = plan.GrandTotal.Desviacion;
            totalDesviacionCell.Style.NumberFormat.Format = CurrencyFormat;
            var totalPctCell = ws.Cell(row, 5);
            totalPctCell.Value = plan.GrandTotal.PctEjecucion;
            totalPctCell.Style.NumberFormat.Format = PercentFormat;
            ws.Cell(row, 6).Value = string.Empty;

            foreach (var cell in ws.Range(row, 1, row, columnCount).Cells())
            {
                cell.Style.Font.Bold = true;
                cell.Style.Font.FontColor = White;
                cell.Style.Fill.BackgroundColor = BrandDark;
            }

            ws.SheetView.FreezeRows(headerRow);

            if (lastDataRow >= headerRow)
            {
                ws.Range(headerRow, 1, lastDataRow, columnCount).SetAutoFilter();
            }

            ws.Columns().AdjustToContents();
        }

        private static string FasePhvaLabel(SstPhvaPhase fase) => fase switch
        {
            SstPhvaPhase.Planear => "Planear",
            SstPhvaPhase.Hacer => "Hacer",
            SstPhvaPhase.Verificar => "Verificar",
            SstPhvaPhase.Actuar => "Actuar",
            _ => fase.ToString()
        };

        private static XLColor EstadoColor(string estado) => estado switch
        {
            "Completado" => GreenOk,
            "Crítico" => RedCritical,
            "Pendiente" => RedCritical,
            _ => AmberWarn
        };

        private static string FormatCurrency(decimal value) => "$" + value.ToString("N0", CultureInfo.InvariantCulture);
    }
}
