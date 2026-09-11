using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FocusEshop.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddPrecoPromocionalPromocaoProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "PrecoPromocional",
                table: "PromocoesProduto",
                type: "numeric",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PrecoPromocional",
                table: "PromocoesProduto");
        }
    }
}
