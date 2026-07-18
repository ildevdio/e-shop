using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PedidosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPedidos()
        {
            var pedidos = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.SeparadoPorUsuario)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.SeparadoPorUsuario)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();
            return Ok(pedido);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePedido([FromBody] CriarPedidoDto dto)
        {
            var cliente = await _context.Clientes.FindAsync(dto.ClienteId);
            if (cliente == null) return BadRequest(new { message = "Cliente não encontrado." });

            var pedido = new Pedido
            {
                ClienteId = dto.ClienteId,
                Status = "Pendente",
                ValorTotal = dto.ValorTotal,
                PesoTotal = dto.PesoTotal,
                DataCriacao = DateTime.UtcNow
            };

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            foreach (var item in dto.Itens)
            {
                var itemPedido = new ItemPedido
                {
                    PedidoId = pedido.Id,
                    ProdutoId = item.ProdutoId,
                    Quantidade = item.Quantidade,
                    PrecoUnitario = item.PrecoUnitario,
                    Status = "Pendente"
                };
                _context.ItensPedido.Add(itemPedido);
            }

            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
        }

        [HttpPut("{id}/separar")]
        public async Task<IActionResult> IniciarSeparacao(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();

            if (pedido.Status != "Pendente")
                return BadRequest("O pedido não está no estado Pendente.");

            pedido.Status = "EmSeparacao";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/concluir-separacao")]
        public async Task<IActionResult> ConcluirSeparacao(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Itens)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();
            if (pedido.Status != "EmSeparacao")
                return BadRequest("O pedido precisa estar em separação.");

            var todosSeparados = pedido.Itens.All(i => i.Separado);
            if (!todosSeparados)
                return BadRequest("Nem todos os itens foram separados.");

            pedido.Status = "ProntoEntrega";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/itens/{itemId}/separar")]
        public async Task<IActionResult> SepararItem(int id, int itemId, [FromBody] SepararItemDto dto)
        {
            var item = await _context.ItensPedido
                .FirstOrDefaultAsync(i => i.Id == itemId && i.PedidoId == id);

            if (item == null) return NotFound();

            item.Separado = !item.Separado;
            item.SeparadoPorUsuarioId = item.Separado ? dto.UsuarioId : null;
            item.Status = item.Separado ? "Separado" : "Pendente";

            await _context.SaveChangesAsync();
            return Ok(new { separado = item.Separado, separadoPor = item.SeparadoPorUsuarioId });
        }
    }
}
