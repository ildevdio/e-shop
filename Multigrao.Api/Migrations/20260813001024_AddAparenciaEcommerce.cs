using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddAparenciaEcommerce : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CorFonte",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CorSecundaria",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DesignEcommerce",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Fonte",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CorFonte", "CorSecundaria", "DesignEcommerce", "Fonte" },
                values: new object[] { null, "#f97316", "claro", "classica" });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CorFonte", "CorSecundaria", "DesignEcommerce", "Fonte" },
                values: new object[] { null, "#f97316", "claro", "classica" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CorFonte",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "CorSecundaria",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "DesignEcommerce",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Fonte",
                table: "ConfiguracoesSistema");
        }
    }
}
