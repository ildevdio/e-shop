namespace Multigrao.Api.DTOs
{
    // Auth
    public class LoginRequestDto
    {
        public string Usuario { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
    }

    public class LoginResponseDto
    {
        public string Token { get; set; } = string.Empty;
        public string Nome { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int UsuarioId { get; set; }
        public List<string> Setores { get; set; } = new();
    }

    // Usuários
    public class CriarUsuarioDto
    {
        public string Nome { get; set; } = string.Empty;
        public string UsuarioLogin { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public string Perfil { get; set; } = "Comum";
        public List<int> SetoresIds { get; set; } = new();
    }

    public class AtualizarUsuarioDto
    {
        public string Nome { get; set; } = string.Empty;
        public string UsuarioLogin { get; set; } = string.Empty;
        public string? Senha { get; set; }
        public string Perfil { get; set; } = "Comum";
        public bool Ativo { get; set; } = true;
        public List<int> SetoresIds { get; set; } = new();
    }

    public class UsuarioResponseDto
    {
        public int Id { get; set; }
        public string Nome { get; set; } = string.Empty;
        public string UsuarioLogin { get; set; } = string.Empty;
        public string Perfil { get; set; } = string.Empty;
        public bool Ativo { get; set; }
        public List<string> Setores { get; set; } = new();
    }

    // Pedidos
    public class CriarPedidoDto
    {
        public int ClienteId { get; set; }
        public decimal ValorTotal { get; set; }
        public decimal PesoTotal { get; set; }
        public string? Observacao { get; set; }
        public List<CriarItemPedidoDto> Itens { get; set; } = new();
    }

    public class CriarItemPedidoDto
    {
        public int ProdutoId { get; set; }
        public decimal Quantidade { get; set; }
        public decimal PrecoUnitario { get; set; }
    }

    public class SepararItemDto
    {
        public int UsuarioId { get; set; }
    }

    // Clientes
    public class CriarClienteDto
    {
        public string RazaoSocialNome { get; set; } = string.Empty;
        public string? NomeFantasia { get; set; }
        public string CpfCnpj { get; set; } = string.Empty;
        public string? TipoPessoa { get; set; }
        public string? InscricaoEstadual { get; set; }
        public string? InscricaoMunicipal { get; set; }
        public string? Cep { get; set; }
        public string? Logradouro { get; set; }
        public string? Numero { get; set; }
        public string? Complemento { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? Estado { get; set; }
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? RegimeTributario { get; set; }
    }

    // Contatos
    public class CriarContatoDto
    {
        public string Nome { get; set; } = string.Empty;
        public string Telefone { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Cargo { get; set; }
        public int? ClienteId { get; set; }
    }

    public class AtualizarContatoDto
    {
        public string? Nome { get; set; }
        public string? Telefone { get; set; }
        public string? Email { get; set; }
        public string? Cargo { get; set; }
        public int? ClienteId { get; set; }
    }

    // Conversas / Chat
    public class CriarConversaDto
    {
        public string Titulo { get; set; } = string.Empty;
        public int? ClienteId { get; set; }
    }

    public class EnviarMensagemInternaDto
    {
        public int? UsuarioRemetenteId { get; set; }
        public string Texto { get; set; } = string.Empty;
        public string? UrlAnexo { get; set; }
    }

    // Avisos / Mural
    public class CriarAvisoDto
    {
        public string Titulo { get; set; } = string.Empty;
        public string Conteudo { get; set; } = string.Empty;
        public int AutorId { get; set; }
        public int? SetorAlvoId { get; set; }
        public string? Tipo { get; set; }
    }

    // Logística
    public class GerarRotaDto
    {
        public int VeiculoId { get; set; }
        public int MotoristaId { get; set; }
        public List<int> PedidosIds { get; set; } = new();
    }

    public class CriarVeiculoDto
    {
        public string Modelo { get; set; } = string.Empty;
        public string Placa { get; set; } = string.Empty;
        public decimal PesoMaximo { get; set; }
    }

    // Motorista
    public class RegistroEntregaDto
    {
        public string Acao { get; set; } = string.Empty;
        public string? MotivoDevolucao { get; set; }
        public string? Observacao { get; set; }
    }

    // Atendimento
    public class CriarAtendimentoDto
    {
        public string Nome { get; set; } = string.Empty;
        public string? Telefone { get; set; }
        public string? Interesse { get; set; }
        public string? Origem { get; set; }
    }

    public class NovaMensagemDto
    {
        public string Text { get; set; } = string.Empty;
        public string Sender { get; set; } = string.Empty;
    }

    public class LeadUpdateDto
    {
        public string? Nome { get; set; }
        public string? Telefone { get; set; }
        public string? Bairro { get; set; }
        public string? Interesse { get; set; }
        public string? Quantidade { get; set; }
        public string? Embalagem { get; set; }
        public string? Pagamento { get; set; }
        public string? TipoCliente { get; set; }
        public bool? IAAtiva { get; set; }
    }
}
