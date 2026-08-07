using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddImagemBytesProduto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<byte[]>(
                name: "ImagemBytes",
                table: "Produtos",
                type: "bytea",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagemContentType",
                table: "Produtos",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "ImagemBytes", "ImagemContentType" },
                values: new object[] { null, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImagemBytes",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "ImagemContentType",
                table: "Produtos");
        }
    }
}
