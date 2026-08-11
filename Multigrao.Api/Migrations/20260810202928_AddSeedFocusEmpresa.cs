using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSeedFocusEmpresa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "ConfiguracoesSistema",
                columns: new[] { "Id", "Ativo", "CorPrincipal", "Endereco", "LogoUrl", "NomeEmpresa", "Slogan", "Slug" },
                values: new object[] { 2, true, "#111827", "Paulista — PE", "/multigraos-logo.png", "Focus Solutions", "Plataforma de Gestão", "focus" });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Ativo", "EmpresaId", "Nome", "Role", "SenhaHash", "UsuarioLogin" },
                values: new object[] { 5, true, 2, "Admin Focus", "AdminMaster", "$2a$11$8txlZeWbLmAkE.FUvRPhj.P6VzpU7K2GVhfVMWMJKqVldAuGhvEXC", "focus" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 5);
        }
    }
}
