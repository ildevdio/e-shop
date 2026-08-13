using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace Multigrao.Api.Models
{
    public class ArquivoUpload : IEmpresa
    {
        [Key]
        public int Id { get; set; }

        public int EmpresaId { get; set; } = 0;

        [Required]
        [StringLength(100)]
        public string FileName { get; set; } = string.Empty;

        [StringLength(50)]
        public string? ContentType { get; set; }

        [JsonIgnore]
        public byte[] Conteudo { get; set; } = Array.Empty<byte>();

        public DateTime CriadoEm { get; set; } = DateTime.UtcNow;
    }
}
