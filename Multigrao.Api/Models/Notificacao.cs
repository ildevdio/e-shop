using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Notificacao
    {
        [Key]
        public int Id { get; set; }

        public int? UsuarioDestinoId { get; set; }

        [StringLength(100)]
        public string? SetorAlvo { get; set; }

        [Required]
        [StringLength(150)]
        public string Titulo { get; set; } = string.Empty;

        [Required]
        public string Mensagem { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Tipo { get; set; } = "info";

        [StringLength(200)]
        public string? Link { get; set; }

        public bool Lida { get; set; } = false;

        public DateTime CriadaEm { get; set; } = DateTime.UtcNow;
    }
}
