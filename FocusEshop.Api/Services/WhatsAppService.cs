using System.Text;
using System.Text.Json;
using Multigrao.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Multigrao.Api.Services
{
    public class WhatsAppService
    {
        private readonly AppDbContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<WhatsAppService> _logger;

        public WhatsAppService(AppDbContext context, IHttpClientFactory httpClientFactory, ILogger<WhatsAppService> logger)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _logger = logger;
        }

        public async Task<bool> EnviarMensagemAsync(string telefone, string mensagem)
        {
            try
            {
                var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
                if (config == null || string.IsNullOrEmpty(config.EvolutionApiUrl) || string.IsNullOrEmpty(config.EvolutionApiKey) || string.IsNullOrEmpty(config.EvolutionApiInstance))
                {
                    _logger.LogWarning("Evolution API não configurada.");
                    return false;
                }

                var baseUrl = config!.EvolutionApiUrl!.TrimEnd('/');
                var proto = config.EvolutionApiSsl ? "https" : "http";
                var url = $"{proto}://{baseUrl}/message/sendText/{config.EvolutionApiInstance}";

                var telefoneNumeros = new string(telefone.Where(char.IsDigit).ToArray());
                if (!telefoneNumeros.StartsWith("55"))
                    telefoneNumeros = "55" + telefoneNumeros;

                var payload = new
                {
                    number = telefoneNumeros,
                    text = mensagem
                };

                var json = JsonSerializer.Serialize(payload);
                var http = _httpClientFactory.CreateClient();
                http.DefaultRequestHeaders.Add("apikey", config.EvolutionApiKey);

                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var resp = await http.PostAsync(url, content);

                if (!resp.IsSuccessStatusCode)
                {
                    var body = await resp.Content.ReadAsStringAsync();
                    _logger.LogWarning("Evolution API retornou {StatusCode}: {Body}", resp.StatusCode, body);
                    return false;
                }

                _logger.LogInformation("Mensagem WhatsApp enviada para {Telefone}", telefoneNumeros);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar mensagem WhatsApp para {Telefone}", telefone);
                return false;
            }
        }

        public async Task<bool> VerificarConexaoAsync()
        {
            try
            {
                var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
                if (string.IsNullOrEmpty(config?.EvolutionApiUrl) || string.IsNullOrEmpty(config?.EvolutionApiKey) || string.IsNullOrEmpty(config?.EvolutionApiInstance))
                    return false;

                var baseUrl = config!.EvolutionApiUrl!.TrimEnd('/');
                var proto = config.EvolutionApiSsl ? "https" : "http";
                var url = $"{proto}://{baseUrl}/instance/connectionState/{config.EvolutionApiInstance}";

                var http = _httpClientFactory.CreateClient();
                http.DefaultRequestHeaders.Add("apikey", config.EvolutionApiKey);

                var resp = await http.GetAsync(url);
                return resp.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }
}
