using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EnqueteController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EnqueteController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetEnquetes()
        {
            var enquetes = await _context.Enquetes
                .Include(e => e.Autor)
                .Include(e => e.Opcoes.OrderBy(o => o.Ordem))
                .Include(e => e.Votos)
                .OrderByDescending(e => e.DataCriacao)
                .ToListAsync();

            var resultado = enquetes.Select(e => new
            {
                id = e.Id,
                titulo = e.Titulo,
                dataCriacao = e.DataCriacao,
                ativa = e.Ativa,
                autorNome = e.Autor?.Nome ?? "Sistema",
                totalVotos = e.Votos.Count,
                opcoes = e.Opcoes.Select(o => new
                {
                    id = o.Id,
                    texto = o.Texto,
                    ordem = o.Ordem,
                    votos = e.Votos.Count(v => v.OpcaoEnqueteId == o.Id)
                })
            });

            return Ok(resultado);
        }

        [HttpPost]
        public async Task<IActionResult> CriarEnquete([FromBody] CriarEnqueteDto dto)
        {
            if (dto.Opcoes == null || dto.Opcoes.Count < 2)
                return BadRequest(new { message = "Uma enquete precisa ter pelo menos 2 opções." });

            var autor = await _context.Usuarios.FindAsync(dto.AutorId);
            if (autor == null) return BadRequest(new { message = "Autor não encontrado." });

            var enquete = new Enquete
            {
                Titulo = dto.Titulo,
                AutorId = dto.AutorId,
                Ativa = true,
                DataCriacao = DateTime.UtcNow
            };

            _context.Enquetes.Add(enquete);
            await _context.SaveChangesAsync();

            int ordem = 1;
            foreach (var texto in dto.Opcoes.Where(o => !string.IsNullOrWhiteSpace(o)))
            {
                _context.OpcoesEnquete.Add(new OpcaoEnquete
                {
                    EnqueteId = enquete.Id,
                    Texto = texto,
                    Ordem = ordem++
                });
            }

            await _context.SaveChangesAsync();

            return Ok(new { id = enquete.Id, mensagem = "Enquete criada com sucesso." });
        }

        [HttpPost("{enqueteId}/votar")]
        public async Task<IActionResult> Votar(int enqueteId, [FromBody] VotarEnqueteDto dto)
        {
            var enquete = await _context.Enquetes
                .Include(e => e.Votos)
                .FirstOrDefaultAsync(e => e.Id == enqueteId);

            if (enquete == null) return NotFound();

            if (!enquete.Ativa)
                return BadRequest(new { message = "Esta enquete foi encerrada." });

            var jaVotou = enquete.Votos.Any(v => v.UsuarioId == dto.UsuarioId);
            if (jaVotou)
                return BadRequest(new { message = "Você já votou nesta enquete." });

            var opcao = await _context.OpcoesEnquete
                .FirstOrDefaultAsync(o => o.Id == dto.OpcaoEnqueteId && o.EnqueteId == enqueteId);

            if (opcao == null) return BadRequest(new { message = "Opção inválida." });

            var voto = new VotoEnquete
            {
                EnqueteId = enqueteId,
                OpcaoEnqueteId = dto.OpcaoEnqueteId,
                UsuarioId = dto.UsuarioId,
                DataVoto = DateTime.UtcNow
            };

            _context.VotosEnquete.Add(voto);
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Voto registrado." });
        }

        [HttpPut("{enqueteId}/encerrar")]
        public async Task<IActionResult> EncerrarEnquete(int enqueteId)
        {
            var enquete = await _context.Enquetes.FindAsync(enqueteId);
            if (enquete == null) return NotFound();

            enquete.Ativa = false;
            await _context.SaveChangesAsync();

            return Ok(new { mensagem = "Enquete encerrada." });
        }

        [HttpDelete("{enqueteId}")]
        public async Task<IActionResult> ExcluirEnquete(int enqueteId)
        {
            var enquete = await _context.Enquetes
                .Include(e => e.Opcoes)
                .Include(e => e.Votos)
                .FirstOrDefaultAsync(e => e.Id == enqueteId);

            if (enquete == null) return NotFound();

            _context.VotosEnquete.RemoveRange(enquete.Votos);
            _context.OpcoesEnquete.RemoveRange(enquete.Opcoes);
            _context.Enquetes.Remove(enquete);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Enquete excluída com sucesso." });
        }
    }
}
