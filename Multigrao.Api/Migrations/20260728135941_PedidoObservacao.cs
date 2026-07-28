using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class PedidoObservacao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Observacao",
                table: "Pedidos",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Observacao",
                table: "Pedidos");
        }
    }
}
