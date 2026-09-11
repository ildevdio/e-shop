using System.ComponentModel.DataAnnotations;

namespace FocusEshop.Api.Models
{
    public class Banner : IEmpresa
    {
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        [Required, MaxLength(200)]
        public string Titulo { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Subtitulo { get; set; }

        [Required, MaxLength(500)]
        public string ImagemUrl { get; set; } = string.Empty;

        /// <summary>"produto", "categoria" ou "externo". Vazio = sem link.</summary>
        [MaxLength(20)]
        public string LinkTipo { get; set; } = string.Empty;

        /// <summary>Id do produto/categoria ou URL externa conforme LinkTipo.</summary>
        [MaxLength(500)]
        public string? LinkValor { get; set; }

        /// <summary>"carrossel", "secao" ou "ambos". Define onde o banner é exibido.</summary>
        [MaxLength(20)]
        public string Posicao { get; set; } = "ambos";

        public int Ordem { get; set; }

        public bool Ativo { get; set; } = true;

        public DateTime? DataInicio { get; set; }
        public DateTime? DataFim { get; set; }
    }
}