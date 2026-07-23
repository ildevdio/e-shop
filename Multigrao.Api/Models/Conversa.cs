using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public enum TipoConversa
    {
        Atendimento = 0,
        ChatInterno = 1
    }

    public class Conversa
    {
        [Key]
        public int Id { get; set; }

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        [StringLength(200)]
        public string Titulo { get; set; } = string.Empty;

        public TipoConversa Tipo { get; set; } = TipoConversa.ChatInterno;

        public int? ClienteId { get; set; }
        public Cliente? Cliente { get; set; }

        public ICollection<Mensagem> Mensagens { get; set; } = new List<Mensagem>();
    }
}
