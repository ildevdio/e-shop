namespace Multigrao.Api.Services
{
    public interface ITenantContext
    {
        int EmpresaId { get; set; }
        string? Slug { get; set; }
    }

    public class TenantContext : ITenantContext
    {
        public int EmpresaId { get; set; } = 1;
        public string? Slug { get; set; }
    }
}
