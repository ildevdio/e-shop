using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddConfiguracaoSistema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "PedidoId",
                table: "AtendimentoLeads",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UsuarioAtendenteId",
                table: "AtendimentoLeads",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ConfiguracoesSistema",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    NomeEmpresa = table.Column<string>(type: "text", nullable: false),
                    Slogan = table.Column<string>(type: "text", nullable: true),
                    Endereco = table.Column<string>(type: "text", nullable: true),
                    LogoUrl = table.Column<string>(type: "text", nullable: true),
                    CorPrincipal = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConfiguracoesSistema", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "ConfiguracoesSistema",
                columns: new[] { "Id", "CorPrincipal", "Endereco", "LogoUrl", "NomeEmpresa", "Slogan" },
                values: new object[] { 1, "#0a0a0a", "Centro — Paulista — PE", "/multigraos-logo.png", "Multigrãos", "Amendoim & Especiarias" });

            migrationBuilder.CreateIndex(
                name: "IX_AtendimentoLeads_PedidoId",
                table: "AtendimentoLeads",
                column: "PedidoId");

            migrationBuilder.CreateIndex(
                name: "IX_AtendimentoLeads_UsuarioAtendenteId",
                table: "AtendimentoLeads",
                column: "UsuarioAtendenteId");

            migrationBuilder.AddForeignKey(
                name: "FK_AtendimentoLeads_Pedidos_PedidoId",
                table: "AtendimentoLeads",
                column: "PedidoId",
                principalTable: "Pedidos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_AtendimentoLeads_Usuarios_UsuarioAtendenteId",
                table: "AtendimentoLeads",
                column: "UsuarioAtendenteId",
                principalTable: "Usuarios",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AtendimentoLeads_Pedidos_PedidoId",
                table: "AtendimentoLeads");

            migrationBuilder.DropForeignKey(
                name: "FK_AtendimentoLeads_Usuarios_UsuarioAtendenteId",
                table: "AtendimentoLeads");

            migrationBuilder.DropTable(
                name: "ConfiguracoesSistema");

            migrationBuilder.DropIndex(
                name: "IX_AtendimentoLeads_PedidoId",
                table: "AtendimentoLeads");

            migrationBuilder.DropIndex(
                name: "IX_AtendimentoLeads_UsuarioAtendenteId",
                table: "AtendimentoLeads");

            migrationBuilder.DropColumn(
                name: "PedidoId",
                table: "AtendimentoLeads");

            migrationBuilder.DropColumn(
                name: "UsuarioAtendenteId",
                table: "AtendimentoLeads");
        }
    }
}
