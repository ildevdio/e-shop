using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AvisosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AvisosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAvisos([FromQuery] int? setorId = null)
        {
            var query = _context.Avisos
                .Include(a => a.Autor)
                .Include(a => a.SetorAlvo)
                .AsQueryable();

            if (setorId.HasValue)
                query = query.Where(a => a.SetorAlvoId == setorId || a.SetorAlvoId == null);

            var avisos = await query
                .OrderByDescending(a => a.DataPublicacao)
                .Take(50)
                .Select(a => new
                {
                    id = a.Id,
                    titulo = a.Titulo,
                    conteudo = a.Conteudo,
                    dataPublicacao = a.DataPublicacao,
                    tipo = a.SetorAlvo != null ? "comunicado" : "aviso",
                    setorAlvo = a.SetorAlvo != null ? a.SetorAlvo.Nome : null,
                    autorNome = a.Autor != null ? a.Autor.Nome : "Sistema"
                })
                .ToListAsync();

            return Ok(avisos);
        }

        [HttpPost]
        public async Task<IActionResult> CriarAviso([FromBody] CriarAvisoDto dto)
        {
            var aviso = new Aviso
            {
                Titulo = dto.Titulo,
                Conteudo = dto.Conteudo,
                AutorId = dto.AutorId,
                SetorAlvoId = dto.SetorAlvoId,
                DataPublicacao = DateTime.UtcNow
            };

            _context.Avisos.Add(aviso);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = aviso.Id,
                titulo = aviso.Titulo,
                conteudo = aviso.Conteudo,
                dataPublicacao = aviso.DataPublicacao
            });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ExcluirAviso(int id)
        {
            var aviso = await _context.Avisos.FindAsync(id);
            if (aviso == null) return NotFound();

            _context.Avisos.Remove(aviso);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Aviso excluído com sucesso." });
        }
    }
}
