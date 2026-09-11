using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImagemBytesToMarca : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "ImagemBytes",
                table: "Marcas",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagemContentType",
                table: "Marcas",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagemBytes",
                table: "Marcas");

            migrationBuilder.DropColumn(
                name: "ImagemContentType",
                table: "Marcas");
        }
    }
}
