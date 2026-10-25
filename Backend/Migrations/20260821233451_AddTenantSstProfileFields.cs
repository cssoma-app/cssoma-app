using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantSstProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Arl",
                table: "Tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CentrosTrabajo",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Ciiu",
                table: "Tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ClaseRiesgo",
                table: "Tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DigitoVerificacion",
                table: "Tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "NumeroTrabajadores",
                table: "Tenants",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ResponsableSst",
                table: "Tenants",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "TieneBrigada",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TieneComiteConvivencia",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TieneContratistas",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TieneCopasst",
                table: "Tenants",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Arl",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "CentrosTrabajo",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "Ciiu",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ClaseRiesgo",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "DigitoVerificacion",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "NumeroTrabajadores",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "ResponsableSst",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "TieneBrigada",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "TieneComiteConvivencia",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "TieneContratistas",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "TieneCopasst",
                table: "Tenants");
        }
    }
}
