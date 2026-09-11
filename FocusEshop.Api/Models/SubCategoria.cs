using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace FocusEshop.Api.Models
{
    public class SubCategoria : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        public int Ordem { get; set; }

        public int? CategoriaId { get; set; }

        [ForeignKey(nameof(CategoriaId))]
        public Categoria? Categoria { get; set; }

        public bool Ativo { get; set; } = true;

        [JsonIgnore]
        public ICollection<Produto> Produtos { get; set; } = new List<Produto>();
    }
}
