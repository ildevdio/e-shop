# Multigrãos

Sistema de gestão da distribuidora de produtos naturais **Multigrãos** (Centro — Paulista — PE), com portal público de e-commerce e área administrativa completa.

## Arquitetura

Monorepo com duas aplicações + banco de dados:

| Pasta          | Tecnologia                                                    | Papel                          |
| -------------- | ------------------------------------------------------------- | ------------------------------ |
| `Multigrao.Api`| ASP.NET Core 10, EF Core 10, Npgsql, JWT, SignalR, Swagger    | API REST + WebSocket          |
| `Multigrao.Ui` | React 19, TypeScript, Vite 8, Tailwind CSS 4, Zustand, axios  | Frontend (admin + portal)      |
| Postgres       | PostgreSQL 17 (docker-compose)                                | Banco de dados                 |

## Funcionalidades

### Portal público — `/multigraos-portal`

E-commerce do Multigrãos com dois temas:

- **E-commerce**: catálogo por categorias e marcas, seção de destaques (produtos marcados como destaque na gestão), busca com autocomplete, carrinho com quantidades digitáveis, mini barra fixa de finalizar pedido, taxa de embalagem para produtos tipo `KG` com 1 unidade (com opção "Levar 2kg"), e **Minha Conta** (acesso por CPF/CNPJ, sem senha, exibindo cadastro e histórico de pedidos). Os dados pessoais do cliente logado são pré-preenchidos automaticamente no próximo pedido.
- **Restaurante** ("Menu Digital"): lista de produtos por categoria com busca e carrinho.

O catálogo é filtrado pela seção de categorias (a dock "Categorias" aplica filtro por categoria, com opção "Todas as categorias").

### Área administrativa — `/` (autenticada)

- **Dashboard**: visão geral do negócio.
- **Comercial**: pedidos, clientes, contatos e lista de atendimentos.
- **Catálogo**: gestão de produtos (preço varejo/atacado, peso, embalagem, unidade de venda, marca, categoria, destaque), categorias e marcas.
- **Separação**, **Logística**, **Conferência** e **Entregas**: operações de estoque e logística.
- **Financeiro**: contas, acréscimos/descontos e controle financeiro.
- **Chat**: comunicação interna em tempo real (SignalR).
- **Empresa**: avisos, metas, comunicados, enquetes e equipe.
- **Configurações**: temas, cor principal e senha mestre.

## Requisitos

- .NET SDK 10
- Node.js 20+ (npm)
- Docker (para o PostgreSQL local)

## Configuração e execução

### 1. Banco de dados (PostgreSQL)

```bash
docker compose up -d
```

Cria o banco `multigrao_db` (usuário/senha `postgres`).

### 2. API

```bash
cd Multigrao.Api
dotnet restore
dotnet ef database update   # aplica as migrations
dotnet run --profile http
```

A API sobe em `http://localhost:5050` (Swagger em `/swagger`).

Variáveis de ambiente (opcionais em desenvolvimento; o `appsettings.json` já tem padrões):

| Variável             | Padrão (dev)                          |
| -------------------- | ------------------------------------- |
| `DB_CONNECTION_STRING` | `Host=localhost;Port=5432;Database=multigrao_db;Username=postgres;Password=postgres` |
| `JWT_KEY`            | chave de desenvolvimento              |
| `CORS_ORIGINS`       | `http://localhost:5173`               |
| `MASTER_PASSWORD`    | senha mestre de suporte               |

### 3. Frontend

```bash
cd Multigrao.Ui
npm install
npm run dev
```

A UI sobe em `http://localhost:5173`. Rotas principais:

- `/` — área administrativa (login)
- `/multigraos-portal` — portal público (e-commerce) · `/tabela` redireciona para ele

Variáveis de ambiente do frontend (arquivo `Multigrao.Ui/.env`):

| Variável        | Padrão                   |
| --------------- | ------------------------ |
| `VITE_API_URL`  | `http://localhost:5050`  |

## Comandos úteis

| Comando                      | Descrição                                |
| ---------------------------- | ---------------------------------------- |
| `docker compose up -d`       | sobe o PostgreSQL local                  |
| `dotnet run` (em `Multigrao.Api`) | sobe a API                           |
| `dotnet ef migrations add <nome>` | cria nova migration                  |
| `dotnet ef database update`  | aplica migrations                        |
| `npm run dev` (em `Multigrao.Ui`) | sobe a UI com hot-reload             |
| `npm run build`              | typecheck (`tsc -b`) + build de produção |
| `npm run lint`               | oxlint                                   |
| `npx tsc -b`                 | typecheck apenas                         |

## Deploy

- **API**: definida em `render.yaml` — serviço web `multigrao-api` (Dockerfile em `Multigrao.Api/Dockerfile`) com banco PostgreSQL gerenciado `multigrao-db`. Variáveis `JWT_KEY` e `MASTER_PASSWORD` devem ser definidas no painel da Render.
- **Frontend**: hospedado na Vercel (`https://multigraos.vercel.app`), origem permitida no CORS da API.

## Estrutura de pastas

```
Multigrao.Api/
  Controllers/      # endpoints por módulo (Produtos, Pedidos, Clientes, ...)
  Data/             # AppDbContext + seed
  Hubs/             # SignalR (chat em tempo real)
  Models/           # entidades
  DTOs/             # contratos de entrada/saída
  Services/         # regras de negócio
  Migrations/       # migrations EF Core

Multigrao.Ui/
  src/pages/        # telas (Login, Dashboard, Comercial*, Catalogo, Tabela, ...)
  src/components/   # layout, nav, cartões, carrossel, busca
  src/services/     # clientes HTTP (axios)
  src/store/        # estado global (Zustand)
```
