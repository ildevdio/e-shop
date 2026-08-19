using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;
using Multigrao.Api.Services;
using System.Globalization;
using System.Text;
using System.Text.Json;
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
        private readonly IHttpClientFactory _httpClientFactory;

        public ConfiguracoesController(AppDbContext context, ITenantContext tenant, IAuthService authService, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _tenant = tenant;
            _authService = authService;
            _httpClientFactory = httpClientFactory;
        }

        [HttpGet]
        public async Task<IActionResult> GetConfiguracao()
        {
            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            if (config == null)
                return NotFound(new { message = "Empresa não encontrada." });

            return Ok(await ConfigDto(config));
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
            if (dto.Cep != null && !string.Equals(dto.Cep, config.Cep, StringComparison.Ordinal))
            {
                config.Latitude = null;
                config.Longitude = null;
            }
            config.Cep = dto.Cep;
            config.Logradouro = dto.Logradouro;
            config.Numero = dto.Numero;
            config.Bairro = dto.Bairro;
            config.Cidade = dto.Cidade;
            config.Estado = dto.Estado;
            config.Endereco = ComporEndereco(dto.Cep, dto.Logradouro, dto.Numero, dto.Bairro, dto.Cidade, dto.Estado) ?? dto.Endereco;
            if (dto.FreteAtivo.HasValue)
                config.FreteAtivo = dto.FreteAtivo.Value;
            if (dto.LogoUrl != null)
                config.LogoUrl = dto.LogoUrl;
            if (dto.Telefone != null)
                config.Telefone = dto.Telefone;
            if (dto.VideoUrl != null)
                config.VideoUrl = dto.VideoUrl;
            config.CorPrincipal = string.IsNullOrWhiteSpace(dto.CorPrincipal) ? "#0a0a0a" : dto.CorPrincipal;
            config.Fonte = string.IsNullOrWhiteSpace(dto.Fonte) ? "classica" : dto.Fonte;
            config.CorSecundaria = string.IsNullOrWhiteSpace(dto.CorSecundaria) ? "#f97316" : dto.CorSecundaria;
            config.CorFonte = dto.CorFonte;
            config.DesignEcommerce = string.IsNullOrWhiteSpace(dto.DesignEcommerce) ? "claro" : dto.DesignEcommerce;
            if (dto.TituloHero != null)
                config.TituloHero = dto.TituloHero;
            if (dto.SubtextoHero != null)
                config.SubtextoHero = dto.SubtextoHero;
            if (dto.ExibirNomeAbaixoLogo.HasValue)
                config.ExibirNomeAbaixoLogo = dto.ExibirNomeAbaixoLogo.Value;
            if (!string.IsNullOrWhiteSpace(dto.TipoMenu))
                config.TipoMenu = dto.TipoMenu;
            if (!string.IsNullOrWhiteSpace(dto.TipoCarrinho))
                config.TipoCarrinho = dto.TipoCarrinho;
            if (dto.LinksBio != null)
                config.LinksBio = dto.LinksBio;
            if (dto.Redirecionamentos != null)
                config.Redirecionamentos = dto.Redirecionamentos;
            if (!string.IsNullOrWhiteSpace(dto.HeroImagemTipo))
                config.HeroImagemTipo = dto.HeroImagemTipo;
            if (dto.MascoteUrl != null)
                config.MascoteUrl = dto.MascoteUrl;

            // SMTP E-mail
            if (dto.SmtpHost != null) config.SmtpHost = dto.SmtpHost;
            if (dto.SmtpPort.HasValue) config.SmtpPort = dto.SmtpPort.Value;
            if (dto.SmtpUsuario != null) config.SmtpUsuario = dto.SmtpUsuario;
            if (dto.SmtpSenha != null) config.SmtpSenha = dto.SmtpSenha;
            if (dto.SmtpNomeRemetente != null) config.SmtpNomeRemetente = dto.SmtpNomeRemetente;
            if (dto.SmtpEmailRemetente != null) config.SmtpEmailRemetente = dto.SmtpEmailRemetente;
            if (dto.SmtpUsarSsl.HasValue) config.SmtpUsarSsl = dto.SmtpUsarSsl.Value;
            if (dto.EmailNotificacoesAtivo.HasValue) config.EmailNotificacoesAtivo = dto.EmailNotificacoesAtivo.Value;

            await _context.SaveChangesAsync();

            return Ok(await ConfigDto(config));
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
                TituloHero = dto.TituloHero,
                SubtextoHero = dto.SubtextoHero,
                ExibirNomeAbaixoLogo = dto.ExibirNomeAbaixoLogo ?? true,
                TipoMenu = string.IsNullOrWhiteSpace(dto.TipoMenu) ? "dock" : dto.TipoMenu,
                TipoCarrinho = string.IsNullOrWhiteSpace(dto.TipoCarrinho) ? "pagina" : dto.TipoCarrinho,
                HeroImagemTipo = string.IsNullOrWhiteSpace(dto.HeroImagemTipo) ? "produto" : dto.HeroImagemTipo,
                MascoteUrl = dto.MascoteUrl,
                FreteAtivo = dto.FreteAtivo ?? false,
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
                    tituloHero = c.TituloHero,
                    subtextoHero = c.SubtextoHero,
                    exibirNomeAbaixoLogo = c.ExibirNomeAbaixoLogo,
                    tipoMenu = c.TipoMenu,
                    tipoCarrinho = c.TipoCarrinho,
                    heroImagemTipo = c.HeroImagemTipo,
                    mascoteUrl = c.MascoteUrl,
                    freteAtivo = c.FreteAtivo,
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
                if (dto.Cep != null && !string.Equals(dto.Cep, config.Cep, StringComparison.Ordinal))
                {
                    config.Latitude = null;
                    config.Longitude = null;
                }
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

            if (dto.FreteAtivo.HasValue)
                config.FreteAtivo = dto.FreteAtivo.Value;

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

            if (dto.TituloHero != null)
                config.TituloHero = dto.TituloHero;

            if (dto.SubtextoHero != null)
                config.SubtextoHero = dto.SubtextoHero;

            if (dto.ExibirNomeAbaixoLogo.HasValue)
                config.ExibirNomeAbaixoLogo = dto.ExibirNomeAbaixoLogo.Value;

            if (!string.IsNullOrWhiteSpace(dto.TipoMenu))
                config.TipoMenu = dto.TipoMenu;

            if (!string.IsNullOrWhiteSpace(dto.TipoCarrinho))
                config.TipoCarrinho = dto.TipoCarrinho;

            if (!string.IsNullOrWhiteSpace(dto.HeroImagemTipo))
                config.HeroImagemTipo = dto.HeroImagemTipo;

            if (dto.MascoteUrl != null)
                config.MascoteUrl = dto.MascoteUrl;

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
                tituloHero = config.TituloHero,
                subtextoHero = config.SubtextoHero,
                exibirNomeAbaixoLogo = config.ExibirNomeAbaixoLogo,
                tipoMenu = config.TipoMenu,
                tipoCarrinho = config.TipoCarrinho,
                heroImagemTipo = config.HeroImagemTipo,
                mascoteUrl = config.MascoteUrl,
                ativo = config.Ativo
            });
        }

        [HttpDelete("empresas/{id:int}")]
        [Authorize]
        public async Task<IActionResult> ExcluirEmpresa(int id)
        {
            if (_tenant.Slug != "focus")
                return Forbid();

            var config = await _context.ConfiguracoesSistema
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.Id == id);

            if (config == null)
                return NotFound(new { message = "Empresa não encontrada." });

            if (config.Slug == "focus")
                return BadRequest(new { message = "A plataforma Focus não pode ser excluída." });

            await using var transaction = await _context.Database.BeginTransactionAsync();

            // Ordem: filhos -> pais, respeitando as restrições de chave estrangeira.
            await _context.VotosEnquete.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.OpcoesEnquete.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Enquetes.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();

            var idsUsuarios = await _context.Usuarios
                .IgnoreQueryFilters()
                .Where(u => u.EmpresaId == id)
                .Select(u => u.Id)
                .ToListAsync();
            if (idsUsuarios.Count > 0)
                await _context.UsuarioSetores.IgnoreQueryFilters().Where(us => idsUsuarios.Contains(us.UsuarioId)).ExecuteDeleteAsync();

            await _context.ItensPedido.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.EntregasPedidos.IgnoreQueryFilters()
                .Where(ep =>
                    _context.Entregas.IgnoreQueryFilters().Where(e => e.EmpresaId == id).Select(e => e.Id).Contains(ep.EntregaId) ||
                    _context.Pedidos.IgnoreQueryFilters().Where(p => p.EmpresaId == id).Select(p => p.Id).Contains(ep.PedidoId))
                .ExecuteDeleteAsync();
            await _context.Entregas.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Pedidos.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.AtendimentoLeads.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Mensagens.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Conversas.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.CarrinhoItens.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Carrinhos.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.PromocoesProduto.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Promocoes.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.FaixasFrete.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Notificacoes.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Avisos.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Contatos.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Clientes.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Produtos.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Categorias.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Marcas.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Rotas.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Veiculos.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.Usuarios.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.ArquivosUpload.IgnoreQueryFilters().Where(x => x.EmpresaId == id).ExecuteDeleteAsync();
            await _context.ConfiguracoesSistema.IgnoreQueryFilters().Where(c => c.Id == id).ExecuteDeleteAsync();

            await transaction.CommitAsync();

            return Ok(new { id = config.Id, slug = config.Slug, nomeEmpresa = config.NomeEmpresa });
        }

        [HttpPut("faixas-frete")]
        [Authorize]
        public async Task<IActionResult> SalvarFaixasFrete([FromBody] List<FaixaFreteDto> faixas)
        {
            await _context.FaixasFrete.ExecuteDeleteAsync();

            var ordenadas = faixas
                .Where(f => f.AteKm > 0 && f.Valor >= 0)
                .OrderBy(f => f.AteKm)
                .ToList();

            for (int i = 0; i < ordenadas.Count; i++)
            {
                _context.FaixasFrete.Add(new FaixaFrete
                {
                    AteKm = ordenadas[i].AteKm,
                    Valor = ordenadas[i].Valor,
                    Ordem = i
                });
            }

            await _context.SaveChangesAsync();

            return Ok(await _context.FaixasFrete
                .OrderBy(f => f.AteKm)
                .Select(f => new { id = f.Id, ateKm = f.AteKm, valor = f.Valor })
                .ToListAsync());
        }

        [HttpPost("simular-frete")]
        public async Task<IActionResult> SimularFrete([FromBody] SimularFreteDto dto)
        {
            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            if (config == null)
                return NotFound(new { message = "Empresa não encontrada." });

            if (!config.FreteAtivo)
                return Ok(new { disponivel = false, mensagem = "A entrega com taxa de frete não está habilitada." });

            var cepOrigem = LimparCep(config.Cep);
            var cepDestino = LimparCep(dto.Cep);

            if (cepOrigem.Length != 8)
                return Ok(new { disponivel = false, mensagem = "Cadastre o CEP da empresa na configuração para calcular o frete." });

            if (cepDestino.Length != 8)
                return Ok(new { disponivel = false, mensagem = "Informe um CEP de destino válido." });

            double? origemLat = config.Latitude;
            double? origemLng = config.Longitude;

            if (!origemLat.HasValue || !origemLng.HasValue)
            {
                var coordsOrigem = await BuscarCoordenadas(cepOrigem);
                if (coordsOrigem is null)
                    return Ok(new { disponivel = false, mensagem = "Não foi possível localizar o CEP da empresa. Confira o CEP cadastrado." });

                config.Latitude = origemLat = coordsOrigem.Lat;
                config.Longitude = origemLng = coordsOrigem.Lng;
                await _context.SaveChangesAsync();
            }

            var coordsDestino = await BuscarCoordenadas(cepDestino);
            if (coordsDestino is null)
                return Ok(new { disponivel = false, mensagem = "CEP de destino não encontrado. Confira e tente novamente." });

            var distanciaKm = DistanciaKm(origemLat.Value, origemLng.Value, coordsDestino.Lat, coordsDestino.Lng);

            var faixas = await _context.FaixasFrete.OrderBy(f => f.AteKm).ToListAsync();
            var faixa = faixas.FirstOrDefault(f => distanciaKm <= (double)f.AteKm);

            if (faixa == null)
                return Ok(new { disponivel = false, distanciaKm = Math.Round(distanciaKm, 1), mensagem = "O endereço informado está fora da área de entrega." });

            return Ok(new
            {
                disponivel = true,
                distanciaKm = Math.Round(distanciaKm, 1),
                valorFrete = faixa.Valor,
                mensagem = $"Frete de R$ {faixa.Valor.ToString("0.##", CultureInfo.InvariantCulture)} para até {faixa.AteKm.ToString("0.#", CultureInfo.InvariantCulture)} km."
            });
        }

        private static string LimparCep(string? cep) => new((cep ?? "").Where(char.IsDigit).Take(8).ToArray());

        private record Coordenadas(double Lat, double Lng);

        private async Task<Coordenadas?> BuscarCoordenadas(string cep)
        {
            try
            {
                var http = _httpClientFactory.CreateClient();
                using var resp = await http.GetAsync($"https://brasilapi.com.br/api/cep/v2/{cep}");
                if (!resp.IsSuccessStatusCode)
                    return null;

                using var doc = JsonDocument.Parse(await resp.Content.ReadAsStringAsync());
                if (!doc.RootElement.TryGetProperty("location", out var location))
                    return null;
                var coords = location.GetProperty("coordinates");
                var lng = double.Parse(coords.GetProperty("longitude").GetString()!, CultureInfo.InvariantCulture);
                var lat = double.Parse(coords.GetProperty("latitude").GetString()!, CultureInfo.InvariantCulture);
                return new Coordenadas(lat, lng);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[BuscarCoordenadas] CEP={cep} ERRO: {ex}");
                return null;
            }
        }

        private static double DistanciaKm(double lat1, double lng1, double lat2, double lng2)
        {
            const double raioTerra = 6371;
            double dLat = (lat2 - lat1) * Math.PI / 180;
            double dLng = (lng2 - lng1) * Math.PI / 180;
            double a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                       Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                       Math.Sin(dLng / 2) * Math.Sin(dLng / 2);
            return raioTerra * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        }

        private async Task<object> ConfigDto(ConfiguracaoSistema config)
        {
            var faixas = await _context.FaixasFrete
                .OrderBy(f => f.AteKm)
                .Select(f => new { id = f.Id, ateKm = f.AteKm, valor = f.Valor })
                .ToListAsync();

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
                telefone = config.Telefone,
                videoUrl = config.VideoUrl,
                corPrincipal = config.CorPrincipal,
                fonte = config.Fonte,
                corSecundaria = config.CorSecundaria,
                corFonte = config.CorFonte,
                designEcommerce = config.DesignEcommerce,
                tituloHero = config.TituloHero,
                subtextoHero = config.SubtextoHero,
                exibirNomeAbaixoLogo = config.ExibirNomeAbaixoLogo,
                tipoMenu = config.TipoMenu,
                tipoCarrinho = config.TipoCarrinho,
                heroImagemTipo = config.HeroImagemTipo,
                mascoteUrl = config.MascoteUrl,
                freteAtivo = config.FreteAtivo,
                latitude = config.Latitude,
                longitude = config.Longitude,
                faixasFrete = faixas,
                linksBio = config.LinksBio,
                redirecionamentos = config.Redirecionamentos,
                smtpHost = config.SmtpHost,
                smtpPort = config.SmtpPort,
                smtpUsuario = config.SmtpUsuario,
                smtpSenha = config.SmtpSenha,
                smtpNomeRemetente = config.SmtpNomeRemetente,
                smtpEmailRemetente = config.SmtpEmailRemetente,
                smtpUsarSsl = config.SmtpUsarSsl,
                emailNotificacoesAtivo = config.EmailNotificacoesAtivo
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
