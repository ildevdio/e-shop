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
                    dataVisualizacao = m.DataVisualizacao,
                    remetente = m.UsuarioRemetente != null ? m.UsuarioRemetente.Nome : "Anônimo",
                    remetenteId = m.UsuarioRemetenteId,
                    conversaId = m.ConversaId
                })
                .ToListAsync();

            mensagens.Reverse();

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

        [HttpGet("chat/conversa/canal/{setorId}")]
        public async Task<IActionResult> GetOuCriarConversaCanal(int setorId)
        {
            var setor = await _context.Setores.FindAsync(setorId);
            if (setor == null) return NotFound(new { message = "Setor não encontrado." });

            var titulo = $"_canal:{setorId}";
            var conversa = await _context.Conversas
                .FirstOrDefaultAsync(c => c.Titulo == titulo && c.Tipo == TipoConversa.ChatInterno);

            if (conversa == null)
            {
                conversa = new Conversa
                {
                    Titulo = titulo,
                    DataCriacao = DateTime.UtcNow,
                    Tipo = TipoConversa.ChatInterno
                };
                _context.Conversas.Add(conversa);
                await _context.SaveChangesAsync();
            }

            return Ok(new { id = conversa.Id, titulo = setor.Nome });
        }

        [HttpGet("chat/conversa/direto")]
        public async Task<IActionResult> GetOuCriarConversaDireta([FromQuery] int usuario1Id, [FromQuery] int usuario2Id)
        {
            if (usuario1Id == usuario2Id)
                return BadRequest(new { message = "Não é possível criar conversa consigo mesmo." });

            var menor = Math.Min(usuario1Id, usuario2Id);
            var maior = Math.Max(usuario1Id, usuario2Id);
            var titulo = $"_direto:{menor}-{maior}";

            var conversa = await _context.Conversas
                .FirstOrDefaultAsync(c => c.Titulo == titulo && c.Tipo == TipoConversa.ChatInterno);

            if (conversa == null)
            {
                var usuario1 = await _context.Usuarios.FindAsync(usuario1Id);
                var usuario2 = await _context.Usuarios.FindAsync(usuario2Id);
                if (usuario1 == null || usuario2 == null)
                    return NotFound(new { message = "Usuário não encontrado." });

                conversa = new Conversa
                {
                    Titulo = titulo,
                    DataCriacao = DateTime.UtcNow,
                    Tipo = TipoConversa.ChatInterno
                };
                _context.Conversas.Add(conversa);
                await _context.SaveChangesAsync();
            }

            return Ok(new { id = conversa.Id, titulo = "Conversa Direta" });
        }

        [HttpGet("chat/conversas")]
        public async Task<IActionResult> GetConversasInternas()
        {
            var conversas = await _context.Conversas
                .Where(c => c.Tipo == TipoConversa.ChatInterno)
                .Select(c => new
                {
                    id = c.Id,
                    titulo = c.Titulo,
                    totalMensagens = c.Mensagens.Count,
                    ultimaMensagem = c.Mensagens.OrderByDescending(m => m.DataEnvio).Select(m => m.Texto).FirstOrDefault()
                })
                .ToListAsync();

            return Ok(conversas);
        }
    }
}
