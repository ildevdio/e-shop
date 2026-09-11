using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Services;

namespace Multigrao.Api.Middlewares
{
    public class TenantMiddleware
    {
        private readonly RequestDelegate _next;

        public TenantMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context, AppDbContext db, ITenantContext tenant)
        {
            var slug = context.Request.Headers["X-Tenant-Slug"].FirstOrDefault();

            if (string.IsNullOrWhiteSpace(slug))
                slug = context.Request.Query["slug"].FirstOrDefault();

            if (!string.IsNullOrWhiteSpace(slug))
            {
                var empresa = await db.ConfiguracoesSistema
                    .AsNoTracking()
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(e => e.Slug == slug.Trim().ToLower() && e.Ativo);

                if (empresa != null)
                {
                    tenant.EmpresaId = empresa.Id;
                    tenant.Slug = empresa.Slug;
                }
            }
            else
            {
                var claim = context.User.FindFirst("EmpresaId")?.Value;
                if (int.TryParse(claim, out var empresaId) && empresaId > 0)
                    tenant.EmpresaId = empresaId;
            }

            if (context.User.Identity?.IsAuthenticated == true)
            {
                var claim = context.User.FindFirst("EmpresaId")?.Value;
                if (int.TryParse(claim, out var tokenEmpresaId) && tokenEmpresaId != tenant.EmpresaId)
                {
                    context.Response.StatusCode = StatusCodes.Status403Forbidden;
                    await context.Response.WriteAsJsonAsync(new { message = "Sessão não autorizada para esta empresa." });
                    return;
                }
            }

            await _next(context);
        }
    }
}
