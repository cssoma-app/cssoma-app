using BackendAPI.Models;

namespace BackendAPI.Services
{
    public interface IResolucion0312ComplianceValidator
    {
        (ComplianceStatus status, string? nota) ValidateCompetencyRequirements(
            int numeroTrabajadores,
            string claseRiesgo,
            SstCompetencyLevel competencyLevel);
    }
}
