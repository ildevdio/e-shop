using Microsoft.AspNetCore.Mvc;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UploadController : ControllerBase
    {
        private readonly IWebHostEnvironment _env;

        public UploadController(IWebHostEnvironment env)
        {
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

            var uploadsDir = GetUploadsDir();
            Directory.CreateDirectory(uploadsDir);

            var nomeArquivo = $"{Guid.NewGuid()}{ext}";
            var caminho = Path.Combine(uploadsDir, nomeArquivo);

            using var stream = new FileStream(caminho, FileMode.Create);
            await file.CopyToAsync(stream);

            var url = $"{Request.Scheme}://{Request.Host}/api/Upload/{nomeArquivo}";
            return Ok(new { url });
        }

        [HttpPost("arquivo")]
        public async Task<IActionResult> UploadArquivo(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Arquivo não enviado." });

            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            var uploadsDir = GetUploadsDir();
            Directory.CreateDirectory(uploadsDir);

            var nomeArquivo = $"{Guid.NewGuid()}{ext}";
            var caminho = Path.Combine(uploadsDir, nomeArquivo);

            using var stream = new FileStream(caminho, FileMode.Create);
            await file.CopyToAsync(stream);

            var url = $"{Request.Scheme}://{Request.Host}/api/Upload/{nomeArquivo}";
            return Ok(new { url, nomeOriginal = file.FileName, tamanho = file.Length });
        }

        [HttpGet("{fileName}")]
        public IActionResult GetImagem(string fileName)
        {
            var uploadsDir = GetUploadsDir();
            var caminho = Path.Combine(uploadsDir, fileName);

            if (!System.IO.File.Exists(caminho))
                return NotFound();

            var ext = Path.GetExtension(fileName).ToLowerInvariant();
            var contentType = ext switch
            {
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".mp4" => "video/mp4",
                ".webm" => "video/webm",
                ".mov" => "video/quicktime",
                _ => "application/octet-stream",
            };

            return PhysicalFile(caminho, contentType);
        }

        private string GetUploadsDir()
        {
            return Path.Combine(
                _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"),
                "uploads"
            );
        }
    }
}
