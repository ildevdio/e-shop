using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class Rota : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        public DateTime Data { get; set; } = DateTime.UtcNow;

        public int VeiculoId { get; set; }
        public Veiculo? Veiculo { get; set; }

        public int MotoristaId { get; set; }
        public Usuario? Motorista { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } = "Aberta"; 

        public string LinkGoogleMaps { get; set; } = string.Empty;

        public ICollection<Entrega> Entregas { get; set; } = new List<Entrega>();
    }
}
