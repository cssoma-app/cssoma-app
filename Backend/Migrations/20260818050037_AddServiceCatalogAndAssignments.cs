using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceCatalogAndAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Key",
                table: "SassServices",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ParentKey",
                table: "SassServices",
                type: "text",
                nullable: true);

            // Los 4 servicios genéricos sembrados originalmente no correspondían a ítems reales
            // del sidebar. Se reemplazan por un catálogo 1 a 1 con los menús/submenús reales.
            migrationBuilder.Sql(@"DELETE FROM ""SassServices"";");
            migrationBuilder.Sql(@"
                INSERT INTO ""SassServices"" (""Key"", ""ParentKey"", ""Name"", ""Description"", ""IsEnabled"") VALUES
                    ('documents', NULL, 'Documentos', 'Gestión documental de seguridad e higiene.', true),
                    ('tenants', NULL, 'Administración Empresas', 'Alta y administración de empresas clientes de la plataforma.', true),
                    ('users', 'admin', 'Usuarios', 'Gestión de cuentas de acceso al sistema.', true),
                    ('roles', 'admin', 'Roles', 'Catálogo de roles del sistema.', true),
                    ('services', 'admin', 'Servicios Globales', 'Catálogo de servicios/menús activables de la plataforma.', true),
                    ('pipeline', 'development', 'Pipeline CI/CD', 'Estado del pipeline de integración y despliegue continuo.', true);
            ");

            migrationBuilder.CreateTable(
                name: "TenantServices",
                columns: table => new
                {
                    EnabledServicesId = table.Column<int>(type: "integer", nullable: false),
                    TenantsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantServices", x => new { x.EnabledServicesId, x.TenantsId });
                    table.ForeignKey(
                        name: "FK_TenantServices_SassServices_EnabledServicesId",
                        column: x => x.EnabledServicesId,
                        principalTable: "SassServices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TenantServices_Tenants_TenantsId",
                        column: x => x.TenantsId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserServices",
                columns: table => new
                {
                    EnabledServicesId = table.Column<int>(type: "integer", nullable: false),
                    UsersId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserServices", x => new { x.EnabledServicesId, x.UsersId });
                    table.ForeignKey(
                        name: "FK_UserServices_SassServices_EnabledServicesId",
                        column: x => x.EnabledServicesId,
                        principalTable: "SassServices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserServices_Users_UsersId",
                        column: x => x.UsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Backfill: conceder todos los servicios nuevos a todos los tenants/usuarios ya
            // existentes, para no ocultarles de golpe nada que ya podían ver antes de este cambio.
            migrationBuilder.Sql(@"
                INSERT INTO ""TenantServices"" (""TenantsId"", ""EnabledServicesId"")
                SELECT t.""Id"", s.""Id"" FROM ""Tenants"" t CROSS JOIN ""SassServices"" s;
            ");
            migrationBuilder.Sql(@"
                INSERT INTO ""UserServices"" (""UsersId"", ""EnabledServicesId"")
                SELECT u.""Id"", s.""Id"" FROM ""Users"" u CROSS JOIN ""SassServices"" s;
            ");

            migrationBuilder.CreateIndex(
                name: "IX_SassServices_Key",
                table: "SassServices",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TenantServices_TenantsId",
                table: "TenantServices",
                column: "TenantsId");

            migrationBuilder.CreateIndex(
                name: "IX_UserServices_UsersId",
                table: "UserServices",
                column: "UsersId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TenantServices");

            migrationBuilder.DropTable(
                name: "UserServices");

            migrationBuilder.DropIndex(
                name: "IX_SassServices_Key",
                table: "SassServices");

            migrationBuilder.DropColumn(
                name: "Key",
                table: "SassServices");

            migrationBuilder.DropColumn(
                name: "ParentKey",
                table: "SassServices");
        }
    }
}
