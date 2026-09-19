using Microsoft.EntityFrameworkCore.Migrations;
using System;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSgSstResponsibleDesignations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SgSstFunctionCatalogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", Npgsql.EntityFrameworkCore.PostgreSQL.Metadata.NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SgSstFunctionCatalogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SgSstResponsibleDesignations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CoberturaCentroTrabajo = table.Column<string>(type: "text", nullable: false),
                    CoberturaDetalle = table.Column<string>(type: "text", nullable: true),
                    ResponsableNombreCompleto = table.Column<string>(type: "text", nullable: false),
                    ResponsableCargo = table.Column<string>(type: "text", nullable: false),
                    ResponsableTipoDocumento = table.Column<int>(type: "integer", nullable: false),
                    ResponsableNumeroDocumento = table.Column<string>(type: "text", nullable: false),
                    NivelCompetencia = table.Column<int>(type: "integer", nullable: false),
                    LicenciaSstNumero = table.Column<string>(type: "text", nullable: false),
                    LicenciaSstExpedidaPor = table.Column<string>(type: "text", nullable: false),
                    Curso50HorasAprobado = table.Column<bool>(type: "boolean", nullable: false),
                    FechaActualizacion20Horas = table.Column<DateTime>(type: "date", nullable: true),
                    EmpleadorAceptaNombre = table.Column<string>(type: "text", nullable: false),
                    EmpleadorAceptaCargo = table.Column<string>(type: "text", nullable: false),
                    EmpleadorAceptaDocumento = table.Column<string>(type: "text", nullable: false),
                    EmpleadorAceptaFechaHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResponsableAceptaNombre = table.Column<string>(type: "text", nullable: false),
                    ResponsableAceptaLicencia = table.Column<string>(type: "text", nullable: false),
                    ResponsableAceptaDocumento = table.Column<string>(type: "text", nullable: false),
                    ResponsableAceptaFechaHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SuscripcionCiudad = table.Column<string>(type: "text", nullable: false),
                    SuscripcionFecha = table.Column<DateTime>(type: "date", nullable: false),
                    ComplianceStatus = table.Column<int>(type: "integer", nullable: false),
                    ComplianceNota = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SgSstResponsibleDesignations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SgSstResponsibleDesignations_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SgSstDesignationFunctions",
                columns: table => new
                {
                    DesignationId = table.Column<Guid>(type: "uuid", nullable: false),
                    FunctionId = table.Column<int>(type: "integer", nullable: false),
                    IsAccepted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SgSstDesignationFunctions", x => new { x.DesignationId, x.FunctionId });
                    table.ForeignKey(
                        name: "FK_SgSstDesignationFunctions_SgSstFunctionCatalogs_FunctionId",
                        column: x => x.FunctionId,
                        principalTable: "SgSstFunctionCatalogs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_SgSstDesignationFunctions_SgSstResponsibleDesignations_DesignationId",
                        column: x => x.DesignationId,
                        principalTable: "SgSstResponsibleDesignations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SgSstDesignationFunctions_FunctionId",
                table: "SgSstDesignationFunctions",
                column: "FunctionId");

            migrationBuilder.CreateIndex(
                name: "IX_SgSstFunctionCatalogs_Code",
                table: "SgSstFunctionCatalogs",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_SgSstResponsibleDesignations_TenantId_Status",
                table: "SgSstResponsibleDesignations",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SgSstResponsibleDesignations_TenantId_Version",
                table: "SgSstResponsibleDesignations",
                columns: new[] { "TenantId", "Version" },
                unique: true);

            migrationBuilder.Sql(@"
                INSERT INTO ""SgSstFunctionCatalogs"" (""Code"", ""Title"", ""Description"", ""DisplayOrder"", ""IsActive"") VALUES
                ('F01', 'Planificación Estratégica (Planear)', 'Diseñar, implementar y evaluar el Plan de Trabajo Anual del SG-SST, asegurando su alineación con los objetivos de calidad y SST de la organización (ISO 9001 / ISO 45001 Cap. 6).', 1, true),
                ('F02', 'Identificación de Peligros y Evaluación de Riesgos (IPEVR)', 'Administrar la metodología para la identificación de peligros, evaluación y valoración de riesgos en todos los centros y puestos de trabajo, definiendo la jerarquía de controles preventivos.', 2, true),
                ('F03', 'Cumplimiento Legal y Normativo', 'Estructurar, actualizar y evaluar periódicamente la Matriz de Requisitos Legales aplicables en materia de riesgos laborales y normatividad ISO aplicable.', 3, true),
                ('F04', 'Competencia y Toma de Conciencia', 'Coordinar y ejecutar el Plan Anual de Capacitación en SST, promoviendo la toma de conciencia sobre el impacto en la seguridad de las operaciones.', 4, true),
                ('F05', 'Investigación de Incidentes y Accidentes', 'Liderar el análisis de causas e investigación de incidentes, accidentes de trabajo (AT) y enfermedades laborales (EL), en conjunto con el COPASST / Vigía de SST.', 5, true),
                ('F06', 'Medicina del Trabajo y Vigilancia Epidemiológica', 'Coordinar los exámenes médicos ocupacionales y ejecutar los programas de vigilancia epidemiológica requeridos según los factores de riesgo prioritarios.', 6, true),
                ('F07', 'Inspecciones y Control Operativo', 'Realizar inspecciones periódicas a la infraestructura, herramientas, maquinaria y equipos, garantizando el suministro y uso adecuado de Elementos de Protección Personal (EPP).', 7, true),
                ('F08', 'Respuesta ante Emergencias', 'Mantener actualizado y probado el Plan de Prevención, Preparación y Respuesta ante Emergencias de la empresa.', 8, true),
                ('F09', 'Participación y Consulta', 'Promover la consulta activa de los trabajadores, coordinando las actividades del COPASST / Vigía de SST y el Comité de Convivencia Laboral.', 9, true),
                ('F10', 'Control de la Información Documentada y Rendición de Cuentas', 'Garantizar la custodia, integridad, legibilidad y conservación segura de los registros del SG-SST (mínimo 20 años para registros clave) y rendir cuentas periódicamente ante la Alta Dirección.', 10, true),
                ('F11', 'Mejora Continua y Acción Correctiva (Actuar)', 'Establecer y verificar los planes de acción correctivos, preventivos y de mejora derivados de auditorías internas (ISO 9001 / 45001), revisiones de la dirección e investigaciones.', 11, true);
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SgSstDesignationFunctions");

            migrationBuilder.DropTable(
                name: "SgSstFunctionCatalogs");

            migrationBuilder.DropTable(
                name: "SgSstResponsibleDesignations");
        }
    }
}
