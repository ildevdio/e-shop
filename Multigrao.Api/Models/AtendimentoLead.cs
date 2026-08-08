using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class AtendimentoLead
    {
        [Key]
        public int Id { get; set; }

        public int ConversaId { get; set; }
        public Conversa? Conversa { get; set; }

        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(20)]
        public string Telefone { get; set; } = string.Empty;

        [StringLength(100)]
        public string Origem { get; set; } = string.Empty;

        [StringLength(100)]
        public string Interesse { get; set; } = string.Empty;

        [StringLength(100)]
        public string Bairro { get; set; } = string.Empty;

        [StringLength(50)]
        public string Quantidade { get; set; } = string.Empty;

        [StringLength(50)]
        public string Embalagem { get; set; } = string.Empty;

        [StringLength(50)]
        public string Pagamento { get; set; } = string.Empty;

        [StringLength(100)]
        public string TipoCliente { get; set; } = string.Empty;

        public string ResumoIA { get; set; } = string.Empty;

        public bool VendaFechada { get; set; } = false;
        
        public bool IAAtiva { get; set; } = true;

        public int? UsuarioAtendenteId { get; set; }
        public Usuario? UsuarioAtendente { get; set; }

        public int? PedidoId { get; set; }
        public Pedido? Pedido { get; set; }
    }
}
