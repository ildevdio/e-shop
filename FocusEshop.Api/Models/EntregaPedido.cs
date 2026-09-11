using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class EntregaPedido
    {
        public int EntregaId { get; set; }
        public Entrega? Entrega { get; set; }

        public int PedidoId { get; set; }
        public Pedido? Pedido { get; set; }
    }
}
