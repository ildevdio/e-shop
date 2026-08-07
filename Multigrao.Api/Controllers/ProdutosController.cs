using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProdutosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetProdutos()
        {
            var produtos = await _context.Produtos
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .OrderBy(p => p.Nome)
                .ToListAsync();

            return Ok(produtos);
        }

        [HttpGet("catalogo")]
        public async Task<IActionResult> GetCatalogo()
        {
            var produtos = await _context.Produtos
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .Where(p => p.Ativo)
                .ToListAsync();

            var ordenados = produtos
                .OrderBy(p => p.Categoria?.Ordem ?? 999)
                .ThenBy(p => p.Marca?.Nome ?? "")
                .ThenBy(p => p.Nome)
                .ToList();

            return Ok(ordenados);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduto(int id)
        {
            var produto = await _context.Produtos
                .Include(p => p.Categoria)
                .Include(p => p.Marca)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (produto == null) return NotFound();
            return Ok(produto);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduto([FromBody] Produto dto)
        {
            var produto = new Produto
            {
                Nome = dto.Nome,
                PesoUnidade = dto.PesoUnidade,
                CodigoERP = dto.CodigoERP,
                CategoriaId = dto.CategoriaId,
                MarcaId = dto.MarcaId,
                PrecoVarejo = dto.PrecoVarejo,
                PrecoAtacado = dto.PrecoAtacado,
                Embalagem = dto.Embalagem,
                UnidadeVenda = dto.UnidadeVenda,
                ImagemUrl = dto.ImagemUrl,
                Ativo = dto.Ativo,
                Destaque = dto.Destaque
            };

            _context.Produtos.Add(produto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProduto), new { id = produto.Id }, produto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProduto(int id, [FromBody] Produto dto)
        {
            var produto = await _context.Produtos.FindAsync(id);
            if (produto == null) return NotFound();

            produto.Nome = dto.Nome;
            produto.PesoUnidade = dto.PesoUnidade;
            produto.CodigoERP = dto.CodigoERP;
            produto.CategoriaId = dto.CategoriaId;
            produto.MarcaId = dto.MarcaId;
            produto.PrecoVarejo = dto.PrecoVarejo;
            produto.PrecoAtacado = dto.PrecoAtacado;
            produto.Embalagem = dto.Embalagem;
            produto.UnidadeVenda = dto.UnidadeVenda;
            produto.ImagemUrl = dto.ImagemUrl;
            produto.Ativo = dto.Ativo;
            produto.Destaque = dto.Destaque;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduto(int id)
        {
            var produto = await _context.Produtos.FindAsync(id);
            if (produto == null) return NotFound();

            _context.Produtos.Remove(produto);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
