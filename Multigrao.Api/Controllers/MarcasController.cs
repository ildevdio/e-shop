using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarcasController : ControllerBase
    {
        private readonly AppDbContext _context;

        public MarcasController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMarcas()
        {
            var marcas = await _context.Marcas
                .OrderBy(m => m.Nome)
                .ToListAsync();
            return Ok(marcas);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetMarca(int id)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound();
            return Ok(marca);
        }

        [HttpPost]
        public async Task<IActionResult> CreateMarca([FromBody] Marca dto)
        {
            var marca = new Marca { Nome = dto.Nome, ImagemUrl = dto.ImagemUrl, Cor = dto.Cor };
            _context.Marcas.Add(marca);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetMarca), new { id = marca.Id }, marca);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMarca(int id, [FromBody] Marca dto)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound();
            marca.Nome = dto.Nome;
            marca.ImagemUrl = dto.ImagemUrl;
            marca.Cor = dto.Cor;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMarca(int id)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound();
            _context.Marcas.Remove(marca);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
