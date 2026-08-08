using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Data;
using Multigrao.Api.DTOs;
using Multigrao.Api.Models;

namespace Multigrao.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PedidosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PedidosController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPedidos()
        {
            var pedidos = await _context.Pedidos
                .Include(p => p.Cliente)
                    .ThenInclude(c => c!.Vendedor)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.SeparadoPorUsuario)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpGet("buscar")]
        public async Task<IActionResult> BuscarPedidos(
            [FromQuery] string? busca,
            [FromQuery] string? status,
            [FromQuery] string? tipoEntrega,
            [FromQuery] string? dataInicio,
            [FromQuery] string? dataFim,
            [FromQuery] int pagina = 1,
            [FromQuery] int tamanhoPagina = 50)
        {
            var query = _context.Pedidos.AsQueryable();

            if (!string.IsNullOrWhiteSpace(busca))
            {
                var termo = busca.ToLower();
                query = query.Where(p =>
                    p.Id.ToString().Contains(termo) ||
                    (p.Cliente != null && p.Cliente.RazaoSocialNome.ToLower().Contains(termo)) ||
                    (p.SolicitanteNome != null && p.SolicitanteNome.ToLower().Contains(termo)) ||
                    (p.CpfCnpj != null && p.CpfCnpj.Contains(termo)) ||
                    (p.Logradouro != null && p.Logradouro.ToLower().Contains(termo)) ||
                    (p.Bairro != null && p.Bairro.ToLower().Contains(termo)) ||
                    (p.Cidade != null && p.Cidade.ToLower().Contains(termo)));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var statuses = status.Split(',', StringSplitOptions.TrimEntries);
                query = query.Where(p => statuses.Contains(p.Status));
            }

            if (!string.IsNullOrWhiteSpace(tipoEntrega) && tipoEntrega != "Todos")
            {
                query = query.Where(p => p.TipoEntrega == tipoEntrega);
            }

            if (DateTime.TryParse(dataInicio, out var di))
            {
                query = query.Where(p => p.DataCriacao >= di);
            }

            if (DateTime.TryParse(dataFim, out var df))
            {
                df = df.AddDays(1).AddTicks(-1);
                query = query.Where(p => p.DataCriacao <= df);
            }

            var total = await query.CountAsync();

            var pedidos = await query
                .Include(p => p.Cliente)
                    .ThenInclude(c => c!.Vendedor)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.SeparadoPorUsuario)
                .OrderByDescending(p => p.DataCriacao)
                .Skip((pagina - 1) * tamanhoPagina)
                .Take(tamanhoPagina)
                .ToListAsync();

            return Ok(new { total, pagina, tamanhoPagina, dados = pedidos });
        }

        [HttpGet("em-conferencia")]
        public async Task<IActionResult> GetPedidosEmConferencia()
        {
            var pedidos = await _context.Pedidos
                .Where(p => p.Status == "EmConferencia" || p.Status == "ProntoRetirada")
                .Include(p => p.Cliente)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.SeparadoPorUsuario)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpGet("por-cpf")]
        public async Task<IActionResult> GetPedidosPorCpf([FromQuery] string cpfCnpj)
        {
            if (string.IsNullOrWhiteSpace(cpfCnpj))
                return BadRequest(new { message = "CPF/CNPJ é obrigatório." });

            var limpo = new string(cpfCnpj.Where(char.IsDigit).ToArray());
            if (limpo.Length == 0)
                return BadRequest(new { message = "CPF/CNPJ inválido." });

            var pedidos = await _context.Pedidos
                .Where(p => (p.CpfCnpj != null && p.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim() == limpo) ||
                            (p.Cliente != null && p.Cliente.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim() == limpo))
                .Include(p => p.Cliente)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .OrderByDescending(p => p.DataCriacao)
                .ToListAsync();

            return Ok(pedidos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.Produto)
                .Include(p => p.Itens)
                    .ThenInclude(i => i.SeparadoPorUsuario)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();
            return Ok(pedido);
        }

        private async Task Notificar(string titulo, string mensagem, string tipo, string? setorAlvo = null, int? usuarioDestinoId = null, string? link = null)
        {
            _context.Notificacoes.Add(new Notificacao
            {
                Titulo = titulo,
                Mensagem = mensagem,
                Tipo = tipo,
                SetorAlvo = setorAlvo,
                UsuarioDestinoId = usuarioDestinoId,
                Link = link,
                CriadaEm = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
        }

        [HttpPost]
        public async Task<IActionResult> CreatePedido([FromBody] CriarPedidoDto dto)
        {
            var cliente = await _context.Clientes.FindAsync(dto.ClienteId);
            if (cliente == null) return BadRequest(new { message = "Cliente não encontrado." });

            var erroEstoque = await ValidarEstoque(dto.Itens);
            if (erroEstoque != null) return BadRequest(new { message = erroEstoque });

            var statusInicial = cliente.BloqueadoFinanceiro ? "BloqueadoFinanceiro" : "Pendente";
            var pedido = await CriarPedido(dto.ClienteId, null, null, dto.ValorTotal, dto.Itens, dto.TipoEntrega, dto.Pagamento, dto.PrazoPagamentoDias, dto.Desconto, dto.Acrescimo, status: statusInicial, observacao: dto.Observacao);
            
            if (dto.AtendimentoId.HasValue)
            {
                var atendimento = await _context.AtendimentoLeads.FindAsync(dto.AtendimentoId.Value);
                if (atendimento != null)
                {
                    atendimento.PedidoId = pedido.Id;
                    atendimento.VendaFechada = true;
                    await _context.SaveChangesAsync();
                }
            }
            
            if (cliente.BloqueadoFinanceiro)
                await Notificar("Pedido Bloqueado", $"Pedido #{pedido.Id} criado para cliente bloqueado — aguardando liberação do financeiro.", "pedido", "Financeiro");
            else
                await Notificar("Novo Pedido", $"Pedido #{pedido.Id} criado no valor de R$ {pedido.ValorTotal:F2}.", "pedido", "Comercial");
            
            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
        }

        [HttpPost("solicitacao-catalogo")]
        public async Task<IActionResult> SolicitacaoCatalogo([FromBody] SolicitacaoCatalogoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.SolicitanteNome))
                return BadRequest(new { message = "Nome do solicitante é obrigatório." });
            if (string.IsNullOrWhiteSpace(dto.CpfCnpj))
                return BadRequest(new { message = "CPF/CNPJ é obrigatório." });

            // Buscar cliente pelo CPF/CNPJ
            var limpo = new string(dto.CpfCnpj.Where(char.IsDigit).ToArray());
            var cliente = await _context.Clientes
                .FirstOrDefaultAsync(c => c.CpfCnpj.Replace(".", "").Replace("/", "").Replace("-", "").Trim() == limpo);

            int? clienteId = cliente?.Id;
            bool enderecoConfere = false;
            bool clienteBloqueado = cliente?.BloqueadoFinanceiro == true;

            var erroEstoque = await ValidarEstoque(dto.Itens);
            if (erroEstoque != null) return BadRequest(new { message = erroEstoque });

            if (cliente != null)
            {
                enderecoConfere =
                    (cliente.Cep ?? "") == (dto.Cep ?? "") &&
                    (cliente.Logradouro ?? "") == (dto.Logradouro ?? "") &&
                    (cliente.Numero ?? "") == (dto.Numero ?? "") &&
                    (cliente.Bairro ?? "") == (dto.Bairro ?? "") &&
                    (cliente.Cidade ?? "") == (dto.Cidade ?? "") &&
                    (cliente.Estado ?? "") == (dto.Estado ?? "");
            }

            var statusInicial = clienteBloqueado ? "BloqueadoFinanceiro" : "AguardandoConfirmacao";
            var pedido = await CriarPedido(
                clienteId,
                dto.SolicitanteNome,
                dto.SolicitanteTelefone,
                dto.ValorTotal,
                dto.Itens,
                dto.TipoEntrega,
                dto.Pagamento,
                dto.PrazoPagamentoDias,
                dto.Desconto,
                dto.Acrescimo,
                dto.CpfCnpj,
                dto.Cep,
                dto.Logradouro,
                dto.Numero,
                dto.Complemento,
                dto.Bairro,
                dto.Cidade,
                dto.Estado,
                enderecoConfere,
                status: statusInicial
            );
            if (clienteBloqueado)
                await Notificar("Solicitação Bloqueada", $"{dto.SolicitanteNome} solicitou pedido via catálogo (R$ {pedido.ValorTotal:F2}), mas o cliente está bloqueado — aguardando liberação do financeiro.", "pedido", "Financeiro");
            else
                await Notificar("Solicitação de Catálogo", $"{dto.SolicitanteNome} solicitou pedido via catálogo (R$ {pedido.ValorTotal:F2}).", "pedido", "Compras");
            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> AtualizarPedido(int id, [FromBody] AtualizarPedidoDto dto)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Itens)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null) return NotFound();

            if (dto.TipoEntrega != null) pedido.TipoEntrega = dto.TipoEntrega;
            if (dto.Pagamento != null) pedido.Pagamento = dto.Pagamento;
            if (dto.Pagamento != null && dto.Pagamento != "Boleto") pedido.PrazoPagamentoDias = null;
            if (dto.PrazoPagamentoDias.HasValue) pedido.PrazoPagamentoDias = dto.PrazoPagamentoDias.Value;
            if (dto.Cep != null) pedido.Cep = dto.Cep;
            if (dto.Logradouro != null) pedido.Logradouro = dto.Logradouro;
            if (dto.Numero != null) pedido.Numero = dto.Numero;
            if (dto.Complemento != null) pedido.Complemento = dto.Complemento;
            if (dto.Bairro != null) pedido.Bairro = dto.Bairro;
            if (dto.Cidade != null) pedido.Cidade = dto.Cidade;
            if (dto.Estado != null) pedido.Estado = dto.Estado;

            if (pedido.Status == "ProntoRetirada" && pedido.TipoEntrega == "Entrega")
            {
                if (string.IsNullOrWhiteSpace(pedido.Logradouro) || string.IsNullOrWhiteSpace(pedido.Numero) ||
                    string.IsNullOrWhiteSpace(pedido.Bairro) || string.IsNullOrWhiteSpace(pedido.Cidade) ||
                    string.IsNullOrWhiteSpace(pedido.Estado) || string.IsNullOrWhiteSpace(pedido.Cep))
                    return BadRequest(new { message = "Preencha o endereço completo (logradouro, número, bairro, cidade, estado e CEP) antes de alterar para Entrega." });
                pedido.Status = "ProntoEntrega";
            }
            if (dto.Desconto.HasValue) pedido.Desconto = dto.Desconto.Value;
            if (dto.Acrescimo.HasValue) pedido.Acrescimo = dto.Acrescimo.Value;
            if (dto.ValorTotal.HasValue) pedido.ValorTotal = dto.ValorTotal.Value;
            if (dto.Observacao != null) pedido.Observacao = dto.Observacao;

            if (dto.Itens != null)
            {
                foreach (var itemDto in dto.Itens)
                {
                    var item = pedido.Itens.FirstOrDefault(i => i.Id == itemDto.Id);
                    if (item != null)
                    {
                        if (itemDto.ProdutoId.HasValue) item.ProdutoId = itemDto.ProdutoId.Value;
                        if (itemDto.Quantidade.HasValue) item.Quantidade = itemDto.Quantidade.Value;
                        if (itemDto.PrecoUnitario.HasValue) item.PrecoUnitario = itemDto.PrecoUnitario.Value;
                        if (itemDto.PesoUnitario.HasValue) item.PesoUnitario = itemDto.PesoUnitario.Value;
                    }
                }
                pedido.PesoTotal = pedido.Itens.Sum(i => i.PesoUnitario * i.Quantidade);
            }

            pedido.ValorFinal = pedido.ValorTotal + pedido.Acrescimo - pedido.Desconto;

            await _context.SaveChangesAsync();
            return Ok(pedido);
        }

        [HttpPut("{id}/confirmar-pedido")]
        public async Task<IActionResult> ConfirmarPedido(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.Status != "AguardandoConfirmacao")
                return BadRequest("O pedido precisa estar como 'Aguardando Confirmação'.");

            pedido.Status = "Pendente";
            await _context.SaveChangesAsync();
            await Notificar("Pedido Confirmado", $"Pedido #{id} foi confirmado e está pendente.", "pedido", "Separação");
            return NoContent();
        }

        private async Task<string?> ValidarEstoque(List<CriarItemPedidoDto> itensDto)
        {
            foreach (var item in itensDto)
            {
                var produto = await _context.Produtos.FindAsync(item.ProdutoId);
                if (produto == null)
                    return $"Produto #{item.ProdutoId} não encontrado.";
                if (produto.Estoque <= 0)
                    return $"O produto '{produto.Nome}' está sem estoque para venda.";
            }
            return null;
        }

        private async Task<Pedido> CriarPedido(
            int? clienteId,
            string? solicitanteNome,
            string? solicitanteTelefone,
            decimal valorTotal,
            List<CriarItemPedidoDto> itensDto,
            string tipoEntrega = "Entrega",
            string? pagamento = null,
            int? prazoPagamentoDias = null,
            decimal desconto = 0,
            decimal acrescimo = 0,
            string? cpfCnpj = null,
            string? cep = null,
            string? logradouro = null,
            string? numero = null,
            string? complemento = null,
            string? bairro = null,
            string? cidade = null,
            string? estado = null,
            bool enderecoConfere = false,
            string status = "Pendente",
            string? observacao = null
        )
        {
            var itens = new List<ItemPedido>();
            decimal pesoTotal = 0;

            foreach (var item in itensDto)
            {
                var produto = await _context.Produtos.FindAsync(item.ProdutoId);
                var pesoUnitario = item.PesoUnitario > 0 ? item.PesoUnitario : (produto?.PesoUnidade ?? 0);
                var itemPedido = new ItemPedido
                {
                    ProdutoId = item.ProdutoId,
                    Quantidade = item.Quantidade,
                    PrecoUnitario = item.PrecoUnitario,
                    PesoUnitario = pesoUnitario,
                    Status = "Pendente"
                };

                if (produto != null)
                    produto.Estoque -= item.Quantidade;

                pesoTotal += pesoUnitario * item.Quantidade;
                itens.Add(itemPedido);
            }

            var valorFinal = valorTotal + acrescimo - desconto;

            var pedido = new Pedido
            {
                ClienteId = clienteId,
                SolicitanteNome = solicitanteNome,
                SolicitanteTelefone = solicitanteTelefone,
                CpfCnpj = cpfCnpj,
                Cep = cep,
                Logradouro = logradouro,
                Numero = numero,
                Complemento = complemento,
                Bairro = bairro,
                Cidade = cidade,
                Estado = estado,
                EnderecoConfere = enderecoConfere,
                Status = status,
                TipoEntrega = tipoEntrega,
                Pagamento = pagamento,
                PrazoPagamentoDias = prazoPagamentoDias,
                Desconto = desconto,
                Acrescimo = acrescimo,
                ValorFinal = valorFinal,
                ValorTotal = valorTotal,
                PesoTotal = pesoTotal,
                DataCriacao = DateTime.UtcNow,
                Observacao = observacao,
                Itens = itens
            };

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();
            return pedido;
        }

        [HttpPut("{id}/concluir-conferencia")]
        public async Task<IActionResult> ConcluirConferencia(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.Status != "EmConferencia")
                return BadRequest("O pedido precisa estar em conferência.");

            if (pedido.TipoEntrega == "Retirada")
            {
                pedido.Status = "ProntoRetirada";
                await _context.SaveChangesAsync();
                await Notificar("Conferência Concluída", $"Pedido #{id} conferido — pronto para retirada.", "pedido", "Comercial");
            }
            else
            {
                pedido.Status = "ProntoEntrega";
                await _context.SaveChangesAsync();
                await Notificar("Conferência Concluída", $"Pedido #{id} conferido — pronto para roteirização.", "pedido", "Logística");
            }

            return NoContent();
        }

        [HttpPut("{id}/confirmar-retirada")]
        public async Task<IActionResult> ConfirmarRetirada(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.TipoEntrega != "Retirada")
                return BadRequest("Este pedido não é do tipo Retirada.");
            if (pedido.Status != "ProntoRetirada")
                return BadRequest("O pedido precisa estar como Pronto p/ Retirada.");

            pedido.Status = "Entregue";
            await _context.SaveChangesAsync();
            await Notificar("Retirada Confirmada", $"Pedido #{id} foi retirado pelo cliente.", "sistema", "Comercial");
            return NoContent();
        }

        [HttpPut("{id}/separar")]
        public async Task<IActionResult> IniciarSeparacao(int id)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();

            if (pedido.Status != "Pendente")
                return BadRequest("O pedido não está no estado Pendente.");

            pedido.Status = "EmSeparacao";
            await _context.SaveChangesAsync();
            await Notificar("Separação Iniciada", $"Pedido #{id} entrou em separação.", "pedido", "Logística");
            return NoContent();
        }

        [HttpPut("{id}/concluir-separacao")]
        public async Task<IActionResult> ConcluirSeparacao(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Itens)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null) return NotFound();
            if (pedido.Status != "EmSeparacao")
                return BadRequest("O pedido precisa estar em separação.");

            var todosSeparados = pedido.Itens.All(i => i.Separado);
            if (!todosSeparados)
                return BadRequest("Nem todos os itens foram separados.");

            pedido.Status = "EmConferencia";
            await _context.SaveChangesAsync();
            await Notificar("Separação Concluída", $"Pedido #{id} foi separado e está aguardando conferência.", "pedido", "Conferência");
            return NoContent();
        }

        [HttpPut("{id}/vincular-cliente")]
        public async Task<IActionResult> VincularCliente(int id, [FromBody] VincularClienteDto dto)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();

            var cliente = await _context.Clientes.FindAsync(dto.ClienteId);
            if (cliente == null) return BadRequest(new { message = "Cliente não encontrado." });

            pedido.ClienteId = dto.ClienteId;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cliente vinculado ao pedido." });
        }

        [HttpPut("{id}/liberar-financeiro")]
        public async Task<IActionResult> LiberarPedidoFinanceiro(int id, [FromBody] LiberarFinanceiroDto? dto = null)
        {
            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null) return NotFound();
            if (pedido.Status != "BloqueadoFinanceiro")
                return BadRequest(new { message = "O pedido não está bloqueado pelo financeiro." });

            pedido.Status = "Pendente";
            pedido.LiberadoFinanceiro = true;
            if (!string.IsNullOrWhiteSpace(dto?.Observacao))
                pedido.Observacao = dto.Observacao;
            await _context.SaveChangesAsync();
            await Notificar("Pedido Liberado", $"Pedido #{id} foi liberado pelo setor financeiro.", "pedido", "Comercial");
            return Ok(pedido);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Itens)
                .Include(p => p.EntregaPedidos)
                .FirstOrDefaultAsync(p => p.Id == id);
            if (pedido == null) return NotFound();

            if (pedido.EntregaPedidos.Any())
                _context.EntregasPedidos.RemoveRange(pedido.EntregaPedidos);

            foreach (var item in pedido.Itens)
            {
                var produto = await _context.Produtos.FindAsync(item.ProdutoId);
                if (produto != null)
                    produto.Estoque += item.Quantidade;
            }

            _context.ItensPedido.RemoveRange(pedido.Itens);
            _context.Pedidos.Remove(pedido);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPut("{id}/itens/{itemId}/separar")]
        public async Task<IActionResult> SepararItem(int id, int itemId, [FromBody] SepararItemDto dto)
        {
            var item = await _context.ItensPedido
                .FirstOrDefaultAsync(i => i.Id == itemId && i.PedidoId == id);

            if (item == null) return NotFound();

            item.Separado = !item.Separado;
            item.SeparadoPorUsuarioId = item.Separado ? dto.UsuarioId : null;
            item.Status = item.Separado ? "Separado" : "Pendente";

            await _context.SaveChangesAsync();
            return Ok(new { separado = item.Separado, separadoPor = item.SeparadoPorUsuarioId });
        }
    }
}
