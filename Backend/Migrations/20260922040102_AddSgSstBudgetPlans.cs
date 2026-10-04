using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace BackendAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddSgSstBudgetPlans : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "SgSstBudgetPlans",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Version = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    Vigencia = table.Column<int>(type: "integer", nullable: false),
                    RepresentanteLegalNombre = table.Column<string>(type: "text", nullable: false),
                    RepresentanteLegalDocumento = table.Column<string>(type: "text", nullable: false),
                    RepresentanteLegalFechaHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RepresentanteLegalFirmaImagen = table.Column<string>(type: "text", nullable: true),
                    ResponsableSgSstNombre = table.Column<string>(type: "text", nullable: false),
                    ResponsableSgSstDocumento = table.Column<string>(type: "text", nullable: false),
                    ResponsableSgSstFechaHora = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ResponsableSgSstFirmaImagen = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SgSstBudgetPlans", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SgSstBudgetPlans_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "SgSstBudgetLineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    BudgetPlanId = table.Column<Guid>(type: "uuid", nullable: false),
                    CategoriaNombre = table.Column<string>(type: "text", nullable: false),
                    CategoriaOrder = table.Column<int>(type: "integer", nullable: false),
                    DisplayOrder = table.Column<int>(type: "integer", nullable: false),
                    Codigo = table.Column<string>(type: "text", nullable: true),
                    Concepto = table.Column<string>(type: "text", nullable: false),
                    FasePhva = table.Column<int>(type: "integer", nullable: false),
                    MesProgramado = table.Column<string>(type: "text", nullable: false),
                    ValorPresupuestado = table.Column<decimal>(type: "numeric", nullable: false),
                    ValorEjecutado = table.Column<decimal>(type: "numeric", nullable: false),
                    AreaResponsable = table.Column<string>(type: "text", nullable: false),
                    SoporteComprobante = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SgSstBudgetLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SgSstBudgetLineItems_SgSstBudgetPlans_BudgetPlanId",
                        column: x => x.BudgetPlanId,
                        principalTable: "SgSstBudgetPlans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_SgSstBudgetLineItems_BudgetPlanId",
                table: "SgSstBudgetLineItems",
                column: "BudgetPlanId");

            migrationBuilder.CreateIndex(
                name: "IX_SgSstBudgetPlans_TenantId_Status",
                table: "SgSstBudgetPlans",
                columns: new[] { "TenantId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_SgSstBudgetPlans_TenantId_Version",
                table: "SgSstBudgetPlans",
                columns: new[] { "TenantId", "Version" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "SgSstBudgetLineItems");

            migrationBuilder.DropTable(
                name: "SgSstBudgetPlans");
        }
    }
}
