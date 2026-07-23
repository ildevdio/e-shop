using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddVendedorSetorAndClienteVendedor : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "VendedorId",
                table: "Clientes",
                type: "integer",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 1,
                column: "VendedorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 2,
                column: "VendedorId",
                value: null);

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 3,
                column: "VendedorId",
                value: null);

            migrationBuilder.InsertData(
                table: "Setores",
                columns: new[] { "Id", "Nome" },
                values: new object[] { 7, "Vendedor" });

            migrationBuilder.CreateIndex(
                name: "IX_Clientes_VendedorId",
                table: "Clientes",
                column: "VendedorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Clientes_Usuarios_VendedorId",
                table: "Clientes",
                column: "VendedorId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Clientes_Usuarios_VendedorId",
                table: "Clientes");

            migrationBuilder.DropIndex(
                name: "IX_Clientes_VendedorId",
                table: "Clientes");

            migrationBuilder.DeleteData(
                table: "Setores",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DropColumn(
                name: "VendedorId",
                table: "Clientes");
        }
    }
}
