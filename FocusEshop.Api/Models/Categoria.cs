using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Categoria : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        public int Ordem { get; set; }

        public ICollection<Produto> Produtos { get; set; } = new List<Produto>();
    }
}
