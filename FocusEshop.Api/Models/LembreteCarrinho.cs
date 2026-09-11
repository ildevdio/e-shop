namespace Multigrao.Api.Models
{
    public class LembreteCarrinho : IEmpresa
    {
        public int Id { get; set; }
        public int EmpresaId { get; set; }
        public int CarrinhoId { get; set; }
        public Carrinho? Carrinho { get; set; }
        public string Tipo { get; set; } = "email";
        public DateTime EnviadoEm { get; set; }
        public string? Erro { get; set; }
    }
}
