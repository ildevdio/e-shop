using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedContatosData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Contatos",
                columns: new[] { "Id", "ClienteId", "Nome", "Telefone" },
                values: new object[,]
                {
                    { 1, 1, "Carlos Eduardo", "(81) 99812-3344" },
                    { 2, 1, "Fernanda Lima", "(81) 99766-5588" },
                    { 3, 2, "Roberto Alves", "(81) 99234-1122" },
                    { 4, 2, "Mariana Costa", "(81) 99100-2233" },
                    { 5, 3, "Pedro Henrique", "(81) 98877-6655" },
                    { 6, null, "Ana Beatriz", "(81) 98543-2211" },
                    { 7, null, "Lucas Nascimento", "(81) 98432-1100" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 7);
        }
    }
}
