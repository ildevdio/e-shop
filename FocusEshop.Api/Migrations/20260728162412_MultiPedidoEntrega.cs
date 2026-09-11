using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class MultiPedidoEntrega : Migration
    {
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
            migrationBuilder.CreateTable(
                name: "EntregasPedidos",
                columns: table => new
                {
                    EntregaId = table.Column<int>(type: "integer", nullable: false),
                    PedidoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EntregasPedidos", x => new { x.EntregaId, x.PedidoId });
                    table.ForeignKey(
                        name: "FK_EntregasPedidos_Entregas_EntregaId",
                        column: x => x.EntregaId,
                        principalTable: "Entregas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_EntregasPedidos_Pedidos_PedidoId",
                        column: x => x.PedidoId,
                        principalTable: "Pedidos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.Sql(@"
                INSERT INTO ""EntregasPedidos"" (""EntregaId"", ""PedidoId"")
                SELECT ""Id"", ""PedidoId"" FROM ""Entregas""
            ");

            migrationBuilder.DropForeignKey(
                name: "FK_Entregas_Pedidos_PedidoId",
                table: "Entregas");

            migrationBuilder.DropIndex(
                name: "IX_Entregas_PedidoId",
                table: "Entregas");

            migrationBuilder.DropColumn(
                name: "PedidoId",
                table: "Entregas");

            migrationBuilder.CreateIndex(
                name: "IX_EntregasPedidos_PedidoId",
                table: "EntregasPedidos",
                column: "PedidoId");
    }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "EntregasPedidos");

            migrationBuilder.AddColumn<int>(
                name: "PedidoId",
                table: "Entregas",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Entregas_PedidoId",
                table: "Entregas",
                column: "PedidoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Entregas_Pedidos_PedidoId",
                table: "Entregas",
                column: "PedidoId",
                principalTable: "Pedidos",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
