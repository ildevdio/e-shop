using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ComunicacaoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ComunicacaoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("avisos")]
        public async Task<IActionResult> GetAvisos()
        {
            var avisos = await _context.Avisos
                .Include(a => a.Autor)
                .Include(a => a.SetorAlvo)
                .OrderByDescending(a => a.DataPublicacao)
                .Take(20)
                .Select(a => new
                {
                    id = a.Id,
                    titulo = a.Titulo,
                    conteudo = a.Conteudo,
                    dataPublicacao = a.DataPublicacao,
                    autorNome = a.Autor != null ? a.Autor.Nome : "Sistema",
                    setorAlvo = a.SetorAlvo != null ? a.SetorAlvo.Nome : null
                })
                .ToListAsync();

            return Ok(avisos);
        }

        [HttpGet("chat/mensagens")]
        public async Task<IActionResult> GetHistoricoChat([FromQuery] int? conversaId = null)
        {
            var query = _context.Mensagens
                .Include(m => m.UsuarioRemetente)
                .Include(m => m.Conversa)
                .Where(m => m.Conversa != null && m.Conversa.Tipo == TipoConversa.ChatInterno)
                .AsQueryable();

            if (conversaId.HasValue)
                query = query.Where(m => m.ConversaId == conversaId.Value);

            var mensagens = await query
                .OrderByDescending(m => m.DataEnvio)
                .Take(50)
                .Select(m => new
                {
                    id = m.Id,
                    texto = m.Texto,
                    dataEnvio = m.DataEnvio,
                    remetente = m.UsuarioRemetente != null ? m.UsuarioRemetente.Nome : "Anônimo",
                    remetenteId = m.UsuarioRemetenteId,
                    conversaId = m.ConversaId
                })
                .ToListAsync();

            return Ok(mensagens);
        }

        [HttpGet("canais")]
        public async Task<IActionResult> GetCanais()
        {
            var canais = await _context.Setores
                .Select(s => new { id = s.Id, nome = s.Nome })
                .ToListAsync();

            return Ok(canais);
        }
    }
}
