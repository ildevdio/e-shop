using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using Multigrao.Api.Data;
using Multigrao.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Multigrao.Api.Services
{
    public class EmailService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<EmailService> _logger;

        public EmailService(AppDbContext context, ILogger<EmailService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> EnviarEmailAsync(string destinatario, string assunto, string htmlBody)
        {
            try
            {
                var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
                if (config == null || !config.EmailNotificacoesAtivo || string.IsNullOrEmpty(config.SmtpHost))
                {
                    _logger.LogWarning("E-mail não configurado ou desativado.");
                    return false;
                }

                var email = new MimeMessage();
                email.From.Add(new MailboxAddress(
                    config.SmtpNomeRemetente ?? config.NomeEmpresa,
                    config.SmtpEmailRemetente ?? config.SmtpUsuario));
                email.To.Add(MailboxAddress.Parse(destinatario));
                email.Subject = assunto;

                var bodyBuilder = new BodyBuilder { HtmlBody = htmlBody };
                email.Body = bodyBuilder.ToMessageBody();

                using var smtp = new SmtpClient();
                await smtp.ConnectAsync(
                    config.SmtpHost,
                    config.SmtpPort ?? 587,
                    config.SmtpUsarSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
                await smtp.AuthenticateAsync(config.SmtpUsuario, config.SmtpSenha);
                await smtp.SendAsync(email);
                await smtp.DisconnectAsync(true);

                _logger.LogInformation("E-mail enviado para {Destinatario}: {Assunto}", destinatario, assunto);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Erro ao enviar e-mail para {Destinatario}", destinatario);
                return false;
            }
        }

        public async Task NotificarPedidoConfirmadoAsync(Pedido pedido)
        {
            if (pedido.Cliente == null) return;
            var destinatario = pedido.Cliente.Email;
            if (string.IsNullOrEmpty(destinatario)) return;

            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            var empresa = config?.NomeEmpresa ?? "Empresa";

            var html = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #0a0a0a; color: #fff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">{empresa}</h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #16a34a; margin-top: 0;">Pedido Confirmado ✓</h2>
                  <p>Olá <strong>{pedido.Cliente.RazaoSocialNome}</strong>,</p>
                  <p>Seu pedido <strong>#{pedido.Id}</strong> foi confirmado com sucesso!</p>
                  <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0;"><strong>Valor Total:</strong> R$ {pedido.ValorTotal:N2}</p>
                    <p style="margin: 8px 0 0 0;"><strong>Status:</strong> {pedido.Status}</p>
                  </div>
                  <p style="color: #666; font-size: 14px;">Acompanhe seu pedido pelo nosso site.</p>
                </div>
                <div style="background: #f9f9f9; padding: 16px; text-align: center; color: #999; font-size: 12px;">
                  {empresa} — Este é um e-mail automático.
                </div>
              </div>
            </body>
            </html>
            """;

            await EnviarEmailAsync(destinatario, $"Pedido #{pedido.Id} Confirmado — {empresa}", html);
        }

        public async Task NotificarPedidoLiberadoAsync(Pedido pedido)
        {
            if (pedido.Cliente == null) return;
            var destinatario = pedido.Cliente.Email;
            if (string.IsNullOrEmpty(destinatario)) return;

            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            var empresa = config?.NomeEmpresa ?? "Empresa";

            var html = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #0a0a0a; color: #fff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">{empresa}</h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #2563eb; margin-top: 0;">Pedido Liberado 📦</h2>
                  <p>Olá <strong>{pedido.Cliente.RazaoSocialNome}</strong>,</p>
                  <p>Seu pedido <strong>#{pedido.Id}</strong> foi liberado e está sendo preparado!</p>
                  <div style="background: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0;"><strong>Valor Total:</strong> R$ {pedido.ValorTotal:N2}</p>
                    <p style="margin: 8px 0 0 0;"><strong>Status:</strong> {pedido.Status}</p>
                  </div>
                </div>
                <div style="background: #f9f9f9; padding: 16px; text-align: center; color: #999; font-size: 12px;">
                  {empresa} — Este é um e-mail automático.
                </div>
              </div>
            </body>
            </html>
            """;

            await EnviarEmailAsync(destinatario, $"Pedido #{pedido.Id} Liberado — {empresa}", html);
        }

        public async Task NotificarSaiuParaEntregaAsync(Pedido pedido)
        {
            if (pedido.Cliente == null) return;
            var destinatario = pedido.Cliente.Email;
            if (string.IsNullOrEmpty(destinatario)) return;

            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            var empresa = config?.NomeEmpresa ?? "Empresa";

            var html = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #0a0a0a; color: #fff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">{empresa}</h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #f59e0b; margin-top: 0;">Saiu para Entrega 🚚</h2>
                  <p>Olá <strong>{pedido.Cliente.RazaoSocialNome}</strong>,</p>
                  <p>Boa notícia! Seu pedido <strong>#{pedido.Id}</strong> saiu para entrega.</p>
                  <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0;"><strong>Valor Total:</strong> R$ {pedido.ValorTotal:N2}</p>
                    <p style="margin: 8px 0 0 0;"><strong>Status:</strong> {pedido.Status}</p>
                  </div>
                  <p style="color: #666; font-size: 14px;">Fique atento! Em breve seu pedido chegará.</p>
                </div>
                <div style="background: #f9f9f9; padding: 16px; text-align: center; color: #999; font-size: 12px;">
                  {empresa} — Este é um e-mail automático.
                </div>
              </div>
            </body>
            </html>
            """;

            await EnviarEmailAsync(destinatario, $"Pedido #{pedido.Id} Saiu para Entrega — {empresa}", html);
        }

        public async Task NotificarProntoParaRetiradaAsync(Pedido pedido)
        {
            if (pedido.Cliente == null) return;
            var destinatario = pedido.Cliente.Email;
            if (string.IsNullOrEmpty(destinatario)) return;

            var config = await _context.ConfiguracoesSistema.FirstOrDefaultAsync();
            var empresa = config?.NomeEmpresa ?? "Empresa";

            var html = $"""
            <!DOCTYPE html>
            <html>
            <head><meta charset="utf-8"></head>
            <body style="font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: #0a0a0a; color: #fff; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; font-size: 20px;">{empresa}</h1>
                </div>
                <div style="padding: 32px;">
                  <h2 style="color: #8b5cf6; margin-top: 0;">Pronto para Retirada 🏪</h2>
                  <p>Olá <strong>{pedido.Cliente.RazaoSocialNome}</strong>,</p>
                  <p>Seu pedido <strong>#{pedido.Id}</strong> está pronto para retirada!</p>
                  <div style="background: #f5f3ff; border-left: 4px solid #8b5cf6; padding: 16px; margin: 20px 0; border-radius: 4px;">
                    <p style="margin: 0;"><strong>Valor Total:</strong> R$ {pedido.ValorTotal:N2}</p>
                    <p style="margin: 8px 0 0 0;"><strong>Status:</strong> {pedido.Status}</p>
                  </div>
                  <p style="color: #666; font-size: 14px;">Dirija-se ao local de retirada com um documento de identidade.</p>
                </div>
                <div style="background: #f9f9f9; padding: 16px; text-align: center; color: #999; font-size: 12px;">
                  {empresa} — Este é um e-mail automático.
                </div>
              </div>
            </body>
            </html>
            """;

            await EnviarEmailAsync(destinatario, $"Pedido #{pedido.Id} Pronto para Retirada — {empresa}", html);
        }
    }
}
