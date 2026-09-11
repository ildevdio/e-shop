using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Hubs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConversasController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<AppHub> _hubContext;

        public ConversasController(AppDbContext context, IHubContext<AppHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        [HttpGet]
        public async Task<IActionResult> GetConversas()
        {
            var conversas = await _context.Conversas
                .Include(c => c.Mensagens)
                    .ThenInclude(m => m.UsuarioRemetente)
                .Include(c => c.Cliente)
                .OrderByDescending(c => c.Mensagens.Max(m => (DateTime?)m.DataEnvio) ?? c.DataCriacao)
                .Select(c => new
                {
                    id = c.Id,
                    titulo = c.Titulo,
                    dataCriacao = c.DataCriacao,
                    cliente = c.Cliente != null ? c.Cliente.RazaoSocialNome : null,
                    totalMensagens = c.Mensagens.Count,
                    ultimaMensagem = c.Mensagens.OrderByDescending(m => m.DataEnvio).FirstOrDefault() != null
                        ? new
                        {
                            texto = c.Mensagens.OrderByDescending(m => m.DataEnvio).First().Texto,
                            remetente = c.Mensagens.OrderByDescending(m => m.DataEnvio).First().UsuarioRemetente != null
                                ? c.Mensagens.OrderByDescending(m => m.DataEnvio).First().UsuarioRemetente!.Nome
                                : "Anônimo",
                            dataEnvio = c.Mensagens.OrderByDescending(m => m.DataEnvio).First().DataEnvio
                        }
                        : null
                })
                .ToListAsync();

            return Ok(conversas);
        }

        [HttpGet("{id}/mensagens")]
        public async Task<IActionResult> GetMensagens(int id)
        {
            var conversa = await _context.Conversas.FindAsync(id);
            if (conversa == null) return NotFound();

            var mensagens = await _context.Mensagens
                .Include(m => m.UsuarioRemetente)
                .Where(m => m.ConversaId == id)
                .OrderBy(m => m.DataEnvio)
                .Select(m => new
                {
                    id = m.Id,
                    texto = m.Texto,
                    urlAnexo = m.UrlAnexo,
                    dataEnvio = m.DataEnvio,
                    dataVisualizacao = m.DataVisualizacao,
                    remetenteNome = m.UsuarioRemetente != null ? m.UsuarioRemetente.Nome : "Anônimo",
                    remetenteId = m.UsuarioRemetenteId
                })
                .ToListAsync();

            return Ok(mensagens);
        }

        [HttpPost]
        public async Task<IActionResult> CriarConversa([FromBody] CriarConversaDto dto)
        {
            var conversa = new Conversa
            {
                Titulo = dto.Titulo,
                ClienteId = dto.ClienteId,
                DataCriacao = DateTime.UtcNow
            };

            _context.Conversas.Add(conversa);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetConversas), new { id = conversa.Id }, new { conversa.Id, conversa.Titulo });
        }

        [HttpPost("{id}/visualizar")]
        public async Task<IActionResult> VisualizarMensagens(int id, [FromBody] VisualizarMensagensDto dto)
        {
            var naoLidas = await _context.Mensagens
                .Where(m => m.ConversaId == id && m.UsuarioRemetenteId != dto.UsuarioId && m.DataVisualizacao == null)
                .ToListAsync();

            if (naoLidas.Count == 0) return Ok(new { visualizadas = 0 });

            var agora = DateTime.UtcNow;
            foreach (var m in naoLidas)
                m.DataVisualizacao = agora;

            await _context.SaveChangesAsync();

            await _hubContext.Clients.All.SendAsync("MensagensVisualizadas", new
            {
                conversaId = id,
                dataVisualizacao = agora,
                mensagensIds = naoLidas.Select(m => m.Id).ToList()
            });

            return Ok(new { visualizadas = naoLidas.Count });
        }

        [HttpPost("{id}/mensagens")]
        public async Task<IActionResult> EnviarMensagem(int id, [FromBody] EnviarMensagemInternaDto dto)
        {
            var conversa = await _context.Conversas.FindAsync(id);
            if (conversa == null) return NotFound();

            var mensagem = new Mensagem
            {
                ConversaId = id,
                UsuarioRemetenteId = dto.UsuarioRemetenteId,
                Texto = dto.Texto,
                UrlAnexo = dto.UrlAnexo ?? string.Empty,
                DataEnvio = DateTime.UtcNow
            };

            _context.Mensagens.Add(mensagem);
            await _context.SaveChangesAsync();

            var remetente = await _context.Usuarios.FindAsync(dto.UsuarioRemetenteId);
            var remetenteNome = remetente?.Nome ?? "Anônimo";

            await _hubContext.Clients.All.SendAsync("ReceberMensagemInterna", new
            {
                id = mensagem.Id,
                texto = mensagem.Texto,
                dataEnvio = mensagem.DataEnvio,
                dataVisualizacao = (DateTime?)null,
                remetente = remetenteNome,
                remetenteId = dto.UsuarioRemetenteId,
                conversaId = id
            });

            return Ok(new
            {
                id = mensagem.Id,
                texto = mensagem.Texto,
                dataEnvio = mensagem.DataEnvio
            });
        }
    }
}
