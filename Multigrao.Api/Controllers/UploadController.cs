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

            var uploadsDir = Path.Combine(_env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot"), "uploads");
            Directory.CreateDirectory(uploadsDir);

            var nomeArquivo = $"{Guid.NewGuid()}{ext}";
            var caminho = Path.Combine(uploadsDir, nomeArquivo);

            using var stream = new FileStream(caminho, FileMode.Create);
            await file.CopyToAsync(stream);

            var url = $"/uploads/{nomeArquivo}";
            return Ok(new { url });
        }
    }
}
