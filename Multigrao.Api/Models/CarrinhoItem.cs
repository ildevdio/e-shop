using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class CarrinhoItem : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        public int CarrinhoId { get; set; }
        public Carrinho? Carrinho { get; set; }

        public int ProdutoId { get; set; }
        public Produto? Produto { get; set; }

        public decimal Quantidade { get; set; }
    }
}
