using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class DropLegacyRoleColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // La columna legada "Role" (enum int) ya no la usa el modelo desde
            // AddRbacRolesAndUserStatus (reemplazada por RoleId), pero quedó sin default
            // ni nullable en la base real -> cualquier INSERT nuevo de EF (que no la setea)
            // viola el NOT NULL. Se elimina definitivamente.
            migrationBuilder.DropColumn(
                name: "Role",
                table: "Users");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Role",
                table: "Users",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
