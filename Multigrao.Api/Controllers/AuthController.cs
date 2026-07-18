using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Services;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly AppDbContext _context;

        public AuthController(IAuthService authService, AppDbContext context)
        {
            _authService = authService;
            _context = context;
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
    }
}
