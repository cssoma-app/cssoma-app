using System;
using System.Collections.Generic;

namespace BackendAPI.Models
{
    public class Tenant
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string RazonSocial { get; set; } = string.Empty;
        public string NitRuc { get; set; } = string.Empty;
        // Dígito de verificación del NIT (1 carácter), guardado aparte del número principal
        // para poder renderizarlo separado por guion en el frontend sin parsear el string.
        public string DigitoVerificacion { get; set; } = string.Empty;
        public string Direccion { get; set; } = string.Empty;
        public string Telefono { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public bool IsPlatformOwner { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Perfil SST de la empresa (ver AGENTS.md — captura básica a nivel de empresa,
        // independiente del detalle transaccional del módulo Diseño e Implementación SG-SST).
        public string Ciiu { get; set; } = string.Empty;
        public int NumeroTrabajadores { get; set; } = 0;
        public int CentrosTrabajo { get; set; } = 0;
        public string ClaseRiesgo { get; set; } = string.Empty;
        public string Arl { get; set; } = string.Empty;
        public string ResponsableSst { get; set; } = string.Empty;
        public bool TieneCopasst { get; set; } = false;
        public bool TieneComiteConvivencia { get; set; } = false;
        public bool TieneBrigada { get; set; } = false;
        public bool TieneContratistas { get; set; } = false;

        // Navigation properties
        public ICollection<User> Users { get; set; } = new List<User>();
        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
        public ICollection<Document> Documents { get; set; } = new List<Document>();
        // Servicios/menús habilitados para esta empresa. Un usuario de este tenant nunca puede
        // tener habilitado un servicio que el tenant mismo no tenga aquí (ver UsersController).
        public ICollection<SassService> EnabledServices { get; set; } = new List<SassService>();
        // Tarjetas del dashboard habilitadas para esta empresa. Un usuario de este tenant nunca
        // puede ver una tarjeta que el tenant mismo no tenga aquí (ver UsersController).
        public ICollection<DashboardCard> EnabledDashboardCards { get; set; } = new List<DashboardCard>();
    }
}
