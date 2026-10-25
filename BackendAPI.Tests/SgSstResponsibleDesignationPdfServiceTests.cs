using BackendAPI.Models;
using BackendAPI.Services;

namespace BackendAPI.Tests
{
    public class SgSstResponsibleDesignationPdfServiceTests
    {
        static SgSstResponsibleDesignationPdfServiceTests()
        {
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        }

        private const string TinyPng = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

        [Fact]
        public void GeneratePdf_WithFullData_DoesNotThrow()
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

            var functions = new List<FunctionAcceptanceDto>();
            for (var i = 1; i <= 11; i++)
            {
                functions.Add(new FunctionAcceptanceDto
                {
                    FunctionId = i,
                    FunctionTitle = $"Función {i}",
                    FunctionDescription = $"Descripción larga de prueba para la función {i} que simula un texto real de varias palabras.",
                    FunctionDisplayOrder = i,
                    IsAccepted = i % 2 == 0
                });
            }

            var designation = new SgSstResponsibleDesignationDto
            {
                Id = Guid.NewGuid(),
                Version = 1,
                Status = SgSstDesignationStatus.Active,
                CoberturaCentroTrabajo = "Sede Central",
                CoberturaDetalle = null,
                OrganizacionDepartamento = "Antioquia",
                OrganizacionMunicipio = "Medellín",
                OrganizacionNivelRiesgoArl = "III",
                OrganizacionActividadEconomica = "Servicios de consultoría",
                ResponsableNombreCompleto = "Juan Perez",
                ResponsableCargo = "Coordinador SST",
                ResponsableTipoDocumento = DocumentIdType.Cc,
                ResponsableNumeroDocumento = "123456789",
                NivelCompetencia = SstCompetencyLevel.TecnicoSst,
                LicenciaSstNumero = "L-123",
                LicenciaSstExpedidaPor = "Secretaria de Salud",
                Curso50HorasAprobado = true,
                FechaActualizacion20Horas = DateTime.UtcNow,
                EmpleadorAceptaNombre = "Maria Lopez",
                EmpleadorAceptaCargo = "Representante Legal",
                EmpleadorAceptaDocumento = "987654321",
                EmpleadorFirmaImagen = TinyPng,
                ResponsableAceptaNombre = "Juan Perez",
                ResponsableAceptaLicencia = "L-123",
                ResponsableAceptaDocumento = "123456789",
                ResponsableFirmaImagen = TinyPng,
                SuscripcionCiudad = "Medellín",
                SuscripcionFecha = DateTime.UtcNow,
                ComplianceStatus = ComplianceStatus.Cumple,
                ComplianceNota = null,
                CreatedAt = DateTime.UtcNow,
                FunctionAcceptances = functions
            };

            var history = new List<SgSstResponsibleDesignationDto> { designation };

            var service = new SgSstResponsibleDesignationPdfService();

            byte[]? bytes = null;
            Exception? caught = null;
            try
            {
                bytes = service.GeneratePdf(tenant, designation, history);
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
        public void GeneratePdf_WithoutImages_DoesNotThrow()
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

            var functions = new List<FunctionAcceptanceDto>();
            for (var i = 1; i <= 11; i++)
            {
                functions.Add(new FunctionAcceptanceDto
                {
                    FunctionId = i,
                    FunctionTitle = $"Función {i}",
                    FunctionDescription = "Descripción de prueba.",
                    FunctionDisplayOrder = i,
                    IsAccepted = false
                });
            }

            var designation = new SgSstResponsibleDesignationDto
            {
                Id = Guid.NewGuid(),
                Version = 1,
                Status = SgSstDesignationStatus.Active,
                CoberturaCentroTrabajo = "Sede Central",
                OrganizacionDepartamento = "",
                OrganizacionMunicipio = "",
                OrganizacionNivelRiesgoArl = "",
                OrganizacionActividadEconomica = "",
                ResponsableNombreCompleto = "Juan Perez",
                ResponsableCargo = "Coordinador SST",
                ResponsableTipoDocumento = DocumentIdType.Cc,
                ResponsableNumeroDocumento = "123456789",
                NivelCompetencia = SstCompetencyLevel.TecnicoSst,
                LicenciaSstNumero = "L-123",
                LicenciaSstExpedidaPor = "Secretaria de Salud",
                Curso50HorasAprobado = false,
                FechaActualizacion20Horas = null,
                EmpleadorAceptaNombre = "Maria Lopez",
                EmpleadorAceptaCargo = "Representante Legal",
                EmpleadorAceptaDocumento = "987654321",
                EmpleadorFirmaImagen = null,
                ResponsableAceptaNombre = "Juan Perez",
                ResponsableAceptaLicencia = "L-123",
                ResponsableAceptaDocumento = "123456789",
                ResponsableFirmaImagen = null,
                SuscripcionCiudad = "Medellín",
                SuscripcionFecha = DateTime.UtcNow,
                ComplianceStatus = ComplianceStatus.RequiereRevision,
                ComplianceNota = null,
                CreatedAt = DateTime.UtcNow,
                FunctionAcceptances = functions
            };

            var service = new SgSstResponsibleDesignationPdfService();

            byte[]? bytes = null;
            Exception? caught = null;
            try
            {
                bytes = service.GeneratePdf(tenant, designation, new List<SgSstResponsibleDesignationDto>());
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
