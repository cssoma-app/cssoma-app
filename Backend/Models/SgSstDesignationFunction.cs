using System;

namespace BackendAPI.Models
{
    public class SgSstDesignationFunction
    {
        public Guid DesignationId { get; set; }
        public int FunctionId { get; set; }
        public bool IsAccepted { get; set; } = false;

        public SgSstResponsibleDesignation? Designation { get; set; }
        public SgSstFunctionCatalog? Function { get; set; }
    }
}
