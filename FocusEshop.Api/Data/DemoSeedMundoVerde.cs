using Microsoft.EntityFrameworkCore;
using FocusEshop.Api.Models;

namespace FocusEshop.Api.Data;

/// <summary>
/// Configuração demonstrativa da loja "Mundo Verde Boa Viagem":
/// empresa, identidade visual, catálogo, estoque, clientes, pedidos,
/// atendimentos, frete e logística. Tudo fictício e idempotente
/// (só é gravado se a loja ainda não existir).
/// </summary>
public static class DemoSeedMundoVerde
{
    private const string Slug = "mundo-verde-boa-viagem";

    public static async Task SeedAsync(AppDbContext db)
    {
        if (await db.ConfiguracoesSistema.IgnoreQueryFilters().AnyAsync(c => c.Slug == Slug))
            return;

        var seq = new Seq(db);

        // ── 1. EMPRESA ────────────────────────────────────────────────
        int empresaId = seq.Next(nameof(ConfiguracaoSistema));

        string logoUrl = "https://placehold.co/520x180/1f7a4d/ffffff.png?text=Mundo%20Verde";
        db.ConfiguracoesSistema.Add(new ConfiguracaoSistema
        {
            Id = empresaId,
            NomeEmpresa = "Mundo Verde Boa Viagem",
            Slug = Slug,
            Cnpj = "41.527.368/0001-20",
            Slogan = "Saúde, bem-estar e alimentação saudável perto de você.",
            Endereco = "Av. Conselheiro Aguiar, 1234 — Boa Viagem — Recife — PE",
            Cep = "51021-040",
            Logradouro = "Av. Conselheiro Aguiar",
            Numero = "1234",
            Bairro = "Boa Viagem",
            Cidade = "Recife",
            Estado = "PE",
            LogoUrl = logoUrl,
            Telefone = "(81) 3456-7890",
            CorPrincipal = "#1f7a4d",
            Fonte = "moderna",
            CorSecundaria = "#f97316",
            CorFonte = "#2c3a2b",
            DesignEcommerce = "wild",
            TituloHero = "Cuide da sua rotina. Cuide de você.",
            SubtextoHero = "Produtos naturais, suplementos e alimentação saudável perto de você.",
            ExibirNomeAbaixoLogo = true,
            TipoMenu = "dock",
            TipoCarrinho = "pagina",
            HeroImagemTipo = "produto",
            FreteAtivo = true,
            TipoEmpresa = "naturais",
            SeparacaoAtiva = true,
            ConferenciaAtiva = true,
            EntregaTerceirizada = false,
            UsarRotas = true,
            UsarPeso = true,
            Ativo = true
        });

        // ── 2. FAIXAS DE FRETE (por distância) ────────────────────────
        var faixas = new (decimal AteKm, decimal Valor)[]
        {
            (3m, 12.90m), (6m, 18.90m), (12m, 28.90m), (20m, 39.90m), (40m, 55.00m)
        };
        int ordfaixa = 0;
        foreach (var (ateKm, valor) in faixas)
        {
            var f = new FaixaFrete
            {
                Id = seq.Next(nameof(FaixaFrete)),
                EmpresaId = empresaId,
                AteKm = ateKm,
                Valor = valor,
                Ordem = ++ordfaixa
            };
            db.FaixasFrete.Add(f);
        }

        // ── 3. USUÁRIOS (equipe da unidade) ───────────────────────────
        int idAdmin = seq.Next(nameof(Usuario));
        int idRenata = seq.Next(nameof(Usuario));
        int idJoao = seq.Next(nameof(Usuario));
        int idLia = seq.Next(nameof(Usuario));
        int idMarcos = seq.Next(nameof(Usuario));
        int idPedro = seq.Next(nameof(Usuario));

        string hashAdmin = BCrypt.Net.BCrypt.HashPassword("admin123");
        string hashUser = BCrypt.Net.BCrypt.HashPassword("123456");

        db.Usuarios.AddRange(
            new Usuario { Id = idAdmin, EmpresaId = empresaId, Nome = "Carla Mendes (Gerente)", UsuarioLogin = "mvbadmin", SenhaHash = hashAdmin, Role = "AdminMaster", Ativo = true },
            new Usuario { Id = idRenata, EmpresaId = empresaId, Nome = "Renata Sales", UsuarioLogin = "renata", SenhaHash = hashUser, Role = "Comum", Ativo = true },
            new Usuario { Id = idJoao, EmpresaId = empresaId, Nome = "João Paiva (Separador)", UsuarioLogin = "separador", SenhaHash = hashUser, Role = "Comum", Ativo = true },
            new Usuario { Id = idLia, EmpresaId = empresaId, Nome = "Lia Torres (Conferente)", UsuarioLogin = "conferente", SenhaHash = hashUser, Role = "Comum", Ativo = true },
            new Usuario { Id = idMarcos, EmpresaId = empresaId, Nome = "Marcos Rota (Logística)", UsuarioLogin = "logistica", SenhaHash = hashUser, Role = "Comum", Ativo = true },
            new Usuario { Id = idPedro, EmpresaId = empresaId, Nome = "Pedro Silva (Motorista)", UsuarioLogin = "motorista", SenhaHash = hashUser, Role = "Comum", Ativo = true }
        );

        // Setores: 1 Comercial, 2 Separação, 3 Logística, 4 Conferência, 5 Entregas, 6 Compras, 7 Vendedor, 8 Financeiro
        var setoresAdmin = new[] { 1, 2, 3, 4, 5, 6, 7, 8 };
        foreach (var s in setoresAdmin)
            db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idAdmin, SetorId = s });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idRenata, SetorId = 1 });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idRenata, SetorId = 7 });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idJoao, SetorId = 2 });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idLia, SetorId = 4 });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idMarcos, SetorId = 3 });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idMarcos, SetorId = 5 });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idPedro, SetorId = 3 });
        db.UsuarioSetores.Add(new UsuarioSetor { UsuarioId = idPedro, SetorId = 5 });

        // ── 4. HIERARQUIA: DEPARTAMENTOS → CATEGORIAS → SUBCATEGORIAS ──
        var departamentos = new (string Nome, int Ordem, string FotoUrl, string Descricao)[]
        {
            ("Suplementos", 1, "https://placehold.co/560x400/5b21b6/ffffff.png?text=Suplementos", "Proteínas, creatinas, pré-treinos e aminoácidos para o seu treino."),
            ("Vitaminas e Minerais", 2, "https://placehold.co/560x400/2563eb/ffffff.png?text=Vitaminas+e+Minerais", "Multivitamínicos, vitaminas e minerais essenciais para o dia a dia."),
            ("Alimentos Saudáveis", 3, "https://placehold.co/560x400/d97706/ffffff.png?text=Alimentos+Saudaveis", "Granolas, aveias, pastas de amendoim, méis e adoçantes naturais."),
            ("Snacks", 4, "https://placehold.co/560x400/e11d48/ffffff.png?text=Snacks", "Barras, salgadinhos e frutas para qualquer hora do dia."),
            ("Produtos Naturais", 5, "https://placehold.co/560x400/65a30d/ffffff.png?text=Produtos+Naturais", "Castanhas, chás, cacau e sementes selecionadas."),
            ("Veganos", 6, "https://placehold.co/560x400/059669/ffffff.png?text=Veganos", "Opções 100% vegetais para a sua rotina."),
            ("Sem Açúcar", 7, "https://placehold.co/560x400/b45309/ffffff.png?text=Sem+Acucar", "Doces e chocolates sem adição de açúcar."),
            ("Sem Glúten", 8, "https://placehold.co/560x400/a16207/ffffff.png?text=Sem+Gluten", "Alimentos sem glúten para dietas restritivas.")
        };
        var depIds = new Dictionary<string, int>();
        foreach (var (nome, ordem, foto, descricao) in departamentos)
        {
            int id = seq.Next(nameof(Departamento));
            depIds[nome] = id;
            db.Departamentos.Add(new Departamento
            {
                Id = id,
                EmpresaId = empresaId,
                Nome = nome,
                Ordem = ordem,
                FotoUrl = foto,
                Descricao = descricao,
                Ativo = true
            });
        }

        var hierarquia = new (string Dept, string Cat, string[] Subs)[]
        {
            ("Suplementos", "Proteínas", new[] { "Whey", "Hipercalóricos" }),
            ("Suplementos", "Performance", new[] { "Creatinas", "Pré-treinos", "Aminoácidos" }),
            ("Vitaminas e Minerais", "Multivitamínicos", Array.Empty<string>()),
            ("Vitaminas e Minerais", "Minerais", Array.Empty<string>()),
            ("Vitaminas e Minerais", "Vitaminas", new[] { "Vitamina D", "Vitamina C" }),
            ("Vitaminas e Minerais", "Ômega 3 e Óleos", Array.Empty<string>()),
            ("Alimentos Saudáveis", "Grãos e Cereais", new[] { "Granolas", "Aveias" }),
            ("Alimentos Saudáveis", "Pastas e Méis", new[] { "Pastas de Amendoim", "Méis Naturais" }),
            ("Alimentos Saudáveis", "Adoçantes Naturais", Array.Empty<string>()),
            ("Snacks", "Barras", Array.Empty<string>()),
            ("Snacks", "Salgadinhos", Array.Empty<string>()),
            ("Snacks", "Frutas", Array.Empty<string>()),
            ("Produtos Naturais", "Castanhas e Mixes", new[] { "Castanhas", "Frutas Secas" }),
            ("Produtos Naturais", "Chás", new[] { "Camomila e Relax", "Verdes e Ervas" }),
            ("Produtos Naturais", "Cacau em Pó", Array.Empty<string>()),
            ("Produtos Naturais", "Farinhas e Sementes", new[] { "Sementes" }),
            ("Veganos", "Proteínas Vegetais", Array.Empty<string>()),
            ("Veganos", "Bebidas Vegetais", Array.Empty<string>()),
            ("Veganos", "Alternativas Lácteas", Array.Empty<string>()),
            ("Sem Açúcar", "Chocolates e Doces", Array.Empty<string>()),
            ("Sem Açúcar", "Adoçantes", Array.Empty<string>()),
            ("Sem Glúten", "Farinhas", Array.Empty<string>()),
            ("Sem Glúten", "Cereais", Array.Empty<string>())
        };
        var catIds = new Dictionary<string, int>();
        var subCatIds = new Dictionary<string, int>();
        int ordemCat = 0, ordemSub = 0;
        foreach (var (dept, cat, subs) in hierarquia)
        {
            int catId = seq.Next(nameof(Categoria));
            catIds[dept + "/" + cat] = catId;
            db.Categorias.Add(new Categoria { Id = catId, EmpresaId = empresaId, Nome = cat, Ordem = ++ordemCat, DepartamentoId = depIds[dept], Ativo = true });
            foreach (var sub in subs)
            {
                int subId = seq.Next(nameof(SubCategoria));
                subCatIds[dept + "/" + cat + "/" + sub] = subId;
                db.SubCategorias.Add(new SubCategoria { Id = subId, EmpresaId = empresaId, Nome = sub, Ordem = ++ordemSub, CategoriaId = catId, Ativo = true });
            }
        }

        // ── 5. MARCAS (fictícias) ─────────────────────────────────────
        var marcas = new (string Nome, string? Cor)[]
        {
            ("VerdeLife", "#1f7a4d"),
            ("PuraVida", "#2e9e6b"),
            ("FitNova", "#7c3aed"),
            ("GranCereal", "#d97706"),
            ("Natureza Fresca", "#65a30d"),
            ("OmegaPure", "#2563eb"),
            ("Cacau Puro", "#78350f"),
            ("SemAçúcar", "#b45309")
        };
        var marcaIds = new Dictionary<string, int>();
        foreach (var (nome, cor) in marcas)
        {
            int id = seq.Next(nameof(Marca));
            marcaIds[nome] = id;
            db.Marcas.Add(new Marca { Id = id, EmpresaId = empresaId, Nome = nome, Cor = cor });
        }

        // ── 6. PRODUTOS (38 itens, estoques variados) ─────────────────
        var prodSpecs = new (string Nome, string CodigoERP, string Slot, string Marca,
            decimal Varejo, decimal Atacado, int MinAtacado, decimal Estoque, bool Destaque,
            bool Granel, string Embalagem, string UnidadeVenda, decimal PesoUnidade)[]
        {
            ("Proteína Whey Premium Chocolate 900g", "MV-WHEY-CHOC", "Suplementos/Proteínas/Whey", "VerdeLife", 149.90m, 129.90m, 3, 42, true, false, "900g", "un", 0.9m),
            ("Proteína Whey Isolada Baunilha 900g", "MV-WHEY-ISO-BAU", "Suplementos/Proteínas/Whey", "FitNova", 189.90m, 169.90m, 3, 15, false, false, "900g", "un", 0.9m),
            ("Creatina Monohidratada 300g", "MV-CREA-300", "Suplementos/Performance/Creatinas", "VerdeLife", 89.90m, 79.90m, 3, 5, true, false, "300g", "un", 0.3m),
            ("Pré-treino Energia Cítrica 300g", "MV-PRETREINO", "Suplementos/Performance/Pré-treinos", "FitNova", 79.90m, 69.90m, 3, 0, false, false, "300g", "un", 0.3m),
            ("Hipercalórico Massa Max Chocolate 3kg", "MV-HIPER-3KG", "Suplementos/Proteínas/Hipercalóricos", "FitNova", 119.90m, 99.90m, 3, 18, false, false, "3kg", "un", 3.0m),
            ("BCAA 2:1:1 Cápsulas 120", "MV-BCAA-120", "Suplementos/Performance/Aminoácidos", "PuraVida", 59.90m, 49.90m, 3, 25, false, false, "120 cáps", "fr", 0.12m),
            ("Multivitamínico Diário 60 Cápsulas", "MV-VITA-MULTI", "Vitaminas e Minerais/Multivitamínicos", "PuraVida", 49.90m, 41.90m, 3, 60, true, false, "60 cáps", "fr", 0.1m),
            ("Vitamina D3 2000UI 60 Cápsulas", "MV-VITA-D3", "Vitaminas e Minerais/Vitaminas/Vitamina D", "PuraVida", 39.90m, 33.90m, 3, 8, false, false, "60 cáps", "fr", 0.1m),
            ("Magnésio Quelato 60 Cápsulas", "MV-MAG-60", "Vitaminas e Minerais/Minerais", "OmegaPure", 54.90m, 46.90m, 3, 30, true, false, "60 cáps", "fr", 0.1m),
            ("Ômega 3 1000mg 60 Cápsulas", "MV-OMEGA3-60", "Vitaminas e Minerais/Ômega 3 e Óleos", "OmegaPure", 69.90m, 59.90m, 3, 35, true, false, "60 cáps", "fr", 0.15m),
            ("Vitamina C 1g Efervescente 20 Comprimidos", "MV-VITA-C-20", "Vitaminas e Minerais/Vitaminas/Vitamina C", "PuraVida", 29.90m, 24.90m, 3, 22, false, false, "20 comp", "un", 0.35m),
            ("Granola Crocante com Castanhas 300g", "MV-GRAN-CAST", "Alimentos Saudáveis/Grãos e Cereais/Granolas", "GranCereal", 24.90m, 19.90m, 4, 55, true, false, "300g", "un", 0.3m),
            ("Granola Integral Frutas Vermelhas 300g", "MV-GRAN-FRUT", "Alimentos Saudáveis/Grãos e Cereais/Granolas", "GranCereal", 22.90m, 18.90m, 4, 40, false, false, "300g", "un", 0.3m),
            ("Aveia em Flocos 500g", "MV-AVEIA-500", "Alimentos Saudáveis/Grãos e Cereais/Aveias", "GranCereal", 12.90m, 9.90m, 5, 120, false, true, "500g", "kg", 0.5m),
            ("Farinha de Amêndoas 500g", "MV-FAR-AMENDOA", "Sem Glúten/Farinhas", "Natureza Fresca", 34.90m, 28.90m, 3, 14, false, false, "500g", "un", 0.5m),
            ("Pasta de Amendoim Integral Sem Açúcar 500g", "MV-PASTA-500", "Alimentos Saudáveis/Pastas e Méis/Pastas de Amendoim", "PuraVida", 26.90m, 21.90m, 5, 80, true, false, "500g", "un", 0.52m),
            ("Pasta de Amendoim com Cacau 500g", "MV-PASTA-CACAU", "Alimentos Saudáveis/Pastas e Méis/Pastas de Amendoim", "VerdeLife", 29.90m, 24.90m, 5, 45, false, false, "500g", "un", 0.52m),
            ("Mel Orgânico Silvestre 500g", "MV-MEL-500", "Alimentos Saudáveis/Pastas e Méis/Méis Naturais", "Natureza Fresca", 32.90m, 27.90m, 3, 20, false, false, "500g", "un", 0.55m),
            ("Açúcar de Coco Orgânico 500g", "MV-ACUCAR-COCO", "Alimentos Saudáveis/Adoçantes Naturais", "Natureza Fresca", 21.90m, 17.90m, 3, 30, false, false, "500g", "un", 0.5m),
            ("Barra Proteica Chocolate 60g", "MV-BARRA-PROT", "Snacks/Barras", "FitNova", 12.90m, 9.90m, 10, 90, true, false, "60g", "un", 0.06m),
            ("Barra de Cereal Castanhas 30g", "MV-BARRA-CER", "Snacks/Barras", "GranCereal", 6.90m, 4.90m, 12, 70, false, false, "30g", "un", 0.03m),
            ("Cookies Proteicos de Cacau 120g", "MV-COOKIE-PROT", "Sem Açúcar/Chocolates e Doces", "FitNova", 16.90m, 12.90m, 6, 25, false, false, "120g", "un", 0.12m),
            ("Chocolate 80% Cacau Sem Açúcar 90g", "MV-CHOC-80", "Sem Açúcar/Chocolates e Doces", "Cacau Puro", 14.90m, 11.90m, 6, 4, false, false, "90g", "un", 0.09m),
            ("Chips de Banana Integral 100g", "MV-CHIPS-BANANA", "Snacks/Frutas", "Natureza Fresca", 13.90m, 10.90m, 6, 8, false, false, "100g", "un", 0.1m),
            ("Mix de Castanhas Premium 200g", "MV-MIX-CAST", "Produtos Naturais/Castanhas e Mixes/Castanhas", "Natureza Fresca", 39.90m, 32.90m, 4, 18, true, false, "200g", "un", 0.2m),
            ("Castanha do Pará 200g", "MV-CAST-PARA", "Produtos Naturais/Castanhas e Mixes/Castanhas", "Natureza Fresca", 29.90m, 24.90m, 4, 60, false, false, "200g", "un", 0.2m),
            ("Mix de Frutas Secas 300g", "MV-MIX-FRUTAS", "Produtos Naturais/Castanhas e Mixes/Frutas Secas", "Natureza Fresca", 27.90m, 22.90m, 4, 35, false, false, "300g", "un", 0.3m),
            ("Chá Verde com Limão 20 Sachês", "MV-CHA-VERDE", "Produtos Naturais/Chás/Verdes e Ervas", "Cacau Puro", 15.90m, 12.90m, 6, 65, true, false, "20 sachês", "un", 0.04m),
            ("Chá de Camomila Relax 20 Sachês", "MV-CHA-CAMOMILA", "Produtos Naturais/Chás/Camomila e Relax", "Cacau Puro", 12.90m, 9.90m, 6, 44, false, false, "20 sachês", "un", 0.04m),
            ("Farinha de Linhaça Dourada 300g", "MV-LINHACA-300", "Produtos Naturais/Farinhas e Sementes/Sementes", "GranCereal", 15.90m, 12.90m, 5, 48, false, true, "300g", "kg", 0.3m),
            ("Quinoa Real em Grãos 500g", "MV-QUINOA-500", "Sem Glúten/Cereais", "Natureza Fresca", 28.90m, 23.90m, 4, 0, false, false, "500g", "un", 0.5m),
            ("Cacau em Pó 100% Orgânico 300g", "MV-CACAU-PO", "Produtos Naturais/Cacau em Pó", "Cacau Puro", 24.90m, 19.90m, 4, 18, false, false, "300g", "un", 0.3m),
            ("Semente de Chia 500g", "MV-CHIA-500", "Produtos Naturais/Farinhas e Sementes/Sementes", "GranCereal", 19.90m, 15.90m, 5, 55, false, true, "500g", "kg", 0.5m),
            ("Whey Vegano Proteína de Ervilha 500g", "MV-WHEY-VEGANO", "Veganos/Proteínas Vegetais", "VerdeLife", 139.90m, 119.90m, 3, 12, true, false, "500g", "un", 0.5m),
            ("Leite Vegetal de Aveia 1L", "MV-LEITE-AVEIA", "Veganos/Bebidas Vegetais", "Natureza Fresca", 12.90m, 9.90m, 8, 55, false, false, "1L", "un", 1.0m),
            ("Iogurte de Soja Natural 170g", "MV-IOGURTE-SOJA", "Veganos/Alternativas Lácteas", "PuraVida", 8.90m, 6.90m, 10, 30, false, false, "170g", "un", 0.17m),
            ("Adoçante Stevia Líquida 100ml", "MV-STEVIA", "Sem Açúcar/Adoçantes", "Cacau Puro", 19.90m, 14.90m, 5, 50, false, false, "100ml", "un", 0.12m),
            ("Snack de Grão-de-Bico Curry 80g", "MV-GRAO-BICO", "Snacks/Salgadinhos", "PuraVida", 9.90m, 7.90m, 8, 40, false, false, "80g", "un", 0.08m)
        };

        var produtosPorNome = new Dictionary<string, Produto>();
        foreach (var s in prodSpecs)
        {
            var partes = s.Slot.Split('/');
            var subCategoriaId = partes.Length > 2 ? subCatIds[s.Slot] : (int?)null;
            var p = new Produto
            {
                Id = seq.Next(nameof(Produto)),
                EmpresaId = empresaId,
                Nome = s.Nome,
                CodigoERP = s.CodigoERP,
                DepartamentoId = depIds[partes[0]],
                CategoriaId = catIds[partes[0] + "/" + partes[1]],
                SubCategoriaId = subCategoriaId,
                MarcaId = marcaIds[s.Marca],
                PrecoVarejo = s.Varejo,
                PrecoAtacado = s.Atacado,
                QuantidadeMinimaAtacado = s.MinAtacado,
                VendidoAGranel = s.Granel,
                Embalagem = s.Embalagem,
                UnidadeVenda = s.UnidadeVenda,
                ImagemUrl = "https://placehold.co/560x700/e9f2e6/1f7a4d.png?text=" + Uri.EscapeDataString(s.Nome.Split(" ")[0] + "+" + s.Embalagem),
                Ativo = true,
                Destaque = s.Destaque,
                Estoque = s.Estoque,
                ValorFrete = 1m,
                PesoUnidade = s.PesoUnidade
            };
            db.Produtos.Add(p);
            produtosPorNome[s.Nome] = p;
        }

        Produto P(string nome) => produtosPorNome[nome];

        // ── 7. PROMOÇÕES ──────────────────────────────────────────────
        var hoje = DateTime.UtcNow.Date;
        (string Titulo, string Descricao, decimal Valor, string[] Produtos, DateTime Inicio, DateTime Fim)[] promos =
        {
            ("Ofertas da Semana — Suplementos", "Creatina, whey, multivitamínico e ômega 3 com 12% de desconto.", 12m,
                new[] { "Proteína Whey Premium Chocolate 900g", "Creatina Monohidratada 300g", "Multivitamínico Diário 60 Cápsulas", "Ômega 3 1000mg 60 Cápsulas" },
                hoje.AddDays(-6), hoje.AddDays(7)),
            ("Snacks Saudáveis com 10% OFF", "Barras, cookies e chips para a sua rotina.", 10m,
                new[] { "Barra Proteica Chocolate 60g", "Cookies Proteicos de Cacau 120g", "Chips de Banana Integral 100g" },
                hoje.AddDays(-4), hoje.AddDays(10)),
            ("Granolas em Promoção", "Granolas e aveia com 15% de desconto.", 15m,
                new[] { "Granola Crocante com Castanhas 300g", "Granola Integral Frutas Vermelhas 300g", "Aveia em Flocos 500g" },
                hoje.AddDays(-3), hoje.AddDays(8)),
            ("Quinta do Bem-Estar", "Pasta de amendoim por um preço especial.", 10m,
                new[] { "Pasta de Amendoim Integral Sem Açúcar 500g", "Pasta de Amendoim com Cacau 500g" },
                hoje.AddDays(-2), hoje.AddDays(5))
        };

        foreach (var (titulo, descricao, valor, produtos, inicio, fim) in promos)
        {
            int promoId = seq.Next(nameof(Promocao));
            db.Promocoes.Add(new Promocao
            {
                Id = promoId,
                EmpresaId = empresaId,
                Titulo = titulo,
                Descricao = descricao,
                Tipo = "percentual",
                Valor = valor,
                DataInicio = inicio,
                DataFim = fim,
                Ativa = true
            });
            foreach (var nome in produtos)
            {
                db.PromocoesProduto.Add(new PromocaoProduto
                {
                    Id = seq.Next(nameof(PromocaoProduto)),
                    EmpresaId = empresaId,
                    PromocaoId = promoId,
                    ProdutoId = P(nome).Id
                });
            }
        }

        // ── 8. CUPONS ─────────────────────────────────────────────────
        void AddCupom(string codigo, string descricao, string tipo, decimal valor, string aplicavelEm,
            decimal? minPedido, decimal? maxDesconto, int? usosMaximos)
        {
            db.Cupons.Add(new Cupom
            {
                Id = seq.Next(nameof(Cupom)),
                EmpresaId = empresaId,
                Codigo = codigo,
                Descricao = descricao,
                Tipo = tipo,
                Valor = valor,
                AplicavelEm = aplicavelEm,
                ValorMinimoPedido = minPedido,
                ValorMaximoDesconto = maxDesconto,
                UsosMaximos = usosMaximos,
                DataInicio = hoje.AddDays(-5),
                DataFim = hoje.AddDays(60),
                Ativo = true,
                CriadoEm = DateTime.UtcNow
            });
        }
        AddCupom("BEM-VINDO10", "10% de desconto na primeira compra (pedido mínimo R$ 80).", "percentual", 10m, "pedido", 80m, 25m, 100);
        AddCupom("FRETEGRATIS", "Frete grátis em pedidos acima de R$ 150.", "frete_gratis", 0m, "pedido", 150m, null, 80);
        AddCupom("NATURAL15", "15% de desconto em pedidos acima de R$ 200 (máx. R$ 60).", "percentual", 15m, "pedido", 200m, 60m, 50);

        // ── 9. VEÍCULOS ───────────────────────────────────────────────
        int idVan = seq.Next(nameof(Veiculo));
        int idMoto = seq.Next(nameof(Veiculo));
        db.Veiculos.AddRange(
            new Veiculo { Id = idVan, EmpresaId = empresaId, Modelo = "Renault Kangoo Express", Placa = "MVR-2B34", PesoMaximo = 800m },
            new Veiculo { Id = idMoto, EmpresaId = empresaId, Modelo = "Scooter Elétrica", Placa = "MVR-3C45", PesoMaximo = 40m }
        );

        // ── 10. CLIENTES (fictícios) ──────────────────────────────────
        (string Nome, string Fantasia, string CpfCnpj, string Tipo, string Bairro, string Cidade, string Estado,
            string Cep, string Logradouro, string Numero, string Telefone, string Email, int? VendedorId)[]
            clientes = new (string, string, string, string, string, string, string, string, string, string, string, string, int?)[]
        {
            ("Mariana Oliveira", "", "391.452.780-11", "PF", "Boa Viagem", "Recife", "PE", "51021-040", "Rua dos Navegantes", "521", "(81) 99900-1101", "mariana.oliveira@email.com.br", idRenata),
            ("Lucas Almeida", "", "528.347.910-66", "PF", "Parnamirim", "Recife", "PE", "52060-190", "Av. Rui Barbosa", "1080", "(81) 99911-2202", "lucas.almeida@email.com.br", null),
            ("Fernanda Sousa", "", "446.739.580-00", "PF", "Casa Forte", "Recife", "PE", "52061-450", "Rua do Futuro", "307", "(81) 99922-3303", "fernanda.sousa@email.com.br", null),
            ("Carlos Henrique", "", "721.096.340-87", "PF", "Graças", "Recife", "PE", "52011-210", "Rua Amélia", "44", "(81) 99933-4404", "carlos.henrique@email.com.br", idRenata),
            ("Juliana Ribeiro", "", "830.481.670-22", "PF", "Espinheiro", "Recife", "PE", "52020-010", "Rua do Espinheiro", "512", "(81) 99944-5505", "juliana.ribeiro@email.com.br", null),
            ("Roberto Marques", "", "157.920.830-45", "PF", "Setúbal", "Recife", "PE", "51110-050", "Av. Eng. Domingos Ferreira", "2121", "(81) 99955-6606", "roberto.marques@email.com.br", null),
            ("Patrícia Nunes", "", "604.285.710-93", "PF", "Boa Viagem", "Recife", "PE", "51020-140", "Rua Padre Bernardo Pessoa", "78", "(81) 99966-7707", "patricia.nunes@email.com.br", idRenata),
            ("André Vieira", "", "312.574.980-21", "PF", "Derby", "Recife", "PE", "52010-050", "Rua do Príncipe", "190", "(81) 99977-8808", "andre.vieira@email.com.br", null),
            ("Beatriz Campos", "", "913.671.450-08", "PF", "Aflitos", "Recife", "PE", "52050-100", "Rua dos Aflitos", "260", "(81) 99988-9909", "beatriz.campos@email.com.br", null),
            ("Academia Corpo & Vida LTDA", "Corpo & Vida", "22.456.789/0001-12", "PJ", "Madalena", "Recife", "PE", "50610-000", "Rua Real da Torre", "900", "(81) 3456-1101", "compras@corporovida.com.br", null),
            ("NutriFit Alimentos LTDA", "NutriFit", "33.678.910/0001-41", "PJ", "Imbiribeira", "Recife", "PE", "51170-040", "Av. Eng. Abdias de Carvalho", "1550", "(81) 3456-2202", "vendas@nutrifit.com.br", null),
            ("Sofia Martins", "", "748.320.510-64", "PF", "Imbiribeira", "Recife", "PE", "51170-042", "Rua Comendador Matos", "315", "(81) 99990-0012", "sofia.martins@email.com.br", null)
        };

        var clientesPorNome = new Dictionary<string, Cliente>();
        foreach (var c in clientes)
        {
            var cli = new Cliente
            {
                Id = seq.Next(nameof(Cliente)),
                EmpresaId = empresaId,
                RazaoSocialNome = c.Nome,
                NomeFantasia = c.Fantasia,
                CpfCnpj = c.CpfCnpj,
                TipoPessoa = c.Tipo,
                Cep = c.Cep,
                Logradouro = c.Logradouro,
                Numero = c.Numero,
                Bairro = c.Bairro,
                Cidade = c.Cidade,
                Estado = c.Estado,
                Telefone = c.Telefone,
                Email = c.Email,
                RegimeTributario = c.Tipo == "PJ" ? "Simples Nacional" : "",
                VendedorId = c.VendedorId,
                BloqueadoFinanceiro = false
            };
            db.Clientes.Add(cli);
            clientesPorNome[c.Nome] = cli;
        }
        Cliente C(string nome) => clientesPorNome[nome];

        // ── 11. CONTATOS ──────────────────────────────────────────────
        db.Contatos.AddRange(
            new Contato { Id = seq.Next(nameof(Contato)), EmpresaId = empresaId, Nome = "Carlos Eduardo", Telefone = "(81) 98123-4455", Email = "carlos@corporovida.com.br", Cargo = "Gerente de Compras", ClienteId = C("Academia Corpo & Vida LTDA").Id },
            new Contato { Id = seq.Next(nameof(Contato)), EmpresaId = empresaId, Nome = "Dra. Fernanda Lima", Telefone = "(81) 98234-5566", Email = "nutri@nutrifit.com.br", Cargo = "Nutricionista", ClienteId = C("NutriFit Alimentos LTDA").Id },
            new Contato { Id = seq.Next(nameof(Contato)), EmpresaId = empresaId, Nome = "Jorge Santos", Telefone = "(81) 98345-6677", Email = "jorge@corporovida.com.br", Cargo = "Sócio", ClienteId = C("Academia Corpo & Vida LTDA").Id },
            new Contato { Id = seq.Next(nameof(Contato)), EmpresaId = empresaId, Nome = "Michelle Andrade", Telefone = "(81) 98456-7788", Email = "", Cargo = "", ClienteId = null },
            new Contato { Id = seq.Next(nameof(Contato)), EmpresaId = empresaId, Nome = "Douglas Ferreira", Telefone = "(81) 98567-8899", Email = "", Cargo = "", ClienteId = null }
        );

        // ── 12. PEDIDOS ───────────────────────────────────────────────
        int idSeparador = idJoao;
        int idConferente = idLia;
        int idMotorista = idPedro;

        DateTime H(int daysAgo, int hoursAgo = 0) => DateTime.UtcNow.AddDays(-daysAgo).AddHours(-hoursAgo);

        (Cliente Cliente, string Titulo, string Status, string TipoEntrega, string Pagamento, int Dias, decimal Acrescimo, decimal? PctDesconto,
            (Produto Produto, decimal Qtd, decimal Preco)[] Itens)[] pedidos = new
            (Cliente, string, string, string, string, int, decimal, decimal?, (Produto, decimal, decimal)[])[]
        {
            (C("Lucas Almeida"), "Lucas Almeida", "Entregue", "Entrega", "Cartao", 35, 18.90m, null,
                new[] { (P("Proteína Whey Premium Chocolate 900g"), 1m, 149.90m), (P("Creatina Monohidratada 300g"), 2m, 89.90m) }),
            (C("Mariana Oliveira"), "Mariana Oliveira", "Entregue", "Entrega", "PIX", 28, 12.90m, 0.05m,
                new[] { (P("Proteína Whey Premium Chocolate 900g"), 1m, 149.90m), (P("Pasta de Amendoim Integral Sem Açúcar 500g"), 2m, 26.90m) }),
            (C("Academia Corpo & Vida LTDA"), "Academia Corpo & Vida", "Entregue", "Entrega", "Boleto", 21, 28.90m, null,
                new[] { (P("Hipercalórico Massa Max Chocolate 3kg"), 10m, 99.90m), (P("Creatina Monohidratada 300g"), 10m, 79.90m), (P("Multivitamínico Diário 60 Cápsulas"), 8m, 41.90m) }),
            (C("Patrícia Nunes"), "Patrícia Nunes", "Entregue", "Entrega", "PIX", 18, 12.90m, 0.05m,
                new[] { (P("Granola Crocante com Castanhas 300g"), 2m, 21.90m), (P("Aveia em Flocos 500g"), 2m, 12.90m), (P("Chá Verde com Limão 20 Sachês"), 2m, 15.90m) }),
            (C("Lucas Almeida"), "Lucas Almeida", "Entregue", "Entrega", "Cartao", 14, 18.90m, null,
                new[] { (P("Multivitamínico Diário 60 Cápsulas"), 2m, 49.90m), (P("Ômega 3 1000mg 60 Cápsulas"), 2m, 69.90m), (P("Barra Proteica Chocolate 60g"), 6m, 12.90m) }),
            (C("NutriFit Alimentos LTDA"), "NutriFit Alimentos", "Entregue", "Entrega", "Boleto", 12, 28.90m, null,
                new[] { (P("Leite Vegetal de Aveia 1L"), 24m, 9.90m), (P("Granola Crocante com Castanhas 300g"), 12m, 19.90m), (P("Semente de Chia 500g"), 10m, 15.90m) }),
            (C("Juliana Ribeiro"), "Juliana Ribeiro", "Entregue", "Entrega", "PIX", 10, 12.90m, null,
                new[] { (P("Barra Proteica Chocolate 60g"), 12m, 12.90m), (P("Cookies Proteicos de Cacau 120g"), 2m, 16.90m), (P("Chocolate 80% Cacau Sem Açúcar 90g"), 2m, 14.90m) }),
            (C("Sofia Martins"), "Sofia Martins", "Entregue", "Entrega", "PIX", 7, 12.90m, null,
                new[] { (P("Chá de Camomila Relax 20 Sachês"), 2m, 12.90m), (P("Mel Orgânico Silvestre 500g"), 1m, 32.90m) }),
            (C("André Vieira"), "André Vieira", "Entregue", "Entrega", "Cartao", 5, 18.90m, null,
                new[] { (P("Proteína Whey Isolada Baunilha 900g"), 1m, 189.90m) }),
            (C("Mariana Oliveira"), "Mariana Oliveira", "Entregue", "Entrega", "PIX", 3, 12.90m, null,
                new[] { (P("Creatina Monohidratada 300g"), 1m, 89.90m), (P("Mix de Castanhas Premium 200g"), 1m, 39.90m) }),
            (C("Fernanda Sousa"), "Fernanda Sousa", "Entregue", "Entrega", "Cartao", 2, 12.90m, null,
                new[] { (P("Granola Integral Frutas Vermelhas 300g"), 3m, 22.90m), (P("Semente de Chia 500g"), 1m, 19.90m) }),
            (C("Lucas Almeida"), "Lucas Almeida", "EmEntrega", "Entrega", "PIX", 1, 18.90m, 0.05m,
                new[] { (P("Proteína Whey Premium Chocolate 900g"), 1m, 131.90m), (P("Creatina Monohidratada 300g"), 2m, 79.10m), (P("Ômega 3 1000mg 60 Cápsulas"), 1m, 61.50m) }),
            (C("Mariana Oliveira"), "Mariana Oliveira", "EmEntrega", "Entrega", "Cartao", 1, 12.90m, null,
                new[] { (P("Pasta de Amendoim Integral Sem Açúcar 500g"), 2m, 26.90m), (P("Barra Proteica Chocolate 60g"), 5m, 12.90m) }),
            (C("Juliana Ribeiro"), "Juliana Ribeiro", "ProntoEntrega", "Entrega", "PIX", 0, 12.90m, null,
                new[] { (P("Chips de Banana Integral 100g"), 2m, 13.90m), (P("Snack de Grão-de-Bico Curry 80g"), 3m, 9.90m), (P("Chocolate 80% Cacau Sem Açúcar 90g"), 2m, 13.40m) }),
            (C("Carlos Henrique"), "Carlos Henrique", "Pendente", "Entrega", "PIX", 0, 18.90m, 0.05m,
                new[] { (P("Proteína Whey Premium Chocolate 900g"), 1m, 131.90m), (P("Vitamina C 1g Efervescente 20 Comprimidos"), 2m, 29.90m) }),
            (C("Sofia Martins"), "Sofia Martins", "Pendente", "Entrega", "Cartao", 0, 12.90m, null,
                new[] { (P("Magnésio Quelato 60 Cápsulas"), 1m, 54.90m), (P("Ômega 3 1000mg 60 Cápsulas"), 1m, 69.90m) }),
            (C("Academia Corpo & Vida LTDA"), "Academia Corpo & Vida", "EmSeparacao", "Entrega", "Boleto", 0, 28.90m, null,
                new[] { (P("Creatina Monohidratada 300g"), 25m, 79.90m), (P("BCAA 2:1:1 Cápsulas 120"), 10m, 49.90m) }),
            (C("Fernanda Sousa"), "Fernanda Sousa", "EmConferencia", "Entrega", "PIX", 0, 12.90m, null,
                new[] { (P("Aveia em Flocos 500g"), 4m, 12.90m), (P("Granola Crocante com Castanhas 300g"), 2m, 24.90m), (P("Farinha de Linhaça Dourada 300g"), 1m, 15.90m) }),
            (C("Roberto Marques"), "Roberto Marques", "EmConferencia", "Entrega", "Cartao", 0, 18.90m, null,
                new[] { (P("Proteína Whey Premium Chocolate 900g"), 1m, 149.90m), (P("Multivitamínico Diário 60 Cápsulas"), 1m, 49.90m) }),
            (C("Patrícia Nunes"), "Patrícia Nunes", "ProntoRetirada", "Retirada", "PIX", 0, 0m, 0.05m,
                new[] { (P("Whey Vegano Proteína de Ervilha 500g"), 1m, 139.90m), (P("Leite Vegetal de Aveia 1L"), 2m, 12.90m) }),
            (C("Beatriz Campos"), "Beatriz Campos", "AguardandoConfirmacao", "Entrega", "Boleto", 0, 18.90m, null,
                new[] { (P("Whey Vegano Proteína de Ervilha 500g"), 2m, 119.90m), (P("Iogurte de Soja Natural 170g"), 6m, 6.90m) }),
            (C("Roberto Marques"), "Roberto Marques", "EmEntrega", "Entrega", "PIX", 0, 12.90m, null,
                new[] { (P("Leite Vegetal de Aveia 1L"), 6m, 9.90m) }),
            (C("Mariana Oliveira"), "Mariana Oliveira", "Cancelado", "Entrega", "Cartao", 2, 12.90m, null,
                new[] { (P("Proteína Whey Premium Chocolate 900g"), 1m, 149.90m) })
        };

        var pedidosCriados = new List<(Pedido Pedido, (Produto Produto, decimal Qtd)[] Itens, string Status, int? SeparadorId, int? ConferenteId)>();
        foreach (var (cliente, titulo, status, tipoEntrega, pagamento, dias, acrescimo, pctDesconto, itens) in pedidos)
        {
            decimal valorTotal = 0, pesoTotal = 0;
            var itensPedido = new List<ItemPedido>();
            foreach (var (produto, qtd, preco) in itens)
            {
                valorTotal += preco * qtd;
                pesoTotal += produto.PesoUnidade * qtd;
                itensPedido.Add(new ItemPedido
                {
                    Id = seq.Next(nameof(ItemPedido)),
                    EmpresaId = empresaId,
                    ProdutoId = produto.Id,
                    Quantidade = qtd,
                    PrecoUnitario = preco,
                    PesoUnitario = produto.PesoUnidade,
                    Separado = false,
                    Status = "Pendente"
                });
            }

            decimal desconto = pctDesconto.HasValue ? Math.Round(valorTotal * pctDesconto.Value, 2) : 0;
            decimal valorFinal = valorTotal + acrescimo - desconto;

            var pedido = new Pedido
            {
                Id = seq.Next(nameof(Pedido)),
                EmpresaId = empresaId,
                ClienteId = cliente.Id,
                SolicitanteNome = cliente.RazaoSocialNome,
                SolicitanteTelefone = cliente.Telefone,
                CpfCnpj = cliente.CpfCnpj,
                Cep = cliente.Cep,
                Logradouro = cliente.Logradouro,
                Numero = cliente.Numero,
                Bairro = cliente.Bairro,
                Cidade = cliente.Cidade,
                Estado = cliente.Estado,
                EnderecoConfere = true,
                Status = status,
                TipoEntrega = tipoEntrega,
                Pagamento = pagamento,
                Desconto = desconto,
                Acrescimo = acrescimo,
                ValorFinal = valorFinal,
                ValorTotal = valorTotal,
                PesoTotal = pesoTotal,
                DataCriacao = H(dias),
                LiberadoFinanceiro = status != "Pendente" && status != "AguardandoConfirmacao",
                Itens = itensPedido
            };
            db.Pedidos.Add(pedido);
            pedidosCriados.Add((pedido, itens.Select(i => (i.Produto, i.Qtd)).ToArray(), status, null, null));
        }

        // Itens das etapas de separação/conferência
        foreach (var (pedido, _, status, _, _) in pedidosCriados)
        {
            if (status is "EmSeparacao" or "EmConferencia" or "ProntoEntrega" or "ProntoRetirada" or "EmEntrega")
            {
                bool itensSeparados = status is "EmConferencia" or "ProntoEntrega" or "ProntoRetirada" or "EmEntrega";
                foreach (var item in pedido.Itens)
                {
                    item.Separado = itensSeparados;
                    item.SeparadoPorUsuarioId = itensSeparados ? idSeparador : null;
                    item.Status = itensSeparados ? "Separado" : "Pendente";
                }
            }
        }

        // ── 13. ROTA / ENTREGAS (demonstra Em Rota e Conferência de rota) ──
        var rotaHoje = new Rota
        {
            Id = seq.Next(nameof(Rota)),
            EmpresaId = empresaId,
            Data = hoje,
            VeiculoId = idVan,
            MotoristaId = idMotorista,
            Status = "Criada",
            LinkGoogleMaps = ""
        };
        db.Rotas.Add(rotaHoje);

        int ordemRota = 1;
        foreach (var (pedido, emRota) in new[] { (pedidosCriados[11].Pedido, true), (pedidosCriados[12].Pedido, true), (pedidosCriados[21].Pedido, false) })
        {
            var entrega = new Entrega
            {
                Id = seq.Next(nameof(Entrega)),
                EmpresaId = empresaId,
                RotaId = rotaHoje.Id,
                Ordem = ordemRota++,
                Status = emRota ? "EmRota" : "PendenteConferencia",
                Observacao = "",
                MotivoDevolucao = ""
            };
            db.Entregas.Add(entrega);
            db.EntregasPedidos.Add(new EntregaPedido { EntregaId = entrega.Id, PedidoId = pedido.Id });
        }

        // ── 14. ATENDIMENTOS (conversas de demonstração) ──────────────
        void AddAtendimento(string nome, string telefone, string origem, string interesse, string bairro,
            bool iaAtiva, int? atendenteId, int? pedidoId, (string Texto, string Sender, DateTime Quando)[] msgs)
        {
            int convId = seq.Next(nameof(Conversa));
            int leadId = seq.Next(nameof(AtendimentoLead));
            var conv = new Conversa
            {
                Id = convId,
                EmpresaId = empresaId,
                DataCriacao = msgs[0].Quando,
                Titulo = nome,
                Tipo = TipoConversa.Atendimento
            };
            db.Conversas.Add(conv);
            db.AtendimentoLeads.Add(new AtendimentoLead
            {
                Id = leadId,
                EmpresaId = empresaId,
                ConversaId = conv.Id,
                Nome = nome,
                Telefone = telefone,
                Origem = origem,
                Interesse = interesse,
                Bairro = bairro,
                IAAtiva = iaAtiva,
                UsuarioAtendenteId = atendenteId,
                PedidoId = pedidoId
            });
            foreach (var (texto, sender, quando) in msgs)
            {
                db.Mensagens.Add(new Mensagem
                {
                    Id = seq.Next(nameof(Mensagem)),
                    EmpresaId = empresaId,
                    ConversaId = conv.Id,
                    UsuarioRemetenteId = sender == "agent" ? atendenteId : null,
                    Texto = texto,
                    UrlAnexo = sender == "bot" ? "bot" : sender == "user" ? "user" : "",
                    DataEnvio = quando
                });
            }
        }

        AddAtendimento("Fernanda Sousa", "(81) 99922-3303", "WhatsApp", "Prazo de entrega", "Casa Forte", true, null, null,
            new[] { ("Olá! Queria saber qual o prazo de entrega para o bairro de Casa Forte.", "user", H(1, 5)), ("Nossas entregas na região levam de 1 a 3 dias úteis, dependendo do bairro e do valor do pedido.", "bot", H(1, 4)) });
        AddAtendimento("Roberto Marques", "(81) 99955-6606", "WhatsApp", "Creatina Monohidratada", "Setúbal", true, null, null,
            new[] { ("Boa tarde! Quando haverá reposição da Creatina Monohidratada 300g?", "user", H(1, 2)), ("Assim que o produto voltar ao estoque, avisamos você por aqui. Quer deixar uma reserva?", "bot", H(1, 1)) });
        AddAtendimento("Juliana Ribeiro", "(81) 99944-5505", "WhatsApp", "Alterar endereço", "Espinheiro", false, idRenata, null,
            new[] { ("Preciso alterar o endereço de entrega do meu último pedido.", "user", H(0, 6)), ("Claro! Vou registrar aqui a alteração. O endereço fica no Espinheiro, certo?", "agent", H(0, 5)) });
        AddAtendimento("Beatriz Campos", "(81) 99988-9909", "WhatsApp", "Produtos sem açúcar", "Aflitos", true, null, null,
            new[] { ("Vocês têm opções sem açúcar para o meu plano alimentar?", "user", H(0, 4)), ("Temos! Chocolate 80% cacau, cookies proteicos e adoçante stevia são algumas das opções. Posso separar para você?", "bot", H(0, 3)) });
        AddAtendimento("Mariana Oliveira", "(81) 99900-1101", "WhatsApp", "Nova compra", "Boa Viagem", false, idRenata, P13Id(),
            new[] { ("Oi! Quero repetir a compra que fiz semana passada: pasta de amendoim e barras de proteína.", "user", H(0, 2)), ("Perfeito, Mariana! Vou montar o pedido igual ao anterior e te enviar para confirmar.", "agent", H(0, 1)) });

        // atalho: P13 é o pedido 'EmEntrega' da Mariana
        int P13Id()
        {
            var p = pedidosCriados[12].Pedido;
            return p.Id;
        }

        // ── 15. BANNERS DE VENDA ──────────────────────────────────────
        db.Banners.AddRange(
            new Banner { Id = seq.Next(nameof(Banner)), EmpresaId = empresaId, Titulo = "Cuide da sua rotina. Cuide de você.", Subtitulo = "Produtos naturais, suplementos e alimentação saudável", ImagemUrl = "https://placehold.co/1400x500/1f7a4d/ffffff.png?text=Cuide+da+sua+rotina", LinkTipo = "", LinkValor = null, Posicao = "carrossel", Ordem = 1, Ativo = true },
            new Banner { Id = seq.Next(nameof(Banner)), EmpresaId = empresaId, Titulo = "Suplementos com ofertas da semana", Subtitulo = "Whey, creatina e vitaminas com desconto", ImagemUrl = "https://placehold.co/1400x500/2e9e6b/ffffff.png?text=Suplementos+em+oferta", LinkTipo = "departamento", LinkValor = depIds["Suplementos"].ToString(), Posicao = "carrossel", Ordem = 2, Ativo = true },
            new Banner { Id = seq.Next(nameof(Banner)), EmpresaId = empresaId, Titulo = "Cereais e castanhas para sua rotina", Subtitulo = "Granolas, aveia, pasta de amendoim e castanhas selecionadas", ImagemUrl = "https://placehold.co/1400x500/d97706/ffffff.png?text=Cereais+e+castanhas", LinkTipo = "departamento", LinkValor = depIds["Alimentos Saudáveis"].ToString(), Posicao = "secao", Ordem = 3, Ativo = true }
        );

        // ── 16. CONFIGURAÇÕES DE BOT (atendimento automático) ─────────
        db.BotsConfig.AddRange(
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Saudação", TipoTrigger = "Saudacao", ValorTrigger = "", TipoReacao = "Texto", TextoResposta = "Olá {nome}! 👋 Seja bem-vindo(a) à {empresa}. Posso ajudar com preços, produtos, estoque e status do pedido. 😊", AcaoBot = "Responder", Ordem = 1, Ativo = true },
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Consultar preço", TipoTrigger = "PalavraChave", ValorTrigger = "preço|preco|quanto custa|valor|custa|tabela", TipoReacao = "PrecoProduto", TextoResposta = "", AcaoBot = "Responder", Ordem = 2, Ativo = true },
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Consultar estoque", TipoTrigger = "PalavraChave", ValorTrigger = "estoque|tem dispon|disponível|disponivel|tem em|tem do|tem de", TipoReacao = "EstoqueProduto", TextoResposta = "", AcaoBot = "Responder", Ordem = 3, Ativo = true },
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Status do pedido", TipoTrigger = "PalavraChave", ValorTrigger = "pedido|rastrear|status do|onde está|onde esta|situação do|situacao do", TipoReacao = "StatusPedido", TextoResposta = "", AcaoBot = "Responder", Ordem = 4, Ativo = true },
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Formas de pagamento", TipoTrigger = "PalavraChave", ValorTrigger = "pagamento|pagar|boleto|pix|cartão|cartao|parcel", TipoReacao = "Texto", TextoResposta = "💳 Trabalhamos com PIX (à vista com desconto), boleto e cartão de crédito. Para empresas, os pedidos a partir de R$ 200 podem ser faturados.", AcaoBot = "Responder", Ordem = 5, Ativo = true },
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Entrega e frete", TipoTrigger = "PalavraChave", ValorTrigger = "entrega|frete|demora|prazo|quanto tempo|chega", TipoReacao = "Texto", TextoResposta = "🛵 Entregamos em Boa Viagem e região do Recife. O frete é calculado pelo CEP; retirada na loja é gratuita.", AcaoBot = "Responder", Ordem = 6, Ativo = true },
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Falar com humano", TipoTrigger = "PalavraChave", ValorTrigger = "contato|telefone|whatsapp|falar com|atendente|humano|vendedor", TipoReacao = "Texto", TextoResposta = "📞 Em instantes um(a) atendente da nossa equipe vai te atender. Aguarde um momento. 😊", AcaoBot = "ResponderEDesativarIA", Ordem = 7, Ativo = true },
            new BotConfig { Id = seq.Next(nameof(BotConfig)), EmpresaId = empresaId, Nome = "Captar interesse", TipoTrigger = "PalavraChave", ValorTrigger = "quero|preciso|vou querer|comprar|gostaria de", TipoReacao = "Texto", TextoResposta = "Ótima escolha! {interesse} é um dos nossos produtos mais procurados. Posso te passar detalhes e condições. 😊", AcaoBot = "SalvarLead", CampoLead = "Interesse", Ordem = 8, Ativo = true }
        );

        await db.SaveChangesAsync();
        await seq.ReajustarSequenciasAsync(db);

        Console.WriteLine($"[Seed] Loja demonstrativa 'Mundo Verde Boa Viagem' criada (empresa #{empresaId}).");
    }

    /// <summary>
    /// Gera ids sequenciais acima do maior id existente nas tabelas.
    /// Usa SQL direto (sem query filters), pois o id é global (PK) mesmo
    /// com multi-tenancy — garante que ids explícitos nunca colidam com
    /// registros já existentes de outras empresas.
    /// </summary>
    private sealed class Seq
    {
        private static readonly string[] Tabelas =
        {
            "ConfiguracoesSistema", "Usuarios", "Clientes", "Contatos", "Produtos", "Departamentos",
            "Categorias", "SubCategorias", "Marcas", "Pedidos", "ItensPedido", "Veiculos", "Rotas",
            "Entregas", "Conversas", "Mensagens", "AtendimentoLeads", "Banners", "BotsConfig",
            "Promocoes", "PromocoesProduto", "Cupons", "FaixasFrete"
        };

        private static string TabelaDaEntidade(string entidade) => entidade switch
        {
            "FaixaFrete" => "FaixasFrete",
            "Contato" => "Contatos",
            "Departamento" => "Departamentos",
            "Categoria" => "Categorias",
            "SubCategoria" => "SubCategorias",
            "Marca" => "Marcas",
            "Mensagem" => "Mensagens",
            "Conversa" => "Conversas",
            "Pedido" => "Pedidos",
            "Produto" => "Produtos",
            "ItemPedido" => "ItensPedido",
            "PromocaoProduto" => "PromocoesProduto",
            "Cliente" => "Clientes",
            "Usuario" => "Usuarios",
            "Veiculo" => "Veiculos",
            "Rota" => "Rotas",
            "Entrega" => "Entregas",
            "Promocao" => "Promocoes",
            "Cupom" => "Cupons",
            "AtendimentoLead" => "AtendimentoLeads",
            "Banner" => "Banners",
            "BotConfig" => "BotsConfig",
            "ConfiguracaoSistema" => "ConfiguracoesSistema",
            _ => entidade
        };

        private readonly Dictionary<string, long> _contadores = new();

        public Seq(AppDbContext db)
        {
            foreach (var nome in Tabelas)
                _contadores[nome] = MaxIdAsync(db, nome).GetAwaiter().GetResult();
        }

        public int Next(string entidade) => (int)++_contadores[TabelaDaEntidade(entidade)];

        private static async Task<int> MaxIdAsync(AppDbContext db, string tabela)
        {
            try
            {
                var sql = $@"SELECT COALESCE(MAX(""Id""), 0) AS ""Value"" FROM ""{tabela}""";
                return await db.Database.SqlQueryRaw<int>(sql, Array.Empty<object>()).SingleOrDefaultAsync();
            }
            catch
            {
                return 0;
            }
        }

        /// <summary>
        /// Realinha as sequences de identidade do PostgreSQL após inserir
        /// com ids explícitos, para não conflitar com a criação futura de
        /// registros via API.
        /// </summary>
        public async Task ReajustarSequenciasAsync(AppDbContext db)
        {
            foreach (var t in Tabelas)
            {
                try
                {
                    var sql =
                        $@"SELECT setval(pg_get_serial_sequence('""{t}""', 'Id'),
                                GREATEST((SELECT COALESCE(MAX(""Id""),1) FROM ""{t}""), 1), true);";
                    await db.Database.ExecuteSqlRawAsync(sql);
                }
                catch
                {
                    // tabela sem sequence de identidade — ignora
                }
            }
        }
    }
}