using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;
using Multigrao.Api.Services;

namespace Multigrao.Api.Controllers
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

            return Ok(new LoginResponseDto
            {
                Token = token,
                Nome = usuario.Nome,
                Role = usuario.Role,
                UsuarioId = usuario.Id,
                Setores = setores
            });
        }

        [HttpPost("resolver-cnpj")]
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

            var usuario = await _context.Usuarios
                .IgnoreQueryFilters()
                .Include(u => u.UsuarioSetores)
                    .ThenInclude(us => us.Setor)
                .FirstOrDefaultAsync(u => u.EmpresaId == empresa.Id && u.UsuarioLogin == request.Usuario && u.Ativo);

            if (usuario == null)
                return Unauthorized(new { message = "Usuário ou senha inválidos." });

            if (!_authService.VerifyPassword(request.Senha, usuario.SenhaHash))
                return Unauthorized(new { message = "Usuário ou senha inválidos." });

            var token = _authService.GenerateJwtToken(usuario);
            var setores = usuario.UsuarioSetores.Select(us => us.Setor!.Nome).ToList();

            return Ok(new
            {
                token,
                nome = usuario.Nome,
                role = usuario.Role,
                usuarioId = usuario.Id,
                setores,
                slug = empresa.Slug,
                nomeEmpresa = empresa.NomeEmpresa,
                logoUrl = empresa.LogoUrl,
                videoUrl = empresa.VideoUrl,
                corPrincipal = empresa.CorPrincipal
            });
        }

        [HttpPost("validar-senha-mestre")]
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
                Role = "Admin",
                Ativo = true,
                EmpresaId = _tenant.EmpresaId
            };

            var token = _authService.GenerateJwtToken(usuario);

            var setores = _context.Setores.Select(s => s.Nome).ToList();

            return Ok(new LoginResponseDto
            {
                Token = token,
                Nome = usuario.Nome,
                Role = usuario.Role,
                UsuarioId = usuario.Id,
                Setores = setores
            });
        }
    }
}
