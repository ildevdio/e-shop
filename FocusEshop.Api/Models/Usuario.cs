using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Usuario : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(150)]
        public string Nome { get; set; } = string.Empty;

        [Required]
        [StringLength(150)]
        public string UsuarioLogin { get; set; } = string.Empty;

        [Required]
        public string SenhaHash { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Role { get; set; } = "Comum";

        public bool Ativo { get; set; } = true;

        public ICollection<UsuarioSetor> UsuarioSetores { get; set; } = new List<UsuarioSetor>();
        public ICollection<Cliente> ClientesVendedor { get; set; } = new List<Cliente>();
    }
}
