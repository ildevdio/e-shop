using Microsoft.EntityFrameworkCore;
using Multigrao.Api.Models;

namespace Multigrao.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<Usuario> Usuarios { get; set; }
        public DbSet<Setor> Setores { get; set; }
        public DbSet<UsuarioSetor> UsuarioSetores { get; set; }
        
        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Contato> Contatos { get; set; }
        
        public DbSet<Produto> Produtos { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<ItemPedido> ItensPedido { get; set; }
        
        public DbSet<Veiculo> Veiculos { get; set; }
        public DbSet<Rota> Rotas { get; set; }
        public DbSet<Entrega> Entregas { get; set; }
        
        public DbSet<Conversa> Conversas { get; set; }
        public DbSet<Mensagem> Mensagens { get; set; }
        public DbSet<Aviso> Avisos { get; set; }
        public DbSet<AtendimentoLead> AtendimentoLeads { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

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

            // Seed: Setores
            modelBuilder.Entity<Setor>().HasData(
                new Setor { Id = 1, Nome = "Comercial" },
                new Setor { Id = 2, Nome = "Separação" },
                new Setor { Id = 3, Nome = "Logística" },
                new Setor { Id = 4, Nome = "Conferência" },
                new Setor { Id = 5, Nome = "Entregas" }
            );

            // Seed: Usuários (senhas BCrypt de "123456")
            const string hash = "$2a$11$9tpv10peRM0MqlDYoaqhDeVEnG04k8PxomSXoA2qGVL8q01aM4xvq";
            modelBuilder.Entity<Usuario>().HasData(
                new Usuario { Id = 1, Nome = "Admin Multigrãos", UsuarioLogin = "admin", SenhaHash = hash, Role = "AdminMaster", Ativo = true },
                new Usuario { Id = 2, Nome = "João Comercial", UsuarioLogin = "joao", SenhaHash = hash, Role = "Comum", Ativo = true },
                new Usuario { Id = 3, Nome = "Ana Separação", UsuarioLogin = "ana", SenhaHash = hash, Role = "Comum", Ativo = true },
                new Usuario { Id = 4, Nome = "Pedro Motorista", UsuarioLogin = "pedro", SenhaHash = hash, Role = "Comum", Ativo = true }
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
                new Produto { Id = 1, Nome = "Castanha do Pará", PesoUnidade = 0.5m, CodigoERP = "CAS001" },
                new Produto { Id = 2, Nome = "Chia (1kg)", PesoUnidade = 1m, CodigoERP = "CHI001" },
                new Produto { Id = 3, Nome = "Aveia em Flocos", PesoUnidade = 0.5m, CodigoERP = "AVE001" },
                new Produto { Id = 4, Nome = "Quinoa (500g)", PesoUnidade = 0.5m, CodigoERP = "QUI001" },
                new Produto { Id = 5, Nome = "Linhaça Dourada", PesoUnidade = 0.25m, CodigoERP = "LIN001" },
                new Produto { Id = 6, Nome = "Nozes (500g)", PesoUnidade = 0.5m, CodigoERP = "NOZ001" },
                new Produto { Id = 7, Nome = "Amêndoas (250g)", PesoUnidade = 0.25m, CodigoERP = "AME001" },
                new Produto { Id = 8, Nome = "Cacau em Pó", PesoUnidade = 0.3m, CodigoERP = "CAC001" }
            );

            // Seed: Clientes
            modelBuilder.Entity<Cliente>().HasData(
                new Cliente { Id = 1, RazaoSocialNome = "Padaria Pão Dourado", CpfCnpj = "12.345.678/0001-90", TipoPessoa = "PJ", Bairro = "Boa Viagem", Cidade = "Recife", Estado = "PE", Telefone = "(81) 3333-4444", Email = "contato@paodourado.com.br" },
                new Cliente { Id = 2, RazaoSocialNome = "Supermercado Fresh", CpfCnpj = "98.765.432/0001-10", TipoPessoa = "PJ", Bairro = "Casa Forte", Cidade = "Recife", Estado = "PE", Telefone = "(81) 3333-5555", Email = "compras@fresh.com.br" },
                new Cliente { Id = 3, RazaoSocialNome = "Loja Naturalzinha", CpfCnpj = "11.222.333/0001-44", TipoPessoa = "PJ", Bairro = "Aflitos", Cidade = "Recife", Estado = "PE", Telefone = "(81) 3333-6666", Email = "vendas@naturalzinha.com.br" }
            );

            // Seed: Veículos
            modelBuilder.Entity<Veiculo>().HasData(
                new Veiculo { Id = 1, Modelo = "Fiorino", Placa = "ABC-1234", PesoMaximo = 800m },
                new Veiculo { Id = 2, Modelo = "Van Master", Placa = "DEF-5678", PesoMaximo = 1500m }
            );

            // Seed: Contatos
            modelBuilder.Entity<Contato>().HasData(
                new Contato { Id = 1, Nome = "Carlos Eduardo", Telefone = "(81) 99812-3344", ClienteId = 1 },
                new Contato { Id = 2, Nome = "Fernanda Lima", Telefone = "(81) 99766-5588", ClienteId = 1 },
                new Contato { Id = 3, Nome = "Roberto Alves", Telefone = "(81) 99234-1122", ClienteId = 2 },
                new Contato { Id = 4, Nome = "Mariana Costa", Telefone = "(81) 99100-2233", ClienteId = 2 },
                new Contato { Id = 5, Nome = "Pedro Henrique", Telefone = "(81) 98877-6655", ClienteId = 3 },
                new Contato { Id = 6, Nome = "Ana Beatriz", Telefone = "(81) 98543-2211", ClienteId = null },
                new Contato { Id = 7, Nome = "Lucas Nascimento", Telefone = "(81) 98432-1100", ClienteId = null }
            );
        }
    }
}
