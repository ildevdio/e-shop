using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Categoria
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        public int Ordem { get; set; }

        public ICollection<Produto> Produtos { get; set; } = new List<Produto>();
    }
}
