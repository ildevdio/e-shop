namespace Multigrao.Api.Models
{
    public class ConfiguracaoSistema
    {
        public int Id { get; set; }
        public string NomeEmpresa { get; set; } = "Multigrãos";
        public string Slug { get; set; } = "multigraos";
        public string? Cnpj { get; set; }
        public string? Slogan { get; set; }
        public string? Endereco { get; set; }
        public string? Cep { get; set; }
        public string? Logradouro { get; set; }
        public string? Numero { get; set; }
        public string? Bairro { get; set; }
        public string? Cidade { get; set; }
        public string? Estado { get; set; }
        public string? LogoUrl { get; set; }
        public string? Telefone { get; set; }
        public string? VideoUrl { get; set; }
        public string CorPrincipal { get; set; } = "#0a0a0a";
        public string Fonte { get; set; } = "classica";
        public string CorSecundaria { get; set; } = "#f97316";
        public string? CorFonte { get; set; }
        public string DesignEcommerce { get; set; } = "claro";
        public string? TituloHero { get; set; }
        public string? SubtextoHero { get; set; }
        public bool ExibirNomeAbaixoLogo { get; set; } = true;
        public string TipoMenu { get; set; } = "dock";
        public string TipoCarrinho { get; set; } = "pagina";
        public string? LinksBio { get; set; }
        public string? Redirecionamentos { get; set; }
        public string HeroImagemTipo { get; set; } = "produto";
        public string? MascoteUrl { get; set; }
        public bool FreteAtivo { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public bool Ativo { get; set; } = true;
    }
}
