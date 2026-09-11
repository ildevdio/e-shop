using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Models;
using FocusEshop.Api.Services;

namespace FocusEshop.Api.Data
{
    public class AppDbContext : DbContext
    {
        private readonly ITenantContext _tenant;

        public AppDbContext(DbContextOptions<AppDbContext> options, ITenantContext tenant) : base(options)
        {
            _tenant = tenant;
        }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Setor> Setores { get; set; }
        public DbSet<UsuarioSetor> UsuarioSetores { get; set; }
        public DbSet<UsuarioEmpresa> UsuariosEmpresas { get; set; }
        
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Contato> Contatos { get; set; }
        
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Departamento> Departamentos { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<SubCategoria> SubCategorias { get; set; }
        public DbSet<Marca> Marcas { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        public DbSet<Carrinho> Carrinhos { get; set; }
        public DbSet<CarrinhoItem> CarrinhoItens { get; set; }
        
        public DbSet<Veiculo> Veiculos { get; set; }
        public DbSet<Rota> Rotas { get; set; }
        public DbSet<Entrega> Entregas { get; set; }
        public DbSet<EntregaPedido> EntregasPedidos { get; set; }
        
        public DbSet<Conversa> Conversas { get; set; }
        public DbSet<Mensagem> Mensagens { get; set; }
        public DbSet<Aviso> Avisos { get; set; }
        public DbSet<AtendimentoLead> AtendimentoLeads { get; set; }
        public DbSet<BotConfig> BotsConfig { get; set; }

        public DbSet<Enquete> Enquetes { get; set; }
        public DbSet<OpcaoEnquete> OpcoesEnquete { get; set; }
        public DbSet<VotoEnquete> VotosEnquete { get; set; }
        public DbSet<Notificacao> Notificacoes { get; set; }

        public DbSet<ConfiguracaoSistema> ConfiguracoesSistema { get; set; }
        public DbSet<ArquivoUpload> ArquivosUpload { get; set; }

        public DbSet<Promocao> Promocoes { get; set; }
        public DbSet<PromocaoProduto> PromocoesProduto { get; set; }
        public DbSet<FaixaFrete> FaixasFrete { get; set; }

        public DbSet<Cupom> Cupons { get; set; }
        public DbSet<CupomProduto> CupomProdutos { get; set; }
        public DbSet<CupomCliente> CupomClientes { get; set; }

        public DbSet<Prospect> Prospects { get; set; }
        public DbSet<LembreteCarrinho> LembretesCarrinho { get; set; }

        public DbSet<Banner> Banners { get; set; }

        public override int SaveChanges()
        {
            AplicarEmpresa();
            return base.SaveChanges();
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            AplicarEmpresa();
            return base.SaveChangesAsync(cancellationToken);
        }

        private void AplicarEmpresa()
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                if (entry.State == EntityState.Added && entry.Entity is IEmpresa empresa && empresa.EmpresaId == 0)
                    empresa.EmpresaId = _tenant.EmpresaId;
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<ArquivoUpload>()
                .HasIndex(a => a.FileName)
                .IsUnique();

            // Filtros globais de multi-tenancy
            modelBuilder.Entity<ConfiguracaoSistema>()
                .HasQueryFilter(c => c.Id == _tenant.EmpresaId);
            modelBuilder.Entity<ConfiguracaoSistema>()
                .Property(c => c.HeroImagemTipo)
                .HasDefaultValue("produto");

            modelBuilder.Entity<Usuario>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Cliente>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Contato>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Produto>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Departamento>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Categoria>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<SubCategoria>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Marca>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Pedido>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<ItemPedido>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Carrinho>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<CarrinhoItem>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Veiculo>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Rota>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Entrega>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Conversa>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Mensagem>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Aviso>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<AtendimentoLead>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<BotConfig>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Enquete>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<OpcaoEnquete>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<VotoEnquete>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Notificacao>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<ArquivoUpload>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Promocao>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<PromocaoProduto>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<FaixaFrete>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Cupom>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<CupomProduto>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<CupomCliente>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);

            modelBuilder.Entity<LembreteCarrinho>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);
            modelBuilder.Entity<Prospect>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);

            modelBuilder.Entity<Banner>().HasQueryFilter(e => e.EmpresaId == _tenant.EmpresaId);

            modelBuilder.Entity<UsuarioSetor>()
                .HasKey(us => new { us.UsuarioId, us.SetorId });

            modelBuilder.Entity<UsuarioSetor>()
                .HasOne(us => us.Usuario)
                .WithMany(u => u.UsuarioSetores)
                .HasForeignKey(us => us.UsuarioId);

            modelBuilder.Entity<UsuarioSetor>()
                .HasOne(us => us.Setor)
                .WithMany(s => s.UsuarioSetores)
                .HasForeignKey(us => us.SetorId);

            modelBuilder.Entity<UsuarioEmpresa>()
                .HasKey(ue => new { ue.UsuarioId, ue.EmpresaId });

            modelBuilder.Entity<UsuarioEmpresa>()
                .HasOne(ue => ue.Usuario)
                .WithMany()
                .HasForeignKey(ue => ue.UsuarioId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UsuarioEmpresa>()
                .HasOne(ue => ue.Empresa)
                .WithMany()
                .HasForeignKey(ue => ue.EmpresaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ConfiguracaoSistema>()
                .HasOne(c => c.EmpresaMatriz)
                .WithMany(c => c.Filiais)
                .HasForeignKey(c => c.EmpresaMatrizId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Rota>()
                .HasOne(r => r.Motorista)
                .WithMany()
                .HasForeignKey(r => r.MotoristaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ItemPedido>()
                .HasOne(ip => ip.SeparadoPorUsuario)
                .WithMany()
                .HasForeignKey(ip => ip.SeparadoPorUsuarioId)
                .OnDelete(DeleteBehavior.Restrict);
                
            modelBuilder.Entity<Mensagem>()
                .HasOne(m => m.UsuarioRemetente)
                .WithMany()
                .HasForeignKey(m => m.UsuarioRemetenteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AtendimentoLead>()
                .HasOne(a => a.UsuarioAtendente)
                .WithMany()
                .HasForeignKey(a => a.UsuarioAtendenteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AtendimentoLead>()
                .HasOne(a => a.Pedido)
                .WithMany()
                .HasForeignKey(a => a.PedidoId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Categoria>()
                .HasOne(c => c.Departamento)
                .WithMany(d => d.Categorias)
                .HasForeignKey(c => c.DepartamentoId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<SubCategoria>()
                .HasOne(sc => sc.Categoria)
                .WithMany(c => c.SubCategorias)
                .HasForeignKey(sc => sc.CategoriaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Produto>()
                .HasOne(p => p.Departamento)
                .WithMany()
                .HasForeignKey(p => p.DepartamentoId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Produto>()
                .HasOne(p => p.Categoria)
                .WithMany()
                .HasForeignKey(p => p.CategoriaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Produto>()
                .HasOne(p => p.SubCategoria)
                .WithMany(sp => sp.Produtos)
                .HasForeignKey(p => p.SubCategoriaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Produto>()
                .HasOne(p => p.Marca)
                .WithMany(m => m.Produtos)
                .HasForeignKey(p => p.MarcaId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<EntregaPedido>()
                .HasKey(ep => new { ep.EntregaId, ep.PedidoId });

            modelBuilder.Entity<EntregaPedido>()
                .HasOne(ep => ep.Entrega)
                .WithMany(e => e.EntregaPedidos)
                .HasForeignKey(ep => ep.EntregaId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<EntregaPedido>()
                .HasOne(ep => ep.Pedido)
                .WithMany(p => p.EntregaPedidos)
                .HasForeignKey(ep => ep.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cliente>()
                .HasOne(c => c.Vendedor)
                .WithMany(u => u.ClientesVendedor)
                .HasForeignKey(c => c.VendedorId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<Carrinho>()
                .HasIndex(c => new { c.EmpresaId, c.CpfCnpj })
                .IsUnique();

            modelBuilder.Entity<CarrinhoItem>()
                .HasOne(ci => ci.Carrinho)
                .WithMany(c => c.Itens)
                .HasForeignKey(ci => ci.CarrinhoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CarrinhoItem>()
                .HasOne(ci => ci.Produto)
                .WithMany()
                .HasForeignKey(ci => ci.ProdutoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PromocaoProduto>()
                .HasOne(pp => pp.Promocao)
                .WithMany(p => p.Produtos)
                .HasForeignKey(pp => pp.PromocaoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<PromocaoProduto>()
                .HasOne(pp => pp.Produto)
                .WithMany()
                .HasForeignKey(pp => pp.ProdutoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Cupom>()
                .HasIndex(c => new { c.EmpresaId, c.Codigo })
                .IsUnique();

            modelBuilder.Entity<CupomProduto>()
                .HasOne(cp => cp.Cupom)
                .WithMany(c => c.Produtos)
                .HasForeignKey(cp => cp.CupomId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CupomProduto>()
                .HasOne(cp => cp.Produto)
                .WithMany()
                .HasForeignKey(cp => cp.ProdutoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CupomCliente>()
                .HasOne(cc => cc.Cupom)
                .WithMany(c => c.Clientes)
                .HasForeignKey(cc => cc.CupomId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CupomCliente>()
                .HasOne(cc => cc.Cliente)
                .WithMany()
                .HasForeignKey(cc => cc.ClienteId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LembreteCarrinho>()
                .HasOne(lc => lc.Carrinho)
                .WithMany()
                .HasForeignKey(lc => lc.CarrinhoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LembreteCarrinho>()
                .HasIndex(lc => new { lc.EmpresaId, lc.CarrinhoId, lc.EnviadoEm });

            // Seed: Setores
            modelBuilder.Entity<Setor>().HasData(
                new Setor { Id = 1, Nome = "Comercial" },
                new Setor { Id = 2, Nome = "Separação" },
                new Setor { Id = 3, Nome = "Logística" },
                new Setor { Id = 4, Nome = "Conferência" },
                new Setor { Id = 5, Nome = "Entregas" },
                new Setor { Id = 6, Nome = "Compras" },
                new Setor { Id = 7, Nome = "Vendedor" },
                new Setor { Id = 8, Nome = "Financeiro" }
            );

            // Seed: Usuários
            const string hash = "$2a$11$9tpv10peRM0MqlDYoaqhDeVEnG04k8PxomSXoA2qGVL8q01aM4xvq";
            modelBuilder.Entity<Usuario>().HasData(
                new Usuario { Id = 1, EmpresaId = 1, Nome = "Admin Focus E-shop", UsuarioLogin = "admin", SenhaHash = hash, Role = "AdminMaster", Ativo = true },
                new Usuario { Id = 2, EmpresaId = 1, Nome = "João Comercial", UsuarioLogin = "joao", SenhaHash = hash, Role = "Comum", Ativo = true },
                new Usuario { Id = 3, EmpresaId = 1, Nome = "Ana Separação", UsuarioLogin = "ana", SenhaHash = hash, Role = "Comum", Ativo = true },
                new Usuario { Id = 4, EmpresaId = 1, Nome = "Pedro Motorista", UsuarioLogin = "pedro", SenhaHash = hash, Role = "Comum", Ativo = true },
                new Usuario { Id = 5, EmpresaId = 2, Nome = "Admin Focus", UsuarioLogin = "focus", SenhaHash = "$2a$11$8txlZeWbLmAkE.FUvRPhj.P6VzpU7K2GVhfVMWMJKqVldAuGhvEXC", Role = "AdminMaster", Ativo = true }
            );

            // Seed: UsuárioSetores
            modelBuilder.Entity<UsuarioSetor>().HasData(
                new UsuarioSetor { UsuarioId = 1, SetorId = 1 },
                new UsuarioSetor { UsuarioId = 2, SetorId = 1 },
                new UsuarioSetor { UsuarioId = 2, SetorId = 3 },
                new UsuarioSetor { UsuarioId = 3, SetorId = 2 },
                new UsuarioSetor { UsuarioId = 4, SetorId = 3 },
                new UsuarioSetor { UsuarioId = 4, SetorId = 5 }
            );

            // Seed: Produtos
            modelBuilder.Entity<Produto>().HasData(
                new Produto { Id = 1, EmpresaId = 1, Nome = "Castanha do Pará", PesoUnidade = 0.5m, CodigoERP = "CAS001" },
                new Produto { Id = 2, EmpresaId = 1, Nome = "Chia (1kg)", PesoUnidade = 1m, CodigoERP = "CHI001" },
                new Produto { Id = 3, EmpresaId = 1, Nome = "Aveia em Flocos", PesoUnidade = 0.5m, CodigoERP = "AVE001" },
                new Produto { Id = 4, EmpresaId = 1, Nome = "Quinoa (500g)", PesoUnidade = 0.5m, CodigoERP = "QUI001" },
                new Produto { Id = 5, EmpresaId = 1, Nome = "Linhaça Dourada", PesoUnidade = 0.25m, CodigoERP = "LIN001" },
                new Produto { Id = 6, EmpresaId = 1, Nome = "Nozes (500g)", PesoUnidade = 0.5m, CodigoERP = "NOZ001" },
                new Produto { Id = 7, EmpresaId = 1, Nome = "Amêndoas (250g)", PesoUnidade = 0.25m, CodigoERP = "AME001" },
                new Produto { Id = 8, EmpresaId = 1, Nome = "Cacau em Pó", PesoUnidade = 0.3m, CodigoERP = "CAC001" }
            );

            // Seed: Clientes
            modelBuilder.Entity<Cliente>().HasData(
                new Cliente { Id = 1, EmpresaId = 1, RazaoSocialNome = "Padaria Pão Dourado", CpfCnpj = "12.345.678/0001-90", TipoPessoa = "PJ", Bairro = "Boa Viagem", Cidade = "Recife", Estado = "PE", Telefone = "(81) 3333-4444", Email = "contato@paodourado.com.br" },
                new Cliente { Id = 2, EmpresaId = 1, RazaoSocialNome = "Supermercado Fresh", CpfCnpj = "98.765.432/0001-10", TipoPessoa = "PJ", Bairro = "Casa Forte", Cidade = "Recife", Estado = "PE", Telefone = "(81) 3333-5555", Email = "compras@fresh.com.br" },
                new Cliente { Id = 3, EmpresaId = 1, RazaoSocialNome = "Loja Naturalzinha", CpfCnpj = "11.222.333/0001-44", TipoPessoa = "PJ", Bairro = "Aflitos", Cidade = "Recife", Estado = "PE", Telefone = "(81) 3333-6666", Email = "vendas@naturalzinha.com.br" }
            );

            // Seed: Veículos
            modelBuilder.Entity<Veiculo>().HasData(
                new Veiculo { Id = 1, EmpresaId = 1, Modelo = "Fiorino", Placa = "ABC-1234", PesoMaximo = 800m },
                new Veiculo { Id = 2, EmpresaId = 1, Modelo = "Van Master", Placa = "DEF-5678", PesoMaximo = 1500m }
            );

            // Seed: Contatos
            modelBuilder.Entity<Contato>().HasData(
                new Contato { Id = 1, EmpresaId = 1, Nome = "Carlos Eduardo", Telefone = "(81) 99812-3344", ClienteId = 1 },
                new Contato { Id = 2, EmpresaId = 1, Nome = "Fernanda Lima", Telefone = "(81) 99766-5588", ClienteId = 1 },
                new Contato { Id = 3, EmpresaId = 1, Nome = "Roberto Alves", Telefone = "(81) 99234-1122", ClienteId = 2 },
                new Contato { Id = 4, EmpresaId = 1, Nome = "Mariana Costa", Telefone = "(81) 99100-2233", ClienteId = 2 },
                new Contato { Id = 5, EmpresaId = 1, Nome = "Pedro Henrique", Telefone = "(81) 98877-6655", ClienteId = 3 },
                new Contato { Id = 6, EmpresaId = 1, Nome = "Ana Beatriz", Telefone = "(81) 98543-2211", ClienteId = null },
                new Contato { Id = 7, EmpresaId = 1, Nome = "Lucas Nascimento", Telefone = "(81) 98432-1100", ClienteId = null }
            );

            // Seed: Configuração do Sistema
            modelBuilder.Entity<ConfiguracaoSistema>().HasData(
                new ConfiguracaoSistema
                {
                    Id = 1,
                    NomeEmpresa = "Focus E-shop",
                    Slug = "focus-eshop",
                    Cnpj = "26.277.355/0001-70",
                    Slogan = "Amendoim & Especiarias",
                    Endereco = "Centro — Paulista — PE",
                    Cep = null,
                    Logradouro = null,
                    Numero = null,
                    Bairro = "Centro",
                    Cidade = "Paulista",
                    Estado = "PE",
                    LogoUrl = "/focus-eshop-logo.png",
                    VideoUrl = "/focus-eshop-vid.mp4",
                    CorPrincipal = "#0a0a0a",
                    Ativo = true
                }
            );

            modelBuilder.Entity<ConfiguracaoSistema>().HasData(
                new ConfiguracaoSistema
                {
                    Id = 2,
                    NomeEmpresa = "Focus Solutions",
                    Slug = "focus",
                    Cnpj = "00.000.000/0000-00",
                    Slogan = "Plataforma de Gestão",
                    Endereco = "Paulista — PE",
                    Cep = null,
                    Logradouro = null,
                    Numero = null,
                    Bairro = null,
                    Cidade = "Paulista",
                    Estado = "PE",
                    LogoUrl = "/focus-eshop-logo.png",
                    VideoUrl = null,
                    CorPrincipal = "#111827",
                    Ativo = true
                }
            );

            // Seed: Bots padrão (por empresa)
            modelBuilder.Entity<BotConfig>().HasData(
                new BotConfig { Id = 1, EmpresaId = 1, Nome = "Saudação", TipoTrigger = "Saudacao", ValorTrigger = "", TipoReacao = "Texto", TextoResposta = "Olá {nome}! 👋 Sou o assistente virtual do {empresa}. Posso te ajudar com preços, produtos, estoque e status de pedidos. 😊", AcaoBot = "Responder", Ordem = 1, Ativo = true },
                new BotConfig { Id = 2, EmpresaId = 1, Nome = "Menu de opções", TipoTrigger = "Menu", ValorTrigger = "", TipoReacao = "Menu", TextoResposta = "", AcaoBot = "Responder", Ordem = 2, Ativo = true },
                new BotConfig { Id = 3, EmpresaId = 1, Nome = "Consultar preço", TipoTrigger = "PalavraChave", ValorTrigger = "preço|preco|quanto custa|valor|custa|tabela", TipoReacao = "PrecoProduto", TextoResposta = "", AcaoBot = "Responder", Ordem = 3, Ativo = true },
                new BotConfig { Id = 4, EmpresaId = 1, Nome = "Consultar estoque", TipoTrigger = "PalavraChave", ValorTrigger = "estoque|tem dispon|disponível|disponivel|tem em|tem do|tem de", TipoReacao = "EstoqueProduto", TextoResposta = "", AcaoBot = "Responder", Ordem = 4, Ativo = true },
                new BotConfig { Id = 5, EmpresaId = 1, Nome = "Status do pedido", TipoTrigger = "PalavraChave", ValorTrigger = "pedido|rastrear|status do|onde está|onde esta|situação do|situacao do", TipoReacao = "StatusPedido", TextoResposta = "", AcaoBot = "Responder", Ordem = 5, Ativo = true },
                new BotConfig { Id = 6, EmpresaId = 1, Nome = "Formas de pagamento", TipoTrigger = "PalavraChave", ValorTrigger = "pagamento|pagar|boleto|pix|cartão|cartao|condição|condicao|parcel", TipoReacao = "Texto", TextoResposta = "💳 Trabalhamos com as seguintes formas de pagamento:\n• PIX (à vista com desconto)\n• Boleto à vista\n• Boleto faturado (14/28 dias para empresas)\n• Cartão de crédito\nPara empresas, temos condições especiais. Qual sua preferência?", AcaoBot = "Responder", Ordem = 6, Ativo = true },
                new BotConfig { Id = 7, EmpresaId = 1, Nome = "Entrega e frete", TipoTrigger = "PalavraChave", ValorTrigger = "entrega|frete|demora|prazo|quanto tempo|chega", TipoReacao = "Texto", TextoResposta = "🛵 Nossas entregas na região levam de 1 a 3 dias úteis, dependendo do bairro e do valor do pedido. Para valores acima de R$ 200, o frete é grátis!", AcaoBot = "Responder", Ordem = 7, Ativo = true },
                new BotConfig { Id = 8, EmpresaId = 1, Nome = "Embalagem", TipoTrigger = "PalavraChave", ValorTrigger = "embalagem|saco|sacos|fracionado|fracionada|granel|quilo|peso|kg", TipoReacao = "Texto", TextoResposta = "📦 Vendemos a granel (sacos de 10kg ou 20kg) e também fracionados. Qual formato e quantidade você prefere?", AcaoBot = "Responder", Ordem = 8, Ativo = true },
                new BotConfig { Id = 9, EmpresaId = 1, Nome = "Falar com humano", TipoTrigger = "PalavraChave", ValorTrigger = "contato|telefone|whatsapp|falar com|atendente|humano|vendedor|pessoa", TipoReacao = "Texto", TextoResposta = "📞 Sem problemas! Em instantes um atendente da nossa equipe vai te atender. Aguarde um momento. 😊", AcaoBot = "ResponderEDesativarIA", Ordem = 9, Ativo = true },
                new BotConfig { Id = 10, EmpresaId = 1, Nome = "Captar região/bairro", TipoTrigger = "PalavraChave", ValorTrigger = "entrega em|moro em|sou de|bairro", TipoReacao = "Texto", TextoResposta = "Perfeito! Anotei sua região. Vou verificar as opções de entrega para você. 😉", AcaoBot = "SalvarLead", CampoLead = "Bairro", Ordem = 10, Ativo = true },
                new BotConfig { Id = 11, EmpresaId = 1, Nome = "Captar interesse", TipoTrigger = "PalavraChave", ValorTrigger = "quero|preciso|vou querer|estou precisando|comprar|pedido de|gostaria de", TipoReacao = "Texto", TextoResposta = "Ótima escolha! {interesse} é um dos nossos produtos mais procurados. Posso te passar mais detalhes e condições. 😊", AcaoBot = "SalvarLead", CampoLead = "Interesse", Ordem = 11, Ativo = true },
                new BotConfig { Id = 12, EmpresaId = 1, Nome = "Agradecimento", TipoTrigger = "PalavraChave", ValorTrigger = "obrigado|obrigada|vlw|valeu|agradeço|agradeco", TipoReacao = "Texto", TextoResposta = "De nada, {nome}! 😄 Fico à disposição. Se precisar de mais alguma coisa, é só chamar.", AcaoBot = "Responder", Ordem = 12, Ativo = true }
            );
        }
    }
}
