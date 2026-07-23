using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class Pedido
    {
        [Key]
        public int Id { get; set; }

        public int? ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        [StringLength(200)]
        public string? SolicitanteNome { get; set; }

        [StringLength(30)]
        public string? SolicitanteTelefone { get; set; }

        [StringLength(20)]
        public string? CpfCnpj { get; set; }

        [StringLength(10)]
        public string? Cep { get; set; }

        [StringLength(200)]
        public string? Logradouro { get; set; }

        [StringLength(20)]
        public string? Numero { get; set; }

        [StringLength(100)]
        public string? Complemento { get; set; }

        [StringLength(100)]
        public string? Bairro { get; set; }

        [StringLength(100)]
        public string? Cidade { get; set; }

        [StringLength(2)]
        public string? Estado { get; set; }

        public bool EnderecoConfere { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pendente";

        [Required]
        [StringLength(20)]
        public string TipoEntrega { get; set; } = "Entrega";

        [StringLength(50)]
        public string? Pagamento { get; set; }

        public decimal Desconto { get; set; }
        public decimal Acrescimo { get; set; }
        public decimal ValorFinal { get; set; }

        public decimal PesoTotal { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public ICollection<ItemPedido> Itens { get; set; } = new List<ItemPedido>();
        public ICollection<Entrega> Entregas { get; set; } = new List<Entrega>();
    }
}
