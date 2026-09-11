using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCuponsEEmailSmtp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CupomId",
                table: "Pedidos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DescontoCupom",
                table: "Pedidos",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "EmailNotificacoesAtivo",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SmtpEmailRemetente",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SmtpHost",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SmtpNomeRemetente",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SmtpPort",
                table: "ConfiguracoesSistema",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SmtpSenha",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "SmtpUsarSsl",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "SmtpUsuario",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Cupons",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    Codigo = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Descricao = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Tipo = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Valor = table.Column<decimal>(type: "numeric", nullable: false),
                    AplicavelEm = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    ValorMinimoPedido = table.Column<decimal>(type: "numeric", nullable: true),
                    ValorMaximoDesconto = table.Column<decimal>(type: "numeric", nullable: true),
                    UsosMaximos = table.Column<int>(type: "integer", nullable: true),
                    UsosRealizados = table.Column<int>(type: "integer", nullable: false),
                    DataInicio = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DataFim = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Cupons", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CupomClientes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    CupomId = table.Column<int>(type: "integer", nullable: false),
                    ClienteId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CupomClientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CupomClientes_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CupomClientes_Cupons_CupomId",
                        column: x => x.CupomId,
                        principalTable: "Cupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CupomProdutos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    CupomId = table.Column<int>(type: "integer", nullable: false),
                    ProdutoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CupomProdutos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CupomProdutos_Cupons_CupomId",
                        column: x => x.CupomId,
                        principalTable: "Cupons",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CupomProdutos_Produtos_ProdutoId",
                        column: x => x.ProdutoId,
                        principalTable: "Produtos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "EmailNotificacoesAtivo", "SmtpEmailRemetente", "SmtpHost", "SmtpNomeRemetente", "SmtpPort", "SmtpSenha", "SmtpUsarSsl", "SmtpUsuario" },
                values: new object[] { false, null, null, null, null, null, true, null });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "EmailNotificacoesAtivo", "SmtpEmailRemetente", "SmtpHost", "SmtpNomeRemetente", "SmtpPort", "SmtpSenha", "SmtpUsarSsl", "SmtpUsuario" },
                values: new object[] { false, null, null, null, null, null, true, null });

            migrationBuilder.CreateIndex(
                name: "IX_Pedidos_CupomId",
                table: "Pedidos",
                column: "CupomId");

            migrationBuilder.CreateIndex(
                name: "IX_CupomClientes_ClienteId",
                table: "CupomClientes",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_CupomClientes_CupomId",
                table: "CupomClientes",
                column: "CupomId");

            migrationBuilder.CreateIndex(
                name: "IX_CupomProdutos_CupomId",
                table: "CupomProdutos",
                column: "CupomId");

            migrationBuilder.CreateIndex(
                name: "IX_CupomProdutos_ProdutoId",
                table: "CupomProdutos",
                column: "ProdutoId");

            migrationBuilder.CreateIndex(
                name: "IX_Cupons_EmpresaId_Codigo",
                table: "Cupons",
                columns: new[] { "EmpresaId", "Codigo" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Pedidos_Cupons_CupomId",
                table: "Pedidos",
                column: "CupomId",
                principalTable: "Cupons",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Pedidos_Cupons_CupomId",
                table: "Pedidos");

            migrationBuilder.DropTable(
                name: "CupomClientes");

            migrationBuilder.DropTable(
                name: "CupomProdutos");

            migrationBuilder.DropTable(
                name: "Cupons");

            migrationBuilder.DropIndex(
                name: "IX_Pedidos_CupomId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "CupomId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "DescontoCupom",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "EmailNotificacoesAtivo",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SmtpEmailRemetente",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SmtpHost",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SmtpNomeRemetente",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SmtpPort",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SmtpSenha",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SmtpUsarSsl",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SmtpUsuario",
                table: "ConfiguracoesSistema");
        }
    }
}
