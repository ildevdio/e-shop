using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

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

        public int? CategoriaId { get; set; }

        [ForeignKey(nameof(CategoriaId))]
        public Categoria? Categoria { get; set; }

        public int? MarcaId { get; set; }

        [ForeignKey(nameof(MarcaId))]
        public Marca? Marca { get; set; }

        public decimal PrecoVarejo { get; set; }

        public decimal PrecoAtacado { get; set; }

        [StringLength(50)]
        public string? Embalagem { get; set; }

        [StringLength(50)]
        public string? UnidadeVenda { get; set; }

        [StringLength(200)]
        public string? ImagemUrl { get; set; }

        public bool Ativo { get; set; } = true;
    }
}
