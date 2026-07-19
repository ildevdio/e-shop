using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddEnquetes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Enquetes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Titulo = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    DataCriacao = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Ativa = table.Column<bool>(type: "boolean", nullable: false),
                    AutorId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Enquetes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Enquetes_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OpcoesEnquete",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EnqueteId = table.Column<int>(type: "integer", nullable: false),
                    Texto = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    Ordem = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OpcoesEnquete", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OpcoesEnquete_Enquetes_EnqueteId",
                        column: x => x.EnqueteId,
                        principalTable: "Enquetes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VotosEnquete",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EnqueteId = table.Column<int>(type: "integer", nullable: false),
                    OpcaoEnqueteId = table.Column<int>(type: "integer", nullable: false),
                    UsuarioId = table.Column<int>(type: "integer", nullable: false),
                    DataVoto = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VotosEnquete", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VotosEnquete_Enquetes_EnqueteId",
                        column: x => x.EnqueteId,
                        principalTable: "Enquetes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VotosEnquete_OpcoesEnquete_OpcaoEnqueteId",
                        column: x => x.OpcaoEnqueteId,
                        principalTable: "OpcoesEnquete",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_VotosEnquete_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Enquetes_AutorId",
                table: "Enquetes",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_OpcoesEnquete_EnqueteId",
                table: "OpcoesEnquete",
                column: "EnqueteId");

            migrationBuilder.CreateIndex(
                name: "IX_VotosEnquete_EnqueteId",
                table: "VotosEnquete",
                column: "EnqueteId");

            migrationBuilder.CreateIndex(
                name: "IX_VotosEnquete_OpcaoEnqueteId",
                table: "VotosEnquete",
                column: "OpcaoEnqueteId");

            migrationBuilder.CreateIndex(
                name: "IX_VotosEnquete_UsuarioId",
                table: "VotosEnquete",
                column: "UsuarioId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "VotosEnquete");

            migrationBuilder.DropTable(
                name: "OpcoesEnquete");

            migrationBuilder.DropTable(
                name: "Enquetes");
        }
    }
}
