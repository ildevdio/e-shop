using System.ComponentModel.DataAnnotations;

namespace FocusEshop.Api.Models
{
    public class Prospect : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(255)]
        public string NomeEmpresa { get; set; } = string.Empty;

        [StringLength(255)]
        public string NomeFantasia { get; set; } = string.Empty;

        [StringLength(255)]
        public string EnderecoCompleto { get; set; } = string.Empty;

        [StringLength(200)]
        public string Logradouro { get; set; } = string.Empty;

        [StringLength(20)]
        public string Numero { get; set; } = string.Empty;

        [StringLength(100)]
        public string Bairro { get; set; } = string.Empty;

        [StringLength(100)]
        public string Cidade { get; set; } = string.Empty;

        [StringLength(2)]
        public string Estado { get; set; } = string.Empty;

        [StringLength(10)]
        public string Cep { get; set; } = string.Empty;

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        [StringLength(20)]
        public string Telefone { get; set; } = string.Empty;

        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Site { get; set; }

        [StringLength(100)]
        public string Categoria { get; set; } = string.Empty;

        [StringLength(500)]
        public string? PlaceId { get; set; }

        public double? Rating { get; set; }
        public int? TotalAvaliacoes { get; set; }

        [StringLength(50)]
        public string Status { get; set; } = "Novo";

        [StringLength(1000)]
        public string? Observacoes { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public DateTime DataAtualizacao { get; set; } = DateTime.UtcNow;
    }
}
