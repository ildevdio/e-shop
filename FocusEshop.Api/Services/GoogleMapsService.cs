using System.Text.Json;
using FocusEshop.Api.DTOs;

namespace FocusEshop.Api.Services
{
    public class GoogleMapsService
    {
        private readonly IHttpClientFactory _httpClientFactory;

        public GoogleMapsService(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        public async Task<ResultadoBuscaDto?> BuscarEmpresasProximasAsync(
            string apiKey,
            double latitude,
            double longitude,
            int raioKm,
            List<string> categorias,
            int limite,
            string? proximoToken = null)
        {
            try
            {
                var http = _httpClientFactory.CreateClient();
                var raioMetros = raioKm * 1000;
                var tipo = categorias.Count == 1
                    ? categorias[0]
                    : null;

                if (!string.IsNullOrEmpty(proximoToken))
                {
                    return await BuscarComTokenAsync(http, apiKey, proximoToken);
                }

                if (!string.IsNullOrEmpty(tipo))
                {
                    return await BuscarNearbyAsync(http, apiKey, latitude, longitude, raioMetros, tipo, limite);
                }

                    return await BuscarNearbyComTiposMultiplosAsync(http, apiKey, latitude, longitude, raioMetros, categorias, limite);
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[GoogleMapsService] ERRO: {ex}");
                return null;
            }
        }

        public async Task<ResultadoBuscaDto?> GeocodificarEnderecoAsync(string apiKey, string endereco)
        {
            try
            {
                var http = _httpClientFactory.CreateClient();
                var encoded = Uri.EscapeDataString(endereco);
                var url = $"https://maps.googleapis.com/maps/api/geocode/json?address={encoded}&key={apiKey}&language=pt-BR";

                using var resp = await http.GetAsync(url);
                if (!resp.IsSuccessStatusCode) return null;

                var json = await resp.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(json);

                var status = doc.RootElement.GetProperty("status").GetString();
                if (status != "OK")
                {
                    var msg = ExtrairErroGoogle(doc, "geocodificar o endereço");
                    throw new InvalidOperationException(msg);
                }

                var results = doc.RootElement.GetProperty("results");
                if (results.GetArrayLength() == 0)
                    throw new InvalidOperationException("Não foi possível localizar o endereço informado no Google Maps.");

                var first = results[0];
                var location = first.GetProperty("geometry").GetProperty("location");
                var lat = location.GetProperty("lat").GetDouble();
                var lng = location.GetProperty("lng").GetDouble();
                var formattedAddress = first.GetProperty("formatted_address").GetString() ?? "";

                return new ResultadoBuscaDto
                {
                    Resultados = new List<EmpresaEncontradaDto>
                    {
                        new()
                        {
                            Nome = "Localização",
                            Endereco = formattedAddress,
                            Latitude = lat,
                            Longitude = lng
                        }
                    },
                    TotalEncontrado = 1
                };
            }
            catch (InvalidOperationException)
            {
                throw;
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"[GoogleMapsService] Geocoding ERRO: {ex}");
                return null;
            }
        }

        private async Task<ResultadoBuscaDto?> BuscarNearbyAsync(
            HttpClient http, string apiKey,
            double lat, double lng, int raioMetros,
            string tipo, int limite)
        {
            var encodedTipo = Uri.EscapeDataString(tipo);
            var url = $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}&radius={raioMetros}&type={encodedTipo}&key={apiKey}&language=pt-BR";

            if (limite > 20)
                url += "&limit=20";

            return await ExecutarBuscaAsync(http, url, limite);
        }

        private async Task<ResultadoBuscaDto?> BuscarNearbyComTiposMultiplosAsync(
            HttpClient http, string apiKey,
            double lat, double lng, int raioMetros,
            List<string> categorias, int limite)
        {
            var resultados = new List<EmpresaEncontradaDto>();
            string? ultimoToken = null;

            foreach (var categoria in categorias)
            {
                if (resultados.Count >= limite) break;

                var encodedTipo = Uri.EscapeDataString(categoria);
                var url = $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}&radius={raioMetros}&type={encodedTipo}&key={apiKey}&language=pt-BR";

                var resultado = await ExecutarBuscaAsync(http, url, limite - resultados.Count);
                if (resultado != null)
                {
                    resultados.AddRange(resultado.Resultados);
                    ultimoToken = resultado.ProximoToken;
                }

                await Task.Delay(200);
            }

            return new ResultadoBuscaDto
            {
                Resultados = resultados.Take(limite).ToList(),
                ProximoToken = ultimoToken,
                TotalEncontrado = resultados.Count
            };
        }

        private async Task<ResultadoBuscaDto?> BuscarComTokenAsync(HttpClient http, string apiKey, string token)
        {
            var url = $"https://maps.googleapis.com/maps/api/place/nearbysearch/json?pagetoken={Uri.EscapeDataString(token)}&key={apiKey}&language=pt-BR";

            await Task.Delay(2000);

            return await ExecutarBuscaAsync(http, url, 20);
        }

        private async Task<ResultadoBuscaDto?> ExecutarBuscaAsync(HttpClient http, string url, int limite)
        {
            using var resp = await http.GetAsync(url);
            if (!resp.IsSuccessStatusCode) return null;

            var json = await resp.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);

            var status = doc.RootElement.GetProperty("status").GetString();
            if (status != "OK")
            {
                var msg = ExtrairErroGoogle(doc, "buscar empresas no Google Maps");
                throw new InvalidOperationException(msg);
            }

            var results = doc.RootElement.GetProperty("results");
            var empresas = new List<EmpresaEncontradaDto>();

            foreach (var place in results.EnumerateArray())
            {
                if (empresas.Count >= limite) break;

                var geometry = place.TryGetProperty("geometry", out var g) ? g : default;
                var location = geometry.TryGetProperty("location", out var loc) ? loc : default;
                var lat = location.TryGetProperty("lat", out var latProp) ? latProp.GetDouble() : (double?)null;
                var lng = location.TryGetProperty("lng", out var lngProp) ? lngProp.GetDouble() : (double?)null;

                var name = place.TryGetProperty("name", out var nameProp) ? nameProp.GetString() ?? "" : "";
                var placeId = place.TryGetProperty("place_id", out var pidProp) ? pidProp.GetString() : null;

                var vicinity = place.TryGetProperty("vicinity", out var vicProp) ? vicProp.GetString() ?? "" : "";

                var rating = place.TryGetProperty("rating", out var ratProp) ? ratProp.GetDouble() : (double?)null;
                var totalRatings = place.TryGetProperty("user_ratings_total", out var ursProp) ? ursProp.GetInt32() : (int?)null;

                var isOpenNow = false;
                if (place.TryGetProperty("opening_hours", out var oh) && oh.TryGetProperty("open_now", out var on))
                    isOpenNow = on.GetBoolean();

                var types = new List<string>();
                if (place.TryGetProperty("types", out var typesProp))
                {
                    foreach (var t in typesProp.EnumerateArray())
                        types.Add(t.GetString() ?? "");
                }

                string? telefone = null;
                string? site = null;

                empresas.Add(new EmpresaEncontradaDto
                {
                    Nome = name,
                    Endereco = vicinity,
                    Telefone = telefone,
                    Avaliacao = rating,
                    TotalAvaliacoes = totalRatings,
                    Site = site,
                    PlaceId = placeId,
                    Latitude = lat,
                    Longitude = lng,
                    Categoria = types.FirstOrDefault(t => t != "point_of_interest" && t != "establishment") ?? "",
                    AbertoAgora = isOpenNow
                });
            }

            string? nextToken = null;
            if (doc.RootElement.TryGetProperty("next_page_token", out var npt))
                nextToken = npt.GetString();

            return new ResultadoBuscaDto
            {
                Resultados = empresas,
                ProximoToken = nextToken,
                TotalEncontrado = empresas.Count
            };
        }

        private static string ExtrairErroGoogle(JsonDocument doc, string acao)
        {
            var motivo = "resposta inesperada do Google Maps";
            if (doc.RootElement.TryGetProperty("error_message", out var em))
                motivo = em.GetString() ?? motivo;
            else if (doc.RootElement.TryGetProperty("status", out var st))
                motivo = $"status {st.GetString()}";

            if (doc.RootElement.TryGetProperty("status", out var st2) && st2.GetString() == "REQUEST_DENIED")
                motivo = "A chave de API não tem permissão ou a API não está habilitada no Google Cloud Console.";

            return $"Não foi possível {acao}: {motivo}";
        }
    }
}
