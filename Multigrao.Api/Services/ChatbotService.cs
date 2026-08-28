using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;

namespace Multigrao.Api.Services
{
    public class ChatbotService
    {
        private readonly AppDbContext _context;

        public ChatbotService(AppDbContext context)
        {
            _context = context;
        }

        public class RespostaBot
        {
            public string Mensagem { get; set; } = string.Empty;
            public bool Finaliza { get; set; }
            public string? CampoLead { get; set; }
            public string? ValorLead { get; set; }
        }

        public async Task<RespostaBot> GerarRespostaAsync(AtendimentoLead atendimento, string textoUsuario)
        {
            var texto = Normalizar(textoUsuario);
            var config = await _context.ConfiguracoesSistema
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == atendimento.EmpresaId);

            var regras = await _context.BotsConfig
                .AsNoTracking()
                .Where(b => b.Ativo)
                .OrderBy(b => b.Ordem)
                .ThenBy(b => b.Id)
                .ToListAsync();

            foreach (var regra in regras)
            {
                if (!TriggerCombina(regra, texto))
                    continue;

                var mensagem = await MontarReacaoAsync(regra, atendimento, texto, config?.NomeEmpresa);
                var resposta = new RespostaBot { Mensagem = mensagem };

                switch (regra.AcaoBot)
                {
                    case "SalvarLead":
                        resposta.CampoLead = regra.CampoLead;
                        resposta.ValorLead = ExtrairValorDoCampo(textoUsuario, regra.CampoLead);
                        break;
                    case "ResponderEDesativarIA":
                        resposta.Finaliza = true;
                        break;
                }

                return resposta;
            }

            return new RespostaBot { Mensagem = RespostaPadrao(config?.NomeEmpresa, atendimento.Nome) };
        }

        private bool TriggerCombina(BotConfig regra, string texto)
        {
            switch (regra.TipoTrigger)
            {
                case "Saudacao":
                    return EhSaudacao(texto);
                case "Menu":
                    return EhMenu(texto);
                case "Igual":
                    return Normalizar(regra.ValorTrigger) == texto;
                case "Regex":
                    try { return Regex.IsMatch(texto, regra.ValorTrigger, RegexOptions.IgnoreCase); }
                    catch { return false; }
                case "Qualquer":
                    return true;
                case "PalavraChave":
                default:
                    var palavras = regra.ValorTrigger
                        .Split('|', ',', ';')
                        .Select(Normalizar)
                        .Where(p => !string.IsNullOrEmpty(p))
                        .ToArray();
                    return palavras.Any(texto.Contains);
            }
        }

        private async Task<string> MontarReacaoAsync(BotConfig regra, AtendimentoLead atendimento, string texto, string? nomeEmpresa)
        {
            switch (regra.TipoReacao)
            {
                case "PrecoProduto":
                    var preco = await ResponderPrecoAsync(texto);
                    return preco;
                case "EstoqueProduto":
                    return await ResponderEstoqueAsync(texto);
                case "StatusPedido":
                    return await ResponderPedidoAsync(texto, atendimento);
                case "Menu":
                    return string.IsNullOrWhiteSpace(regra.TextoResposta)
                        ? MenuTexto(nomeEmpresa)
                        : regra.TextoResposta;
                case "Texto":
                default:
                    if (string.IsNullOrWhiteSpace(regra.TextoResposta))
                        return $"Ok, entendi! Anotei sua solicitação e nossa equipe vai te dar retorno. 😉";
                    return SubstituirTokens(regra.TextoResposta, atendimento, nomeEmpresa);
            }
        }

        private string SubstituirTokens(string template, AtendimentoLead atendimento, string? nomeEmpresa)
        {
            return template
                .Replace("{nome}", PrimeiroNome(atendimento.Nome))
                .Replace("{empresa}", nomeEmpresa ?? "nossa loja")
                .Replace("{interesse}", string.IsNullOrWhiteSpace(atendimento.Interesse) ? "seus produtos de interesse" : atendimento.Interesse);
        }

        private async Task<string> ResponderPrecoAsync(string texto)
        {
            var palavraProduto = ExtrairProduto(texto);
            if (string.IsNullOrEmpty(palavraProduto))
                return "Sobre qual produto você quer o preço? 😊 Me diga o nome (ex.: castanha, chia, aveia, quinoa...).";

            var produtos = await BuscarProdutosAsync(palavraProduto);
            if (produtos.Count == 0)
                return $"Hmm, não encontrei o produto \"{palavraProduto}\" no nosso catálogo. 😕 Pode tentar outro nome?";

            var linhas = produtos.Select(x =>
                $"• {x.Nome}: R$ {x.PrecoVarejo:0.00} (varejo) / R$ {x.PrecoAtacado:0.00} (atacado acima de {x.QuantidadeMinimaAtacado:0} un)");

            return $"💲 Segue a tabela para *{palavraProduto}*:\n\n{string.Join("\n", linhas)}\n\nQuer fazer um pedido? Me diga a quantidade!";
        }

        private async Task<string> ResponderEstoqueAsync(string texto)
        {
            var palavraProduto = ExtrairProduto(texto);
            if (string.IsNullOrEmpty(palavraProduto))
                return "Qual produto você quer saber se tem em estoque? 😊";

            var produtos = await BuscarProdutosAsync(palavraProduto);
            if (produtos.Count == 0)
                return $"Não localizei \"{palavraProduto}\" no nosso catálogo. 😕";

            var produto = produtos[0];
            var emEstoque = produto.Estoque > 0;
            return emEstoque
                ? $"✅ *{produto.Nome}* está disponível! Temos {produto.Estoque:0.##} unidades em estoque. Quer reservar?"
                : $"❌ *{produto.Nome}* está temporariamente sem estoque. Posso indicar um produto similar. 😉";
        }

        private async Task<string> ResponderPedidoAsync(string texto, AtendimentoLead atendimento)
        {
            string numeros = new(texto.Where(char.IsDigit).ToArray());
            int? pedidoId = atendimento.PedidoId;

            if (!pedidoId.HasValue && int.TryParse(numeros, out var id) && id > 0)
                pedidoId = id;

            if (!pedidoId.HasValue)
                return "Para ver o status do pedido, me informe o número do pedido. 📦";

            var pedido = await _context.Pedidos
                .Include(p => p.Itens)
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == pedidoId.Value);

            if (pedido == null)
                return $"Não encontrei um pedido com o número #{pedidoId}. 😕 Confere se o número está correto?";

            var itensResumo = pedido.Itens.Count > 0
                ? string.Join(", ", pedido.Itens.Take(3).Select(i => $"{i.Quantidade:0.##}x (item {i.ProdutoId})"))
                : "—";

            return $"📦 *Pedido #{pedido.Id}*\nStatus: {StatusLegivel(pedido.Status)}\nValor: R$ {pedido.ValorFinal:0.00}\nItens: {itensResumo}\n\nAlguma dúvida sobre o pedido?";
        }

        private async Task<List<Produto>> BuscarProdutosAsync(string palavraChave)
        {
            var produtos = await _context.Produtos
                .AsNoTracking()
                .Where(p => p.Ativo)
                .ToListAsync();

            return produtos
                .Select(p => new { Produto = p, Score = ScoreProduto(p.Nome, palavraChave) })
                .Where(x => x.Score > 0)
                .OrderByDescending(x => x.Score)
                .ThenBy(x => x.Produto.Nome)
                .Take(3)
                .Select(x => x.Produto)
                .ToList();
        }

        private static string? ExtrairValorDoCampo(string textoOriginal, string? campo)
        {
            if (string.IsNullOrWhiteSpace(campo)) return null;

            var texto = textoOriginal.Trim();
            switch (Normalizar(campo))
            {
                case "bairro":
                    return ExtrairAposPrefixo(texto, "bairro", "bairro é", "sou de", "moro em", "do bairro");
                case "quantidade":
                    return ExtrairQuantidade(texto);
                case "interesse":
                    return ExtrairInteresse(texto);
                case "pagamento":
                    if (Contem(texto, "pix")) return "PIX";
                    if (Contem(texto, "boleto faturado", "faturado")) return "Boleto Faturado";
                    if (Contem(texto, "boleto")) return "Boleto";
                    if (Contem(texto, "cartão", "cartao")) return "Cartão";
                    return null;
                case "embalagem":
                    if (Contem(texto, "fracionado", "pacote", "pacotes")) return "Fracionado";
                    if (Contem(texto, "granel", "saco", "sacos", "saca")) return "A Granel";
                    return null;
                case "tipocliente":
                    if (Contem(texto, "empório", "emporio", "natural")) return "Empório / Produtos Naturais";
                    if (Contem(texto, "industria", "indústria")) return "Indústria de Alimentos";
                    if (Contem(texto, "padaria", "mercado", "supermercado", "supermercado")) return "Varejo";
                    return null;
                default:
                    return null;
            }
        }

        private static string? ExtrairAposPrefixo(string texto, string campo, params string[] prefixos)
        {
            foreach (var prefixo in prefixos)
            {
                var idx = texto.IndexOf(prefixo, StringComparison.OrdinalIgnoreCase);
                if (idx < 0) continue;
                var resto = texto[(idx + prefixo.Length)..].Trim();
                resto = resto.Trim(' ', '-', '.', ',', ':', ';');
                resto = System.Text.RegularExpressions.Regex.Replace(resto, @"^(?:\s*(?:é|e|de|do|da|no|na|em)\s+)+", string.Empty, System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                if (resto.Length > 1 && resto.Length <= 60)
                    return char.ToUpperInvariant(resto[0]) + resto[1..];
            }
            return null;
        }

        private static string? ExtrairQuantidade(string texto)
        {
            var match = Regex.Match(texto, @"(\d+)\s*(?:kg|quilos?|kilos?|unidades?|un|sacos|pacotes)", RegexOptions.IgnoreCase);
            if (match.Success)
                return $"{match.Groups[1].Value} {match.Groups[2].Value}";
            return null;
        }

        private static string? ExtrairInteresse(string texto)
        {
            var match = Regex.Match(texto, @"(?:quero|vou querer|preciso|estou precisando|pedido|comprar|gostaria de)\s+(?:de\s+|do\s+|da\s+)?(.+)", RegexOptions.IgnoreCase);
            if (match.Success && match.Groups[1].Value.Trim().Length > 2)
                return match.Groups[1].Value.Trim();
            return null;
        }

        private static string ExtrairProduto(string texto)
        {
            var palavrasChave = new[] { "castanha", "chia", "aveia", "quinoa", "linhaca", "linhaça", "nozes", "noz", "amendoas", "amêndoas", "amendoim", "cacau", "uva", "passa", "girassol", "gergelim", "amaranto", "farinha", "açucar", "açúcar", "mel", "granola", "mix", "frutas", "oleaginosas", "arroz", "castanha do para", "castanha do pará" };

            foreach (var palavra in palavrasChave)
            {
                if (texto.Contains(palavra))
                    return palavra;
            }

            var palavras = texto.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            foreach (var p in palavras)
            {
                if (p.Length >= 4 && !Contem(p, "qual", "quero", "preciso", "estou", "gostaria", "quanto", "custa", "valor", "preço", "preco", "tem", "esta", "porque", "voce", "quando"))
                    return p;
            }

            return string.Empty;
        }

        private static int ScoreProduto(string nomeProduto, string palavraChave)
        {
            var n = Normalizar(nomeProduto);
            if (n == palavraChave) return 100;
            if (n.Contains(palavraChave)) return 50;
            if (palavraChave.Contains(n)) return 30;
            return 0;
        }

        private static string MenuTexto(string? nomeEmpresa)
        {
            return $"📋 *Menu de opções*\n\nOlá! Eu sou o assistente do {nomeEmpresa ?? "catálogo"} 🤖\n\nVocê pode perguntar:\n• *Preço* — ex: \"quanto custa a castanha?\"\n• *Estoque* — ex: \"tem chia disponível?\"\n• *Pedido* — ex: \"qual o status do pedido 123?\"\n• *Entrega* — ex: \"quanto tempo demora a entrega?\"\n• *Pagamento* — ex: \"quais as formas de pagamento?\"\n\nSe preferir, posso te passar para um atendente humano. 😉";
        }

        private static string RespostaPadrao(string? nomeEmpresa, string nomeLead)
        {
            return $"Entendi! 😊 Posso te ajudar com preços, estoque, status de pedido, formas de pagamento e entrega. Sobre o que você gostaria de saber? (ou digite *menu*)";
        }

        private static string StatusLegivel(string status)
        {
            return status switch
            {
                "Pendente" => "⏳ Pendente de confirmação",
                "Confirmado" => "✅ Confirmado",
                "Separacao" or "Em Separacao" or "Em Separação" => "📦 Em separação",
                "Conferencia" or "Em Conferência" => "🔍 Em conferência",
                "Em Rota" or "EmTransporte" or "Rota" => "🚚 Em rota de entrega",
                "Entregue" => "✅ Entregue",
                "Cancelado" => "❌ Cancelado",
                _ => status
            };
        }

        private static bool EhSaudacao(string texto)
        {
            return Contem(texto, "oi", "ola", "olá", "bom dia", "boa tarde", "boa noite", "hello", "hey", "eae", "eai", "opa");
        }

        private static bool EhMenu(string texto)
        {
            return texto == "menu" || texto == "opcoes" || texto == "opções" || texto == "ajuda" || texto == "-menu" || texto == "/menu";
        }

        private static string Normalizar(string texto)
        {
            return new string(texto.ToLowerInvariant().Where(c => char.IsLetterOrDigit(c) || c == ' ' || c == '#' || c == 'º' || c == '°' || c == '/').ToArray())
                .Replace("  ", " ")
                .Trim();
        }

        private static bool Contem(string texto, params string[] termos)
        {
            foreach (var termo in termos)
            {
                if (texto.Contains(termo))
                    return true;
            }
            return false;
        }

        private static string PrimeiroNome(string nome)
        {
            if (string.IsNullOrWhiteSpace(nome)) return "tudo bem";
            return nome.Split(' ')[0];
        }
    }
}
