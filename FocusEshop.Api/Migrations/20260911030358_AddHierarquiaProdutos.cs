using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FocusEshop.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHierarquiaProdutos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DepartamentoId",
                table: "Produtos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SubCategoriaId",
                table: "Produtos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "Ativo",
                table: "Categorias",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "DepartamentoId",
                table: "Categorias",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Departamentos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    FotoUrl = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    FotoBytes = table.Column<byte[]>(type: "bytea", nullable: true),
                    FotoContentType = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Descricao = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departamentos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "SubCategorias",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    CategoriaId = table.Column<int>(type: "integer", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SubCategorias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SubCategorias_Categorias_CategoriaId",
                        column: x => x.CategoriaId,
                        principalTable: "Categorias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8,
                columns: new[] { "DepartamentoId", "SubCategoriaId" },
                values: new object[] { null, null });

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_DepartamentoId",
                table: "Produtos",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_Produtos_SubCategoriaId",
                table: "Produtos",
                column: "SubCategoriaId");

            migrationBuilder.CreateIndex(
                name: "IX_Categorias_DepartamentoId",
                table: "Categorias",
                column: "DepartamentoId");

            migrationBuilder.CreateIndex(
                name: "IX_SubCategorias_CategoriaId",
                table: "SubCategorias",
                column: "CategoriaId");

            migrationBuilder.AddForeignKey(
                name: "FK_Categorias_Departamentos_DepartamentoId",
                table: "Categorias",
                column: "DepartamentoId",
                principalTable: "Departamentos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_Departamentos_DepartamentoId",
                table: "Produtos",
                column: "DepartamentoId",
                principalTable: "Departamentos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Produtos_SubCategorias_SubCategoriaId",
                table: "Produtos",
                column: "SubCategoriaId",
                principalTable: "SubCategorias",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Categorias_Departamentos_DepartamentoId",
                table: "Categorias");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_Departamentos_DepartamentoId",
                table: "Produtos");

            migrationBuilder.DropForeignKey(
                name: "FK_Produtos_SubCategorias_SubCategoriaId",
                table: "Produtos");

            migrationBuilder.DropTable(
                name: "Departamentos");

            migrationBuilder.DropTable(
                name: "SubCategorias");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_DepartamentoId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Produtos_SubCategoriaId",
                table: "Produtos");

            migrationBuilder.DropIndex(
                name: "IX_Categorias_DepartamentoId",
                table: "Categorias");

            migrationBuilder.DropColumn(
                name: "DepartamentoId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "SubCategoriaId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "Ativo",
                table: "Categorias");

            migrationBuilder.DropColumn(
                name: "DepartamentoId",
                table: "Categorias");
        }
    }
}
