using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace FocusEshop.Api.Models
{
    public class Departamento : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(100)]
        public string Nome { get; set; } = string.Empty;

        public int Ordem { get; set; }

        [StringLength(500)]
        public string? FotoUrl { get; set; }

        [JsonIgnore]
        public byte[]? FotoBytes { get; set; }

        [StringLength(30)]
        public string? FotoContentType { get; set; }

        [StringLength(500)]
        public string? Descricao { get; set; }

        public bool Ativo { get; set; } = true;

        [JsonIgnore]
        public ICollection<Categoria> Categorias { get; set; } = new List<Categoria>();
    }
}
