using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class CupomProduto : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        public int CupomId { get; set; }
        public Cupom? Cupom { get; set; }

        public int ProdutoId { get; set; }
        public Produto? Produto { get; set; }
    }
}
