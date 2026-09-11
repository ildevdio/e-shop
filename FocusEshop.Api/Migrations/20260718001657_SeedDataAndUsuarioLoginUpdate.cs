using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedDataAndUsuarioLoginUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "Email",
                table: "Usuarios",
                newName: "UsuarioLogin");

            migrationBuilder.AddColumn<bool>(
                name: "Separado",
                table: "ItensPedido",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.InsertData(
                table: "Clientes",
                columns: new[] { "Id", "Bairro", "Cep", "Cidade", "CpfCnpj", "Estado", "Latitude", "Logradouro", "Longitude", "RazaoSocialNome" },
                values: new object[,]
                {
                    { 1, "Boa Viagem", "", "Recife", "12.345.678/0001-90", "PE", null, "", null, "Padaria Pão Dourado" },
                    { 2, "Casa Forte", "", "Recife", "98.765.432/0001-10", "PE", null, "", null, "Supermercado Fresh" },
                    { 3, "Aflitos", "", "Recife", "11.222.333/0001-44", "PE", null, "", null, "Loja Naturalzinha" }
                });

            migrationBuilder.InsertData(
                table: "Produtos",
                columns: new[] { "Id", "CodigoERP", "Nome", "PesoUnidade" },
                values: new object[,]
                {
                    { 1, "CAS001", "Castanha do Pará", 0.5m },
                    { 2, "CHI001", "Chia (1kg)", 1m },
                    { 3, "AVE001", "Aveia em Flocos", 0.5m },
                    { 4, "QUI001", "Quinoa (500g)", 0.5m },
                    { 5, "LIN001", "Linhaça Dourada", 0.25m },
                    { 6, "NOZ001", "Nozes (500g)", 0.5m },
                    { 7, "AME001", "Amêndoas (250g)", 0.25m },
                    { 8, "CAC001", "Cacau em Pó", 0.3m }
                });

            migrationBuilder.InsertData(
                table: "Setores",
                columns: new[] { "Id", "Nome" },
                values: new object[,]
                {
                    { 1, "Comercial" },
                    { 2, "Separação" },
                    { 3, "Logística" },
                    { 4, "Conferência" },
                    { 5, "Entregas" }
                });

            migrationBuilder.InsertData(
                table: "Usuarios",
                columns: new[] { "Id", "Ativo", "Nome", "Role", "SenhaHash", "UsuarioLogin" },
                values: new object[,]
                {
                    { 1, true, "Admin Multigrãos", "AdminMaster", "$2a$11$n.NPXBGoATdtu.nH.p3i1OcHYRXFm/NGGVGzXy0YT3KKipUj4E.we", "admin" },
                    { 2, true, "João Comercial", "Comum", "$2a$11$n.NPXBGoATdtu.nH.p3i1OcHYRXFm/NGGVGzXy0YT3KKipUj4E.we", "joao" },
                    { 3, true, "Ana Separação", "Comum", "$2a$11$n.NPXBGoATdtu.nH.p3i1OcHYRXFm/NGGVGzXy0YT3KKipUj4E.we", "ana" },
                    { 4, true, "Pedro Motorista", "Comum", "$2a$11$n.NPXBGoATdtu.nH.p3i1OcHYRXFm/NGGVGzXy0YT3KKipUj4E.we", "pedro" }
                });

            migrationBuilder.InsertData(
                table: "Veiculos",
                columns: new[] { "Id", "Modelo", "PesoMaximo", "Placa" },
                values: new object[,]
                {
                    { 1, "Fiorino", 800m, "ABC-1234" },
                    { 2, "Van Master", 1500m, "DEF-5678" }
                });

            migrationBuilder.InsertData(
                table: "UsuarioSetores",
                columns: new[] { "SetorId", "UsuarioId" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 1, 2 },
                    { 3, 2 },
                    { 2, 3 },
                    { 3, 4 },
                    { 5, 4 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Clientes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Produtos",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Setores",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "UsuarioSetores",
                keyColumns: new[] { "SetorId", "UsuarioId" },
                keyValues: new object[] { 1, 1 });

            migrationBuilder.DeleteData(
                table: "UsuarioSetores",
                keyColumns: new[] { "SetorId", "UsuarioId" },
                keyValues: new object[] { 1, 2 });

            migrationBuilder.DeleteData(
                table: "UsuarioSetores",
                keyColumns: new[] { "SetorId", "UsuarioId" },
                keyValues: new object[] { 3, 2 });

            migrationBuilder.DeleteData(
                table: "UsuarioSetores",
                keyColumns: new[] { "SetorId", "UsuarioId" },
                keyValues: new object[] { 2, 3 });

            migrationBuilder.DeleteData(
                table: "UsuarioSetores",
                keyColumns: new[] { "SetorId", "UsuarioId" },
                keyValues: new object[] { 3, 4 });

            migrationBuilder.DeleteData(
                table: "UsuarioSetores",
                keyColumns: new[] { "SetorId", "UsuarioId" },
                keyValues: new object[] { 5, 4 });

            migrationBuilder.DeleteData(
                table: "Veiculos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Veiculos",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Setores",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Setores",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Setores",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Setores",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Usuarios",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DropColumn(
                name: "Separado",
                table: "ItensPedido");

            migrationBuilder.RenameColumn(
                name: "UsuarioLogin",
                table: "Usuarios",
                newName: "Email");
        }
    }
}
