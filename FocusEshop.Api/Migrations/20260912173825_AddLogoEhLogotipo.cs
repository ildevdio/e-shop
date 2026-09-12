using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FocusEshop.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddLogoEhLogotipo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LogoEhLogotipo",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                column: "LogoEhLogotipo",
                value: false);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                column: "LogoEhLogotipo",
                value: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LogoEhLogotipo",
                table: "ConfiguracoesSistema");
        }
    }
}
