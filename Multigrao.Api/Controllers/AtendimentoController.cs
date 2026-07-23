using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AtendimentoController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AtendimentoController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("contatos")]
        public async Task<IActionResult> GetContatos()
        {
            var contatos = await _context.Contatos
                .Include(c => c.Cliente)
                .OrderBy(c => c.Nome)
                .Select(c => new
                {
                    id = c.Id,
                    nome = c.Nome,
                    telefone = c.Telefone,
                    clienteId = c.ClienteId,
                    clienteNome = c.Cliente != null ? c.Cliente.RazaoSocialNome : null
                })
                .ToListAsync();

            return Ok(contatos);
        }

        [HttpPost]
        public async Task<IActionResult> CriarAtendimento([FromBody] CriarAtendimentoDto dto)
        {
            var conversa = new Conversa
            {
                Titulo = dto.Nome,
                DataCriacao = DateTime.UtcNow,
                Tipo = TipoConversa.Atendimento
            };
            _context.Conversas.Add(conversa);
            await _context.SaveChangesAsync();

            var atendimento = new AtendimentoLead
            {
                ConversaId = conversa.Id,
                Nome = dto.Nome,
                Telefone = dto.Telefone ?? string.Empty,
                Interesse = dto.Interesse ?? string.Empty,
                Origem = dto.Origem ?? "Manual",
                IAAtiva = true
            };
            _context.AtendimentoLeads.Add(atendimento);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = atendimento.Id.ToString(),
                lead = new
                {
                    nome = atendimento.Nome,
                    telefone = atendimento.Telefone,
                    interesse = atendimento.Interesse,
                    origem = atendimento.Origem,
                    vendaFechada = atendimento.VendaFechada,
                    resumoIA = atendimento.ResumoIA
                },
                iaActive = atendimento.IAAtiva,
                messages = Array.Empty<object>()
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAtendimentos()
        {
            var atendimentos = await _context.AtendimentoLeads
                .Include(a => a.Conversa)
                    .ThenInclude(c => c!.Mensagens)
                .OrderByDescending(a => a.Id)
                .ToListAsync();

            var response = atendimentos.Select(a => new
            {
                id = a.Id.ToString(),
                lead = new
                {
                    nome = a.Nome,
                    telefone = a.Telefone,
                    interesse = a.Interesse,
                    origem = a.Origem,
                    bairro = a.Bairro,
                    quantidade = a.Quantidade,
                    embalagem = a.Embalagem,
                    pagamento = a.Pagamento,
                    tipoCliente = a.TipoCliente,
                    resumoIA = a.ResumoIA,
                    vendaFechada = a.VendaFechada
                },
                iaActive = a.IAAtiva,
                messages = a.Conversa != null ? a.Conversa.Mensagens.OrderBy(m => m.DataEnvio).Select(m => new
                {
                    id = m.Id.ToString(),
                    text = m.Texto,
                    sender = m.UrlAnexo == "bot" ? "bot" : m.UrlAnexo == "user" ? "user" : "agent",
                    timestamp = m.DataEnvio
                }) : null
            });

            return Ok(response);
        }

        [HttpPost("{id}/mensagens")]
        public async Task<IActionResult> EnviarMensagem(int id, [FromBody] NovaMensagemDto dto)
        {
            var atendimento = await _context.AtendimentoLeads
                .Include(a => a.Conversa)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (atendimento == null || atendimento.Conversa == null)
                return NotFound();

            var mensagem = new Mensagem
            {
                ConversaId = atendimento.Conversa.Id,
                Texto = dto.Text,
                DataEnvio = DateTime.UtcNow,
                UrlAnexo = dto.Sender == "bot" ? "bot" : (dto.Sender == "user" ? "user" : "")
            };

            if (dto.Sender == "agent")
            {
                atendimento.IAAtiva = false;
            }

            _context.Mensagens.Add(mensagem);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = mensagem.Id.ToString(),
                text = mensagem.Texto,
                sender = dto.Sender,
                timestamp = mensagem.DataEnvio
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarLead(int id, [FromBody] LeadUpdateDto dto)
        {
            var atendimento = await _context.AtendimentoLeads.FindAsync(id);
            if (atendimento == null) return NotFound();

            if (dto.Nome != null) atendimento.Nome = dto.Nome;
            if (dto.Telefone != null) atendimento.Telefone = dto.Telefone;
            if (dto.Bairro != null) atendimento.Bairro = dto.Bairro;
            if (dto.Interesse != null) atendimento.Interesse = dto.Interesse;
            if (dto.Quantidade != null) atendimento.Quantidade = dto.Quantidade;
            if (dto.Embalagem != null) atendimento.Embalagem = dto.Embalagem;
            if (dto.Pagamento != null) atendimento.Pagamento = dto.Pagamento;
            if (dto.TipoCliente != null) atendimento.TipoCliente = dto.TipoCliente;
            if (dto.IAAtiva.HasValue) atendimento.IAAtiva = dto.IAAtiva.Value;

            await _context.SaveChangesAsync();
            return Ok(atendimento);
        }

        [HttpPost("{id}/ia-resumo")]
        public async Task<IActionResult> GerarResumoIa(int id)
        {
            var atendimento = await _context.AtendimentoLeads
                .Include(a => a.Conversa)
                    .ThenInclude(c => c!.Mensagens)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (atendimento == null) return NotFound();

            var textoConversa = string.Join(" ", atendimento.Conversa?.Mensagens.Select(m => m.Texto) ?? Array.Empty<string>());

            string resumo;
            if (textoConversa.ToLower().Contains("castanha") || textoConversa.ToLower().Contains("chia"))
            {
                resumo = $"RESUMO IA:\n- Cliente: {atendimento.Nome}\n- Interesse: {atendimento.Interesse}\n- Bairro: {atendimento.Bairro}\n- Pedido pendente de aprovação.";
            }
            else
            {
                resumo = $"RESUMO IA:\n- Cliente: {atendimento.Nome}\n- Histórico curto ou dados insuficientes.";
            }

            atendimento.ResumoIA = resumo;
            await _context.SaveChangesAsync();

            return Ok(new { resumoIA = resumo });
        }

        [HttpPost("{id}/finalizar")]
        public async Task<IActionResult> FinalizarAtendimento(int id)
        {
            var atendimento = await _context.AtendimentoLeads.FindAsync(id);
            if (atendimento == null) return NotFound();

            atendimento.VendaFechada = true;
            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Atendimento finalizado." });
        }
    }
}
