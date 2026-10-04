using BackendAPI.Models;
using BackendAPI.Services;

namespace BackendAPI.Tests
{
    public class Resolucion0312ComplianceValidatorTests
    {
        private readonly Resolucion0312ComplianceValidator _validator = new();

        [Theory]
        // Riesgo I/II, <=50 trabajadores => mínimo Técnico SST
        [InlineData(30, "I", SstCompetencyLevel.TecnicoSst, ComplianceStatus.Cumple)]
        [InlineData(30, "II", SstCompetencyLevel.TecnicoSst, ComplianceStatus.Cumple)]
        // Riesgo I/II, >50 trabajadores => mínimo Tecnólogo SST
        [InlineData(80, "I", SstCompetencyLevel.TecnicoSst, ComplianceStatus.NoCumple)]
        [InlineData(80, "I", SstCompetencyLevel.TecnologoSst, ComplianceStatus.Cumple)]
        // Riesgo III, <=50 => mínimo Tecnólogo SST
        [InlineData(20, "III", SstCompetencyLevel.TecnicoSst, ComplianceStatus.NoCumple)]
        [InlineData(20, "III", SstCompetencyLevel.TecnologoSst, ComplianceStatus.Cumple)]
        // Riesgo III, >50 => mínimo Profesional SST
        [InlineData(100, "III", SstCompetencyLevel.TecnologoSst, ComplianceStatus.NoCumple)]
        [InlineData(100, "III", SstCompetencyLevel.ProfesionalSst, ComplianceStatus.Cumple)]
        // Riesgo IV/V, cualquier tamaño => mínimo Profesional SST
        [InlineData(10, "IV", SstCompetencyLevel.TecnologoSst, ComplianceStatus.NoCumple)]
        [InlineData(10, "IV", SstCompetencyLevel.ProfesionalSst, ComplianceStatus.Cumple)]
        [InlineData(500, "V", SstCompetencyLevel.EspecialistaSst, ComplianceStatus.Cumple)]
        public void ValidateCompetencyRequirements_ReturnsExpectedStatus(
            int numeroTrabajadores, string claseRiesgo, SstCompetencyLevel nivel, ComplianceStatus esperado)
        {
            var (status, nota) = _validator.ValidateCompetencyRequirements(numeroTrabajadores, claseRiesgo, nivel);

            Assert.Equal(esperado, status);
            Assert.False(string.IsNullOrWhiteSpace(nota));
        }

        [Fact]
        public void ValidateCompetencyRequirements_HigherThanRequired_StillCumple()
        {
            // Un especialista siempre cumple, incluso en el escenario menos exigente.
            var (status, _) = _validator.ValidateCompetencyRequirements(10, "I", SstCompetencyLevel.EspecialistaSst);

            Assert.Equal(ComplianceStatus.Cumple, status);
        }

        [Fact]
        public void ValidateCompetencyRequirements_UnknownClaseRiesgo_FallsBackToTecnicoMinimum()
        {
            var (status, _) = _validator.ValidateCompetencyRequirements(10, "N/A", SstCompetencyLevel.TecnicoSst);

            Assert.Equal(ComplianceStatus.Cumple, status);
        }
    }
}
