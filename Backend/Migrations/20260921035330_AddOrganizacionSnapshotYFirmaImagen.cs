using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddOrganizacionSnapshotYFirmaImagen : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EmpleadorFirmaImagen",
                table: "SgSstResponsibleDesignations",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OrganizacionDepartamento",
                table: "SgSstResponsibleDesignations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OrganizacionMunicipio",
                table: "SgSstResponsibleDesignations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "OrganizacionNivelRiesgoArl",
                table: "SgSstResponsibleDesignations",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ResponsableFirmaImagen",
                table: "SgSstResponsibleDesignations",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EmpleadorFirmaImagen",
                table: "SgSstResponsibleDesignations");

            migrationBuilder.DropColumn(
                name: "OrganizacionDepartamento",
                table: "SgSstResponsibleDesignations");

            migrationBuilder.DropColumn(
                name: "OrganizacionMunicipio",
                table: "SgSstResponsibleDesignations");

            migrationBuilder.DropColumn(
                name: "OrganizacionNivelRiesgoArl",
                table: "SgSstResponsibleDesignations");

            migrationBuilder.DropColumn(
                name: "ResponsableFirmaImagen",
                table: "SgSstResponsibleDesignations");
        }
    }
}
