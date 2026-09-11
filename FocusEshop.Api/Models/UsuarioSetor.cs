using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Multigrao.Api.Models
{
    public class UsuarioSetor
    {
        public int UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        public int SetorId { get; set; }
        public Setor? Setor { get; set; }
    }
}
