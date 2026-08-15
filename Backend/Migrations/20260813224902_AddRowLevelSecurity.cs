using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddRowLevelSecurity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Habilitar RLS en Employees
            migrationBuilder.Sql("ALTER TABLE \"Employees\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("DROP POLICY IF EXISTS tenant_employees_policy ON \"Employees\";");
            migrationBuilder.Sql("CREATE POLICY tenant_employees_policy ON \"Employees\" " +
                                 "USING (\"TenantId\" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid " +
                                 "OR current_setting('app.is_super_admin', true) = 'true');");

            // Habilitar RLS en Documents
            migrationBuilder.Sql("ALTER TABLE \"Documents\" ENABLE ROW LEVEL SECURITY;");
            migrationBuilder.Sql("DROP POLICY IF EXISTS tenant_documents_policy ON \"Documents\";");
            migrationBuilder.Sql("CREATE POLICY tenant_documents_policy ON \"Documents\" " +
                                 "USING (\"TenantId\" = NULLIF(current_setting('app.current_tenant_id', true), '')::uuid " +
                                 "OR current_setting('app.is_super_admin', true) = 'true');");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP POLICY IF EXISTS tenant_employees_policy ON \"Employees\";");
            migrationBuilder.Sql("ALTER TABLE \"Employees\" DISABLE ROW LEVEL SECURITY;");

            migrationBuilder.Sql("DROP POLICY IF EXISTS tenant_documents_policy ON \"Documents\";");
            migrationBuilder.Sql("ALTER TABLE \"Documents\" DISABLE ROW LEVEL SECURITY;");
        }
    }
}
