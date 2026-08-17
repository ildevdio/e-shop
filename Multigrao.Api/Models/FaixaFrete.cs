namespace Multigrao.Api.Models
{
    public class FaixaFrete : IEmpresa
    {
        public int Id { get; set; }
        public int EmpresaId { get; set; } = 0;
        public decimal AteKm { get; set; }
        public decimal Valor { get; set; }
        public int Ordem { get; set; }
    }
}
