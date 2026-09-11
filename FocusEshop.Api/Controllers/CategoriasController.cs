using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Data;
using FocusEshop.Api.Models;

namespace FocusEshop.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetCategorias([FromQuery] int? departamentoId)
        {
            var categorias = _context.Categorias
                .Include(c => c.Departamento)
                .AsQueryable();

            if (departamentoId.HasValue)
                categorias = categorias.Where(c => c.DepartamentoId == departamentoId.Value);

            var resultado = await categorias
                .OrderBy(c => c.Departamento!.Ordem)
                .ThenBy(c => c.Ordem)
                .ThenBy(c => c.Nome)
                .ToListAsync();
            return Ok(resultado);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCategoria(int id)
        {
            var categoria = await _context.Categorias
                .Include(c => c.Departamento)
                .Include(c => c.SubCategorias)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (categoria == null) return NotFound();
            return Ok(categoria);
        }

        [HttpGet("{id}/detalhe")]
        public async Task<IActionResult> GetCategoriaDetalhe(int id)
        {
            var categoria = await _context.Categorias
                .Include(c => c.Departamento)
                .Include(c => c.SubCategorias)
                .Include(c => c.SubCategorias)
                .ThenInclude(sc => sc.Produtos)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (categoria == null) return NotFound();
            return Ok(categoria);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategoria([FromBody] Categoria dto)
        {
            var categoria = new Categoria
            {
                Nome = dto.Nome,
                Ordem = dto.Ordem,
                DepartamentoId = dto.DepartamentoId,
                Ativo = dto.Ativo
            };
            _context.Categorias.Add(categoria);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetCategoria), new { id = categoria.Id }, categoria);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategoria(int id, [FromBody] Categoria dto)
        {
            var categoria = await _context.Categorias.FindAsync(id);
            if (categoria == null) return NotFound();
            categoria.Nome = dto.Nome;
            categoria.Ordem = dto.Ordem;
            categoria.DepartamentoId = dto.DepartamentoId;
            categoria.Ativo = dto.Ativo;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategoria(int id)
        {
            var categoria = await _context.Categorias
                .Include(c => c.SubCategorias)
                .FirstOrDefaultAsync(c => c.Id == id);
            if (categoria == null) return NotFound();
            if (categoria.SubCategorias.Any())
                return BadRequest(new { message = "Esta categoria possui subcategorias. Exclua as subcategorias primeiro." });
            _context.Categorias.Remove(categoria);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}