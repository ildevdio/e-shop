using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificacoesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificacoesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetNotificacoes(
            [FromQuery] int? usuarioId,
            [FromQuery] string? setor,
            [FromQuery] bool? lidas)
        {
            var query = _context.Notificacoes.AsQueryable();

            if (usuarioId.HasValue)
                query = query.Where(n => n.UsuarioDestinoId == usuarioId || n.UsuarioDestinoId == null);

            if (!string.IsNullOrEmpty(setor))
                query = query.Where(n => n.SetorAlvo == null || n.SetorAlvo == setor);

            if (lidas.HasValue)
                query = query.Where(n => n.Lida == lidas.Value);

            var notificacoes = await query
                .OrderByDescending(n => n.CriadaEm)
                .Take(50)
                .ToListAsync();

            return Ok(notificacoes);
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetCount(
            [FromQuery] int? usuarioId,
            [FromQuery] string? setor)
        {
            var query = _context.Notificacoes.Where(n => !n.Lida);

            if (usuarioId.HasValue)
                query = query.Where(n => n.UsuarioDestinoId == usuarioId || n.UsuarioDestinoId == null);

            if (!string.IsNullOrEmpty(setor))
                query = query.Where(n => n.SetorAlvo == null || n.SetorAlvo == setor);

            var count = await query.CountAsync();
            return Ok(new { count });
        }

        [HttpPut("{id}/lida")]
        public async Task<IActionResult> MarcarLida(int id)
        {
            var notificacao = await _context.Notificacoes.FindAsync(id);
            if (notificacao == null) return NotFound();

            notificacao.Lida = true;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("lidas-todas")]
        public async Task<IActionResult> MarcarTodasLidas(
            [FromQuery] int? usuarioId,
            [FromQuery] string? setor)
        {
            var query = _context.Notificacoes.Where(n => !n.Lida);

            if (usuarioId.HasValue)
                query = query.Where(n => n.UsuarioDestinoId == usuarioId || n.UsuarioDestinoId == null);

            if (!string.IsNullOrEmpty(setor))
                query = query.Where(n => n.SetorAlvo == null || n.SetorAlvo == setor);

            await query.ExecuteUpdateAsync(s => s.SetProperty(n => n.Lida, true));
            return NoContent();
        }

        [HttpPost]
        public async Task<IActionResult> CriarNotificacao([FromBody] Notificacao notificacao)
        {
            notificacao.CriadaEm = DateTime.UtcNow;
            _context.Notificacoes.Add(notificacao);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetNotificacoes), new { id = notificacao.Id }, notificacao);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ExcluirNotificacao(int id)
        {
            var notificacao = await _context.Notificacoes.FindAsync(id);
            if (notificacao == null) return NotFound();

            _context.Notificacoes.Remove(notificacao);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
