using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHeroImagemMascote : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "HeroImagemTipo",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "produto");

            migrationBuilder.AddColumn<string>(
                name: "MascoteUrl",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "HeroImagemTipo", "MascoteUrl" },
                values: new object[] { "produto", null });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "HeroImagemTipo", "MascoteUrl" },
                values: new object[] { "produto", null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HeroImagemTipo",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "MascoteUrl",
                table: "ConfiguracoesSistema");
        }
    }
}
