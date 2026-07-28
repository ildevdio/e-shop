using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class Enquete
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;

        public DateTime DataExpiracao { get; set; }

        public bool Ativa { get; set; } = true;

        public int AutorId { get; set; }
        public Usuario? Autor { get; set; }

        public ICollection<OpcaoEnquete> Opcoes { get; set; } = new List<OpcaoEnquete>();
        public ICollection<VotoEnquete> Votos { get; set; } = new List<VotoEnquete>();
    }

    public class OpcaoEnquete
    {
        public int Id { get; set; }

        public int EnqueteId { get; set; }
        public Enquete? Enquete { get; set; }

        [Required, MaxLength(150)]
        public string Texto { get; set; } = string.Empty;

        public int Ordem { get; set; }
    }

    public class VotoEnquete
    {
        public int Id { get; set; }

        public int EnqueteId { get; set; }
        public Enquete? Enquete { get; set; }

        public int OpcaoEnqueteId { get; set; }
        public OpcaoEnquete? OpcaoEnquete { get; set; }

        public int UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }

        public DateTime DataVoto { get; set; } = DateTime.UtcNow;
    }
}
