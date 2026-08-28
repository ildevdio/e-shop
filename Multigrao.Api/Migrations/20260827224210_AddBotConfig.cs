using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Multigrao.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddBotConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BotsConfig",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmpresaId = table.Column<int>(type: "integer", nullable: false),
                    Nome = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    TipoTrigger = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    ValorTrigger = table.Column<string>(type: "text", nullable: false),
                    TipoReacao = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    TextoResposta = table.Column<string>(type: "text", nullable: false),
                    AcaoBot = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    CampoLead = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: true),
                    Ordem = table.Column<int>(type: "integer", nullable: false),
                    Ativo = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BotsConfig", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "BotsConfig",
                columns: new[] { "Id", "AcaoBot", "Ativo", "CampoLead", "EmpresaId", "Nome", "Ordem", "TextoResposta", "TipoReacao", "TipoTrigger", "ValorTrigger" },
                values: new object[,]
                {
                    { 1, "Responder", true, null, 1, "Saudação", 1, "Olá {nome}! 👋 Sou o assistente virtual do {empresa}. Posso te ajudar com preços, produtos, estoque e status de pedidos. 😊", "Texto", "Saudacao", "" },
                    { 2, "Responder", true, null, 1, "Menu de opções", 2, "", "Menu", "Menu", "" },
                    { 3, "Responder", true, null, 1, "Consultar preço", 3, "", "PrecoProduto", "PalavraChave", "preço|preco|quanto custa|valor|custa|tabela" },
                    { 4, "Responder", true, null, 1, "Consultar estoque", 4, "", "EstoqueProduto", "PalavraChave", "estoque|tem dispon|disponível|disponivel|tem em|tem do|tem de" },
                    { 5, "Responder", true, null, 1, "Status do pedido", 5, "", "StatusPedido", "PalavraChave", "pedido|rastrear|status do|onde está|onde esta|situação do|situacao do" },
                    { 6, "Responder", true, null, 1, "Formas de pagamento", 6, "💳 Trabalhamos com as seguintes formas de pagamento:\n• PIX (à vista com desconto)\n• Boleto à vista\n• Boleto faturado (14/28 dias para empresas)\n• Cartão de crédito\nPara empresas, temos condições especiais. Qual sua preferência?", "Texto", "PalavraChave", "pagamento|pagar|boleto|pix|cartão|cartao|condição|condicao|parcel" },
                    { 7, "Responder", true, null, 1, "Entrega e frete", 7, "🛵 Nossas entregas na região levam de 1 a 3 dias úteis, dependendo do bairro e do valor do pedido. Para valores acima de R$ 200, o frete é grátis!", "Texto", "PalavraChave", "entrega|frete|demora|prazo|quanto tempo|chega" },
                    { 8, "Responder", true, null, 1, "Embalagem", 8, "📦 Vendemos a granel (sacos de 10kg ou 20kg) e também fracionados. Qual formato e quantidade você prefere?", "Texto", "PalavraChave", "embalagem|saco|sacos|fracionado|fracionada|granel|quilo|peso|kg" },
                    { 9, "ResponderEDesativarIA", true, null, 1, "Falar com humano", 9, "📞 Sem problemas! Em instantes um atendente da nossa equipe vai te atender. Aguarde um momento. 😊", "Texto", "PalavraChave", "contato|telefone|whatsapp|falar com|atendente|humano|vendedor|pessoa" },
                    { 10, "SalvarLead", true, "Bairro", 1, "Captar região/bairro", 10, "Perfeito! Anotei sua região. Vou verificar as opções de entrega para você. 😉", "Texto", "PalavraChave", "entrega em|moro em|sou de|bairro" },
                    { 11, "SalvarLead", true, "Interesse", 1, "Captar interesse", 11, "Ótima escolha! {interesse} é um dos nossos produtos mais procurados. Posso te passar mais detalhes e condições. 😊", "Texto", "PalavraChave", "quero|preciso|vou querer|estou precisando|comprar|pedido de|gostaria de" },
                    { 12, "Responder", true, null, 1, "Agradecimento", 12, "De nada, {nome}! 😄 Fico à disposição. Se precisar de mais alguma coisa, é só chamar.", "Texto", "PalavraChave", "obrigado|obrigada|vlw|valeu|agradeço|agradeco" }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BotsConfig");
        }
    }
}
