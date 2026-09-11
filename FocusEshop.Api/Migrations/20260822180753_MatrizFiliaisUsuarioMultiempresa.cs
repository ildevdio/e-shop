using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class MatrizFiliaisUsuarioMultiempresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EmpresaMatrizId",
                table: "ConfiguracoesSistema",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "UsuariosEmpresas",
                columns: table => new
                {
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UsuariosEmpresas", x => new { x.UsuarioId, x.EmpresaId });
                    table.ForeignKey(
                        name: "FK_UsuariosEmpresas_ConfiguracoesSistema_EmpresaId",
                        column: x => x.EmpresaId,
                        principalTable: "ConfiguracoesSistema",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UsuariosEmpresas_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                column: "EmpresaMatrizId",
                value: null);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                column: "EmpresaMatrizId",
                value: null);

            migrationBuilder.CreateIndex(
                name: "IX_ConfiguracoesSistema_EmpresaMatrizId",
                table: "ConfiguracoesSistema",
                column: "EmpresaMatrizId");

            migrationBuilder.CreateIndex(
                name: "IX_UsuariosEmpresas_EmpresaId",
                table: "UsuariosEmpresas",
                column: "EmpresaId");

            migrationBuilder.AddForeignKey(
                name: "FK_ConfiguracoesSistema_ConfiguracoesSistema_EmpresaMatrizId",
                table: "ConfiguracoesSistema",
                column: "EmpresaMatrizId",
                principalTable: "ConfiguracoesSistema",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ConfiguracoesSistema_ConfiguracoesSistema_EmpresaMatrizId",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropTable(
                name: "UsuariosEmpresas");

            migrationBuilder.DropIndex(
                name: "IX_ConfiguracoesSistema_EmpresaMatrizId",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "EmpresaMatrizId",
                table: "ConfiguracoesSistema");
        }
    }
}
