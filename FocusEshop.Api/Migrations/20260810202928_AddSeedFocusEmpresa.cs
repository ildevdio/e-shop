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
            migrationBuilder.Sql("""
                INSERT INTO "ConfiguracoesSistema" ("Id", "Ativo", "CorPrincipal", "Endereco", "LogoUrl", "NomeEmpresa", "Slogan", "Slug")
                SELECT 2, TRUE, '#111827', 'Paulista — PE', '/multigraos-logo.png', 'Focus Solutions', 'Plataforma de Gestão', 'focus'
                WHERE NOT EXISTS (SELECT 1 FROM "ConfiguracoesSistema" WHERE "Id" = 2);
                """);

            migrationBuilder.Sql("""
                SELECT setval(pg_get_serial_sequence('"Usuarios"', 'Id'), (SELECT COALESCE(MAX("Id"), 1) FROM "Usuarios"));
                """);

            migrationBuilder.Sql("""
                INSERT INTO "Usuarios" ("Ativo", "EmpresaId", "Nome", "Role", "SenhaHash", "UsuarioLogin")
                SELECT TRUE, 2, 'Admin Focus', 'AdminMaster', '$2a$11$8txlZeWbLmAkE.FUvRPhj.P6VzpU7K2GVhfVMWMJKqVldAuGhvEXC', 'focus'
                WHERE NOT EXISTS (SELECT 1 FROM "Usuarios" WHERE "UsuarioLogin" = 'focus');
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DELETE FROM "ConfiguracoesSistema" WHERE "Id" = 2;
                """);

            migrationBuilder.Sql("""
                DELETE FROM "Usuarios" WHERE "UsuarioLogin" = 'focus' AND "EmpresaId" = 2;
                """);
        }
    }
}
