using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGranelMedidasProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "QuantidadeMinimaAtacado",
                table: "Produtos",
                type: "numeric",
                nullable: false,
                defaultValue: 5m);

            migrationBuilder.AddColumn<bool>(
                name: "VendidoAGranel",
                table: "Produtos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "QuantidadeMinimaAtacado", "VendidoAGranel" },
                values: new object[] { 5m, false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QuantidadeMinimaAtacado",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "VendidoAGranel",
                table: "Produtos");
        }
    }
}
