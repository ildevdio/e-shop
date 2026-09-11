using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FocusEshop.Api.Migrations
{
    /// <inheritdoc />
    public partial class PedidoLiberadoFinanceiro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LiberadoFinanceiro",
                table: "Pedidos",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LiberadoFinanceiro",
                table: "Pedidos");
        }
    }
}
