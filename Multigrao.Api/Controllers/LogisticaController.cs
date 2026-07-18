using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogisticaController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LogisticaController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("veiculos")]
        public async Task<IActionResult> GetVeiculos()
        {
            var veiculos = await _context.Veiculos.ToListAsync();
            return Ok(veiculos);
        }

        [HttpPost("veiculos")]
        public async Task<IActionResult> CreateVeiculo([FromBody] CriarVeiculoDto dto)
        {
            var veiculo = new Veiculo
            {
                Modelo = dto.Modelo,
                Placa = dto.Placa,
                PesoMaximo = dto.PesoMaximo
            };

            _context.Veiculos.Add(veiculo);
            await _context.SaveChangesAsync();
            return Ok(veiculo);
        }

        [HttpDelete("veiculos/{id}")]
        public async Task<IActionResult> ExcluirVeiculo(int id)
        {
            var veiculo = await _context.Veiculos.FindAsync(id);
            if (veiculo == null) return NotFound();

            _context.Veiculos.Remove(veiculo);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Veículo excluído com sucesso." });
        }

        [HttpGet("rotas")]
        public async Task<IActionResult> GetRotas()
        {
            var rotas = await _context.Rotas
                .Include(r => r.Veiculo)
                .Include(r => r.Motorista)
                .Include(r => r.Entregas)
                    .ThenInclude(e => e.Pedido)
                        .ThenInclude(p => p!.Cliente)
                .OrderByDescending(r => r.Data)
                .ToListAsync();

            return Ok(rotas);
        }

        [HttpPost("rotas/gerar")]
        public async Task<IActionResult> GerarRota([FromBody] GerarRotaDto dto)
        {
            var veiculo = await _context.Veiculos.FindAsync(dto.VeiculoId);
            if (veiculo == null) return BadRequest(new { message = "Veículo não encontrado." });

            var motorista = await _context.Usuarios.FindAsync(dto.MotoristaId);
            if (motorista == null) return BadRequest(new { message = "Motorista não encontrado." });

            var rota = new Rota
            {
                Data = DateTime.UtcNow,
                VeiculoId = dto.VeiculoId,
                MotoristaId = dto.MotoristaId,
                Status = "Criada"
            };

            _context.Rotas.Add(rota);
            await _context.SaveChangesAsync();

            int ordem = 1;
            foreach (var pedidoId in dto.PedidosIds)
            {
                var entrega = new Entrega
                {
                    RotaId = rota.Id,
                    PedidoId = pedidoId,
                    Ordem = ordem++,
                    Status = "PendenteConferencia"
                };
                _context.Entregas.Add(entrega);
            }

            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Rota gerada com sucesso", rotaId = rota.Id });
        }
    }
}
