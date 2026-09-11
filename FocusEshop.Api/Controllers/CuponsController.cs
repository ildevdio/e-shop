using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CuponsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CuponsController(AppDbContext context)
        {
            _context = context;
        }

        private static IQueryable<Cupom> ComProdutosClientes(IQueryable<Cupom> query)
        {
            return query
                .Include(c => c.Produtos)
                    .ThenInclude(cp => cp.Produto)
                .Include(c => c.Clientes)
                    .ThenInclude(cc => cc.Cliente);
        }

        [HttpGet]
        public async Task<IActionResult> GetCupons()
        {
            var cupons = await ComProdutosClientes(_context.Cupons)
                .OrderByDescending(c => c.CriadoEm)
                .ToListAsync();
            return Ok(cupons);
        }

        [HttpGet("ativos")]
        public async Task<IActionResult> GetCuponsAtivos()
        {
            var agora = DateTime.UtcNow;
            var cupons = await _context.Cupons
                .Where(c => c.Ativo
                    && (c.DataInicio == null || c.DataInicio <= agora)
                    && (c.DataFim == null || c.DataFim >= agora)
                    && (c.UsosMaximos == null || c.UsosRealizados < c.UsosMaximos))
                .Select(c => new { c.Id, c.Codigo, c.Tipo, c.Valor, c.AplicavelEm, c.ValorMinimoPedido, c.ValorMaximoDesconto })
                .ToListAsync();
            return Ok(cupons);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCupom(int id)
        {
            var cupom = await ComProdutosClientes(_context.Cupons)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (cupom == null) return NotFound();
            return Ok(cupom);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCupom([FromBody] CriarCupomDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Codigo))
                return BadRequest(new { message = "Informe o código do cupom." });

            if (dto.Valor <= 0)
                return BadRequest(new { message = "O valor do desconto deve ser maior que zero." });

            if (dto.Tipo != "percentual" && dto.Tipo != "valor_fixo" && dto.Tipo != "frete_gratis")
                return BadRequest(new { message = "Tipo inválido. Use 'percentual', 'valor_fixo' ou 'frete_gratis'." });

            if (dto.AplicavelEm != "pedido" && dto.AplicavelEm != "produtos" && dto.AplicavelEm != "frete")
                return BadRequest(new { message = "Aplicável em inválido. Use 'pedido', 'produtos' ou 'frete'." });

            var codigo = dto.Codigo.Trim().ToUpper();
            var existe = await _context.Cupons.AnyAsync(c => c.Codigo == codigo);
            if (existe)
                return BadRequest(new { message = "Já existe um cupom com este código." });

            var cupom = new Cupom
            {
                Codigo = codigo,
                Descricao = dto.Descricao?.Trim(),
                Tipo = dto.Tipo,
                Valor = dto.Tipo == "percentual" ? Math.Min(dto.Valor, 100) : dto.Valor,
                AplicavelEm = dto.AplicavelEm,
                ValorMinimoPedido = dto.ValorMinimoPedido,
                ValorMaximoDesconto = dto.ValorMaximoDesconto,
                UsosMaximos = dto.UsosMaximos,
                DataInicio = dto.DataInicio,
                DataFim = dto.DataFim,
                Ativo = dto.Ativo,
                CriadoEm = DateTime.UtcNow
            };

            foreach (var item in dto.Produtos.Where(p => p.ProdutoId > 0).GroupBy(p => p.ProdutoId).Select(g => g.First()))
            {
                cupom.Produtos.Add(new CupomProduto { ProdutoId = item.ProdutoId });
            }

            foreach (var item in dto.Clientes.Where(c => c.ClienteId > 0).GroupBy(c => c.ClienteId).Select(g => g.First()))
            {
                cupom.Clientes.Add(new CupomCliente { ClienteId = item.ClienteId });
            }

            _context.Cupons.Add(cupom);
            await _context.SaveChangesAsync();

            var resultado = await ComProdutosClientes(_context.Cupons)
                .FirstOrDefaultAsync(c => c.Id == cupom.Id);

            return CreatedAtAction(nameof(GetCupom), new { id = cupom.Id }, resultado);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCupom(int id, [FromBody] CriarCupomDto dto)
        {
            var cupom = await ComProdutosClientes(_context.Cupons)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (cupom == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Codigo))
                return BadRequest(new { message = "Informe o código do cupom." });

            if (dto.Valor <= 0)
                return BadRequest(new { message = "O valor do desconto deve ser maior que zero." });

            var codigo = dto.Codigo.Trim().ToUpper();
            var existeOutro = await _context.Cupons.AnyAsync(c => c.Codigo == codigo && c.Id != id);
            if (existeOutro)
                return BadRequest(new { message = "Já existe outro cupom com este código." });

            cupom.Codigo = codigo;
            cupom.Descricao = dto.Descricao?.Trim();
            cupom.Tipo = dto.Tipo;
            cupom.Valor = dto.Tipo == "percentual" ? Math.Min(dto.Valor, 100) : dto.Valor;
            cupom.AplicavelEm = dto.AplicavelEm;
            cupom.ValorMinimoPedido = dto.ValorMinimoPedido;
            cupom.ValorMaximoDesconto = dto.ValorMaximoDesconto;
            cupom.UsosMaximos = dto.UsosMaximos;
            cupom.DataInicio = dto.DataInicio;
            cupom.DataFim = dto.DataFim;
            cupom.Ativo = dto.Ativo;

            _context.CupomProdutos.RemoveRange(cupom.Produtos);
            _context.CupomClientes.RemoveRange(cupom.Clientes);

            foreach (var item in dto.Produtos.Where(p => p.ProdutoId > 0).GroupBy(p => p.ProdutoId).Select(g => g.First()))
            {
                cupom.Produtos.Add(new CupomProduto { ProdutoId = item.ProdutoId });
            }

            foreach (var item in dto.Clientes.Where(c => c.ClienteId > 0).GroupBy(c => c.ClienteId).Select(g => g.First()))
            {
                cupom.Clientes.Add(new CupomCliente { ClienteId = item.ClienteId });
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCupom(int id)
        {
            var cupom = await _context.Cupons.FindAsync(id);
            if (cupom == null) return NotFound();

            _context.Cupons.Remove(cupom);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("validar")]
        public async Task<IActionResult> ValidarCupom([FromBody] ValidarCupomDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Codigo))
                return BadRequest(new { message = "Informe o código do cupom." });

            var codigo = dto.Codigo.Trim().ToUpper();
            var cupom = await ComProdutosClientes(_context.Cupons)
                .FirstOrDefaultAsync(c => c.Codigo == codigo);

            if (cupom == null)
                return BadRequest(new { message = "Cupom não encontrado." });

            if (!cupom.Ativo)
                return BadRequest(new { message = "Este cupom está inativo." });

            var agora = DateTime.UtcNow;
            if (cupom.DataInicio.HasValue && agora < cupom.DataInicio.Value)
                return BadRequest(new { message = "Este cupom ainda não está ativo." });

            if (cupom.DataFim.HasValue && agora > cupom.DataFim.Value)
                return BadRequest(new { message = "Este cupom expirou." });

            if (cupom.UsosMaximos.HasValue && cupom.UsosRealizados >= cupom.UsosMaximos.Value)
                return BadRequest(new { message = "Este cupom atingiu o limite de uso." });

            if (cupom.ValorMinimoPedido.HasValue && dto.ValorPedido < cupom.ValorMinimoPedido.Value)
                return BadRequest(new { message = $"Valor mínimo do pedido: R$ {cupom.ValorMinimoPedido.Value:F2}." });

            if (cupom.AplicavelEm == "produtos" && cupom.Produtos.Any())
            {
                var produtosPermitidos = cupom.Produtos.Select(cp => cp.ProdutoId).ToList();
                if (dto.ProdutosIds != null && !dto.ProdutosIds.Any(pid => produtosPermitidos.Contains(pid)))
                    return BadRequest(new { message = "Nenhum produto do pedido é elegível para este cupom." });
            }

            if (cupom.Clientes.Any() && !string.IsNullOrWhiteSpace(dto.CpfCnpj))
            {
                var limpo = new string(dto.CpfCnpj.Where(char.IsDigit).ToArray());
                var clienteIds = cupom.Clientes.Select(cc => cc.ClienteId).ToList();
                var temCliente = await _context.Clientes.AnyAsync(c =>
                    clienteIds.Contains(c.Id) &&
                    c.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim() == limpo);
                if (!temCliente)
                    return BadRequest(new { message = "Este cupom não é válido para este cliente." });
            }
            else if (cupom.Clientes.Any())
            {
                return BadRequest(new { message = "Este cupom é exclusivo para clientes específicos." });
            }

            return Ok(new
            {
                cupom.Id,
                cupom.Codigo,
                cupom.Tipo,
                cupom.Valor,
                cupom.AplicavelEm,
                cupom.ValorMaximoDesconto,
                valido = true
            });
        }

        [HttpPost("aplicar")]
        public async Task<IActionResult> AplicarCupom([FromBody] AplicarCupomDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Codigo))
                return BadRequest(new { message = "Informe o código do cupom." });

            var codigo = dto.Codigo.Trim().ToUpper();
            var cupom = await ComProdutosClientes(_context.Cupons)
                .FirstOrDefaultAsync(c => c.Codigo == codigo);

            if (cupom == null)
                return BadRequest(new { message = "Cupom não encontrado." });

            if (!cupom.Ativo)
                return BadRequest(new { message = "Este cupom está inativo." });

            var agora = DateTime.UtcNow;
            if (cupom.DataInicio.HasValue && agora < cupom.DataInicio.Value)
                return BadRequest(new { message = "Este cupom ainda não está ativo." });

            if (cupom.DataFim.HasValue && agora > cupom.DataFim.Value)
                return BadRequest(new { message = "Este cupom expirou." });

            if (cupom.UsosMaximos.HasValue && cupom.UsosRealizados >= cupom.UsosMaximos.Value)
                return BadRequest(new { message = "Este cupom atingiu o limite de uso." });

            if (cupom.ValorMinimoPedido.HasValue && dto.ValorPedido < cupom.ValorMinimoPedido.Value)
                return BadRequest(new { message = $"Valor mínimo do pedido: R$ {cupom.ValorMinimoPedido.Value:F2}." });

            decimal desconto = 0;

            if (cupom.Tipo == "frete_gratis")
            {
                desconto = dto.ValorFrete;
            }
            else if (cupom.AplicavelEm == "produtos" && cupom.Produtos.Any())
            {
                var produtosPermitidos = cupom.Produtos.Select(cp => cp.ProdutoId).ToList();
                desconto = dto.ProdutosIds != null
                    ? dto.ProdutosIds.Where(pid => produtosPermitidos.Contains(pid)).Sum(_ => dto.ValorPedido / Math.Max(dto.ProdutosIds.Count, 1))
                    : 0;

                if (cupom.Tipo == "percentual")
                    desconto = desconto * cupom.Valor / 100;
                else
                    desconto = Math.Min(desconto, cupom.Valor * (dto.ProdutosIds?.Count ?? 1));
            }
            else
            {
                if (cupom.Tipo == "percentual")
                    desconto = dto.ValorPedido * cupom.Valor / 100;
                else
                    desconto = cupom.Valor;
            }

            if (cupom.ValorMaximoDesconto.HasValue && desconto > cupom.ValorMaximoDesconto.Value)
                desconto = cupom.ValorMaximoDesconto.Value;

            desconto = Math.Min(desconto, dto.ValorPedido + dto.ValorFrete);

            return Ok(new
            {
                cupom.Codigo,
                cupom.Tipo,
                cupom.AplicavelEm,
                desconto,
                descontoFormatado = $"R$ {desconto:F2}"
            });
        }
    }
}
