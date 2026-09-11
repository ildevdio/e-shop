using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddRedirecionamentos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Redirecionamentos",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                column: "Redirecionamentos",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                column: "Redirecionamentos",
                value: null);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Redirecionamentos",
                table: "ConfiguracoesSistema");
        }
    }
}
