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

        [HttpGet("{id}/imagem")]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetMarcaImagem(int id)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound();
            if (marca.ImagemBytes == null || marca.ImagemContentType == null) return NotFound();

            return File(marca.ImagemBytes, marca.ImagemContentType);
        }

        [HttpPost("{id}/imagem")]
        public async Task<IActionResult> UploadMarcaImagem(int id, IFormFile file)
        {
            var marca = await _context.Marcas.FindAsync(id);
            if (marca == null) return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Arquivo não enviado." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png")
                return BadRequest(new { message = "Apenas arquivos JPG e PNG são permitidos." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            marca.ImagemBytes = ms.ToArray();
            marca.ImagemContentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
            marca.ImagemUrl = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Imagem salva com sucesso." });
        }

        [HttpPost]
        public async Task<IActionResult> CreateMarca([FromBody] Marca dto)
        {
            var marca = new Marca { Nome = dto.Nome, Cor = dto.Cor };
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
