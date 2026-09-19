using System;
using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class SgSstFunctionCatalog
    {
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int DisplayOrder { get; set; }
        public bool IsActive { get; set; } = true;

        public ICollection<SgSstDesignationFunction> DesignationFunctions { get; set; } = new List<SgSstDesignationFunction>();
    }
}
