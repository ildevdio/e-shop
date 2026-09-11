namespace FocusEshop.Api.Models
{
    public class UsuarioEmpresa : IEmpresa
    {
        public int UsuarioId { get; set; }
        public int EmpresaId { get; set; }

        public Usuario Usuario { get; set; } = null!;
        public ConfiguracaoSistema Empresa { get; set; } = null!;
    }
}
