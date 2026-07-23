using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTipoConversa : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Tipo",
                table: "Conversas",
                type: "integer",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.Sql(@"
                UPDATE ""Conversas""
                SET ""Tipo"" = 0
                WHERE ""Id"" IN (SELECT ""ConversaId"" FROM ""AtendimentoLeads"")
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Tipo",
                table: "Conversas");
        }
    }
}
