using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Data;
using FocusEshop.Api.DTOs;
using FocusEshop.Api.Models;

namespace FocusEshop.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BannersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BannersController(AppDbContext context)
        {
            _context = context;
        }

        private static object BannerDto(Banner b) => new
        {
            b.Id,
            b.EmpresaId,
            b.Titulo,
            b.Subtitulo,
            b.ImagemUrl,
            b.LinkTipo,
            b.LinkValor,
            b.Posicao,
            b.Ordem,
            b.Ativo,
            b.DataInicio,
            b.DataFim
        };

        [HttpGet]
        public async Task<IActionResult> GetBanners()
        {
            var banners = await _context.Banners
                .OrderBy(b => b.Ordem)
                .ThenByDescending(b => b.Id)
                .ToListAsync();

            return Ok(banners.Select(BannerDto));
        }

        [HttpGet("ativos")]
        public async Task<IActionResult> GetBannersAtivos()
        {
            var agora = DateTime.UtcNow;
            var banners = await _context.Banners
                .Where(b => b.Ativo
                    && (b.DataInicio == null || b.DataInicio <= agora)
                    && (b.DataFim == null || b.DataFim >= agora))
                .OrderBy(b => b.Ordem)
                .ThenByDescending(b => b.Id)
                .ToListAsync();

            return Ok(banners.Select(BannerDto));
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetBanner(int id)
        {
            var banner = await _context.Banners.FirstOrDefaultAsync(b => b.Id == id);
            if (banner == null) return NotFound();
            return Ok(BannerDto(banner));
        }

        [HttpPost]
        public async Task<IActionResult> CreateBanner([FromBody] CriarBannerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return BadRequest(new { message = "Informe o título do banner." });

            if (string.IsNullOrWhiteSpace(dto.ImagemUrl))
                return BadRequest(new { message = "Envie a imagem do banner." });

            var tipoLink = (dto.LinkTipo ?? "").Trim().ToLowerInvariant();
            if (tipoLink != "" && tipoLink != "produto" && tipoLink != "categoria" && tipoLink != "externo")
                return BadRequest(new { message = "Tipo de link inválido. Use 'produto', 'categoria' ou 'externo'." });

            var posicao = (dto.Posicao ?? "").Trim().ToLowerInvariant();
            if (posicao != "carrossel" && posicao != "secao" && posicao != "ambos")
                return BadRequest(new { message = "Posição inválida. Use 'carrossel', 'secao' ou 'ambos'." });

            var banner = new Banner
            {
                Titulo = dto.Titulo.Trim(),
                Subtitulo = dto.Subtitulo?.Trim(),
                ImagemUrl = dto.ImagemUrl.Trim(),
                LinkTipo = tipoLink,
                LinkValor = dto.LinkValor?.Trim(),
                Posicao = posicao,
                Ordem = dto.Ordem,
                Ativo = dto.Ativo,
                DataInicio = dto.DataInicio,
                DataFim = dto.DataFim
            };

            _context.Banners.Add(banner);
            await _context.SaveChangesAsync();

            var resultado = await _context.Banners.FirstOrDefaultAsync(b => b.Id == banner.Id);
            return CreatedAtAction(nameof(GetBanner), new { id = banner.Id }, BannerDto(resultado!));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBanner(int id, [FromBody] CriarBannerDto dto)
        {
            var banner = await _context.Banners.FirstOrDefaultAsync(b => b.Id == id);
            if (banner == null) return NotFound();

            if (string.IsNullOrWhiteSpace(dto.Titulo))
                return BadRequest(new { message = "Informe o título do banner." });

            if (string.IsNullOrWhiteSpace(dto.ImagemUrl))
                return BadRequest(new { message = "Envie a imagem do banner." });

            var tipoLink = (dto.LinkTipo ?? "").Trim().ToLowerInvariant();
            if (tipoLink != "" && tipoLink != "produto" && tipoLink != "categoria" && tipoLink != "externo")
                return BadRequest(new { message = "Tipo de link inválido. Use 'produto', 'categoria' ou 'externo'." });

            var posicao = (dto.Posicao ?? "").Trim().ToLowerInvariant();
            if (posicao != "carrossel" && posicao != "secao" && posicao != "ambos")
                return BadRequest(new { message = "Posição inválida. Use 'carrossel', 'secao' ou 'ambos'." });

            banner.Titulo = dto.Titulo.Trim();
            banner.Subtitulo = dto.Subtitulo?.Trim();
            banner.ImagemUrl = dto.ImagemUrl.Trim();
            banner.LinkTipo = tipoLink;
            banner.LinkValor = dto.LinkValor?.Trim();
            banner.Posicao = posicao;
            banner.Ordem = dto.Ordem;
            banner.Ativo = dto.Ativo;
            banner.DataInicio = dto.DataInicio;
            banner.DataFim = dto.DataFim;

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBanner(int id)
        {
            var banner = await _context.Banners.FindAsync(id);
            if (banner == null) return NotFound();

            _context.Banners.Remove(banner);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}