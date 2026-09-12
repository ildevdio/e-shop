using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Data;
using FocusEshop.Api.DTOs;
using FocusEshop.Api.Models;
using FocusEshop.Api.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace FocusEshop.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ITenantContext _tenant;

        public AuthController(IAuthService authService, AppDbContext context, IConfiguration configuration, ITenantContext tenant)
        {
            _authService = authService;
            _context = context;
            _configuration = configuration;
            _tenant = tenant;
        }

        [HttpPost("login")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.UsuarioSetores)
                    .ThenInclude(us => us.Setor)
                .FirstOrDefaultAsync(u => u.UsuarioLogin == request.Usuario && u.Ativo);

            if (usuario == null)
                return Unauthorized(new { message = "Usuário ou senha inválidos." });

            if (!_authService.VerifyPassword(request.Senha, usuario.SenhaHash))
                return Unauthorized(new { message = "Usuário ou senha inválidos." });

            var token = _authService.GenerateJwtToken(usuario);

            var setores = usuario.UsuarioSetores.Select(us => us.Setor!.Nome).ToList();
            var empresas = await CarregarEmpresasDoUsuarioAsync(usuario);

            return Ok(new LoginResponseDto
            {
                Token = token,
                Nome = usuario.Nome,
                Role = usuario.Role,
                UsuarioId = usuario.Id,
                Setores = setores,
                Empresas = empresas
            });
        }

        [HttpPost("resolver-cnpj")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ResolverCnpj([FromBody] ResolverCnpjDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Cnpj))
                return BadRequest(new { message = "Informe o CNPJ da empresa." });

            var cnpj = new string(request.Cnpj.Where(char.IsDigit).ToArray());
            if (cnpj.Length != 14)
                return BadRequest(new { message = "Informe um CNPJ válido (14 dígitos)." });

            var empresas = await _context.ConfiguracoesSistema
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(c => c.Ativo && c.Cnpj != null)
                .ToListAsync();

            var empresa = empresas.FirstOrDefault(c => new string(c.Cnpj!.Where(char.IsDigit).ToArray()) == cnpj);
            if (empresa == null)
                return NotFound(new { message = "Nenhuma empresa encontrada para este CNPJ." });

            return Ok(new
            {
                slug = empresa.Slug,
                nomeEmpresa = empresa.NomeEmpresa,
                logoUrl = empresa.LogoUrl,
                videoUrl = empresa.VideoUrl,
                corPrincipal = empresa.CorPrincipal
            });
        }

        [HttpPost("login-empresa")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> LoginEmpresa([FromBody] LoginEmpresaDto request)
        {
            if (string.IsNullOrWhiteSpace(request.Cnpj))
                return BadRequest(new { message = "Informe o CNPJ da empresa." });

            var cnpj = new string(request.Cnpj.Where(char.IsDigit).ToArray());
            if (cnpj.Length != 14)
                return BadRequest(new { message = "Informe um CNPJ válido (14 dígitos)." });

            var empresas = await _context.ConfiguracoesSistema
                .AsNoTracking()
                .IgnoreQueryFilters()
                .Where(c => c.Ativo && c.Cnpj != null)
                .ToListAsync();

            var empresa = empresas.FirstOrDefault(c => new string(c.Cnpj!.Where(char.IsDigit).ToArray()) == cnpj);
            if (empresa == null)
                return Unauthorized(new { message = "Nenhuma empresa encontrada para este CNPJ." });

            var idsMembros = await _context.UsuariosEmpresas
                .IgnoreQueryFilters()
                .Where(ue => ue.EmpresaId == empresa.Id)
                .Select(ue => ue.UsuarioId)
                .ToListAsync();

            var usuario = await _context.Usuarios
                .IgnoreQueryFilters()
                .Include(u => u.UsuarioSetores)
                    .ThenInclude(us => us.Setor)
                .FirstOrDefaultAsync(u => u.UsuarioLogin == request.Usuario && u.Ativo &&
                    (u.EmpresaId == empresa.Id || idsMembros.Contains(u.Id)));

            if (usuario == null)
                return Unauthorized(new { message = "Usuário ou senha inválidos." });

            if (!_authService.VerifyPassword(request.Senha, usuario.SenhaHash))
                return Unauthorized(new { message = "Usuário ou senha inválidos." });

            var token = _authService.GenerateJwtToken(usuario, empresa.Id);
            var setores = usuario.UsuarioSetores.Select(us => us.Setor!.Nome).ToList();
            var empresasUsuario = await CarregarEmpresasDoUsuarioAsync(usuario);

            return Ok(new
            {
                token,
                nome = usuario.Nome,
                role = usuario.Role,
                usuarioId = usuario.Id,
                setores,
                empresas = empresasUsuario,
                slug = empresa.Slug,
                nomeEmpresa = empresa.NomeEmpresa,
                logoUrl = empresa.LogoUrl,
                videoUrl = empresa.VideoUrl,
                corPrincipal = empresa.CorPrincipal
            });
        }

        [HttpPost("validar-senha-mestre")]
        [EnableRateLimiting("auth")]
        public async Task<IActionResult> ValidarSenhaMestre([FromBody] ValidarSenhaMestreDto request)
        {
            var masterPassword = Environment.GetEnvironmentVariable("MASTER_PASSWORD")
                ?? _configuration["MasterPassword"]
                ?? string.Empty;

            if (string.IsNullOrEmpty(masterPassword) || request.Senha != masterPassword)
                return Unauthorized(new { message = "Senha mestre inválida." });

            var adminUser = await _context.Usuarios.FirstOrDefaultAsync(u => u.UsuarioLogin == "admin");
            var usuario = adminUser ?? new Usuario
            {
                Nome = "Administrador",
                UsuarioLogin = "admin",
                Role = "AdminMaster",
                Ativo = true,
                EmpresaId = _tenant.EmpresaId
            };

            var token = _authService.GenerateJwtToken(usuario);

            var setores = _context.Setores.Select(s => s.Nome).ToList();
            var empresas = await CarregarEmpresasDoUsuarioAsync(usuario);

            return Ok(new LoginResponseDto
            {
                Token = token,
                Nome = usuario.Nome,
                Role = usuario.Role,
                UsuarioId = usuario.Id,
                Setores = setores,
                Empresas = empresas
            });
        }

        [Authorize]
        [HttpPost("trocar-empresa")]
        public async Task<IActionResult> TrocarEmpresa([FromBody] TrocarEmpresaDto request)
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!int.TryParse(usuarioIdClaim, out var usuarioId))
                return Unauthorized(new { message = "Sessão inválida." });

            var empresa = await _context.ConfiguracoesSistema
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.Id == request.EmpresaId && e.Ativo);

            if (empresa == null)
                return NotFound(new { message = "Empresa não encontrada ou inativa." });

            var usuario = new Usuario { Id = usuarioId, EmpresaId = empresa.Id };

            int? empresaOrigem = null;
            var empresaOrigemClaim = User.FindFirst("EmpresaId")?.Value;
            if (int.TryParse(empresaOrigemClaim, out var empresaOrigemId) && empresaOrigemId > 0)
                empresaOrigem = empresaOrigemId;

            var empresasAcessiveis = await CarregarEmpresasDoUsuarioAsync(usuarioId, empresaOrigem);
            if (!empresasAcessiveis.Any(e => e.Id == empresa.Id))
                return Forbid();

            var token = _authService.GenerateJwtToken(usuario, empresa.Id);

            return Ok(new
            {
                token,
                usuarioId,
                empresas = empresasAcessiveis,
                slug = empresa.Slug,
                nomeEmpresa = empresa.NomeEmpresa,
                logoUrl = empresa.LogoUrl,
                corPrincipal = empresa.CorPrincipal
            });
        }

        [Authorize]
        [HttpGet("minhas-empresas")]
        public async Task<IActionResult> MinhasEmpresas()
        {
            var usuarioIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
            if (!int.TryParse(usuarioIdClaim, out var usuarioId))
                return Unauthorized(new { message = "Sessão inválida." });

            int? empresaPrincipal = null;
            var empresaClaim = User.FindFirst("EmpresaId")?.Value;
            if (int.TryParse(empresaClaim, out var empresaIdClaim) && empresaIdClaim > 0)
                empresaPrincipal = empresaIdClaim;

            return Ok(await CarregarEmpresasDoUsuarioAsync(usuarioId, empresaPrincipal));
        }

        private async Task<List<EmpresaResumoDto>> CarregarEmpresasDoUsuarioAsync(Usuario usuario)
        {
            return await CarregarEmpresasDoUsuarioAsync(usuario.Id, usuario.EmpresaId);
        }

        private async Task<List<EmpresaResumoDto>> CarregarEmpresasDoUsuarioAsync(int usuarioId, int? empresaPrincipalId = null)
        {
            var todas = await _context.ConfiguracoesSistema
                .IgnoreQueryFilters()
                .Where(e => e.Ativo)
                .OrderBy(e => e.NomeEmpresa)
                .Select(e => new EmpresaResumoDto
                {
                    Id = e.Id,
                    NomeEmpresa = e.NomeEmpresa,
                    Slug = e.Slug,
                    EmpresaMatrizId = e.EmpresaMatrizId
                })
                .ToListAsync();

            if (todas.Count == 0)
                return todas;

            var idsVinculados = await _context.UsuariosEmpresas
                .IgnoreQueryFilters()
                .Where(ue => ue.UsuarioId == usuarioId)
                .Select(ue => ue.EmpresaId)
                .ToListAsync();

            if (empresaPrincipalId.HasValue && empresaPrincipalId.Value > 0 && !idsVinculados.Contains(empresaPrincipalId.Value))
                idsVinculados.Add(empresaPrincipalId.Value);

            var matrizIds = todas
                .Where(e => idsVinculados.Contains(e.Id))
                .Select(e => e.EmpresaMatrizId ?? e.Id)
                .Distinct()
                .ToList();

            return todas
                .Where(e => matrizIds.Contains(e.EmpresaMatrizId ?? e.Id))
                .ToList();
        }
    }
}
