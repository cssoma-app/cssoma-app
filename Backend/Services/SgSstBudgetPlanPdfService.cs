using BackendAPI.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BackendAPI.Services
{
    public class SgSstBudgetPlanPdfService : ISgSstBudgetPlanPdfService
    {
        private static readonly QuestPDF.Infrastructure.Color BrandDark = QuestPDF.Infrastructure.Color.FromHex("#0F172A");
        private static readonly QuestPDF.Infrastructure.Color BrandBlue = QuestPDF.Infrastructure.Color.FromHex("#1E3A8A");
        private static readonly QuestPDF.Infrastructure.Color LegalBg = QuestPDF.Infrastructure.Color.FromHex("#EFF6FF");
        private static readonly QuestPDF.Infrastructure.Color LegalBorder = QuestPDF.Infrastructure.Color.FromHex("#BFDBFE");
        private static readonly QuestPDF.Infrastructure.Color RowBorder = QuestPDF.Infrastructure.Color.FromHex("#E2E8F0");
        private static readonly QuestPDF.Infrastructure.Color LabelBg = QuestPDF.Infrastructure.Color.FromHex("#F8FAFC");
        private static readonly QuestPDF.Infrastructure.Color BarBg = QuestPDF.Infrastructure.Color.FromHex("#E2E8F0");
        private static readonly QuestPDF.Infrastructure.Color BarFillOk = QuestPDF.Infrastructure.Color.FromHex("#16A34A");
        private static readonly QuestPDF.Infrastructure.Color BarFillWarn = QuestPDF.Infrastructure.Color.FromHex("#EAB308");
        private static readonly QuestPDF.Infrastructure.Color BarFillCritical = QuestPDF.Infrastructure.Color.FromHex("#DC2626");

        public byte[] GeneratePdf(TenantListItemDto tenant, SgSstBudgetPlanDto plan)
        {
            var logoBytes = TryDecodeDataUrl(tenant.LogoUrl);
            var representanteFirmaBytes = TryDecodeDataUrl(plan.RepresentanteLegalFirmaImagen);
            var responsableFirmaBytes = TryDecodeDataUrl(plan.ResponsableSgSstFirmaImagen);

            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(28);
                    page.DefaultTextStyle(x => x.FontSize(9).FontColor(BrandDark));

                    page.Header().Element(c => ComposeHeader(c, tenant, logoBytes));

                    page.Content().PaddingTop(10).Column(col =>
                    {
                        col.Spacing(10);
                        ComposeSection1(col, tenant, plan);
                        ComposeKpiCards(col, plan);
                        ComposeSection2(col, plan);
                        ComposeSection3(col, plan);
                        ComposeSection4(col, plan, representanteFirmaBytes, responsableFirmaBytes);
                    });

                    page.Footer().PaddingTop(8).Column(footer =>
                    {
                        footer.Item().Row(row =>
                        {
                            row.RelativeItem().Text("SISTEMA INTEGRADO DE GESTIÓN (ISO 9001 / ISO 45001)").FontSize(7).FontColor(Colors.Grey.Darken1);
                            row.ConstantItem(80).AlignRight().Text(text =>
                            {
                                text.DefaultTextStyle(x => x.FontSize(7).FontColor(Colors.Grey.Darken1));
                                text.Span("Página ");
                                text.CurrentPageNumber();
                                text.Span(" de ");
                                text.TotalPages();
                            });
                        });
                        footer.Item().PaddingTop(2).Text(
                            $"Plataforma de gestión SG-SST desarrollada por SSTerra Consultores. (C) {DateTime.UtcNow.Year} SSTerra Consultores. " +
                            "Todos los derechos de autor reservados sobre la plataforma y sus formatos."
                        ).FontSize(6).FontColor(Colors.Grey.Medium);
                    });
                });
            });

            return document.GeneratePdf();
        }

        private static void ComposeHeader(QuestPDF.Infrastructure.IContainer container, TenantListItemDto tenant, byte[]? logoBytes)
        {
            container.Border(1).BorderColor(RowBorder).Row(row =>
            {
                row.ConstantItem(90).Padding(6).AlignMiddle().AlignCenter().Height(70).Element(logoContainer =>
                {
                    if (logoBytes != null)
                    {
                        logoContainer.Image(logoBytes).FitArea();
                    }
                    else
                    {
                        logoContainer.Border(1).BorderColor(RowBorder).AlignMiddle().AlignCenter().Padding(4)
                            .Text(string.IsNullOrWhiteSpace(tenant.Name) ? "Sin logo" : tenant.Name)
                            .FontSize(8).Bold().FontColor(BrandDark).AlignCenter();
                    }
                });

                var meta = SgSstDocumentCatalog.PresupuestoRecursos;

                row.RelativeItem().BorderLeft(1).BorderColor(RowBorder).Padding(8).AlignMiddle().Column(c =>
                {
                    c.Item().AlignCenter().Text("SISTEMA INTEGRADO DE GESTIÓN (ISO 9001 / ISO 45001)")
                        .FontSize(7).Bold().FontColor(Colors.Grey.Darken2);
                    c.Item().AlignCenter().PaddingTop(2).Text(meta.Title)
                        .FontSize(11).Bold().FontColor(BrandDark).AlignCenter();
                });

                row.ConstantItem(140).BorderLeft(1).BorderColor(RowBorder).Column(c =>
                {
                    void MetaRow(string label, string value)
                    {
                        c.Item().BorderBottom(1).BorderColor(RowBorder).Padding(4).Row(r =>
                        {
                            r.RelativeItem().Text(label).FontSize(6).Bold().FontColor(Colors.Grey.Darken1);
                            r.RelativeItem().AlignRight().Text(value).FontSize(7).Bold().FontColor(BrandDark);
                        });
                    }
                    MetaRow("CÓDIGO", meta.Code);
                    MetaRow("VERSIÓN", meta.Version);
                    MetaRow("APROBACIÓN", meta.ApprovalDate);
                    c.Item().BorderBottom(1).BorderColor(RowBorder).Padding(4).Text(meta.Process).FontSize(6).Bold().FontColor(BrandDark);
                    c.Item().Padding(4).Column(inner =>
                    {
                        inner.Item().Text("PROPIEDAD INTELECTUAL DEL FORMATO").FontSize(5.5f).Bold().FontColor(Colors.Grey.Darken1);
                        inner.Item().PaddingTop(1).Text("(C) SSTerra Consultores").FontSize(6.5f).Bold().FontColor(BrandDark);
                    });
                });
            });
        }

        private static void SectionHeader(QuestPDF.Fluent.ColumnDescriptor col, int number, string title)
        {
            col.Item().Background(BrandDark).Padding(6).Text($"{number}. {title}").FontSize(9).Bold().FontColor(Colors.White);
        }

        private static void InfoRow(QuestPDF.Fluent.ColumnDescriptor col, string label, string value)
        {
            col.Item().BorderBottom(1).BorderColor(RowBorder).Row(row =>
            {
                row.ConstantItem(150).Background(LabelBg).Padding(6).Text(label).FontSize(7.5f).Bold().FontColor(Colors.Grey.Darken2);
                row.RelativeItem().Padding(6).Text(string.IsNullOrWhiteSpace(value) ? "-" : value).FontSize(8).FontColor(BrandDark);
            });
        }

        private static void ComposeSection1(QuestPDF.Fluent.ColumnDescriptor col, TenantListItemDto tenant, SgSstBudgetPlanDto plan)
        {
            SectionHeader(col, 1, "ENCABEZADO INSTITUCIONAL");
            col.Item().Border(1).BorderColor(RowBorder).Column(c =>
            {
                InfoRow(c, "Empresa", tenant.RazonSocial);
                InfoRow(c, "NIT", tenant.NitRuc + (string.IsNullOrWhiteSpace(tenant.DigitoVerificacion) ? "" : "-" + tenant.DigitoVerificacion));
                InfoRow(c, "Responsable SG-SST", plan.ResponsableSgSstNombre);
                InfoRow(c, "Aprobado por", plan.RepresentanteLegalNombre);
                InfoRow(c, "Fecha de Aprobación", plan.CreatedAt.ToString("dd/MM/yyyy"));
                InfoRow(c, "Vigencia", plan.Vigencia.ToString());
            });
        }

        private static void ComposeKpiCards(QuestPDF.Fluent.ColumnDescriptor col, SgSstBudgetPlanDto plan)
        {
            col.Item().Row(row =>
            {
                KpiCard(row, "PRESUPUESTO PROYECTADO", FormatCurrency(plan.GrandTotal.TotalPresupuestado), BrandBlue);
                KpiCard(row, "PRESUPUESTO EJECUTADO", FormatCurrency(plan.GrandTotal.TotalEjecutado), BarFillOk);
                KpiCard(row, "SALDO DISPONIBLE", FormatCurrency(plan.GrandTotal.Desviacion), BrandDark);
                KpiCard(row, "CATEGORÍAS EN ESTADO CRÍTICO", plan.GrandTotal.CategoriasCriticas.ToString(), BarFillCritical);
            });
        }

        private static void KpiCard(QuestPDF.Fluent.RowDescriptor row, string label, string value, QuestPDF.Infrastructure.Color accent)
        {
            row.RelativeItem().PaddingRight(4).Border(1).BorderColor(RowBorder).Column(card =>
            {
                card.Item().Height(3).Background(accent);
                card.Item().Padding(8).Column(c =>
                {
                    c.Item().Text(label).FontSize(6.5f).Bold().FontColor(Colors.Grey.Darken1);
                    c.Item().PaddingTop(3).Text(value).FontSize(11).Bold().FontColor(BrandDark);
                });
            });
        }

        private static void ComposeSection2(QuestPDF.Fluent.ColumnDescriptor col, SgSstBudgetPlanDto plan)
        {
            SectionHeader(col, 2, "CONTROL PRESUPUESTAL POR CATEGORÍA");
            col.Item().Border(1).BorderColor(RowBorder).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(2.2f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.3f);
                    columns.RelativeColumn(0.9f);
                });

                void HeaderCell(string text) => table.Cell().Background(LabelBg).BorderBottom(1).BorderColor(RowBorder)
                    .Padding(5).Text(text).FontSize(6.5f).Bold().FontColor(Colors.Grey.Darken2);

                table.Header(header =>
                {
                    HeaderCell("Categoría");
                    HeaderCell("Presupuestado");
                    HeaderCell("Ejecutado");
                    HeaderCell("Desviación");
                    HeaderCell("% Ejecución");
                    HeaderCell("Estado");
                });

                foreach (var category in plan.CategorySummaries)
                {
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(category.CategoriaNombre).FontSize(7.5f).FontColor(BrandDark);
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(FormatCurrency(category.TotalPresupuestado)).FontSize(7.5f).FontColor(BrandDark);
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(FormatCurrency(category.TotalEjecutado)).FontSize(7.5f).FontColor(BrandDark);
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(FormatCurrency(category.Desviacion)).FontSize(7.5f).FontColor(BrandDark);
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5).Element(e => ProgressBar(e, category.PctEjecucion, category.Estado));
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(category.Estado).FontSize(7.5f).Bold().FontColor(EstadoColor(category.Estado));
                }

                if (plan.CategorySummaries.Count == 0)
                {
                    table.Cell().ColumnSpan(6).Padding(8).AlignCenter()
                        .Text("Sin categorías registradas.").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                }
            });
        }

        // Barra de progreso simple con un Rectangle de ancho proporcional al % de ejecución —
        // sin gráficos SVG, según lo definido para este formato.
        private static void ProgressBar(QuestPDF.Infrastructure.IContainer container, double pct, string estado)
        {
            var clamped = Math.Clamp(pct, 0, 1);
            container.Height(10).Background(BarBg).Row(row =>
            {
                if (clamped > 0)
                {
                    row.RelativeItem((float)clamped).Background(EstadoColor(estado));
                }
                if (clamped < 1)
                {
                    row.RelativeItem((float)(1 - clamped));
                }
            });
        }

        private static QuestPDF.Infrastructure.Color EstadoColor(string estado) => estado switch
        {
            "Completado" => BarFillOk,
            "Crítico" => BarFillCritical,
            "Pendiente" => BarFillCritical,
            _ => BarFillWarn
        };

        private static void ComposeSection3(QuestPDF.Fluent.ColumnDescriptor col, SgSstBudgetPlanDto plan)
        {
            SectionHeader(col, 3, "DETALLE DE RUBROS PRESUPUESTALES");
            col.Item().Border(1).BorderColor(RowBorder).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.RelativeColumn(0.8f);
                    columns.RelativeColumn(2.0f);
                    columns.RelativeColumn(0.9f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(0.7f);
                    columns.RelativeColumn(0.9f);
                    columns.RelativeColumn(1.1f);
                    columns.RelativeColumn(1.1f);
                });

                void HeaderCell(string text) => table.Cell().Background(LabelBg).BorderBottom(1).BorderColor(RowBorder)
                    .Padding(4).Text(text).FontSize(6).Bold().FontColor(Colors.Grey.Darken2);

                table.Header(header =>
                {
                    HeaderCell("Código");
                    HeaderCell("Concepto");
                    HeaderCell("Fase PHVA");
                    HeaderCell("Mes Programado");
                    HeaderCell("Presupuestado");
                    HeaderCell("Ejecutado");
                    HeaderCell("Desviación");
                    HeaderCell("%");
                    HeaderCell("Estado");
                    HeaderCell("Área Responsable");
                    HeaderCell("Soporte");
                });

                var grouped = plan.LineItems
                    .GroupBy(li => new { li.CategoriaNombre, li.CategoriaOrder })
                    .OrderBy(g => g.Key.CategoriaOrder);

                foreach (var group in grouped)
                {
                    table.Cell().ColumnSpan(11).Background(LabelBg).Padding(4)
                        .Text(group.Key.CategoriaNombre).FontSize(7).Bold().FontColor(BrandDark);

                    foreach (var item in group.OrderBy(i => i.DisplayOrder))
                    {
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(string.IsNullOrWhiteSpace(item.Codigo) ? "-" : item.Codigo).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(item.Concepto).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(FasePhvaLabel(item.FasePhva)).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(item.MesProgramado).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(FormatCurrency(item.ValorPresupuestado)).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(FormatCurrency(item.ValorEjecutado)).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(FormatCurrency(item.Desviacion)).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text($"{item.PctEjecucion * 100:0}%").FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(item.Estado).FontSize(6.5f).Bold().FontColor(EstadoColor(item.Estado));
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(item.AreaResponsable).FontSize(6.5f).FontColor(BrandDark);
                        table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(4)
                            .Text(string.IsNullOrWhiteSpace(item.SoporteComprobante) ? "-" : item.SoporteComprobante).FontSize(6.5f).FontColor(BrandDark);
                    }
                }

                if (plan.LineItems.Count == 0)
                {
                    table.Cell().ColumnSpan(11).Padding(8).AlignCenter()
                        .Text("Sin rubros registrados.").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                }
            });
        }

        private static string FasePhvaLabel(SstPhvaPhase fase) => fase switch
        {
            SstPhvaPhase.Planear => "Planear",
            SstPhvaPhase.Hacer => "Hacer",
            SstPhvaPhase.Verificar => "Verificar",
            SstPhvaPhase.Actuar => "Actuar",
            _ => fase.ToString()
        };

        private static void ComposeSection4(
            QuestPDF.Fluent.ColumnDescriptor col,
            SgSstBudgetPlanDto plan,
            byte[]? representanteFirmaBytes,
            byte[]? responsableFirmaBytes)
        {
            SectionHeader(col, 4, "FIRMAS DE APROBACIÓN Y CERTIFICACIÓN");
            col.Item().Border(1).BorderColor(RowBorder).Padding(8).Row(row =>
            {
                row.RelativeItem().PaddingRight(6).Element(e => SignatureBlock(
                    e, "APROBACIÓN PRESUPUESTAL - REPRESENTANTE LEGAL", representanteFirmaBytes,
                    plan.RepresentanteLegalNombre, "Documento", plan.RepresentanteLegalDocumento));

                row.RelativeItem().PaddingLeft(6).Element(e => SignatureBlock(
                    e, "ELABORADO Y CERTIFICADO - RESPONSABLE SG-SST", responsableFirmaBytes,
                    plan.ResponsableSgSstNombre, "Documento", plan.ResponsableSgSstDocumento));
            });
        }

        private static void SignatureBlock(
            QuestPDF.Infrastructure.IContainer container,
            string title,
            byte[]? firmaBytes,
            string nombre,
            string docLabel,
            string docValue)
        {
            container.Border(1).BorderColor(RowBorder).Padding(8).Column(c =>
            {
                c.Item().BorderBottom(1).BorderColor(RowBorder).PaddingBottom(4).Text(title).FontSize(7).Bold().FontColor(BrandDark);

                c.Item().PaddingVertical(6).Height(55).AlignMiddle().AlignCenter().Element(sig =>
                {
                    if (firmaBytes != null)
                    {
                        sig.Image(firmaBytes).FitArea();
                    }
                    else
                    {
                        sig.AlignBottom().BorderBottom(1).BorderColor(Colors.Grey.Medium).Text("").FontSize(1);
                    }
                });

                c.Item().Text($"Nombre: {nombre}").FontSize(7.5f).FontColor(BrandDark);
                c.Item().PaddingTop(2).Text($"{docLabel}: {docValue}").FontSize(7.5f).FontColor(BrandDark);
            });
        }

        private static string FormatCurrency(decimal value) => "$" + value.ToString("N0", System.Globalization.CultureInfo.InvariantCulture);

        // Los logos y firmas llegan como data URL en base64 (ej. "data:image/png;base64,...."),
        // ya validados en el punto de guardado — acá solo se decodifica de forma defensiva.
        private static byte[]? TryDecodeDataUrl(string? dataUrl)
        {
            if (string.IsNullOrWhiteSpace(dataUrl)) return null;
            var commaIndex = dataUrl.IndexOf(',');
            if (commaIndex < 0) return null;
            try
            {
                return Convert.FromBase64String(dataUrl[(commaIndex + 1)..]);
            }
            catch (FormatException)
            {
                return null;
            }
        }
    }
}
