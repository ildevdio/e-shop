using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class BotConfig : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        // Tipos: Saudacao | Menu | PalavraChave | Igual | Regex | Qualquer
        [StringLength(30)]
        public string TipoTrigger { get; set; } = "PalavraChave";

        // Palavras-chave separadas por "|", texto exato ou padrão regex
        public string ValorTrigger { get; set; } = string.Empty;

        // Tipos: Texto | PrecoProduto | EstoqueProduto | StatusPedido | Menu
        [StringLength(30)]
        public string TipoReacao { get; set; } = "Texto";

        // Texto usado em reações Texto/Menu
        public string TextoResposta { get; set; } = string.Empty;

        // Ações: Responder | ResponderEDesativarIA | SalvarLead
        [StringLength(30)]
        public string AcaoBot { get; set; } = "Responder";

        // Campo do lead a preencher quando AcaoBot = SalvarLead (interesse, bairro, quantidade, embalagem, pagamento, tipoCliente)
        [StringLength(30)]
        public string? CampoLead { get; set; }

        public int Ordem { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
