using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Cupom : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(50)]
        public string Codigo { get; set; } = string.Empty;

        [StringLength(200)]
        public string? Descricao { get; set; }

        [Required]
        [StringLength(20)]
        public string Tipo { get; set; } = "percentual";

        public decimal Valor { get; set; }

        [Required]
        [StringLength(20)]
        public string AplicavelEm { get; set; } = "pedido";

        public decimal? ValorMinimoPedido { get; set; }
        public decimal? ValorMaximoDesconto { get; set; }
        public int? UsosMaximos { get; set; }
        public int UsosRealizados { get; set; } = 0;

        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
        public bool Ativo { get; set; } = true;
        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;

        public ICollection<CupomProduto> Produtos { get; set; } = new List<CupomProduto>();
        public ICollection<CupomCliente> Clientes { get; set; } = new List<CupomCliente>();
    }
}
