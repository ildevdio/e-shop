using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;
using Multigrao.Api.Services;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProspectController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly GoogleMapsService _googleMaps;

        public ProspectController(AppDbContext context, GoogleMapsService googleMaps)
        {
            _context = context;
            _googleMaps = googleMaps;
        }

        [HttpPost("buscar")]
        public async Task<IActionResult> Buscar([FromBody] BuscaProspeccaoDto dto)
        {
            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            if (config == null)
                return NotFound(new { message = "Empresa não encontrada." });

            if (string.IsNullOrWhiteSpace(config.GoogleMapsApiKey))
                return BadRequest(new { message = "Configure a chave da API do Google Maps nas Configurações > Sistema > Prospecção." });

            double? lat = dto.Latitude;
            double? lng = dto.Longitude;

            try
            {
                if (!lat.HasValue || !lng.HasValue)
                {
                    if (!string.IsNullOrWhiteSpace(dto.EnderecoOuCidade))
                    {
                        var geo = await _googleMaps.GeocodificarEnderecoAsync(config.GoogleMapsApiKey, dto.EnderecoOuCidade);
                        if (geo == null || geo.Resultados.Count == 0)
                            return BadRequest(new { message = "Não foi possível localizar o endereço informado." });

                        lat = geo.Resultados[0].Latitude;
                        lng = geo.Resultados[0].Longitude;
                    }
                    else
                    {
                        return BadRequest(new { message = "Informe um endereço/cidade ou coordenadas (latitude e longitude)." });
                    }
                }

                var categorias = dto.Categorias?.Where(c => !string.IsNullOrWhiteSpace(c)).ToList() ?? new List<string>();
                if (categorias.Count == 0)
                    categorias = new List<string> { "establishment" };

                var resultado = await _googleMaps.BuscarEmpresasProximasAsync(
                    config.GoogleMapsApiKey,
                    lat.Value,
                    lng.Value,
                    dto.RaioKm,
                    categorias,
                    dto.Limite,
                    dto.ProximoToken);

                if (resultado == null)
                    return BadRequest(new { message = "Erro ao buscar empresas no Google Maps." });

                return Ok(new
                {
                    resultados = resultado.Resultados,
                    proximoToken = resultado.ProximoToken,
                    totalEncontrado = resultado.TotalEncontrado,
                    centro = new { latitude = lat, longitude = lng }
                });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> Listar([FromQuery] string? status, [FromQuery] string? busca)
        {
            var query = _context.Prospects.AsQueryable();

            if (!string.IsNullOrWhiteSpace(status) && status != "Todos")
                query = query.Where(p => p.Status == status);

            if (!string.IsNullOrWhiteSpace(busca))
            {
                var b = busca.ToLower();
                query = query.Where(p =>
                    p.NomeEmpresa.ToLower().Contains(b) ||
                    p.NomeFantasia.ToLower().Contains(b) ||
                    p.Cidade.ToLower().Contains(b) ||
                    p.Bairro.ToLower().Contains(b) ||
                    p.Categoria.ToLower().Contains(b) ||
                    p.Telefone.Contains(b));
            }

            var prospects = await query
                .OrderByDescending(p => p.DataCriacao)
                .Select(p => new ProspectResponseDto
                {
                    Id = p.Id,
                    NomeEmpresa = p.NomeEmpresa,
                    NomeFantasia = p.NomeFantasia,
                    EnderecoCompleto = p.EnderecoCompleto,
                    Logradouro = p.Logradouro,
                    Numero = p.Numero,
                    Bairro = p.Bairro,
                    Cidade = p.Cidade,
                    Estado = p.Estado,
                    Cep = p.Cep,
                    Latitude = p.Latitude,
                    Longitude = p.Longitude,
                    Telefone = p.Telefone,
                    Email = p.Email,
                    Site = p.Site,
                    Categoria = p.Categoria,
                    PlaceId = p.PlaceId,
                    Rating = p.Rating,
                    TotalAvaliacoes = p.TotalAvaliacoes,
                    Status = p.Status,
                    Observacoes = p.Observacoes,
                    DataCriacao = p.DataCriacao,
                    DataAtualizacao = p.DataAtualizacao
                })
                .ToListAsync();

            return Ok(prospects);
        }

        [HttpPost("salvar")]
        public async Task<IActionResult> Salvar([FromBody] SalvarProspectDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.NomeEmpresa))
                return BadRequest(new { message = "Informe o nome da empresa." });

            var existente = await _context.Prospects
                .FirstOrDefaultAsync(p => p.PlaceId != null && dto.PlaceId != null && p.PlaceId == dto.PlaceId);

            if (existente != null)
                return Conflict(new { message = "Este estabelecimento já foi salvo como prospect.", id = existente.Id });

            var prospect = new Prospect
            {
                NomeEmpresa = dto.NomeEmpresa.Trim(),
                NomeFantasia = dto.NomeFantasia ?? "",
                EnderecoCompleto = dto.EnderecoCompleto ?? "",
                Logradouro = dto.Logradouro ?? "",
                Numero = dto.Numero ?? "",
                Bairro = dto.Bairro ?? "",
                Cidade = dto.Cidade ?? "",
                Estado = dto.Estado ?? "",
                Cep = dto.Cep ?? "",
                Latitude = dto.Latitude,
                Longitude = dto.Longitude,
                Telefone = dto.Telefone ?? "",
                Email = dto.Email ?? "",
                Site = dto.Site,
                Categoria = dto.Categoria ?? "",
                PlaceId = dto.PlaceId,
                Rating = dto.Rating,
                TotalAvaliacoes = dto.TotalAvaliacoes,
                Status = "Novo",
                DataCriacao = DateTime.UtcNow,
                DataAtualizacao = DateTime.UtcNow
            };

            _context.Prospects.Add(prospect);
            await _context.SaveChangesAsync();

            return Ok(new { id = prospect.Id, message = "Prospect salvo com sucesso." });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Atualizar(int id, [FromBody] AtualizarProspectDto dto)
        {
            var prospect = await _context.Prospects.FindAsync(id);
            if (prospect == null)
                return NotFound(new { message = "Prospect não encontrado." });

            if (dto.Status != null)
                prospect.Status = dto.Status;
            if (dto.Observacoes != null)
                prospect.Observacoes = dto.Observacoes;

            prospect.DataAtualizacao = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Prospect atualizado." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Excluir(int id)
        {
            var prospect = await _context.Prospects.FindAsync(id);
            if (prospect == null)
                return NotFound(new { message = "Prospect não encontrado." });

            _context.Prospects.Remove(prospect);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Prospect excluído." });
        }

        [HttpGet("categorias-predefinidas")]
        public IActionResult CategoriasPredefinidas()
        {
            return Ok(new[]
            {
                new { valor = "supermarket", nome = "Supermercado" },
                new { valor = "grocery_or_supermarket", nome = "Mercearia" },
                new { valor = "bakery", nome = "Padaria" },
                new { valor = "convenience_store", nome = "Loja de conveniência" },
                new { valor = "restaurant", nome = "Restaurante" },
                new { valor = "cafe", nome = "Café" },
                new { valor = "pharmacy", nome = "Farmácia" },
                new { valor = "health", nome = "Saúde" },
                new { valor = "store", nome = "Loja" },
                new { valor = "food", nome = "Alimentação" },
                new { valor = "meal_takeaway", nome = "Delivery" },
                new { valor = "gas_station", nome = "Posto de gasolina" },
                new { valor = "gym", nome = "Academia" },
                new { valor = "beauty_salon", nome = "Salão de beleza" },
                new { valor = "pet_store", nome = "Pet shop" },
                new { valor = "hardware_store", nome = "Loja de materiais" },
                new { valor = "clothing_store", nome = "Loja de roupas" },
                new { valor = "electronics_store", nome = "Loja de eletrônicos" },
                new { valor = "furniture_store", nome = "Loja de móveis" },
                new { valor = "florist", nome = "Floricultura" }
            });
        }
    }
}
