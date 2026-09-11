using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCatalogCategoriaMarca : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Ativo",
                table: "Produtos",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "CategoriaId",
                table: "Produtos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Embalagem",
                table: "Produtos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImagemUrl",
                table: "Produtos",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MarcaId",
                table: "Produtos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PrecoAtacado",
                table: "Produtos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PrecoVarejo",
                table: "Produtos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "UnidadeVenda",
                table: "Produtos",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Categorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Categorias", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Marcas",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ImagemUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Marcas", x => x.Id);
                });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "Ativo", "CategoriaId", "Embalagem", "ImagemUrl", "MarcaId", "PrecoAtacado", "PrecoVarejo", "UnidadeVenda" },
                values: new object[] { true, null, null, null, null, 0m, 0m, null });

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_CategoriaId",
                table: "Produtos",
                column: "CategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_MarcaId",
                table: "Produtos",
                column: "MarcaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_Categorias_CategoriaId",
                table: "Produtos",
                column: "CategoriaId",
                principalTable: "Categorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_Marcas_MarcaId",
                table: "Produtos",
                column: "MarcaId",
                principalTable: "Marcas",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Categorias_CategoriaId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Marcas_MarcaId",
                table: "Produtos");

            migrationBuilder.DropTable(
                name: "Categorias");

            migrationBuilder.DropTable(
                name: "Marcas");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_CategoriaId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_MarcaId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Ativo",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "CategoriaId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Embalagem",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "ImagemUrl",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "MarcaId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "PrecoAtacado",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "PrecoVarejo",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "UnidadeVenda",
                table: "Produtos");
        }
    }
}
