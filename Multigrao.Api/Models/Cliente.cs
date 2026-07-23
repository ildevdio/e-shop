using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Cliente
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string RazaoSocialNome { get; set; } = string.Empty;

        [StringLength(255)]
        public string NomeFantasia { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string CpfCnpj { get; set; } = string.Empty;

        [StringLength(2)]
        public string TipoPessoa { get; set; } = string.Empty;

        [StringLength(20)]
        public string InscricaoEstadual { get; set; } = string.Empty;

        [StringLength(20)]
        public string InscricaoMunicipal { get; set; } = string.Empty;

        [StringLength(10)]
        public string Cep { get; set; } = string.Empty;

        [StringLength(200)]
        public string Logradouro { get; set; } = string.Empty;

        [StringLength(20)]
        public string Numero { get; set; } = string.Empty;

        [StringLength(100)]
        public string Complemento { get; set; } = string.Empty;

        [StringLength(100)]
        public string Bairro { get; set; } = string.Empty;

        [StringLength(100)]
        public string Cidade { get; set; } = string.Empty;

        [StringLength(2)]
        public string Estado { get; set; } = string.Empty;

        [StringLength(20)]
        public string Telefone { get; set; } = string.Empty;

        [StringLength(255)]
        public string Email { get; set; } = string.Empty;

        [StringLength(50)]
        public string RegimeTributario { get; set; } = string.Empty;

        public double? Latitude { get; set; }
        public double? Longitude { get; set; }

        public int? VendedorId { get; set; }
        public Usuario? Vendedor { get; set; }

        public ICollection<Contato> Contatos { get; set; } = new List<Contato>();
        public ICollection<Pedido> Pedidos { get; set; } = new List<Pedido>();
    }
}
