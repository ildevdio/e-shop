using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Data;
using FocusEshop.Api.Models;

namespace FocusEshop.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SubCategoriasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public SubCategoriasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetSubCategorias([FromQuery] int? categoriaId)
        {
            var subCategorias = _context.SubCategorias
                .Include(sc => sc.Categoria)
                .AsQueryable();

            if (categoriaId.HasValue)
                subCategorias = subCategorias.Where(sc => sc.CategoriaId == categoriaId.Value);

            var resultado = await subCategorias
                .OrderBy(sc => sc.Categoria!.Ordem)
                .ThenBy(sc => sc.Ordem)
                .ThenBy(sc => sc.Nome)
                .ToListAsync();
            return Ok(resultado);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSubCategoria(int id)
        {
            var subCategoria = await _context.SubCategorias
                .Include(sc => sc.Categoria)
                .FirstOrDefaultAsync(sc => sc.Id == id);
            if (subCategoria == null) return NotFound();
            return Ok(subCategoria);
        }

        [HttpGet("categoria/lista")]
        public async Task<IActionResult> GetSubCategoriasComCategoria()
        {
            var subCategorias = await _context.SubCategorias
                .Include(sc => sc.Categoria)
                .Include(sc => sc.Categoria!.Departamento)
                .OrderBy(sc => sc.Categoria!.Departamento!.Ordem)
                .ThenBy(sc => sc.Categoria!.Ordem)
                .ThenBy(sc => sc.Ordem)
                .ToListAsync();
            return Ok(subCategorias);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSubCategoria([FromBody] SubCategoria dto)
        {
            var subCategoria = new SubCategoria
            {
                Nome = dto.Nome,
                Ordem = dto.Ordem,
                CategoriaId = dto.CategoriaId,
                Ativo = dto.Ativo
            };
            _context.SubCategorias.Add(subCategoria);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetSubCategoria), new { id = subCategoria.Id }, subCategoria);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSubCategoria(int id, [FromBody] SubCategoria dto)
        {
            var subCategoria = await _context.SubCategorias.FindAsync(id);
            if (subCategoria == null) return NotFound();
            subCategoria.Nome = dto.Nome;
            subCategoria.Ordem = dto.Ordem;
            subCategoria.CategoriaId = dto.CategoriaId;
            subCategoria.Ativo = dto.Ativo;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSubCategoria(int id)
        {
            var subCategoria = await _context.SubCategorias
                .Include(sc => sc.Produtos)
                .FirstOrDefaultAsync(sc => sc.Id == id);
            if (subCategoria == null) return NotFound();
            if (subCategoria.Produtos.Any())
                return BadRequest(new { message = "Esta subcategoria possui produtos. Remova os produtos primeiro." });
            _context.SubCategorias.Remove(subCategoria);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}