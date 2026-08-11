using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEnderecoEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Bairro",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cep",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Cidade",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Estado",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Logradouro",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Numero",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Bairro", "Cep", "Cidade", "Estado", "Logradouro", "Numero" },
                values: new object[] { "Centro", null, "Paulista", "PE", null, null });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Bairro", "Cep", "Cidade", "Estado", "Logradouro", "Numero" },
                values: new object[] { null, null, "Paulista", "PE", null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Bairro",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Cep",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Cidade",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Estado",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Logradouro",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Numero",
                table: "ConfiguracoesSistema");
        }
    }
}
