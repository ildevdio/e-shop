using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoEmpresaFluxoOperacional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ConferenciaAtiva",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EntregaTerceirizada",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "SeparacaoAtiva",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TipoEmpresa",
                table: "ConfiguracoesSistema",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "UsarPeso",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UsarRotas",
                table: "ConfiguracoesSistema",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "ConferenciaAtiva", "EntregaTerceirizada", "SeparacaoAtiva", "TipoEmpresa", "UsarPeso", "UsarRotas" },
                values: new object[] { true, false, true, "distribuidora", true, true });

            migrationBuilder.UpdateData(
                table: "ConfiguracoesSistema",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "ConferenciaAtiva", "EntregaTerceirizada", "SeparacaoAtiva", "TipoEmpresa", "UsarPeso", "UsarRotas" },
                values: new object[] { true, false, true, "distribuidora", true, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ConferenciaAtiva",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "EntregaTerceirizada",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "SeparacaoAtiva",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "TipoEmpresa",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "UsarPeso",
                table: "ConfiguracoesSistema");

            migrationBuilder.DropColumn(
                name: "UsarRotas",
                table: "ConfiguracoesSistema");
        }
    }
}
