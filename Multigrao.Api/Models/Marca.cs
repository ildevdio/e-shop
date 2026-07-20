using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Marca
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        [StringLength(500)]
        public string? ImagemUrl { get; set; }

        [StringLength(7)]
        public string? Cor { get; set; }

        public ICollection<Produto> Produtos { get; set; } = new List<Produto>();
    }
}
