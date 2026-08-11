using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class Aviso : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        public string Conteudo { get; set; } = string.Empty;

        public DateTime DataPublicacao { get; set; } = DateTime.UtcNow;

        public int? SetorAlvoId { get; set; }
        public Setor? SetorAlvo { get; set; }

        public int AutorId { get; set; }
        public Usuario? Autor { get; set; }
    }
}
