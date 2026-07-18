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
    public class UsuariosController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;

        public UsuariosController(AppDbContext context, IAuthService authService)
        {
            _context = context;
            _authService = authService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsuarios()
        {
            var usuarios = await _context.Usuarios
                .Include(u => u.UsuarioSetores)
                    .ThenInclude(us => us.Setor)
                .OrderBy(u => u.Nome)
                .Select(u => new UsuarioResponseDto
                {
                    Id = u.Id,
                    Nome = u.Nome,
                    UsuarioLogin = u.UsuarioLogin,
                    Perfil = u.Role,
                    Ativo = u.Ativo,
                    Setores = u.UsuarioSetores.Select(us => us.Setor!.Nome).ToList()
                })
                .ToListAsync();

            return Ok(usuarios);
        }

        [HttpPost]
        public async Task<IActionResult> CriarUsuario([FromBody] CriarUsuarioDto dto)
        {
            if (await _context.Usuarios.AnyAsync(u => u.UsuarioLogin == dto.UsuarioLogin))
                return BadRequest(new { message = "Já existe um usuário com esse login." });

            var usuario = new Usuario
            {
                Nome = dto.Nome,
                UsuarioLogin = dto.UsuarioLogin,
                SenhaHash = _authService.HashPassword(dto.Senha),
                Role = dto.Perfil,
                Ativo = true
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            foreach (var setorId in dto.SetoresIds)
            {
                _context.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = usuario.Id, SetorId = setorId });
            }
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetUsuarios), new { id = usuario.Id }, new { usuario.Id, usuario.Nome });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarUsuario(int id, [FromBody] AtualizarUsuarioDto dto)
        {
            var usuario = await _context.Usuarios
                .Include(u => u.UsuarioSetores)
                .FirstOrDefaultAsync(u => u.Id == id);

            if (usuario == null) return NotFound();

            if (await _context.Usuarios.AnyAsync(u => u.UsuarioLogin == dto.UsuarioLogin && u.Id != id))
                return BadRequest(new { message = "Já existe um usuário com esse login." });

            usuario.Nome = dto.Nome;
            usuario.UsuarioLogin = dto.UsuarioLogin;
            usuario.Role = dto.Perfil;
            usuario.Ativo = dto.Ativo;

            if (!string.IsNullOrEmpty(dto.Senha))
                usuario.SenhaHash = _authService.HashPassword(dto.Senha);

            _context.UsuarioSetores.RemoveRange(usuario.UsuarioSetores);
            foreach (var setorId in dto.SetoresIds)
            {
                _context.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = usuario.Id, SetorId = setorId });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Usuário atualizado com sucesso." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ExcluirUsuario(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();

            _context.Usuarios.Remove(usuario);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Usuário excluído com sucesso." });
        }

        [HttpPut("{id}/toggle-ativo")]
        public async Task<IActionResult> ToggleAtivo(int id)
        {
            var usuario = await _context.Usuarios.FindAsync(id);
            if (usuario == null) return NotFound();

            usuario.Ativo = !usuario.Ativo;
            await _context.SaveChangesAsync();
            return Ok(new { ativo = usuario.Ativo });
        }
    }
}
