using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RelatoriosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public RelatoriosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("vendas-periodo")]
        public async Task<IActionResult> VendasPeriodo(
            [FromQuery] string? dataInicio,
            [FromQuery] string? dataFim,
            [FromQuery] string? agrupamento = "diario")
        {
            var query = _context.Pedidos
                .Where(p => p.Status != "Cancelado" && p.Status != "Devolvido");

            if (DateTime.TryParse(dataInicio, out var di))
                query = query.Where(p => p.DataCriacao >= di);
            if (DateTime.TryParse(dataFim, out var df))
                query = query.Where(p => p.DataCriacao <= df.AddDays(1).AddTicks(-1));

            var pedidos = await query
                .Select(p => new { p.DataCriacao, p.ValorTotal, p.ValorFinal, p.Id })
                .ToListAsync();

            IEnumerable<dynamic> resultado;

            if (agrupamento == "semanal")
            {
                resultado = pedidos
                    .GroupBy(p => System.Globalization.CultureInfo.CurrentCulture.Calendar.GetWeekOfYear(
                        p.DataCriacao, System.Globalization.CalendarWeekRule.FirstDay, DayOfWeek.Monday))
                    .Select(g => new
                    {
                        Periodo = $"Semana {g.Key}",
                        TotalPedidos = g.Count(),
                        ValorTotal = g.Sum(p => p.ValorTotal),
                        ValorFinal = g.Sum(p => p.ValorFinal),
                        TicketMedio = g.Average(p => p.ValorTotal)
                    });
            }
            else if (agrupamento == "mensal")
            {
                resultado = pedidos
                    .GroupBy(p => new { p.DataCriacao.Year, p.DataCriacao.Month })
                    .Select(g => new
                    {
                        Periodo = $"{g.Key.Month:D2}/{g.Key.Year}",
                        TotalPedidos = g.Count(),
                        ValorTotal = g.Sum(p => p.ValorTotal),
                        ValorFinal = g.Sum(p => p.ValorFinal),
                        TicketMedio = g.Average(p => p.ValorTotal)
                    });
            }
            else
            {
                resultado = pedidos
                    .GroupBy(p => p.DataCriacao.Date)
                    .Select(g => new
                    {
                        Periodo = g.Key.ToString("dd/MM/yyyy"),
                        TotalPedidos = g.Count(),
                        ValorTotal = g.Sum(p => p.ValorTotal),
                        ValorFinal = g.Sum(p => p.ValorFinal),
                        TicketMedio = g.Average(p => p.ValorTotal)
                    });
            }

            return Ok(new
            {
                agrupamento,
                totalPedidos = pedidos.Count,
                valorTotalGeral = pedidos.Sum(p => p.ValorTotal),
                ticketMedioGeral = pedidos.Any() ? pedidos.Average(p => p.ValorTotal) : 0,
                dados = resultado
            });
        }

        [HttpGet("top-produtos")]
        public async Task<IActionResult> TopProdutos(
            [FromQuery] string? dataInicio,
            [FromQuery] string? dataFim,
            [FromQuery] int limite = 20)
        {
            var query = _context.ItensPedido
                .Where(i => i.Pedido!.Status != "Cancelado" && i.Pedido!.Status != "Devolvido");

            if (DateTime.TryParse(dataInicio, out var di))
                query = query.Where(i => i.Pedido!.DataCriacao >= di);
            if (DateTime.TryParse(dataFim, out var df))
                query = query.Where(i => i.Pedido!.DataCriacao <= df.AddDays(1).AddTicks(-1));

            var resultado = await query
                .GroupBy(i => new { i.ProdutoId, i.Produto!.Nome })
                .Select(g => new
                {
                    ProdutoId = g.Key.ProdutoId,
                    ProdutoNome = g.Key.Nome,
                    QuantidadeVendida = g.Sum(i => i.Quantidade),
                    ValorTotal = g.Sum(i => i.PrecoUnitario * i.Quantidade),
                    NumPedidos = g.Select(i => i.PedidoId).Distinct().Count()
                })
                .OrderByDescending(x => x.ValorTotal)
                .Take(limite)
                .ToListAsync();

            var valorTotalGeral = resultado.Sum(r => r.ValorTotal);

            return Ok(new
            {
                totalProdutos = resultado.Count,
                dados = resultado.Select(r => new
                {
                    r.ProdutoId,
                    r.ProdutoNome,
                    r.QuantidadeVendida,
                    r.ValorTotal,
                    r.NumPedidos,
                    Percentual = valorTotalGeral > 0 ? Math.Round(r.ValorTotal / valorTotalGeral * 100, 1) : 0
                })
            });
        }

        [HttpGet("clientes-top")]
        public async Task<IActionResult> ClientesTop(
            [FromQuery] string? dataInicio,
            [FromQuery] string? dataFim,
            [FromQuery] int limite = 20)
        {
            var query = _context.Pedidos
                .Where(p => p.Status != "Cancelado" && p.Status != "Devolvido" && p.ClienteId != null);

            if (DateTime.TryParse(dataInicio, out var di))
                query = query.Where(p => p.DataCriacao >= di);
            if (DateTime.TryParse(dataFim, out var df))
                query = query.Where(p => p.DataCriacao <= df.AddDays(1).AddTicks(-1));

            var resultado = await query
                .GroupBy(p => new { p.ClienteId, p.Cliente!.RazaoSocialNome, p.Cliente.CpfCnpj })
                .Select(g => new
                {
                    ClienteId = g.Key.ClienteId!.Value,
                    ClienteNome = g.Key.RazaoSocialNome,
                    CpfCnpj = g.Key.CpfCnpj,
                    TotalPedidos = g.Count(),
                    ValorTotal = g.Sum(p => p.ValorTotal),
                    TicketMedio = g.Average(p => p.ValorTotal),
                    UltimoPedido = g.Max(p => p.DataCriacao)
                })
                .OrderByDescending(x => x.ValorTotal)
                .Take(limite)
                .ToListAsync();

            return Ok(new
            {
                totalClientes = resultado.Count,
                dados = resultado
            });
        }

        [HttpGet("desempenho-vendedor")]
        public async Task<IActionResult> DesempenhoVendedor(
            [FromQuery] string? dataInicio,
            [FromQuery] string? dataFim)
        {
            var query = _context.Pedidos
                .Where(p => p.Status != "Cancelado" && p.Status != "Devolvido" && p.Cliente != null && p.Cliente.VendedorId != null);

            if (DateTime.TryParse(dataInicio, out var di))
                query = query.Where(p => p.DataCriacao >= di);
            if (DateTime.TryParse(dataFim, out var df))
                query = query.Where(p => p.DataCriacao <= df.AddDays(1).AddTicks(-1));

            var resultado = await query
                .GroupBy(p => new { p.Cliente!.Vendedor!.Id, p.Cliente!.Vendedor!.Nome })
                .Select(g => new
                {
                    VendedorId = g.Key.Id,
                    VendedorNome = g.Key.Nome,
                    TotalPedidos = g.Count(),
                    ValorTotal = g.Sum(p => p.ValorTotal),
                    TicketMedio = g.Average(p => p.ValorTotal),
                    NumClientes = g.Select(p => p.ClienteId).Distinct().Count()
                })
                .OrderByDescending(x => x.ValorTotal)
                .ToListAsync();

            return Ok(new
            {
                totalVendedores = resultado.Count,
                dados = resultado
            });
        }

        [HttpGet("estoque-margem")]
        public async Task<IActionResult> EstoqueMargem(
            [FromQuery] string? dataInicio,
            [FromQuery] string? dataFim,
            [FromQuery] int limite = 50)
        {
            var query = _context.ItensPedido
                .Where(i => i.Pedido!.Status != "Cancelado" && i.Pedido!.Status != "Devolvido");

            if (DateTime.TryParse(dataInicio, out var di))
                query = query.Where(i => i.Pedido!.DataCriacao >= di);
            if (DateTime.TryParse(dataFim, out var df))
                query = query.Where(i => i.Pedido!.DataCriacao <= df.AddDays(1).AddTicks(-1));

            var vendas = await query
                .GroupBy(i => i.ProdutoId)
                .Select(g => new
                {
                    ProdutoId = g.Key,
                    QuantidadeVendida = g.Sum(i => i.Quantidade),
                    ReceitaTotal = g.Sum(i => i.PrecoUnitario * i.Quantidade)
                })
                .ToDictionaryAsync(x => x.ProdutoId);

            var produtos = await _context.Produtos
                .Where(p => p.Ativo)
                .Select(p => new { p.Id, p.Nome, p.Estoque, p.PrecoVarejo, CategoriaNome = p.Categoria!.Nome, MarcaNome = p.Marca!.Nome })
                .ToListAsync();

            var resultado = produtos
                .Select(p =>
                {
                    var v = vendas.GetValueOrDefault(p.Id);
                    return new
                    {
                        ProdutoId = p.Id,
                        ProdutoNome = p.Nome,
                        Categoria = p.CategoriaNome,
                        Marca = p.MarcaNome,
                        EstoqueAtual = p.Estoque,
                        QuantidadeVendida = v?.QuantidadeVendida ?? 0,
                        ReceitaTotal = v?.ReceitaTotal ?? 0,
                        PrecoVarejo = p.PrecoVarejo,
                        GiroEstoque = p.Estoque > 0 && (v?.QuantidadeVendida ?? 0) > 0
                            ? Math.Round((v!.QuantidadeVendida / p.Estoque), 2)
                            : 0
                    };
                })
                .OrderByDescending(x => x.QuantidadeVendida)
                .Take(limite)
                .ToList();

            return Ok(new
            {
                totalProdutos = resultado.Count,
                dados = resultado
            });
        }
    }
}
