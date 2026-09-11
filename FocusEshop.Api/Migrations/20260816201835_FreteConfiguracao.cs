using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class FreteConfiguracao : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ValorFrete",
                table: "Produtos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "FreteAtivo",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "ConfiguracoesSistema",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "ConfiguracoesSistema",
                type: "double precision",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FaixasFrete",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    AteKm = table.Column<decimal>(type: "numeric", nullable: false),
                    Valor = table.Column<decimal>(type: "numeric", nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaixasFrete", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "FreteAtivo", "Latitude", "Longitude" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "FreteAtivo", "Latitude", "Longitude" },
                values: new object[] { false, null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1,
                column: "ValorFrete",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2,
                column: "ValorFrete",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3,
                column: "ValorFrete",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4,
                column: "ValorFrete",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5,
                column: "ValorFrete",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6,
                column: "ValorFrete",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7,
                column: "ValorFrete",
                value: 0m);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8,
                column: "ValorFrete",
                value: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FaixasFrete");

            migrationBuilder.DropColumn(
                name: "ValorFrete",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "FreteAtivo",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "ConfiguracoesSistema");
        }
    }
}
