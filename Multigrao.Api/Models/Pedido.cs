using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class Pedido
    {
        [Key]
        public int Id { get; set; }

        public int ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pendente"; // Pendente, EmProducao, ProntoEntrega, EmSeparacao, EmEntrega, Entregue

        public decimal PesoTotal { get; set; }
        public decimal ValorTotal { get; set; }
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public ICollection<ItemPedido> Itens { get; set; } = new List<ItemPedido>();
    }
}
