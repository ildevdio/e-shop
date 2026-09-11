using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Data;
using FocusEshop.Api.DTOs;
using FocusEshop.Api.Models;
using FocusEshop.Api.Services;

namespace FocusEshop.Api.Controllers
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
                .ToListAsync();

            var ids = usuarios.Select(u => u.Id).ToList();
            var vinculos = await _context.UsuariosEmpresas
                .IgnoreQueryFilters()
                .Where(ue => ids.Contains(ue.UsuarioId))
                .Join(_context.ConfiguracoesSistema.IgnoreQueryFilters(),
                    ue => ue.EmpresaId,
                    c => c.Id,
                    (ue, c) => new { ue.UsuarioId, EmpresaId = c.Id, c.NomeEmpresa, c.Slug })
                .ToListAsync();

            var response = usuarios.Select(u => new UsuarioResponseDto
            {
                Id = u.Id,
                Nome = u.Nome,
                UsuarioLogin = u.UsuarioLogin,
                Perfil = u.Role,
                Ativo = u.Ativo,
                Setores = u.UsuarioSetores.Select(us => us.Setor!.Nome).ToList(),
                Empresas = vinculos
                    .Where(v => v.UsuarioId == u.Id)
                    .Select(v => new EmpresaResumoDto { Id = v.EmpresaId, NomeEmpresa = v.NomeEmpresa, Slug = v.Slug })
                    .ToList()
            }).ToList();

            return Ok(response);
        }

        [HttpGet("vendedores")]
        public async Task<IActionResult> GetVendedores()
        {
            var vendedores = await _context.Usuarios
                .Include(u => u.UsuarioSetores)
                    .ThenInclude(us => us.Setor)
                .Where(u => u.Ativo && u.UsuarioSetores.Any(us => us.Setor!.Nome == "Vendedor"))
                .OrderBy(u => u.Nome)
                .Select(u => new { u.Id, u.Nome })
                .ToListAsync();

            return Ok(vendedores);
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

            await AdicionarVinculosEmpresasAsync(usuario.Id, usuario.EmpresaId, dto.EmpresasIds);
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

            var vinculosAtuais = await _context.UsuariosEmpresas
                .IgnoreQueryFilters()
                .Where(ue => ue.UsuarioId == id)
                .ToListAsync();
            _context.UsuariosEmpresas.RemoveRange(vinculosAtuais);
            await AdicionarVinculosEmpresasAsync(usuario.Id, usuario.EmpresaId, dto.EmpresasIds);

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

        private async Task AdicionarVinculosEmpresasAsync(int usuarioId, int empresaPrincipalId, List<int> empresasIds)
        {
            var ids = empresasIds
                .Where(i => i > 0)
                .Distinct()
                .ToList();

            var existentes = await _context.ConfiguracoesSistema
                .IgnoreQueryFilters()
                .Where(c => ids.Contains(c.Id))
                .Select(c => c.Id)
                .ToListAsync();

            foreach (var empresaId in existentes.Append(empresaPrincipalId).Distinct())
            {
                _context.UsuariosEmpresas.Add(new UsuarioEmpresa { UsuarioId = usuarioId, EmpresaId = empresaId });
            }
        }
    }
}
