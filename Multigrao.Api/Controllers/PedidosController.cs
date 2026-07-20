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

            var pedido = await CriarPedido(dto.ClienteId, null, null, dto.ValorTotal, dto.Itens, dto.TipoEntrega, dto.Desconto, dto.Acrescimo);
            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
        }

        [HttpPost("solicitacao-catalogo")]
        public async Task<IActionResult> SolicitacaoCatalogo([FromBody] SolicitacaoCatalogoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SolicitanteNome))
                return BadRequest(new { message = "Nome do solicitante é obrigatório." });
            if (string.IsNullOrWhiteSpace(dto.CpfCnpj))
                return BadRequest(new { message = "CPF/CNPJ é obrigatório." });

            // Buscar cliente pelo CPF/CNPJ
            var limpo = new string(dto.CpfCnpj.Where(char.IsDigit).ToArray());
            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim() == limpo);

            int? clienteId = cliente?.Id;
            bool enderecoConfere = false;

            if (cliente != null)
            {
                enderecoConfere =
                    (cliente.Cep ?? "") == (dto.Cep ?? "") &&
                    (cliente.Logradouro ?? "") == (dto.Logradouro ?? "") &&
                    (cliente.Numero ?? "") == (dto.Numero ?? "") &&
                    (cliente.Bairro ?? "") == (dto.Bairro ?? "") &&
                    (cliente.Cidade ?? "") == (dto.Cidade ?? "") &&
                    (cliente.Estado ?? "") == (dto.Estado ?? "");
            }

            var pedido = await CriarPedido(
                clienteId,
                dto.SolicitanteNome,
                dto.SolicitanteTelefone,
                dto.ValorTotal,
                dto.Itens,
                dto.TipoEntrega,
                dto.Desconto,
                dto.Acrescimo,
                dto.CpfCnpj,
                dto.Cep,
                dto.Logradouro,
                dto.Numero,
                dto.Complemento,
                dto.Bairro,
                dto.Cidade,
                dto.Estado,
                enderecoConfere,
                status: "AguardandoConfirmacao"
            );
            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
        }

        [HttpPut("{id}/confirmar-pedido")]
        public async Task<IActionResult> ConfirmarPedido(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.Status != "AguardandoConfirmacao")
                return BadRequest("O pedido precisa estar como 'Aguardando Confirmação'.");

            pedido.Status = "Pendente";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private async Task<Pedido> CriarPedido(
            int? clienteId,
            string? solicitanteNome,
            string? solicitanteTelefone,
            decimal valorTotal,
            List<CriarItemPedidoDto> itensDto,
            string tipoEntrega = "Entrega",
            decimal desconto = 0,
            decimal acrescimo = 0,
            string? cpfCnpj = null,
            string? cep = null,
            string? logradouro = null,
            string? numero = null,
            string? complemento = null,
            string? bairro = null,
            string? cidade = null,
            string? estado = null,
            bool enderecoConfere = false,
            string status = "Pendente"
        )
        {
            var itens = new List<ItemPedido>();
            decimal pesoTotal = 0;

            foreach (var item in itensDto)
            {
                var produto = await _context.Produtos.FindAsync(item.ProdutoId);
                var pesoUnitario = item.PesoUnitario > 0 ? item.PesoUnitario : (produto?.PesoUnidade ?? 0);
                var itemPedido = new ItemPedido
                {
                    ProdutoId = item.ProdutoId,
                    Quantidade = item.Quantidade,
                    PrecoUnitario = item.PrecoUnitario,
                    PesoUnitario = pesoUnitario,
                    Status = "Pendente"
                };

                pesoTotal += pesoUnitario * item.Quantidade;
                itens.Add(itemPedido);
            }

            var valorFinal = valorTotal + acrescimo - desconto;

            var pedido = new Pedido
            {
                ClienteId = clienteId,
                SolicitanteNome = solicitanteNome,
                SolicitanteTelefone = solicitanteTelefone,
                CpfCnpj = cpfCnpj,
                Cep = cep,
                Logradouro = logradouro,
                Numero = numero,
                Complemento = complemento,
                Bairro = bairro,
                Cidade = cidade,
                Estado = estado,
                EnderecoConfere = enderecoConfere,
                Status = status,
                TipoEntrega = tipoEntrega,
                Desconto = desconto,
                Acrescimo = acrescimo,
                ValorFinal = valorFinal,
                ValorTotal = valorTotal,
                PesoTotal = pesoTotal,
                DataCriacao = DateTime.UtcNow,
                Itens = itens
            };

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            return pedido;
        }

        [HttpPut("{id}/concluir-conferencia")]
        public async Task<IActionResult> ConcluirConferencia(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.Status != "EmSeparacao")
                return BadRequest("O pedido precisa estar em separação.");

            pedido.Status = "ProntoEntrega";
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/confirmar-retirada")]
        public async Task<IActionResult> ConfirmarRetirada(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.TipoEntrega != "Retirada")
                return BadRequest("Este pedido não é do tipo Retirada.");
            if (pedido.Status != "ProntoEntrega")
                return BadRequest("O pedido precisa estar como Pronto p/ Retirada.");

            pedido.Status = "Entregue";
            await _context.SaveChangesAsync();
            return NoContent();
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
