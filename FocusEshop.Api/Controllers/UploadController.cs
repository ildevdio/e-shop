using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;
using Multigrao.Api.Services;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenant;
        private readonly IWebHostEnvironment _env;

        public UploadController(AppDbContext context, ITenantContext tenant, IWebHostEnvironment env)
        {
            _context = context;
            _tenant = tenant;
            _env = env;
        }

        [HttpPost("imagem")]
        public async Task<IActionResult> UploadImagem(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Arquivo não enviado." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".jpg" && ext != ".jpeg" && ext != ".png")
                return BadRequest(new { message = "Apenas arquivos JPG e PNG são permitidos." });

            var contentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                _ => "application/octet-stream"
            };

            var nomeArquivo = await SalvarNoBanco(file, ext, contentType);
            var url = $"/api/Upload/{nomeArquivo}";
            return Ok(new { url });
        }

        [HttpPost("arquivo")]
        public async Task<IActionResult> UploadArquivo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Arquivo não enviado." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var contentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".mp4" => "video/mp4",
                ".webm" => "video/webm",
                ".mov" => "video/quicktime",
                _ => "application/octet-stream"
            };

            var nomeArquivo = await SalvarNoBanco(file, ext, contentType);
            var url = $"/api/Upload/{nomeArquivo}";
            return Ok(new { url, nomeOriginal = file.FileName, tamanho = file.Length });
        }

        private async Task<string> SalvarNoBanco(IFormFile file, string ext, string contentType)
        {
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);

            var nomeArquivo = $"{Guid.NewGuid()}{ext}";
            var upload = new ArquivoUpload
            {
                EmpresaId = _tenant.EmpresaId,
                FileName = nomeArquivo,
                ContentType = contentType,
                Conteudo = ms.ToArray()
            };

            _context.ArquivosUpload.Add(upload);
            await _context.SaveChangesAsync();

            // Remove arquivo legado em disco (se existir) para não acumular no container
            var caminhoLegado = Path.Combine(GetUploadsDir(), nomeArquivo);
            if (System.IO.File.Exists(caminhoLegado))
                System.IO.File.Delete(caminhoLegado);

            return nomeArquivo;
        }

        [HttpGet("{fileName}")]
        public async Task<IActionResult> GetImagem(string fileName)
        {
            var arquivo = await _context.ArquivosUpload
                .IgnoreQueryFilters()
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.FileName == fileName);

            if (arquivo != null && arquivo.Conteudo.Length > 0)
            {
                var contentType = arquivo.ContentType ?? ContentTypePorExtensao(fileName);
                return File(arquivo.Conteudo, contentType);
            }

            // Fallback: arquivos legados gravados em disco antes do armazenamento em banco
            var uploadsDir = GetUploadsDir();
            var caminho = Path.Combine(uploadsDir, fileName);

            if (!System.IO.File.Exists(caminho))
                return NotFound();

            return PhysicalFile(caminho, ContentTypePorExtensao(fileName));
        }

        private string GetUploadsDir()
        {
            return Path.Combine(
                _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"),
                "uploads"
            );
        }

        private static string ContentTypePorExtensao(string fileName)
        {
            return Path.GetExtension(fileName).ToLowerInvariant() switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".mp4" => "video/mp4",
                ".webm" => "video/webm",
                ".mov" => "video/quicktime",
                _ => "application/octet-stream",
            };
        }
    }
}
