using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace Multigrao.Api.Models
{
    public class Promocao : IEmpresa
    {
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required, MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Descricao { get; set; }

        /// <summary>"percentual" ou "valor"</summary>
        [Required, MaxLength(20)]
        public string Tipo { get; set; } = "percentual";

        public decimal Valor { get; set; }

        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }

        public bool Ativa { get; set; } = true;

        public ICollection<PromocaoProduto> Produtos { get; set; } = new List<PromocaoProduto>();
    }

    public class PromocaoProduto : IEmpresa
    {
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        public int PromocaoId { get; set; }
        [JsonIgnore]
        public Promocao? Promocao { get; set; }

        public int ProdutoId { get; set; }
        public Produto? Produto { get; set; }

        /// <summary>Preço promocional fixo por produto. Null = usar o desconto da promoção (percentual/valor).</summary>
        public decimal? PrecoPromocional { get; set; }
    }
}
