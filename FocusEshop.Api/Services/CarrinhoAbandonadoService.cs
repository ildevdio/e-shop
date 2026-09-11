using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.Models;

namespace Multigrao.Api.Services
{
    public class CarrinhoAbandonadoService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<CarrinhoAbandonadoService> _logger;
        private readonly TimeSpan _intervaloVerificacao = TimeSpan.FromMinutes(5);

        public CarrinhoAbandonadoService(IServiceProvider serviceProvider, ILogger<CarrinhoAbandonadoService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("CarrinhoAbandonadoService iniciado.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await VerificarCarrinhosAbandonados(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao verificar carrinhos abandonados.");
                }

                await Task.Delay(_intervaloVerificacao, stoppingToken);
            }
        }

        private async Task VerificarCarrinhosAbandonados(CancellationToken ct)
        {
            using var scope = _serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<EmailService>();
            var whatsappService = scope.ServiceProvider.GetRequiredService<WhatsAppService>();

            var empresas = await context.ConfiguracoesSistema
                .Where(c => c.CarrinhoLembreteAtivo)
                .ToListAsync(ct);

            foreach (var config in empresas)
            {
                try
                {
                    var minutos = config.CarrinhoLembreteMinutos > 0 ? config.CarrinhoLembreteMinutos : 30;
                    var repetir = Math.Max(0, Math.Min(3, config.CarrinhoLembreteRepetir));
                    var intervaloRep = config.CarrinhoLembreteIntervaloRepeticao > 0 ? config.CarrinhoLembreteIntervaloRepeticao : 120;
                    var canal = config.CarrinhoLembreteCanal ?? "email";

                    var cutoff = DateTime.UtcNow.AddMinutes(-minutos);
                    var cutoffRepeticao = DateTime.UtcNow.AddMinutes(-minutos - (repetir * intervaloRep));

                    var carrinhos = await context.Carrinhos
                        .Where(c => c.EmpresaId == config.Id)
                        .Where(c => c.AtualizadoEm <= cutoff)
                        .Where(c => c.Itens.Any())
                        .ToListAsync(ct);

                    foreach (var carrinho in carrinhos)
                    {
                        if (ct.IsCancellationRequested) break;

                        var lembretesExistentes = await context.LembretesCarrinho
                            .Where(l => l.CarrinhoId == carrinho.Id)
                            .OrderByDescending(l => l.EnviadoEm)
                            .ToListAsync(ct);

                        var totalEnviados = lembretesExistentes.Count;

                        if (totalEnviados >= repetir + 1)
                            continue;

                        var ultimoEnvio = lembretesExistentes.FirstOrDefault()?.EnviadoEm ?? DateTime.MinValue;
                        var minutosDesdeUltimo = (DateTime.UtcNow - ultimoEnvio).TotalMinutes;

                        if (totalEnviados > 0 && minutosDesdeUltimo < intervaloRep)
                            continue;

                        var pedidoRecente = await context.Pedidos
                            .Where(p => p.EmpresaId == config.Id)
                            .Where(p => p.CpfCnpj == carrinho.CpfCnpj || (p.Cliente != null && p.Cliente.CpfCnpj == carrinho.CpfCnpj))
                            .Where(p => p.DataCriacao >= carrinho.AtualizadoEm)
                            .AnyAsync(ct);

                        if (pedidoRecente)
                            continue;

                        var cliente = await context.Clientes
                            .Where(c => c.EmpresaId == config.Id)
                            .Where(c => c.CpfCnpj == carrinho.CpfCnpj || c.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim() == carrinho.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim())
                            .FirstOrDefaultAsync(ct);

                        if (cliente == null)
                            continue;

                        var itens = await context.CarrinhoItens
                            .Where(ci => ci.CarrinhoId == carrinho.Id)
                            .Include(ci => ci.Produto)
                            .ToListAsync(ct);

                        if (!itens.Any())
                            continue;

                        var enviado = false;
                        var tipo = "";
                        var erro = (string?)null;

                        if ((canal == "email" || canal == "ambos") && !string.IsNullOrEmpty(cliente.Email))
                        {
                            try
                            {
                                await emailService.NotificarCarrinhoAbandonadoAsync(cliente, itens, config.Slug);
                                enviado = true;
                                tipo = "email";
                            }
                            catch (Exception ex)
                            {
                                erro = $"Email: {ex.Message}";
                                _logger.LogWarning(ex, "Erro ao enviar email carrinho abandonado para {CpfCnpj}", carrinho.CpfCnpj);
                            }
                        }

                        if ((canal == "whatsapp" || canal == "ambos") && !string.IsNullOrEmpty(cliente.Telefone))
                        {
                            try
                            {
                                var nomeEmpresa = config.NomeEmpresa;
                                var texto = $"Olá {cliente.RazaoSocialNome}! Você deixou produtos no carrinho em {nomeEmpresa}. Ainda dá tempo de finalizar sua compra! Acesse: https://shop.focus-solutions.tech/{config.Slug}/commerce?cpf={cliente.CpfCnpj}";
                                var ok = await whatsappService.EnviarMensagemAsync(cliente.Telefone, texto);
                                if (ok)
                                {
                                    enviado = true;
                                    tipo = string.IsNullOrEmpty(tipo) ? "whatsapp" : "ambos";
                                }
                                else
                                {
                                    erro = string.IsNullOrEmpty(erro) ? "WhatsApp: falha no envio" : erro + "; WhatsApp: falha no envio";
                                }
                            }
                            catch (Exception ex)
                            {
                                erro = $"WhatsApp: {ex.Message}";
                                _logger.LogWarning(ex, "Erro ao enviar WhatsApp carrinho abandonado para {CpfCnpj}", carrinho.CpfCnpj);
                            }
                        }

                        if (enviado || erro != null)
                        {
                            context.LembretesCarrinho.Add(new LembreteCarrinho
                            {
                                CarrinhoId = carrinho.Id,
                                Tipo = tipo,
                                EnviadoEm = DateTime.UtcNow,
                                Erro = erro
                            });
                            await context.SaveChangesAsync(ct);
                        }

                        await Task.Delay(1000, ct);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Erro ao processar carrinhos abandonados para empresa {EmpresaId}", config.Id);
                }
            }
        }
    }
}
