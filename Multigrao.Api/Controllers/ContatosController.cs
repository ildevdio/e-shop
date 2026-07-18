using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ContatosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ContatosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetContatos()
        {
            var contatos = await _context.Contatos
                .Include(c => c.Cliente)
                .OrderBy(c => c.Nome)
                .Select(c => new {
                    c.Id,
                    c.Nome,
                    c.Telefone,
                    c.Email,
                    c.Cargo,
                    c.ClienteId,
                    clienteNome = c.Cliente != null ? c.Cliente.RazaoSocialNome : null
                })
                .ToListAsync();

            return Ok(contatos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetContato(int id)
        {
            var contato = await _context.Contatos
                .Include(c => c.Cliente)
                .FirstOrDefaultAsync(c => c.Id == id);

            if (contato == null) return NotFound();
            return Ok(contato);
        }

        [HttpPost]
        public async Task<IActionResult> CreateContato([FromBody] CriarContatoDto dto)
        {
            var contato = new Contato
            {
                Nome = dto.Nome,
                Telefone = dto.Telefone,
                Email = dto.Email ?? string.Empty,
                Cargo = dto.Cargo ?? string.Empty,
                ClienteId = dto.ClienteId
            };

            _context.Contatos.Add(contato);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetContato), new { id = contato.Id }, contato);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarContato(int id, [FromBody] AtualizarContatoDto dto)
        {
            var contato = await _context.Contatos.FindAsync(id);
            if (contato == null) return NotFound();

            if (dto.Nome != null) contato.Nome = dto.Nome;
            if (dto.Telefone != null) contato.Telefone = dto.Telefone;
            if (dto.Email != null) contato.Email = dto.Email;
            if (dto.Cargo != null) contato.Cargo = dto.Cargo;
            if (dto.ClienteId.HasValue) contato.ClienteId = dto.ClienteId;

            await _context.SaveChangesAsync();
            return Ok(contato);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletarContato(int id)
        {
            var contato = await _context.Contatos.FindAsync(id);
            if (contato == null) return NotFound();

            _context.Contatos.Remove(contato);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
