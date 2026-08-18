using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddRbacRolesAndUserStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // NOTA: la columna legada "Role" (enum int) NO se elimina en esta migración.
            // Queda huérfana/sin mapear en el modelo EF para mantener el cambio reversible
            // y evitar un DROP COLUMN destructivo en el mismo PR. Limpieza = follow-up aparte.

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId",
                table: "Users");

            migrationBuilder.AddColumn<bool>(
                name: "IsDisabled",
                table: "Users",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "Users",
                type: "timestamp with time zone",
                nullable: true);

            // RoleId se agrega nullable primero para poder hacer el backfill de datos
            // desde la columna legada "Role"; luego se vuelve NOT NULL.
            migrationBuilder.AddColumn<Guid>(
                name: "RoleId",
                table: "Users",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Key = table.Column<string>(type: "text", nullable: false),
                    DisplayName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Roles_Key",
                table: "Roles",
                column: "Key",
                unique: true);

            // Sembrado de los 3 roles del sistema con GUID fijos (ver RoleKeys en Models/Role.cs).
            migrationBuilder.Sql(@"
                INSERT INTO ""Roles"" (""Id"", ""Key"", ""DisplayName"") VALUES
                    ('11111111-1111-1111-1111-111111111111', 'SuperAdmin', 'Super Administrador'),
                    ('22222222-2222-2222-2222-222222222222', 'Admin', 'Administrador de Empresa'),
                    ('33333333-3333-3333-3333-333333333333', 'Member', 'Colaborador')
                ON CONFLICT (""Id"") DO NOTHING;
            ");

            // Backfill: mapea la columna legada "Role" (0=SST_Manager, 1=General_Manager, 2=SuperAdmin)
            // al nuevo RoleId. SST_Manager era el admin real de tenant (usado en TenantsController) -> Admin;
            // General_Manager no se asignaba en ningún flujo real -> se mapea a Member por defecto.
            migrationBuilder.Sql(@"
                UPDATE ""Users"" SET ""RoleId"" =
                    CASE ""Role""
                        WHEN 0 THEN '22222222-2222-2222-2222-222222222222'::uuid
                        WHEN 2 THEN '11111111-1111-1111-1111-111111111111'::uuid
                        ELSE '33333333-3333-3333-3333-333333333333'::uuid
                    END
                WHERE ""RoleId"" IS NULL;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "RoleId",
                table: "Users",
                type: "uuid",
                nullable: false,
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Users_RoleId",
                table: "Users",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId_IsDisabled",
                table: "Users",
                columns: new[] { "TenantId", "IsDisabled" });

            migrationBuilder.AddForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users",
                column: "RoleId",
                principalTable: "Roles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Users_Roles_RoleId",
                table: "Users");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropIndex(
                name: "IX_Users_RoleId",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_TenantId_IsDisabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsDisabled",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "RoleId",
                table: "Users");

            // La columna legada "Role" nunca se eliminó en Up(), no requiere restauración aquí.

            migrationBuilder.CreateIndex(
                name: "IX_Users_TenantId",
                table: "Users",
                column: "TenantId");
        }
    }
}
