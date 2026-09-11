using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Veiculo : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(100)]
        public string Modelo { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Placa { get; set; } = string.Empty;

        public decimal PesoMaximo { get; set; }
    }
}
