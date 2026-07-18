using Microsoft.AspNetCore.SignalR;
using Multigrao.Api.Data;
using Multigrao.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Multigrao.Api.Hubs
{
    public class AppHub : Hub
    {
        private readonly AppDbContext _context;

        public AppHub(AppDbContext context)
        {
            _context = context;
        }

        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public async Task EnviarMensagemInterna(string mensagem, int usuarioDestinoId)
        {
            // O usuário logado é o rementente. Na vida real, pegariamos do Context.User
            // string userIdString = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            
            // Para simplificar no mock, mandamos como um broadcast
            await Clients.All.SendAsync("ReceberMensagemInterna", new { RemetenteId = 1, Texto = mensagem, DataEnvio = DateTime.UtcNow });
        }

        public async Task PublicarAviso(string titulo, string conteudo)
        {
            await Clients.All.SendAsync("ReceberNovoAviso", new { Titulo = titulo, Conteudo = conteudo, DataPublicacao = DateTime.UtcNow });
        }
    }
}
