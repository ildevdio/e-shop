using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MotoristaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MotoristaController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("minhas-entregas")]
        public async Task<IActionResult> GetMinhasEntregas([FromQuery] int motoristaId)
        {
            var rotas = await _context.Rotas
                .Where(r => r.MotoristaId == motoristaId && r.Data.Date == DateTime.UtcNow.Date)
                .Include(r => r.Veiculo)
                .Include(r => r.Entregas)
                    .ThenInclude(e => e.Pedido)
                        .ThenInclude(p => p!.Cliente)
                .ToListAsync();

            return Ok(rotas);
        }

        [HttpGet("entregas")]
        public async Task<IActionResult> GetEntregas([FromQuery] int? motoristaId = null)
        {
            var query = _context.Entregas
                .Include(e => e.Rota)
                    .ThenInclude(r => r!.Motorista)
                .Include(e => e.Pedido)
                    .ThenInclude(p => p!.Cliente)
                .AsQueryable();

            if (motoristaId.HasValue)
                query = query.Where(e => e.Rota!.MotoristaId == motoristaId.Value);

            var entregas = await query
                .OrderByDescending(e => e.Id)
                .ToListAsync();

            return Ok(entregas);
        }

        [HttpPut("entrega/{entregaId}/registrar")]
        public async Task<IActionResult> RegistrarAcaoEntrega(int entregaId, [FromBody] RegistroEntregaDto dto)
        {
            var entrega = await _context.Entregas
                .Include(e => e.Pedido)
                .FirstOrDefaultAsync(e => e.Id == entregaId);

            if (entrega == null) return NotFound();

            switch (dto.Acao)
            {
                case "Entregue":
                    entrega.Status = "Entregue";
                    entrega.Observacao = dto.Observacao ?? string.Empty;
                    if (entrega.Pedido != null)
                        entrega.Pedido.Status = "Entregue";
                    break;

                case "Devolvido":
                    entrega.Status = "Devolvido";
                    entrega.MotivoDevolucao = dto.MotivoDevolucao ?? string.Empty;
                    entrega.Observacao = dto.Observacao ?? string.Empty;
                    if (entrega.Pedido != null)
                        entrega.Pedido.Status = "Devolvido";
                    break;

                case "EmRota":
                    entrega.Status = "EmRota";
                    if (entrega.Pedido != null)
                        entrega.Pedido.Status = "EmEntrega";
                    break;

                default:
                    return BadRequest(new { message = "Ação inválida. Use: Entregue, Devolvido ou EmRota." });
            }

            await _context.SaveChangesAsync();
            return Ok(new { status = entrega.Status });
        }
    }
}
