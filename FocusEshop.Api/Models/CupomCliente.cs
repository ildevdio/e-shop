using System.ComponentModel.DataAnnotations;

namespace Multigrao.Api.Models
{
    public class CupomCliente : IEmpresa
    {
        [Key]
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;

        public int CupomId { get; set; }
        public Cupom? Cupom { get; set; }

        public int ClienteId { get; set; }
        public Cliente? Cliente { get; set; }
    }
}
