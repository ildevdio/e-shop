using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
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

        [HttpPut("estoque")]
        public async Task<IActionResult> AjustarEstoque([FromBody] AjustarEstoqueDto dto)
        {
            if (dto.Itens == null || dto.Itens.Count == 0)
                return BadRequest(new { message = "Nenhum produto informado." });

            var ids = dto.Itens.Select(i => i.ProdutoId).Distinct().ToList();
            var produtos = await _context.Produtos
                .Where(p => ids.Contains(p.Id))
                .ToListAsync();

            var naoEncontrados = ids.Where(id => !produtos.Any(p => p.Id == id)).ToList();
            if (naoEncontrados.Any())
                return BadRequest(new { message = $"Produtos não encontrados: {string.Join(", ", naoEncontrados)}" });

            foreach (var item in dto.Itens)
            {
                var produto = produtos.First(p => p.Id == item.ProdutoId);
                if (item.Quantidade < 0)
                    return BadRequest(new { message = $"Quantidade inválida para o produto '{produto.Nome}'." });
                produto.Estoque = item.Quantidade;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Estoque atualizado com sucesso." });
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

        [HttpGet("{id}/imagem")]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetProdutoImagem(int id)
        {
            var produto = await _context.Produtos.FindAsync(id);
            if (produto == null) return NotFound();
            if (produto.ImagemBytes == null || produto.ImagemContentType == null) return NotFound();

            return File(produto.ImagemBytes, produto.ImagemContentType);
        }

        [HttpPost("{id}/imagem")]
        public async Task<IActionResult> UploadProdutoImagem(int id, IFormFile file)
        {
            var produto = await _context.Produtos.FindAsync(id);
            if (produto == null) return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Arquivo não enviado." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png")
                return BadRequest(new { message = "Apenas arquivos JPG e PNG são permitidos." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            produto.ImagemBytes = ms.ToArray();
            produto.ImagemContentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
            produto.ImagemUrl = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Imagem salva com sucesso." });
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
                QuantidadeMinimaAtacado = dto.QuantidadeMinimaAtacado <= 0 ? 5 : dto.QuantidadeMinimaAtacado,
                VendidoAGranel = dto.VendidoAGranel,
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
            produto.QuantidadeMinimaAtacado = dto.QuantidadeMinimaAtacado <= 0 ? 5 : dto.QuantidadeMinimaAtacado;
            produto.VendidoAGranel = dto.VendidoAGranel;
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
