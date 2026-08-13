using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConfigHeroMenuCarrinho : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ExibirNomeAbaixoLogo",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SubtextoHero",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TipoCarrinho",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TipoMenu",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "TituloHero",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ExibirNomeAbaixoLogo", "SubtextoHero", "TipoCarrinho", "TipoMenu", "TituloHero" },
                values: new object[] { true, null, "pagina", "dock", null });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ExibirNomeAbaixoLogo", "SubtextoHero", "TipoCarrinho", "TipoMenu", "TituloHero" },
                values: new object[] { true, null, "pagina", "dock", null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExibirNomeAbaixoLogo",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SubtextoHero",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "TipoCarrinho",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "TipoMenu",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "TituloHero",
                table: "ConfiguracoesSistema");
        }
    }
}
