using Microsoft.AspNetCore.SignalR;

namespace Multigrao.Api.Hubs
{
    public class AppHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            await base.OnConnectedAsync();
        }

        public async Task PublicarAviso(string titulo, string conteudo)
        {
            await Clients.All.SendAsync("ReceberNovoAviso", new { Titulo = titulo, Conteudo = conteudo, DataPublicacao = DateTime.UtcNow });
        }
    }
}
