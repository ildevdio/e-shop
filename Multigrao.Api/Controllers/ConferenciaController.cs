using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConferenciaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ConferenciaController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("pendentes")]
        public async Task<IActionResult> GetEntregasPendentes()
        {
            var entregas = await _context.Entregas
                .Where(e => e.Status == "PendenteConferencia" || e.Status == "EmConferencia")
                .Include(e => e.Pedido)
                    .ThenInclude(p => p!.Cliente)
                .Include(e => e.Pedido)
                    .ThenInclude(p => p!.Itens)
                        .ThenInclude(i => i.Produto)
                .Include(e => e.Rota)
                    .ThenInclude(r => r!.Motorista)
                .OrderBy(e => e.Ordem)
                .ToListAsync();

            return Ok(entregas);
        }

        [HttpPut("{entregaId}/iniciar")]
        public async Task<IActionResult> IniciarConferencia(int entregaId)
        {
            var entrega = await _context.Entregas.FindAsync(entregaId);
            if (entrega == null) return NotFound();

            if (entrega.Status != "PendenteConferencia")
                return BadRequest(new { message = "A entrega não está pendente de conferência." });

            entrega.Status = "EmConferencia";
            await _context.SaveChangesAsync();

            return Ok(new { status = entrega.Status });
        }

        [HttpPut("{entregaId}/concluir")]
        public async Task<IActionResult> ConcluirConferencia(int entregaId)
        {
            var entrega = await _context.Entregas
                .Include(e => e.Pedido)
                .FirstOrDefaultAsync(e => e.Id == entregaId);

            if (entrega == null) return NotFound();

            if (entrega.Status != "EmConferencia")
                return BadRequest(new { message = "A entrega precisa estar em conferência." });

            entrega.Status = "Conferido";

            if (entrega.Pedido != null)
                entrega.Pedido.Status = "ProntoEntrega";

            await _context.SaveChangesAsync();

            return Ok(new { status = entrega.Status });
        }
    }
}
