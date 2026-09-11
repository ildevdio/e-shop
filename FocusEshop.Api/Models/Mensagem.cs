using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class Mensagem : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        public int ConversaId { get; set; }
        public Conversa? Conversa { get; set; }

        public int? UsuarioRemetenteId { get; set; }
        public Usuario? UsuarioRemetente { get; set; }

        public string Texto { get; set; } = string.Empty;
        public string UrlAnexo { get; set; } = string.Empty;

        public DateTime DataEnvio { get; set; } = DateTime.UtcNow;
        public DateTime? DataVisualizacao { get; set; }
    }
}
