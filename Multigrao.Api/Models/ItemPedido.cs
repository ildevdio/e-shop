using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class ItemPedido
    {
        [Key]
        public int Id { get; set; }

        public int PedidoId { get; set; }
        public Pedido? Pedido { get; set; }

        public int ProdutoId { get; set; }
        public Produto? Produto { get; set; }

        public decimal Quantidade { get; set; }
        public decimal PrecoUnitario { get; set; }

        public bool Separado { get; set; } = false;

        public int? SeparadoPorUsuarioId { get; set; }
        public Usuario? SeparadoPorUsuario { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Pendente";
    }
}
