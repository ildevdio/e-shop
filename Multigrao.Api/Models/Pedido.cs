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

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pendente";

        [Required]
        [StringLength(20)]
        public string TipoEntrega { get; set; } = "Entrega";

        public decimal Desconto { get; set; }
        public decimal Acrescimo { get; set; }
        public decimal ValorFinal { get; set; }

        public decimal PesoTotal { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public ICollection<ItemPedido> Itens { get; set; } = new List<ItemPedido>();
    }
}
