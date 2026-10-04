using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

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
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Code = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false)
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
                    FechaActualizacion20Horas = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    EmpleadorAceptaNombre = table.Column<string>(type: "text", nullable: false),
                    EmpleadorAceptaCargo = table.Column<string>(type: "text", nullable: false),
                    EmpleadorAceptaDocumento = table.Column<string>(type: "text", nullable: false),
                    EmpleadorAceptaFechaHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResponsableAceptaNombre = table.Column<string>(type: "text", nullable: false),
                    ResponsableAceptaLicencia = table.Column<string>(type: "text", nullable: false),
                    ResponsableAceptaDocumento = table.Column<string>(type: "text", nullable: false),
                    ResponsableAceptaFechaHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    SuscripcionCiudad = table.Column<string>(type: "text", nullable: false),
                    SuscripcionFecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
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
                        name: "FK_SgSstDesignationFunctions_SgSstResponsibleDesignations_Desi~",
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
