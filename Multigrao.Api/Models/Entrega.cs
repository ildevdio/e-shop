using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class Entrega
    {
        [Key]
        public int Id { get; set; }

        public int RotaId { get; set; }
        public Rota? Rota { get; set; }

        public int Ordem { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "PendenteConferencia";

        public string Observacao { get; set; } = string.Empty;
        public string MotivoDevolucao { get; set; } = string.Empty;

        public ICollection<EntregaPedido> EntregaPedidos { get; set; } = new List<EntregaPedido>();
    }
}
