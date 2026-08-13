using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;
using Multigrao.Api.Services;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ConfiguracoesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ITenantContext _tenant;
        private readonly IAuthService _authService;

        public ConfiguracoesController(AppDbContext context, ITenantContext tenant, IAuthService authService)
        {
            _context = context;
            _tenant = tenant;
            _authService = authService;
        }

        [HttpGet]
        public async Task<IActionResult> GetConfiguracao()
        {
            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            if (config == null)
                return NotFound(new { message = "Empresa não encontrada." });

            return Ok(ConfigDto(config));
        }

        [HttpPut]
        public async Task<IActionResult> AtualizarConfiguracao([FromBody] ConfiguracaoSistemaDto dto)
        {
            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            if (config == null)
                return NotFound(new { message = "Empresa não encontrada." });

            if (!string.IsNullOrWhiteSpace(dto.NomeEmpresa))
                config.NomeEmpresa = dto.NomeEmpresa.Trim();

            if (dto.Cnpj != null)
            {
                var cnpj = FormatarCnpj(dto.Cnpj);
                if (cnpj == null)
                    return BadRequest(new { message = "Informe um CNPJ válido (14 dígitos)." });

                if (await CnpjEmUso(cnpj, config.Id))
                    return BadRequest(new { message = "Este CNPJ já está cadastrado para outra empresa." });

                config.Cnpj = cnpj;
            }

            config.Slogan = dto.Slogan;
            config.Cep = dto.Cep;
            config.Logradouro = dto.Logradouro;
            config.Numero = dto.Numero;
            config.Bairro = dto.Bairro;
            config.Cidade = dto.Cidade;
            config.Estado = dto.Estado;
            config.Endereco = ComporEndereco(dto.Cep, dto.Logradouro, dto.Numero, dto.Bairro, dto.Cidade, dto.Estado) ?? dto.Endereco;
            if (dto.LogoUrl != null)
                config.LogoUrl = dto.LogoUrl;
            if (dto.VideoUrl != null)
                config.VideoUrl = dto.VideoUrl;
            config.CorPrincipal = string.IsNullOrWhiteSpace(dto.CorPrincipal) ? "#0a0a0a" : dto.CorPrincipal;
            config.Fonte = string.IsNullOrWhiteSpace(dto.Fonte) ? "classica" : dto.Fonte;
            config.CorSecundaria = string.IsNullOrWhiteSpace(dto.CorSecundaria) ? "#f97316" : dto.CorSecundaria;
            config.CorFonte = dto.CorFonte;
            config.DesignEcommerce = string.IsNullOrWhiteSpace(dto.DesignEcommerce) ? "claro" : dto.DesignEcommerce;

            await _context.SaveChangesAsync();

            return Ok(ConfigDto(config));
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> CriarEmpresa([FromBody] CriarEmpresaDto dto)
        {
            if (_tenant.Slug != "focus")
                return Forbid();

            if (string.IsNullOrWhiteSpace(dto.NomeEmpresa))
                return BadRequest(new { message = "Informe o nome da empresa." });

            var slug = await GerarSlugUnico(dto.NomeEmpresa.Trim());

            var cnpj = FormatarCnpj(dto.Cnpj);
            if (dto.Cnpj != null && cnpj == null)
                return BadRequest(new { message = "Informe um CNPJ válido (14 dígitos)." });

            if (cnpj != null && await CnpjEmUso(cnpj, null))
                return BadRequest(new { message = "Este CNPJ já está cadastrado para outra empresa." });

            var config = new ConfiguracaoSistema
            {
                NomeEmpresa = dto.NomeEmpresa.Trim(),
                Slug = slug,
                Cnpj = cnpj,
                Slogan = dto.Slogan,
                Cep = dto.Cep,
                Logradouro = dto.Logradouro,
                Numero = dto.Numero,
                Bairro = dto.Bairro,
                Cidade = dto.Cidade,
                Estado = dto.Estado,
                LogoUrl = dto.LogoUrl,
                VideoUrl = dto.VideoUrl,
                CorPrincipal = string.IsNullOrWhiteSpace(dto.CorPrincipal) ? "#0a0a0a" : dto.CorPrincipal,
                Fonte = string.IsNullOrWhiteSpace(dto.Fonte) ? "classica" : dto.Fonte,
                CorSecundaria = string.IsNullOrWhiteSpace(dto.CorSecundaria) ? "#f97316" : dto.CorSecundaria,
                CorFonte = dto.CorFonte,
                DesignEcommerce = string.IsNullOrWhiteSpace(dto.DesignEcommerce) ? "claro" : dto.DesignEcommerce,
                Ativo = true
            };
            config.Endereco = ComporEndereco(dto.Cep, dto.Logradouro, dto.Numero, dto.Bairro, dto.Cidade, dto.Estado) ?? dto.Endereco;

            _context.ConfiguracoesSistema.Add(config);
            await _context.SaveChangesAsync();

            var login = string.IsNullOrWhiteSpace(dto.Login) ? "admin" : dto.Login.Trim();
            var senha = string.IsNullOrWhiteSpace(dto.Senha) ? "admin123" : dto.Senha;

            var usuario = new Usuario
            {
                Nome = $"Admin {config.NomeEmpresa}",
                UsuarioLogin = login,
                SenhaHash = _authService.HashPassword(senha),
                Role = "AdminMaster",
                Ativo = true,
                EmpresaId = config.Id
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = config.Id,
                slug = config.Slug,
                nomeEmpresa = config.NomeEmpresa,
                cnpj = config.Cnpj
            });
        }

        [HttpGet("empresas")]
        [Authorize]
        public async Task<IActionResult> ListarEmpresas()
        {
            if (_tenant.Slug != "focus")
                return Forbid();

            var empresas = await _context.ConfiguracoesSistema
                .AsNoTracking()
                .IgnoreQueryFilters()
                .OrderBy(c => c.NomeEmpresa)
                .Select(c => new
                {
                    id = c.Id,
                    slug = c.Slug,
                    nomeEmpresa = c.NomeEmpresa,
                    cnpj = c.Cnpj,
                    slogan = c.Slogan,
                    endereco = c.Endereco,
                    cep = c.Cep,
                    logradouro = c.Logradouro,
                    numero = c.Numero,
                    bairro = c.Bairro,
                    cidade = c.Cidade,
                    estado = c.Estado,
                    logoUrl = c.LogoUrl,
                    videoUrl = c.VideoUrl,
                    corPrincipal = c.CorPrincipal,
                    fonte = c.Fonte,
                    corSecundaria = c.CorSecundaria,
                    corFonte = c.CorFonte,
                    designEcommerce = c.DesignEcommerce,
                    ativo = c.Ativo
                })
                .ToListAsync();

            return Ok(empresas);
        }

        [HttpPut("empresas/{id:int}")]
        [Authorize]
        public async Task<IActionResult> AtualizarEmpresa(int id, [FromBody] AtualizarEmpresaDto dto)
        {
            if (_tenant.Slug != "focus")
                return Forbid();

            var config = await _context.ConfiguracoesSistema
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (config == null)
                return NotFound(new { message = "Empresa não encontrada." });

            if (!string.IsNullOrWhiteSpace(dto.NomeEmpresa))
                config.NomeEmpresa = dto.NomeEmpresa.Trim();

            if (dto.Cnpj != null)
            {
                var cnpj = FormatarCnpj(dto.Cnpj);
                if (cnpj == null)
                    return BadRequest(new { message = "Informe um CNPJ válido (14 dígitos)." });

                if (await CnpjEmUso(cnpj, config.Id))
                    return BadRequest(new { message = "Este CNPJ já está cadastrado para outra empresa." });

                config.Cnpj = cnpj;
            }

            if (dto.Slogan != null)
                config.Slogan = dto.Slogan;

            if (dto.Cep != null || dto.Logradouro != null || dto.Numero != null || dto.Bairro != null || dto.Cidade != null || dto.Estado != null)
            {
                config.Cep = dto.Cep;
                config.Logradouro = dto.Logradouro;
                config.Numero = dto.Numero;
                config.Bairro = dto.Bairro;
                config.Cidade = dto.Cidade;
                config.Estado = dto.Estado;
                config.Endereco = ComporEndereco(dto.Cep, dto.Logradouro, dto.Numero, dto.Bairro, dto.Cidade, dto.Estado) ?? dto.Endereco ?? config.Endereco;
            }
            else if (dto.Endereco != null)
            {
                config.Endereco = dto.Endereco;
            }

            if (dto.LogoUrl != null)
                config.LogoUrl = dto.LogoUrl;

            if (dto.VideoUrl != null)
                config.VideoUrl = dto.VideoUrl;

            if (!string.IsNullOrWhiteSpace(dto.CorPrincipal))
                config.CorPrincipal = dto.CorPrincipal;

            if (!string.IsNullOrWhiteSpace(dto.Fonte))
                config.Fonte = dto.Fonte;

            if (!string.IsNullOrWhiteSpace(dto.CorSecundaria))
                config.CorSecundaria = dto.CorSecundaria;

            if (dto.CorFonte != null)
                config.CorFonte = dto.CorFonte;

            if (!string.IsNullOrWhiteSpace(dto.DesignEcommerce))
                config.DesignEcommerce = dto.DesignEcommerce;

            if (dto.Ativo.HasValue)
                config.Ativo = dto.Ativo.Value;

            if (!string.IsNullOrWhiteSpace(dto.Slug))
            {
                var novoSlug = GerarSlug(dto.Slug.Trim());
                if (novoSlug != config.Slug)
                {
                    var slugBase = novoSlug;
                    var slug = novoSlug;
                    var contador = 2;
                    while (await _context.ConfiguracoesSistema.IgnoreQueryFilters().AnyAsync(c => c.Slug == slug && c.Id != id))
                    {
                        slug = $"{slugBase}-{contador}";
                        contador++;
                    }
                    config.Slug = slug;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                id = config.Id,
                slug = config.Slug,
                nomeEmpresa = config.NomeEmpresa,
                cnpj = config.Cnpj,
                slogan = config.Slogan,
                endereco = config.Endereco,
                cep = config.Cep,
                logradouro = config.Logradouro,
                numero = config.Numero,
                bairro = config.Bairro,
                cidade = config.Cidade,
                estado = config.Estado,
                logoUrl = config.LogoUrl,
                videoUrl = config.VideoUrl,
                corPrincipal = config.CorPrincipal,
                fonte = config.Fonte,
                corSecundaria = config.CorSecundaria,
                corFonte = config.CorFonte,
                designEcommerce = config.DesignEcommerce,
                ativo = config.Ativo
            });
        }

        private static object ConfigDto(ConfiguracaoSistema config)
        {
            return new
            {
                slug = config.Slug,
                nomeEmpresa = config.NomeEmpresa,
                cnpj = config.Cnpj,
                slogan = config.Slogan,
                endereco = config.Endereco,
                cep = config.Cep,
                logradouro = config.Logradouro,
                numero = config.Numero,
                bairro = config.Bairro,
                cidade = config.Cidade,
                estado = config.Estado,
                logoUrl = config.LogoUrl,
                videoUrl = config.VideoUrl,
                corPrincipal = config.CorPrincipal,
                fonte = config.Fonte,
                corSecundaria = config.CorSecundaria,
                corFonte = config.CorFonte,
                designEcommerce = config.DesignEcommerce
            };
        }

        private static string? ComporEndereco(string? cep, string? logradouro, string? numero, string? bairro, string? cidade, string? estado)
        {
            var partes = new List<string>();

            var logradouroComNumero = $"{logradouro?.Trim()}{(string.IsNullOrWhiteSpace(numero) ? "" : $", {numero.Trim()}")}".Trim();
            if (logradouroComNumero.Length > 0)
                partes.Add(logradouroComNumero);

            if (!string.IsNullOrWhiteSpace(bairro))
                partes.Add(bairro.Trim());

            var cidadeEstado = string.Join(" — ", new[] { cidade?.Trim(), estado?.Trim() }.Where(s => !string.IsNullOrWhiteSpace(s)));
            if (cidadeEstado.Length > 0)
                partes.Add(cidadeEstado);

            if (!string.IsNullOrWhiteSpace(cep))
                partes.Add($"CEP {cep.Trim()}");

            return partes.Count > 0 ? string.Join(" — ", partes) : null;
        }

        private async Task<string> GerarSlugUnico(string nome)
        {
            var baseSlug = GerarSlug(nome);
            var slug = baseSlug;
            var contador = 2;

            while (await _context.ConfiguracoesSistema.IgnoreQueryFilters().AnyAsync(c => c.Slug == slug))
            {
                slug = $"{baseSlug}-{contador}";
                contador++;
            }

            return slug;
        }

        private static string GerarSlug(string nome)
        {
            var slug = nome.Normalize(NormalizationForm.FormD);
            slug = new string(slug
                .Where(c => CharUnicodeInfo.GetUnicodeCategory(c) != UnicodeCategory.NonSpacingMark)
                .ToArray());
            slug = slug.ToLowerInvariant();
            slug = Regex.Replace(slug, @"[^a-z0-9]+", "-").Trim('-');
            return string.IsNullOrWhiteSpace(slug) ? "empresa" : slug;
        }

        private static string? FormatarCnpj(string? valor)
        {
            if (string.IsNullOrWhiteSpace(valor)) return null;
            var digitos = new string(valor.Where(char.IsDigit).ToArray());
            if (digitos.Length != 14)
                return null;
            return $"{digitos.Substring(0, 2)}.{digitos.Substring(2, 3)}.{digitos.Substring(5, 3)}/{digitos.Substring(8, 4)}-{digitos.Substring(12, 2)}";
        }

        private async Task<bool> CnpjEmUso(string cnpj, int? ignorarId)
        {
            var digitos = new string(cnpj.Where(char.IsDigit).ToArray());
            var empresas = await _context.ConfiguracoesSistema
                .IgnoreQueryFilters()
                .AsNoTracking()
                .Where(c => c.Cnpj != null)
                .ToListAsync();
            return empresas.Any(c =>
                (ignorarId == null || c.Id != ignorarId) &&
                new string(c.Cnpj!.Where(char.IsDigit).ToArray()) == digitos);
        }
    }
}
