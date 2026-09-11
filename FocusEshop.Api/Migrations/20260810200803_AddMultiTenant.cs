using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMultiTenant : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Carrinhos_CpfCnpj",
                table: "Carrinhos");

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "VotosEnquete",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Veiculos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Usuarios",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Rotas",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Produtos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Pedidos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "OpcoesEnquete",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Notificacoes",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Mensagens",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Marcas",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "ItensPedido",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Entregas",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Enquetes",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Conversas",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Contatos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<bool>(
                name: "Ativo",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "Slug",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Clientes",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Categorias",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Carrinhos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "CarrinhoItens",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "Avisos",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "EmpresaId",
                table: "AtendimentoLeads",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 1,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 2,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 3,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "Ativo", "Slug" },
                values: new object[] { true, "multigraos" });

            migrationBuilder.UpdateData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 1,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 2,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 3,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 4,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 5,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 6,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Contatos",
                keyColumn: "Id",
                keyValue: 7,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 3,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 4,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Veiculos",
                keyColumn: "Id",
                keyValue: 1,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.UpdateData(
                table: "Veiculos",
                keyColumn: "Id",
                keyValue: 2,
                column: "EmpresaId",
                value: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Carrinhos_EmpresaId_CpfCnpj",
                table: "Carrinhos",
                columns: new[] { "EmpresaId", "CpfCnpj" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Carrinhos_EmpresaId_CpfCnpj",
                table: "Carrinhos");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "VotosEnquete");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Veiculos");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Rotas");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Produtos");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Pedidos");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "OpcoesEnquete");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Notificacoes");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Mensagens");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Marcas");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "ItensPedido");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Entregas");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Enquetes");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Conversas");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Contatos");

            migrationBuilder.DropColumn(
                name: "Ativo",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "Slug",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Categorias");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Carrinhos");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "CarrinhoItens");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "Avisos");

            migrationBuilder.DropColumn(
                name: "EmpresaId",
                table: "AtendimentoLeads");

            migrationBuilder.CreateIndex(
                name: "IX_Carrinhos_CpfCnpj",
                table: "Carrinhos",
                column: "CpfCnpj",
                unique: true);
        }
    }
}
