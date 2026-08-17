using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;
using Multigrao.Api.Services;
using System.Text;

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
                Destaque = dto.Destaque,
                ValorFrete = dto.ValorFrete
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
            produto.ValorFrete = dto.ValorFrete;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPost("importar")]
        public async Task<IActionResult> Importar(IFormFile arquivo)
        {
            if (arquivo == null || arquivo.Length == 0)
                return BadRequest(new { message = "Selecione um arquivo .sql para importar." });

            if (!arquivo.FileName.EndsWith(".sql", StringComparison.OrdinalIgnoreCase))
                return BadRequest(new { message = "O arquivo deve ter extensão .sql." });

            if (arquivo.Length > 50 * 1024 * 1024)
                return BadRequest(new { message = "Arquivo muito grande (máximo 50 MB)." });

            string conteudo;
            using (var reader = new StreamReader(arquivo.OpenReadStream(), Encoding.UTF8, true))
                conteudo = await reader.ReadToEndAsync();

            var registros = ProdutosImportacaoParser.Parse(conteudo);

            if (registros.Count == 0)
                return BadRequest(new { message = "Nenhum registro INSERT INTO tb_produtos_crm encontrado no arquivo. Exporte a tabela tb_produtos_crm com os dados (formato INSERT SQL)." });

            var codigos = registros
                .Select(r => r.CodigoErp?.Trim())
                .Where(c => !string.IsNullOrWhiteSpace(c))
                .Distinct()
                .ToList();

            var existentes = await _context.Produtos
                .Where(p => p.CodigoERP != "" && codigos.Contains(p.CodigoERP))
                .ToListAsync();

            var porCodigo = existentes
                .GroupBy(p => p.CodigoERP)
                .ToDictionary(g => g.Key, g => g.First());

            int importados = 0, atualizados = 0, erros = 0;

            foreach (var r in registros)
            {
                var codigo = r.CodigoErp?.Trim();
                if (string.IsNullOrWhiteSpace(codigo))
                {
                    erros++;
                    continue;
                }

                var nome = string.IsNullOrWhiteSpace(r.Nome) ? codigo : r.Nome.Trim();
                if (nome.Length > 150) nome = nome[..150];

                var embalagem = r.UnidadesPorCaixa > 0 ? $"{r.UnidadesPorCaixa:0.##} un/caixa" : null;

                if (porCodigo.TryGetValue(codigo, out var produto))
                {
                    produto.Nome = nome;
                    produto.PesoUnidade = r.PesoUnidade;
                    produto.PrecoVarejo = r.PrecoVarejo;
                    produto.PrecoAtacado = r.PrecoAtacado;
                    produto.Estoque = r.EstoqueFiscalSefaz;
                    produto.Embalagem = embalagem;
                    produto.UnidadeVenda = r.UnidadeVenda;
                    produto.Ativo = r.Ativo;
                    produto.ValorFrete = r.ValorFrete;
                    atualizados++;
                }
                else
                {
                    _context.Produtos.Add(new Produto
                    {
                        Nome = nome,
                        CodigoERP = codigo,
                        PesoUnidade = r.PesoUnidade,
                        PrecoVarejo = r.PrecoVarejo,
                        PrecoAtacado = r.PrecoAtacado,
                        Estoque = r.EstoqueFiscalSefaz,
                        Embalagem = embalagem,
                        UnidadeVenda = r.UnidadeVenda,
                        Ativo = r.Ativo,
                        ValorFrete = r.ValorFrete
                    });
                    importados++;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"{importados} produto(s) importado(s) e {atualizados} atualizado(s).",
                importados,
                atualizados,
                erros
            });
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
