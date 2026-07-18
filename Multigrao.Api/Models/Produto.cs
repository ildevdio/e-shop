using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Produto
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        public decimal PesoUnidade { get; set; }

        [StringLength(50)]
        public string CodigoERP { get; set; } = string.Empty;
    }
}
