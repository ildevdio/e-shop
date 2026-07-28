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
                    .ThenInclude(e => e.EntregaPedidos)
                        .ThenInclude(ep => ep.Pedido)
                            .ThenInclude(p => p!.Cliente)
                .OrderByDescending(r => r.Data)
                .ToListAsync();

            return Ok(rotas);
        }

        [HttpGet("motoristas")]
        public async Task<IActionResult> GetMotoristas()
        {
            var motoristas = await _context.Usuarios
                .Where(u => u.Ativo && u.UsuarioSetores.Any(us => us.Setor!.Nome == "Entregas"))
                .Select(u => new { u.Id, u.Nome })
                .ToListAsync();

            return Ok(motoristas);
        }

        [HttpGet("pedidos-prontos")]
        public async Task<IActionResult> GetPedidosProntos()
        {
            var pedidos = await _context.Pedidos
                .Where(p => p.Status == "ProntoEntrega" && p.TipoEntrega == "Entrega"
                    && !_context.EntregasPedidos.Any(ep => ep.PedidoId == p.Id && ep.Entrega.Status != "Devolvido"))
                .Include(p => p.Cliente)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .OrderByDescending(p => p.Id)
                .ToListAsync();

            return Ok(pedidos);
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
                    Ordem = ordem++,
                    Status = "PendenteConferencia"
                };
                _context.Entregas.Add(entrega);

                var pedido = await _context.Pedidos.FindAsync(pedidoId);
                if (pedido != null)
                {
                    pedido.Status = "EmEntrega";
                    _context.EntregasPedidos.Add(new EntregaPedido { Entrega = entrega, PedidoId = pedidoId });
                }
            }

            await _context.SaveChangesAsync();

            var pedidos = await _context.Pedidos
                .Where(p => dto.PedidosIds.Contains(p.Id))
                .Include(p => p.Cliente)
                .ToListAsync();

            var enderecos = dto.PedidosIds
                .Select(id => pedidos.FirstOrDefault(p => p.Id == id))
                .Where(p => p?.Cliente != null)
                .Select(p =>
                    Uri.EscapeDataString(
                        string.Join(", ",
                            new[] {
                                p!.Cliente!.Logradouro,
                                p.Cliente.Numero,
                                p.Cliente.Bairro,
                                p.Cliente.Cidade
                            }.Where(s => !string.IsNullOrWhiteSpace(s))
                        )
                    )
                ).ToList();

            if (enderecos.Count > 0)
            {
                rota.LinkGoogleMaps = "https://www.google.com/maps/dir/" +
                    string.Join("/", enderecos) +
                    "/data=!3m1!4b1";
                await _context.SaveChangesAsync();
            }

            return Ok(new { mensagem = "Rota gerada com sucesso", rotaId = rota.Id });
        }

        [HttpGet("entregas/{id}")]
        public async Task<IActionResult> GetEntrega(int id)
        {
            var entrega = await _context.Entregas
                .Include(e => e.Rota)
                    .ThenInclude(r => r!.Motorista)
                .Include(e => e.Rota)
                    .ThenInclude(r => r!.Veiculo)
                .Include(e => e.EntregaPedidos)
                    .ThenInclude(ep => ep.Pedido)
                        .ThenInclude(p => p!.Cliente)
                .Include(e => e.EntregaPedidos)
                    .ThenInclude(ep => ep.Pedido)
                        .ThenInclude(p => p!.Itens)
                            .ThenInclude(i => i.Produto)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrega == null) return NotFound();
            return Ok(entrega);
        }

        [HttpPut("entregas/{id}")]
        public async Task<IActionResult> EditarEntrega(int id, [FromBody] EditarEntregaDto dto)
        {
            var entrega = await _context.Entregas
                .Include(e => e.EntregaPedidos)
                    .ThenInclude(ep => ep.Pedido)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrega == null) return NotFound();

            if (dto.Ordem.HasValue)
                entrega.Ordem = dto.Ordem.Value;

            if (dto.Observacao != null)
                entrega.Observacao = dto.Observacao;

            if (dto.Status != null && dto.Status != entrega.Status)
            {
                var transicoesValidas = new Dictionary<string, string[]>
                {
                    ["PendenteConferencia"] = ["EmConferencia", "EmRota", "Cancelada"],
                    ["EmConferencia"] = ["EmRota", "Cancelada"],
                    ["EmRota"] = ["Entregue", "Devolvido"],
                };

                if (transicoesValidas.TryGetValue(entrega.Status, out var proximos) && proximos.Contains(dto.Status))
                {
                    entrega.Status = dto.Status;

                    if (dto.Status == "Cancelada")
                        foreach (var epc in entrega.EntregaPedidos)
                            if (epc.Pedido != null) epc.Pedido.Status = "ProntoEntrega";
                    else if (dto.Status == "Entregue")
                        foreach (var epe in entrega.EntregaPedidos)
                            if (epe.Pedido != null) epe.Pedido.Status = "Entregue";
                    else if (dto.Status == "Devolvido")
                        foreach (var epd in entrega.EntregaPedidos)
                            if (epd.Pedido != null) epd.Pedido.Status = "Devolvido";
                }
                else
                {
                    return BadRequest(new { message = $"Transição de '{entrega.Status}' para '{dto.Status}' não é permitida." });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(entrega);
        }

        [HttpDelete("entregas/{id}")]
        public async Task<IActionResult> ExcluirEntrega(int id)
        {
            var entrega = await _context.Entregas
                .Include(e => e.EntregaPedidos)
                    .ThenInclude(ep => ep.Pedido)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (entrega == null) return NotFound();

            foreach (var ep in entrega.EntregaPedidos)
                if (ep.Pedido != null && entrega.Status != "Entregue")
                    ep.Pedido.Status = "ProntoEntrega";

            _context.Entregas.Remove(entrega);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Entrega excluída com sucesso." });
        }
    }
}
