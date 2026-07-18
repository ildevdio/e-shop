using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class Conversa
    {
        [Key]
        public int Id { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        // Uma conversa pode ser um atendimento de cliente ou um chat interno
        public int? ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        public ICollection<Mensagem> Mensagens { get; set; } = new List<Mensagem>();
    }
}
