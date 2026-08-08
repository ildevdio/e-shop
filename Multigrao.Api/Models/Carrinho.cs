using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Carrinho
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(20)]
        public string CpfCnpj { get; set; } = string.Empty;

        public DateTime AtualizadoEm { get; set; } = DateTime.UtcNow;

        public ICollection<CarrinhoItem> Itens { get; set; } = new List<CarrinhoItem>();
    }
}
