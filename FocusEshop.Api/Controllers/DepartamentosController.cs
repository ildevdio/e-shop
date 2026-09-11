using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Data;
using FocusEshop.Api.Models;

namespace FocusEshop.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartamentosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DepartamentosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDepartamentos()
        {
            var departamentos = await _context.Departamentos
                .Include(d => d.Categorias)
                .OrderBy(d => d.Ordem)
                .ThenBy(d => d.Nome)
                .ToListAsync();
            return Ok(departamentos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetDepartamento(int id)
        {
            var departamento = await _context.Departamentos
                .Include(d => d.Categorias)
                .FirstOrDefaultAsync(d => d.Id == id);
            if (departamento == null) return NotFound();
            return Ok(departamento);
        }

        [HttpGet("{id}/detalhe")]
        public async Task<IActionResult> GetDepartamentoDetalhe(int id)
        {
            var departamento = await _context.Departamentos
                .Include(d => d.Categorias)
                .Include(d => d.Categorias)
                .ThenInclude(c => c.SubCategorias)
                .FirstOrDefaultAsync(d => d.Id == id);
            if (departamento == null) return NotFound();
            return Ok(departamento);
        }

        [HttpGet("{id}/imagem")]
        [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
        public async Task<IActionResult> GetDepartamentoImagem(int id)
        {
            var departamento = await _context.Departamentos.FindAsync(id);
            if (departamento == null) return NotFound();
            if (departamento.FotoBytes == null || departamento.FotoContentType == null) return NotFound();

            return File(departamento.FotoBytes, departamento.FotoContentType);
        }

        [HttpPost("{id}/imagem")]
        public async Task<IActionResult> UploadDepartamentoImagem(int id, IFormFile file)
        {
            var departamento = await _context.Departamentos.FindAsync(id);
            if (departamento == null) return NotFound();

            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Arquivo não enviado." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png")
                return BadRequest(new { message = "Apenas arquivos JPG e PNG são permitidos." });

            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            departamento.FotoBytes = ms.ToArray();
            departamento.FotoContentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };
            departamento.FotoUrl = null;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Foto salva com sucesso." });
        }

        [HttpPost]
        public async Task<IActionResult> CreateDepartamento([FromBody] Departamento dto)
        {
            var departamento = new Departamento
            {
                Nome = dto.Nome,
                Ordem = dto.Ordem,
                FotoUrl = dto.FotoUrl,
                Descricao = dto.Descricao,
                Ativo = dto.Ativo
            };
            _context.Departamentos.Add(departamento);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetDepartamento), new { id = departamento.Id }, departamento);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateDepartamento(int id, [FromBody] Departamento dto)
        {
            var departamento = await _context.Departamentos.FindAsync(id);
            if (departamento == null) return NotFound();
            departamento.Nome = dto.Nome;
            departamento.Ordem = dto.Ordem;
            departamento.FotoUrl = dto.FotoUrl;
            departamento.Descricao = dto.Descricao;
            departamento.Ativo = dto.Ativo;
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDepartamento(int id)
        {
            var departamento = await _context.Departamentos
                .Include(d => d.Categorias)
                .FirstOrDefaultAsync(d => d.Id == id);
            if (departamento == null) return NotFound();
            if (departamento.Categorias.Any())
                return BadRequest(new { message = "Este departamento possui categorias. Exclua as categorias primeiro." });
            _context.Departamentos.Remove(departamento);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}