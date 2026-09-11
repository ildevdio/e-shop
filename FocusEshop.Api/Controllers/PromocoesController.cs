using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PromocoesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PromocoesController(AppDbContext context)
        {
            _context = context;
        }

        private static IQueryable<Promocao> ComProdutos(IQueryable<Promocao> query)
        {
            return query
                .Include(p => p.Produtos)
                .ThenInclude(pp => pp.Produto);
        }

        [HttpGet]
        public async Task<IActionResult> GetPromocoes()
        {
            var promocoes = await ComProdutos(_context.Promocoes)
                .OrderByDescending(p => p.DataFim ?? DateTime.MaxValue)
                .ThenByDescending(p => p.Id)
                .ToListAsync();

            return Ok(promocoes);
        }

        [HttpGet("ativas")]
        public async Task<IActionResult> GetPromocoesAtivas()
        {
            var agora = DateTime.UtcNow;
            var promocoes = await ComProdutos(_context.Promocoes)
                .Where(p => p.Ativa
                    && (p.DataInicio == null || p.DataInicio <= agora)
                    && (p.DataFim == null || p.DataFim >= agora))
                .OrderBy(p => p.Id)
                .ToListAsync();

            var resultado = promocoes.Select(p => new
            {
                p.Id,
                p.Titulo,
                p.Descricao,
                p.Tipo,
                p.Valor,
                p.DataInicio,
                p.DataFim,
                Produtos = p.Produtos.Select(pp => new { pp.ProdutoId, pp.PrecoPromocional }).ToList()
            });

            return Ok(resultado);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPromocao(int id)
        {
            var promocao = await ComProdutos(_context.Promocoes)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (promocao == null) return NotFound();
            return Ok(promocao);
        }

        [HttpPost]
        public async Task<IActionResult> CreatePromocao([FromBody] CriarPromocaoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return BadRequest(new { message = "Informe o título da promoção." });

            if (dto.Valor <= 0)
                return BadRequest(new { message = "O valor do desconto deve ser maior que zero." });

            if (dto.Tipo != "percentual" && dto.Tipo != "valor")
                return BadRequest(new { message = "Tipo de desconto inválido. Use 'percentual' ou 'valor'." });

            var promocao = new Promocao
            {
                Titulo = dto.Titulo.Trim(),
                Descricao = dto.Descricao?.Trim(),
                Tipo = dto.Tipo,
                Valor = dto.Tipo == "percentual" ? Math.Min(dto.Valor, 100) : dto.Valor,
                DataInicio = dto.DataInicio,
                DataFim = dto.DataFim,
                Ativa = dto.Ativa
            };

            foreach (var item in dto.Produtos
                .Where(x => x.ProdutoId > 0)
                .GroupBy(x => x.ProdutoId)
                .Select(g => g.First()))
            {
                promocao.Produtos.Add(new PromocaoProduto
                {
                    ProdutoId = item.ProdutoId,
                    PrecoPromocional = item.PrecoPromocional
                });
            }

            _context.Promocoes.Add(promocao);
            await _context.SaveChangesAsync();

            var resultado = await ComProdutos(_context.Promocoes)
                .FirstOrDefaultAsync(p => p.Id == promocao.Id);

            return CreatedAtAction(nameof(GetPromocao), new { id = promocao.Id }, resultado);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePromocao(int id, [FromBody] CriarPromocaoDto dto)
        {
            var promocao = await ComProdutos(_context.Promocoes)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (promocao == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return BadRequest(new { message = "Informe o título da promoção." });

            if (dto.Valor <= 0)
                return BadRequest(new { message = "O valor do desconto deve ser maior que zero." });

            if (dto.Tipo != "percentual" && dto.Tipo != "valor")
                return BadRequest(new { message = "Tipo de desconto inválido. Use 'percentual' ou 'valor'." });

            promocao.Titulo = dto.Titulo.Trim();
            promocao.Descricao = dto.Descricao?.Trim();
            promocao.Tipo = dto.Tipo;
            promocao.Valor = dto.Tipo == "percentual" ? Math.Min(dto.Valor, 100) : dto.Valor;
            promocao.DataInicio = dto.DataInicio;
            promocao.DataFim = dto.DataFim;
            promocao.Ativa = dto.Ativa;

            var items = dto.Produtos
                .Where(x => x.ProdutoId > 0)
                .GroupBy(x => x.ProdutoId)
                .Select(g => g.First())
                .ToList();
            _context.PromocoesProduto.RemoveRange(promocao.Produtos);
            foreach (var item in items)
            {
                promocao.Produtos.Add(new PromocaoProduto
                {
                    ProdutoId = item.ProdutoId,
                    PrecoPromocional = item.PrecoPromocional
                });
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePromocao(int id)
        {
            var promocao = await _context.Promocoes.FindAsync(id);
            if (promocao == null) return NotFound();

            _context.Promocoes.Remove(promocao);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
