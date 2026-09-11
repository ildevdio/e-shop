using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BotsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BotsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetBots()
        {
            var bots = await _context.BotsConfig
                .OrderBy(b => b.Ordem)
                .ThenBy(b => b.Id)
                .Select(b => new
                {
                    id = b.Id,
                    nome = b.Nome,
                    tipoTrigger = b.TipoTrigger,
                    valorTrigger = b.ValorTrigger,
                    tipoReacao = b.TipoReacao,
                    textoResposta = b.TextoResposta,
                    acaoBot = b.AcaoBot,
                    campoLead = b.CampoLead,
                    ordem = b.Ordem,
                    ativo = b.Ativo
                })
                .ToListAsync();

            return Ok(bots);
        }

        [HttpPost]
        public async Task<IActionResult> CriarBot([FromBody] BotConfigDto dto)
        {
            var bot = new BotConfig
            {
                Nome = dto.Nome,
                TipoTrigger = string.IsNullOrWhiteSpace(dto.TipoTrigger) ? "PalavraChave" : dto.TipoTrigger,
                ValorTrigger = dto.ValorTrigger ?? string.Empty,
                TipoReacao = string.IsNullOrWhiteSpace(dto.TipoReacao) ? "Texto" : dto.TipoReacao,
                TextoResposta = dto.TextoResposta ?? string.Empty,
                AcaoBot = string.IsNullOrWhiteSpace(dto.AcaoBot) ? "Responder" : dto.AcaoBot,
                CampoLead = dto.CampoLead,
                Ordem = dto.Ordem,
                Ativo = dto.Ativo
            };

            _context.BotsConfig.Add(bot);
            await _context.SaveChangesAsync();

            return Ok(new { id = bot.Id, mensagem = "Bot criado com sucesso." });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarBot(int id, [FromBody] BotConfigDto dto)
        {
            var bot = await _context.BotsConfig.FindAsync(id);
            if (bot == null) return NotFound();

            bot.Nome = dto.Nome;
            bot.TipoTrigger = string.IsNullOrWhiteSpace(dto.TipoTrigger) ? bot.TipoTrigger : dto.TipoTrigger;
            bot.ValorTrigger = dto.ValorTrigger ?? string.Empty;
            bot.TipoReacao = string.IsNullOrWhiteSpace(dto.TipoReacao) ? bot.TipoReacao : dto.TipoReacao;
            bot.TextoResposta = dto.TextoResposta ?? string.Empty;
            bot.AcaoBot = string.IsNullOrWhiteSpace(dto.AcaoBot) ? bot.AcaoBot : dto.AcaoBot;
            bot.CampoLead = dto.CampoLead;
            bot.Ordem = dto.Ordem;
            bot.Ativo = dto.Ativo;

            await _context.SaveChangesAsync();
            return Ok(new { mensagem = "Bot atualizado com sucesso." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> ExcluirBot(int id)
        {
            var bot = await _context.BotsConfig.FindAsync(id);
            if (bot == null) return NotFound();

            _context.BotsConfig.Remove(bot);
            await _context.SaveChangesAsync();
            return Ok(new { mensagem = "Bot excluído com sucesso." });
        }
    }
}
