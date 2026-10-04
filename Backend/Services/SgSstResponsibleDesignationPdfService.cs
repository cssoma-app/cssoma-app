using BackendAPI.Models;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace BackendAPI.Services
{
    public class SgSstResponsibleDesignationPdfService : ISgSstResponsibleDesignationPdfService
    {
        private static readonly QuestPDF.Infrastructure.Color BrandDark = QuestPDF.Infrastructure.Color.FromHex("#0F172A");
        private static readonly QuestPDF.Infrastructure.Color BrandBlue = QuestPDF.Infrastructure.Color.FromHex("#1E3A8A");
        private static readonly QuestPDF.Infrastructure.Color LegalBg = QuestPDF.Infrastructure.Color.FromHex("#EFF6FF");
        private static readonly QuestPDF.Infrastructure.Color LegalBorder = QuestPDF.Infrastructure.Color.FromHex("#BFDBFE");
        private static readonly QuestPDF.Infrastructure.Color RowBorder = QuestPDF.Infrastructure.Color.FromHex("#E2E8F0");
        private static readonly QuestPDF.Infrastructure.Color LabelBg = QuestPDF.Infrastructure.Color.FromHex("#F8FAFC");

        public byte[] GeneratePdf(
            TenantListItemDto tenant,
            SgSstResponsibleDesignationDto designation,
            List<SgSstResponsibleDesignationDto> history)
        {
            var logoBytes = TryDecodeDataUrl(tenant.LogoUrl);
            var empleadorFirmaBytes = TryDecodeDataUrl(designation.EmpleadorFirmaImagen);
            var responsableFirmaBytes = TryDecodeDataUrl(designation.ResponsableFirmaImagen);

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
                        ComposeLegalBanner(col);
                        ComposeSection1(col, tenant, designation);
                        ComposeSection2(col, designation);
                        ComposeSection3(col, designation);
                        ComposeSection4(col, designation, empleadorFirmaBytes, responsableFirmaBytes);
                        ComposeSection5(col, history);
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

                var meta = SgSstDocumentCatalog.ResponsableDesignacion;

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

        private static void ComposeLegalBanner(QuestPDF.Fluent.ColumnDescriptor col)
        {
            col.Item().Background(LegalBg).Border(1).BorderColor(LegalBorder).Padding(8).Column(c =>
            {
                c.Item().Text("MARCO LEGAL Y NORMATIVO APLICABLE").FontSize(7).Bold().FontColor(BrandDark);
                c.Item().PaddingTop(2).Text(
                    "El presente documento de control de la información documentada se expide conforme a las exigencias de la " +
                    "NTC-ISO 9001:2015 (Numeral 7.5), la NTC-ISO 45001:2018 (Numerales 5.3 y 7.5), el Artículo 2.2.4.6.8 (Numeral 2) " +
                    "del Decreto 1072 de 2015 y los criterios de idoneidad técnica previstos en los Artículos 4, 9 y 16 de la " +
                    "Resolución 0312 de 2019 del Ministerio del Trabajo de Colombia."
                ).FontSize(7.5f).FontColor(Colors.Grey.Darken3).Justify();
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

        // Fila con opciones tipo "pill" (Nivel de Riesgo, Nivel de Competencia, etc.) donde se
        // resalta la seleccionada y el resto queda en gris — igual criterio visual que el formulario web.
        private static void InfoRowChoices(QuestPDF.Fluent.ColumnDescriptor col, string label, IEnumerable<(string Text, bool Selected)> options)
        {
            col.Item().BorderBottom(1).BorderColor(RowBorder).Row(row =>
            {
                row.ConstantItem(150).Background(LabelBg).Padding(6).Text(label).FontSize(7.5f).Bold().FontColor(Colors.Grey.Darken2);
                row.RelativeItem().Padding(6).Text(text =>
                {
                    var items = options.ToList();
                    for (var i = 0; i < items.Count; i++)
                    {
                        var (optText, selected) = items[i];
                        if (selected)
                        {
                            text.Span($"[ {optText} ]").FontSize(8).Bold().FontColor(BrandBlue);
                        }
                        else
                        {
                            text.Span(optText).FontSize(8).FontColor(Colors.Grey.Medium);
                        }
                        if (i < items.Count - 1) text.Span("    ");
                    }
                });
            });
        }

        private static void ComposeSection1(QuestPDF.Fluent.ColumnDescriptor col, TenantListItemDto tenant, SgSstResponsibleDesignationDto designation)
        {
            SectionHeader(col, 1, "IDENTIFICACIÓN DE LA ORGANIZACIÓN / EMPLEADOR");
            col.Item().Border(1).BorderColor(RowBorder).Column(c =>
            {
                InfoRow(c, "Razón Social", tenant.RazonSocial);
                InfoRow(c, "NIT / Identificación", tenant.NitRuc + (string.IsNullOrWhiteSpace(tenant.DigitoVerificacion) ? "" : "-" + tenant.DigitoVerificacion));
                var direccionCompleta = string.Join(" / ", new[] { tenant.Direccion, designation.OrganizacionMunicipio, designation.OrganizacionDepartamento }
                    .Where(s => !string.IsNullOrWhiteSpace(s)));
                InfoRow(c, "Dirección de la Sede", direccionCompleta);
                InfoRow(c, "Actividad Económica", designation.OrganizacionActividadEconomica);
                InfoRowChoices(c, "Nivel de Riesgo ARL",
                    new[] { "I", "II", "III", "IV", "V" }.Select(v => ($"RIESGO {v}", v == designation.OrganizacionNivelRiesgoArl)));
                InfoRow(c, "Centro de Trabajo / Cobertura",
                    designation.CoberturaCentroTrabajo + (string.IsNullOrWhiteSpace(designation.CoberturaDetalle) ? "" : $" ({designation.CoberturaDetalle})"));
            });
        }

        private static void ComposeSection2(QuestPDF.Fluent.ColumnDescriptor col, SgSstResponsibleDesignationDto designation)
        {
            SectionHeader(col, 2, "PERFIL E IDENTIFICACIÓN DEL RESPONSABLE DESIGNADO");
            col.Item().Border(1).BorderColor(RowBorder).Column(c =>
            {
                InfoRow(c, "Nombres y Apellidos", designation.ResponsableNombreCompleto);
                InfoRow(c, "Tipo y N° de Documento", $"{DocTipoLabel(designation.ResponsableTipoDocumento)} N° {designation.ResponsableNumeroDocumento}");
                InfoRow(c, "Cargo Organizacional", designation.ResponsableCargo);
                InfoRowChoices(c, "Nivel de Competencia", new[]
                {
                    ("Técnico SST", designation.NivelCompetencia == SstCompetencyLevel.TecnicoSst),
                    ("Tecnólogo SST", designation.NivelCompetencia == SstCompetencyLevel.TecnologoSst),
                    ("Profesional SST", designation.NivelCompetencia == SstCompetencyLevel.ProfesionalSst),
                    ("Especialista SST", designation.NivelCompetencia == SstCompetencyLevel.EspecialistaSst)
                });
                InfoRow(c, "Licencia en SST Vigente", $"N° {designation.LicenciaSstNumero} | Expedida por: {designation.LicenciaSstExpedidaPor}");
                var actualizacion = designation.FechaActualizacion20Horas.HasValue
                    ? designation.FechaActualizacion20Horas.Value.ToString("dd/MM/yyyy")
                    : "N/A";
                InfoRowChoices(c, "Curso Virtual 50 Horas", new[]
                {
                    ("SÍ Aprobado", designation.Curso50HorasAprobado),
                    ("NO Pendiente", !designation.Curso50HorasAprobado)
                });
                InfoRow(c, "Última Actualización 20 Horas", actualizacion);
            });
        }

        private static void ComposeSection3(QuestPDF.Fluent.ColumnDescriptor col, SgSstResponsibleDesignationDto designation)
        {
            SectionHeader(col, 3, "FUNCIONES, AUTORIDAD Y RESPONSABILIDADES ASIGNADAS");
            col.Item().Border(1).BorderColor(RowBorder).Padding(8).Column(c =>
            {
                c.Item().PaddingBottom(4).Text(
                    "En consonancia con la estructura del ciclo PHVA (Planear, Hacer, Verificar, Actuar) exigido por ISO 45001:2018 " +
                    "y la legislación colombiana vigente, la persona asignada asume la autoridad técnica y administrativa para " +
                    "desarrollar las siguientes funciones (X = aceptada por el responsable designado):"
                ).FontSize(7.5f).FontColor(Colors.Grey.Darken3).Justify();

                foreach (var fn in designation.FunctionAcceptances.OrderBy(f => f.FunctionDisplayOrder))
                {
                    c.Item().PaddingBottom(4).Row(row =>
                    {
                        row.ConstantItem(16).Text(fn.IsAccepted ? "X" : "-").FontSize(9).Bold()
                            .FontColor(fn.IsAccepted ? Colors.Green.Darken1 : Colors.Grey.Medium);
                        row.RelativeItem().Text(text =>
                        {
                            text.Span($"{fn.FunctionDisplayOrder}. {fn.FunctionTitle}: ").FontSize(8).Bold().FontColor(BrandDark);
                            text.Span(fn.FunctionDescription).FontSize(8).FontColor(Colors.Grey.Darken2);
                        });
                    });
                }
            });
        }

        private static void ComposeSection4(
            QuestPDF.Fluent.ColumnDescriptor col,
            SgSstResponsibleDesignationDto designation,
            byte[]? empleadorFirmaBytes,
            byte[]? responsableFirmaBytes)
        {
            SectionHeader(col, 4, "COMPROMISO DE LA ALTA DIRECCIÓN Y DECLARACIÓN DE ACEPTACIÓN");
            col.Item().Border(1).BorderColor(RowBorder).Padding(8).Column(c =>
            {
                c.Item().Background(LabelBg).Padding(6).Column(inner =>
                {
                    inner.Item().Text("Por parte de la Alta Dirección / Representación Legal:").FontSize(7.5f).Bold().FontColor(BrandDark);
                    inner.Item().PaddingTop(1).Text(
                        "La empresa se compromete a suministrar los recursos financieros, humanos, técnicos y tecnológicos " +
                        "necesarios para la operación y mejora continua del SG-SST, otorgando la autoridad formal al responsable " +
                        "para la toma de decisiones técnicas dentro del marco del Sistema Integrado de Gestión."
                    ).FontSize(7.5f).FontColor(Colors.Grey.Darken3).Justify();

                    inner.Item().PaddingTop(6).Text("Por parte del Responsable Designado:").FontSize(7.5f).Bold().FontColor(BrandDark);
                    inner.Item().PaddingTop(1).Text(
                        "Acepto expresamente la asignación de responsabilidades y la autoridad conferida, comprometiéndome a " +
                        "cumplir los lineamientos del Sistema Integrado de Gestión (ISO 9001 / ISO 45001) y la legislación " +
                        "colombiana aplicable con rigor ético y profesional."
                    ).FontSize(7.5f).FontColor(Colors.Grey.Darken3).Justify();
                });

                c.Item().PaddingTop(6).Text(
                    $"Para constancia de lo anterior, se suscribe el presente documento en la ciudad de {designation.SuscripcionCiudad}, " +
                    $"el {designation.SuscripcionFecha:dd 'de' MMMM 'de' yyyy}."
                ).FontSize(8).FontColor(BrandDark);

                c.Item().PaddingTop(10).Row(row =>
                {
                    row.RelativeItem().PaddingRight(6).Element(e => SignatureBlock(
                        e, "POR LA ORGANIZACIÓN / EMPLEADOR", empleadorFirmaBytes,
                        designation.EmpleadorAceptaNombre, "Cargo", designation.EmpleadorAceptaCargo,
                        "Documento", designation.EmpleadorAceptaDocumento));

                    row.RelativeItem().PaddingLeft(6).Element(e => SignatureBlock(
                        e, "EL RESPONSABLE DESIGNADO DEL SG-SST", responsableFirmaBytes,
                        designation.ResponsableAceptaNombre, "Licencia SST N°", designation.ResponsableAceptaLicencia,
                        "Documento", designation.ResponsableAceptaDocumento));
                });
            });
        }

        private static void SignatureBlock(
            QuestPDF.Infrastructure.IContainer container,
            string title,
            byte[]? firmaBytes,
            string nombre,
            string extraLabel,
            string extraValue,
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
                c.Item().PaddingTop(2).Text($"{extraLabel}: {extraValue}").FontSize(7.5f).FontColor(BrandDark);
                c.Item().PaddingTop(2).Text($"{docLabel}: {docValue}").FontSize(7.5f).FontColor(BrandDark);
            });
        }

        private static void ComposeSection5(QuestPDF.Fluent.ColumnDescriptor col, List<SgSstResponsibleDesignationDto> history)
        {
            SectionHeader(col, 5, "CONTROL DE CAMBIOS Y CUSTODIA DOCUMENTAL (ISO 9001 / ISO 45001)");
            col.Item().Border(1).BorderColor(RowBorder).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(45);
                    columns.ConstantColumn(70);
                    columns.RelativeColumn();
                    columns.ConstantColumn(90);
                });

                void HeaderCell(string text) => table.Cell().Background(LabelBg).BorderBottom(1).BorderColor(RowBorder)
                    .Padding(5).Text(text).FontSize(7).Bold().FontColor(Colors.Grey.Darken2);

                table.Header(header =>
                {
                    HeaderCell("Versión");
                    HeaderCell("Fecha");
                    HeaderCell("Descripción");
                    HeaderCell("Elaboró / Revisó");
                });

                var ordered = history.OrderByDescending(h => h.Version).ToList();
                foreach (var record in ordered)
                {
                    var isActive = record.Status == SgSstDesignationStatus.Active;
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(record.Version.ToString("00")).FontSize(7.5f).FontColor(BrandDark);
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(record.SuscripcionFecha.ToString("dd/MM/yyyy")).FontSize(7.5f).FontColor(BrandDark);
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text($"Designación de {record.ResponsableNombreCompleto} como {record.ResponsableCargo}" +
                              (isActive ? "." : " (versión reemplazada)."))
                        .FontSize(7.5f).FontColor(BrandDark);
                    table.Cell().BorderBottom(1).BorderColor(RowBorder).Padding(5)
                        .Text(isActive ? "Vigente" : "Histórico").FontSize(7.5f).FontColor(BrandDark);
                }

                if (ordered.Count == 0)
                {
                    table.Cell().ColumnSpan(4).Padding(8).AlignCenter()
                        .Text("Sin versiones registradas.").FontSize(7.5f).FontColor(Colors.Grey.Medium);
                }
            });
        }

        private static string DocTipoLabel(DocumentIdType tipo) => tipo switch
        {
            DocumentIdType.Cc => "C.C.",
            DocumentIdType.Ce => "C.E.",
            DocumentIdType.Pasaporte => "Pasaporte",
            _ => tipo.ToString()
        };

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
