using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardCardsCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "DashboardCards",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Key = table.Column<string>(type: "text", nullable: false),
                    TabKey = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    IsEnabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DashboardCards", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TenantDashboardCards",
                columns: table => new
                {
                    EnabledDashboardCardsId = table.Column<int>(type: "integer", nullable: false),
                    TenantsId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TenantDashboardCards", x => new { x.EnabledDashboardCardsId, x.TenantsId });
                    table.ForeignKey(
                        name: "FK_TenantDashboardCards_DashboardCards_EnabledDashboardCardsId",
                        column: x => x.EnabledDashboardCardsId,
                        principalTable: "DashboardCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TenantDashboardCards_Tenants_TenantsId",
                        column: x => x.TenantsId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserDashboardCards",
                columns: table => new
                {
                    EnabledDashboardCardsId = table.Column<int>(type: "integer", nullable: false),
                    UsersId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserDashboardCards", x => new { x.EnabledDashboardCardsId, x.UsersId });
                    table.ForeignKey(
                        name: "FK_UserDashboardCards_DashboardCards_EnabledDashboardCardsId",
                        column: x => x.EnabledDashboardCardsId,
                        principalTable: "DashboardCards",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserDashboardCards_Users_UsersId",
                        column: x => x.UsersId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DashboardCards_Key",
                table: "DashboardCards",
                column: "Key",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TenantDashboardCards_TenantsId",
                table: "TenantDashboardCards",
                column: "TenantsId");

            migrationBuilder.CreateIndex(
                name: "IX_UserDashboardCards_UsersId",
                table: "UserDashboardCards",
                column: "UsersId");

            // Catálogo inicial de tarjetas del dashboard: tab1 = Análisis de Riesgos (empresa propia),
            // tab2 = Visión de Empresas (multi-tenant, solo visible para quien tiene acceso amplio).
            migrationBuilder.Sql(@"
                INSERT INTO ""DashboardCards"" (""Key"", ""TabKey"", ""Name"", ""Description"", ""IsEnabled"") VALUES
                    ('cumplimiento-general', 'tab1', 'Cumplimiento General', 'Porcentaje global de cumplimiento normativo de la empresa.', true),
                    ('documentos-totales', 'tab1', 'Documentos', 'Total de documentos de seguridad e higiene registrados.', true),
                    ('documentos-vencidos', 'tab1', 'Vencidos', 'Documentos que requieren atención inmediata por vencimiento.', true),
                    ('acciones-abiertas', 'tab1', 'Acciones Abiertas', 'Acciones correctivas o preventivas en seguimiento.', true),
                    ('semaforo-cumplimiento', 'tab1', 'Semáforo de Cumplimiento', 'Distribución de documentos por estado: cumplidos, por vencer, vencidos y no aplica.', true),
                    ('cumplimiento-por-estandar', 'tab1', 'Cumplimiento por Estándar', 'Nivel de cumplimiento desglosado por estándar normativo.', true),
                    ('lista-documentos-vencidos', 'tab1', 'Documentos Vencidos', 'Listado detallado de los documentos vencidos más recientes.', true),
                    ('empresas-activas', 'tab2', 'Empresas Activas', 'Cantidad de empresas activas en la plataforma.', true),
                    ('empresas-asociadas', 'tab2', 'Empresas Asociadas', 'Cantidad total de empresas registradas en la plataforma.', true),
                    ('usuarios-por-empresa', 'tab2', 'Usuarios por Empresa', 'Distribución de usuarios activos por cada empresa cliente.', true),
                    ('compras-mes', 'tab2', 'Compras del Mes', 'Ingresos por compras/renovaciones de servicios en el mes en curso.', true),
                    ('tipos-riesgo', 'tab2', 'Tipos de Riesgo', 'Distribución de los tipos de riesgo identificados en la plataforma.', true),
                    ('empresas-por-riesgo', 'tab2', 'Empresas por Nivel de Riesgo', 'Cantidad de empresas agrupadas por nivel de riesgo (alto, medio, bajo).', true);
            ");

            // Backfill: conceder todas las tarjetas nuevas a todos los tenants/usuarios ya
            // existentes, para no ocultarles de golpe nada que ya podían ver antes de este cambio.
            migrationBuilder.Sql(@"
                INSERT INTO ""TenantDashboardCards"" (""TenantsId"", ""EnabledDashboardCardsId"")
                SELECT t.""Id"", c.""Id"" FROM ""Tenants"" t CROSS JOIN ""DashboardCards"" c;
            ");
            migrationBuilder.Sql(@"
                INSERT INTO ""UserDashboardCards"" (""UsersId"", ""EnabledDashboardCardsId"")
                SELECT u.""Id"", c.""Id"" FROM ""Users"" u CROSS JOIN ""DashboardCards"" c;
            ");

            // Nueva entrada de página de configuración en el catálogo de Servicios existente,
            // para que /dashboard/dashboard-cards se active/asigne con el mismo mecanismo que
            // Roles/Servicios/Usuarios (ver AddServiceCatalogAndAssignments).
            migrationBuilder.Sql(@"
                INSERT INTO ""SassServices"" (""Key"", ""ParentKey"", ""Name"", ""Description"", ""IsEnabled"") VALUES
                    ('dashboard-cards', 'admin', 'Tarjetas del Dashboard', 'Catálogo de tarjetas visibles en el dashboard principal.', true);
            ");
            migrationBuilder.Sql(@"
                INSERT INTO ""TenantServices"" (""TenantsId"", ""EnabledServicesId"")
                SELECT t.""Id"", s.""Id"" FROM ""Tenants"" t CROSS JOIN ""SassServices"" s WHERE s.""Key"" = 'dashboard-cards';
            ");
            migrationBuilder.Sql(@"
                INSERT INTO ""UserServices"" (""UsersId"", ""EnabledServicesId"")
                SELECT u.""Id"", s.""Id"" FROM ""Users"" u CROSS JOIN ""SassServices"" s WHERE s.""Key"" = 'dashboard-cards';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"DELETE FROM ""SassServices"" WHERE ""Key"" = 'dashboard-cards';");

            migrationBuilder.DropTable(
                name: "TenantDashboardCards");

            migrationBuilder.DropTable(
                name: "UserDashboardCards");

            migrationBuilder.DropTable(
                name: "DashboardCards");
        }
    }
}
