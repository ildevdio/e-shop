using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCarrinhoAbandonado : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "CarrinhoLembreteAtivo",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "CarrinhoLembreteCanal",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "CarrinhoLembreteIntervaloRepeticao",
                table: "ConfiguracoesSistema",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CarrinhoLembreteMinutos",
                table: "ConfiguracoesSistema",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CarrinhoLembreteRepetir",
                table: "ConfiguracoesSistema",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "EvolutionApiInstance",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EvolutionApiKey",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EvolutionApiSsl",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "EvolutionApiUrl",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "LembretesCarrinho",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    CarrinhoId = table.Column<int>(type: "integer", nullable: false),
                    Tipo = table.Column<string>(type: "text", nullable: false),
                    EnviadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Erro = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LembretesCarrinho", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LembretesCarrinho_Carrinhos_CarrinhoId",
                        column: x => x.CarrinhoId,
                        principalTable: "Carrinhos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CarrinhoLembreteAtivo", "CarrinhoLembreteCanal", "CarrinhoLembreteIntervaloRepeticao", "CarrinhoLembreteMinutos", "CarrinhoLembreteRepetir", "EvolutionApiInstance", "EvolutionApiKey", "EvolutionApiSsl", "EvolutionApiUrl" },
                values: new object[] { false, "email", 120, 30, 1, null, null, true, null });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CarrinhoLembreteAtivo", "CarrinhoLembreteCanal", "CarrinhoLembreteIntervaloRepeticao", "CarrinhoLembreteMinutos", "CarrinhoLembreteRepetir", "EvolutionApiInstance", "EvolutionApiKey", "EvolutionApiSsl", "EvolutionApiUrl" },
                values: new object[] { false, "email", 120, 30, 1, null, null, true, null });

            migrationBuilder.CreateIndex(
                name: "IX_LembretesCarrinho_CarrinhoId",
                table: "LembretesCarrinho",
                column: "CarrinhoId");

            migrationBuilder.CreateIndex(
                name: "IX_LembretesCarrinho_EmpresaId_CarrinhoId_EnviadoEm",
                table: "LembretesCarrinho",
                columns: new[] { "EmpresaId", "CarrinhoId", "EnviadoEm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LembretesCarrinho");

            migrationBuilder.DropColumn(
                name: "CarrinhoLembreteAtivo",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "CarrinhoLembreteCanal",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "CarrinhoLembreteIntervaloRepeticao",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "CarrinhoLembreteMinutos",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "CarrinhoLembreteRepetir",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "EvolutionApiInstance",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "EvolutionApiKey",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "EvolutionApiSsl",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "EvolutionApiUrl",
                table: "ConfiguracoesSistema");
        }
    }
}
