using BackendAPI.Models;

namespace BackendAPI.Services
{
    public class Resolucion0312ComplianceValidator : IResolucion0312ComplianceValidator
    {
        public (ComplianceStatus status, string? nota) ValidateCompetencyRequirements(
            int numeroTrabajadores,
            string claseRiesgo,
            SstCompetencyLevel competencyLevel)
        {
            string minimumLevelRequired = DetermineMinimumCompetencyLevel(numeroTrabajadores, claseRiesgo);

            var levelHierarchy = new Dictionary<string, int>
            {
                { "TecnicoSst", 1 },
                { "TecnologoSst", 2 },
                { "ProfesionalSst", 3 },
                { "EspecialistaSst", 4 }
            };

            string currentLevelString = competencyLevel.ToString();
            int currentLevel = levelHierarchy.GetValueOrDefault(currentLevelString, 0);
            int requiredLevel = levelHierarchy.GetValueOrDefault(minimumLevelRequired, 1);

            if (currentLevel >= requiredLevel)
            {
                return (ComplianceStatus.Cumple,
                    $"Perfil de competencia conforme a Resolución 0312/2019: {currentLevelString} cumple con el requisito mínimo ({minimumLevelRequired}).");
            }

            return (ComplianceStatus.NoCumple,
                $"Resolución 0312/2019: empresas clase de riesgo {claseRiesgo} requieren mínimo {minimumLevelRequired}; actual: {currentLevelString}.");
        }

        private string DetermineMinimumCompetencyLevel(int numeroTrabajadores, string claseRiesgo)
        {
            return (claseRiesgo.ToLowerInvariant(), numeroTrabajadores) switch
            {
                ("i" or "ii", <= 50) => "TecnicoSst",
                ("i" or "ii", > 50) => "TecnologoSst",
                ("iii", <= 50) => "TecnologoSst",
                ("iii", > 50) => "ProfesionalSst",
                ("iv" or "v", _) => "ProfesionalSst",
                _ => "TecnicoSst"
            };
        }
    }
}
