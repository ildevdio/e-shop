import { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, ShoppingBag, MapPin, Phone, Loader2, ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2, X, User, LayoutGrid, IdCard, LogOut, Package, CalendarDays, KeyRound, AlertTriangle, Check, Trash2 } from 'lucide-react';
import SearchAutocomplete, { type Sugestao } from '../components/SearchAutocomplete';
import { produtoService, type Produto, type Categoria, type Marca } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';
import { pedidoService, type Pedido } from '../services/pedidoService';
import { clienteService, type Cliente } from '../services/clienteService';
import { carrinhoService } from '../services/carrinhoService';
import { imageUrl, produtoImagemUrl, midiaUrl } from '../utils/imageUrl';
import { marcaService } from '../services/marcaService';
import { buscarCEP } from '../utils/buscarCEP';
import { formatEstoque } from '../utils/formatEstoque';
import { useSistemaStore } from '../store/sistemaStore';

function marcaImagemUrl(marca: { id: number; imagemUrl?: string | null; imagemContentType?: string | null } | null | undefined): string | undefined {
  if (!marca) return undefined;
  if (marca.imagemContentType && marca.id) return marcaService.getImagemUrl(marca.id);
  if (marca.imagemUrl) return imageUrl(marca.imagemUrl);
  return undefined;
}

function formatPreco(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function mascaraCpfCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return d
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatarData(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const rotuloStatus: Record<string, string> = {
  AguardandoConfirmacao: 'Aguardando confirmação',
  Pendente: 'Pendente',
  EmSeparacao: 'Em separação',
  EmConferencia: 'Em conferência',
  ProntoRetirada: 'Pronto para retirada',
  EmEntrega: 'Em entrega',
  Entregue: 'Entregue',
  Concluido: 'Concluído',
  Cancelado: 'Cancelado',
  BloqueadoFinanceiro: 'Bloqueado financeiro',
};

const statusClasse: Record<string, string> = {
  AguardandoConfirmacao: 'bg-amber-100 text-amber-700',
  Pendente: 'bg-blue-100 text-blue-700',
  EmSeparacao: 'bg-violet-100 text-violet-700',
  EmConferencia: 'bg-cyan-100 text-cyan-700',
  ProntoRetirada: 'bg-teal-100 text-teal-700',
  EmEntrega: 'bg-indigo-100 text-indigo-700',
  Entregue: 'bg-green-100 text-green-700',
  Concluido: 'bg-green-100 text-green-700',
  Cancelado: 'bg-red-100 text-red-700',
  BloqueadoFinanceiro: 'bg-red-100 text-red-700',
};

const labelStatus = (s: string) => rotuloStatus[s] ?? s;
const corStatus = (s: string) => statusClasse[s] ?? 'bg-zinc-100 text-zinc-700';

function corClara(hex?: string | null): boolean {
  if (!hex) return false;
  const m = hex.replace('#', '').trim();
  if (!m || (m.length !== 3 && m.length !== 6)) return false;
  const v = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  if (Number.isNaN(v)) return false;
  const r = (v >> 16) & 255;
  const g = (v >> 8) & 255;
  const b = v & 255;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function descricaoProduto(p: Produto): { rotulo: string; valor: string }[] {
  const itens: { rotulo: string; valor: string }[] = [];
  if (p.embalagem) itens.push({ rotulo: 'Embalagem', valor: p.embalagem });
  if (p.unidadeVenda) itens.push({ rotulo: 'Unidade de venda', valor: p.unidadeVenda });
  if (p.pesoUnidade > 0) itens.push({ rotulo: 'Peso por unidade', valor: `${p.pesoUnidade} kg` });
  if (p.categoria?.nome) itens.push({ rotulo: 'Categoria', valor: p.categoria.nome });
  return itens;
}

function CardEcommerce({
  produto,
  qtd,
  onQtd,
  onAbrir,
  showMarca,
}: {
  produto: Produto;
  qtd: number;
  onQtd: (q: number) => void;
  onAbrir: () => void;
  showMarca?: boolean;
}) {
  const isAtacado = qtd >= 5;
  return (
    <div className="group bg-white rounded-2xl border border-zinc-900/15 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] hover:-translate-y-1 transition-all flex flex-col h-full overflow-hidden">
      <button onClick={onAbrir} className="relative aspect-square overflow-hidden bg-[#F7F5F2] border-b border-zinc-900/10 text-left">
        {produtoImagemUrl(produto) ? (
          <img src={produtoImagemUrl(produto)} alt={produto.nome} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Sem foto</span>
        )}
        {isAtacado && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Atacado</span>
        )}
        {produto.estoque <= 0 && (
          <span className="absolute top-2 right-2 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">Esgotado</span>
        )}
      </button>
      <div className="p-3 flex-1 flex flex-col">
        {showMarca && produto.marca?.nome && (
          <p className="text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-1 truncate">{produto.marca.nome}</p>
        )}
        <button onClick={onAbrir} className="text-left">
          <h3 className="font-heading font-bold text-zinc-900 text-base leading-snug line-clamp-2 hover:underline decoration-zinc-300 underline-offset-4">{produto.nome}</h3>
        </button>
        <p className="text-[10px] uppercase tracking-widest font-semibold text-zinc-400 mt-1 mb-2 truncate">
          {produto.embalagem && `${produto.embalagem} `}
          {produto.unidadeVenda && `· ${produto.unidadeVenda}`}
        </p>
        {produto.estoque > 0 && (
          <p className="text-[10px] font-semibold text-emerald-600 mb-1">
            Em estoque: {formatEstoque(produto.estoque)}{produto.unidadeVenda ? ` ${produto.unidadeVenda.toLowerCase()}` : ''}
          </p>
        )}
        <div className="mt-auto pt-2 pb-3">
          {isAtacado ? (
            <>
              <p className="text-[10px] font-medium text-zinc-400 line-through">{formatPreco(produto.precoVarejo)}</p>
              <p className="text-lg font-black text-zinc-900 leading-none">{formatPreco(produto.precoAtacado)}</p>
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mt-0.5">Atacado · 5+ un.</p>
            </>
          ) : (
            <p className="text-lg font-black text-zinc-900 leading-none">{formatPreco(produto.precoVarejo)}</p>
          )}
        </div>
        {qtd > 0 ? (
          <CampoQuantidade valor={qtd} max={produto.estoque} onChange={onQtd} aoRemover={() => onQtd(0)} className="w-full justify-between" />
        ) : produto.estoque <= 0 ? (
          <button disabled className="w-full py-2.5 bg-zinc-100 text-zinc-400 font-bold uppercase tracking-widest text-[10px] rounded-full cursor-not-allowed">
            Produto esgotado
          </button>
        ) : (
          <button onClick={onAbrir} className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[10px] rounded-full transition-colors">
            Ver Produto
          </button>
        )}
      </div>
    </div>
  );
}

function CardCarrossel({
  produto,
  qtd,
  onQtd,
  onAbrir,
}: {
  produto: Produto;
  qtd: number;
  onQtd: (q: number) => void;
  onAbrir: () => void;
}) {
  const isAtacado = qtd >= 5;
  return (
    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group bg-[#F7F5F2] border border-zinc-900/15 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] transition-all">
      <button onClick={onAbrir} aria-label={`Ver ${produto.nome}`} className="absolute inset-0 w-full h-full block text-left cursor-pointer">
        {produtoImagemUrl(produto) ? (
          <img src={produtoImagemUrl(produto)} alt={produto.nome} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Sem foto</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      </button>
      {isAtacado && (
        <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Atacado</span>
      )}
      {produto.estoque <= 0 && (
        <span className="absolute top-3 right-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Esgotado</span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        {produto.marca?.nome && (
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">{produto.marca.nome}</p>
        )}
        <button onClick={onAbrir} className="text-left block w-full">
          <h3 className="font-heading font-bold text-white text-xl leading-snug line-clamp-2 hover:underline decoration-white/40 underline-offset-4">{produto.nome}</h3>
        </button>
        {produto.estoque > 0 && (
          <p className="text-[10px] font-semibold text-emerald-300 mt-1">
            Em estoque: {formatEstoque(produto.estoque)}{produto.unidadeVenda ? ` ${produto.unidadeVenda.toLowerCase()}` : ''}
          </p>
        )}
        <div className="mt-2.5 flex items-end justify-between gap-3">
          <div className="min-w-0">
            {isAtacado ? (
              <>
                <p className="text-[10px] font-medium text-white/60 line-through">{formatPreco(produto.precoVarejo)}</p>
                <p className="text-xl font-black text-white leading-none">{formatPreco(produto.precoAtacado)}</p>
              </>
            ) : (
              <p className="text-xl font-black text-white leading-none">{formatPreco(produto.precoVarejo)}</p>
            )}
          </div>
          {qtd > 0 ? (
            <CampoQuantidade valor={qtd} max={produto.estoque} onChange={onQtd} aoRemover={() => onQtd(0)} className="bg-white shrink-0" />
          ) : produto.estoque <= 0 ? (
            <button disabled className="px-4 py-2 bg-zinc-200 text-zinc-400 font-bold uppercase tracking-widest text-[10px] rounded-full cursor-not-allowed shrink-0">Esgotado</button>
          ) : (
            <button onClick={onAbrir} className="px-4 py-2 bg-white text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-zinc-100 transition-colors shrink-0">Ver Produto</button>
          )}
        </div>
      </div>
    </div>
  );
}

function CampoQuantidade({
  valor,
  onChange,
  min = 1,
  max,
  aoRemover,
  grande = false,
  className,
}: {
  valor: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  aoRemover?: () => void;
  grande?: boolean;
  className?: string;
}) {
  const [texto, setTexto] = useState(String(valor));
  const [focado, setFocado] = useState(false);

  useEffect(() => {
    if (!focado) setTexto(String(valor));
  }, [valor, focado]);

  const aoAplicar = (v: number) => {
    const limite = max ?? Infinity;
    const n = Math.min(limite, Math.max(min, Math.round(v)));
    setTexto(String(n));
    onChange(n);
  };

  const aoDecrementar = () => {
    if (valor <= min && aoRemover) {
      aoRemover();
      return;
    }
    aoAplicar(valor - 1);
  };

  const commit = () => {
    const n = parseInt(texto, 10);
    aoAplicar(Number.isNaN(n) ? min : n);
  };

  const noLimite = max !== undefined && valor >= max;

  return (
    <div className={`flex items-center rounded-full border border-zinc-900/20 bg-zinc-50 ${grande ? 'p-1.5' : 'p-1'} ${className ?? ''}`}>
      <button
        type="button"
        onClick={aoDecrementar}
        className={`rounded-full text-zinc-700 hover:bg-white hover:shadow-sm transition-colors ${grande ? 'p-3' : 'p-1.5'}`}
      >
        <Minus size={grande ? 18 : 14} />
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={texto}
        onFocus={() => setFocado(true)}
        onChange={e => setTexto(e.target.value.replace(/\D/g, '').slice(0, 5))}
        onBlur={() => { setFocado(false); commit(); }}
        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
        className={`text-center font-bold text-zinc-900 bg-transparent focus:outline-none ${grande ? 'w-14 text-lg font-black' : 'w-10 text-sm'}`}
      />
      <button
        type="button"
        onClick={() => aoAplicar(valor + 1)}
        disabled={noLimite}
        className={`rounded-full transition-colors ${noLimite ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'} ${grande ? 'p-3' : 'p-1.5'}`}
      >
        <Plus size={grande ? 18 : 14} />
      </button>
    </div>
  );
}

function FaixaMarca({ marca, total }: { marca: Marca | null; total: number }) {
  const bandClara = corClara(marca?.cor);
  const bandBg = marca?.cor ?? '#18181b';
  const logoMarca = marcaImagemUrl(marca);
  if (!marca) {
    return (
      <div className="flex items-center gap-3 px-5 sm:px-8 py-4 rounded-2xl border border-zinc-900/20 bg-white">
        <div className="h-8 w-2 bg-primary rounded-full" />
        <h3 className="font-heading font-bold text-xl sm:text-2xl text-zinc-900">Diversos</h3>
        <div className="flex-1" />
        <span className="hidden sm:block text-[11px] font-bold uppercase tracking-widest text-zinc-400">
          {total} {total === 1 ? 'produto' : 'produtos'}
        </span>
      </div>
    );
  }
  return (
    <div className="relative flex items-center justify-between gap-4 px-5 sm:px-8 py-5 rounded-2xl border-2 border-zinc-900 overflow-hidden shadow-sm" style={{ backgroundColor: bandBg }}>
      <div className={`flex items-center gap-4 min-w-0 ${bandClara ? 'text-zinc-900' : 'text-white'}`}>
        <div className="flex items-center justify-center shrink-0">
          {logoMarca ? (
            <img src={logoMarca} alt={marca.nome} className="h-16 sm:h-20 w-auto object-contain" />
          ) : (
            <span className={`font-heading font-bold text-2xl ${bandClara ? 'text-zinc-900' : 'text-white'}`}>{marca.nome?.[0] ?? 'M'}</span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-heading font-bold text-2xl sm:text-3xl truncate">{marca.nome}</h3>
        </div>
      </div>
      <div className={`hidden sm:block shrink-0 text-[11px] font-bold uppercase tracking-widest ${bandClara ? 'text-zinc-900/70' : 'text-white/80'}`}>
        {total} {total === 1 ? 'produto' : 'produtos'}
      </div>
    </div>
  );
}

interface ProdutoAgrupado {
  marca: Marca | null;
  produtos: Produto[];
}

interface CategoriaComProdutos {
  categoria: Categoria;
  grupos: ProdutoAgrupado[];
}

export default function Tabela() {
  const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([]);
  const [todasCategorias, setTodasCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [categoriaAberta, setCategoriaAberta] = useState<number | null>(null);
  const [carrinho, setCarrinho] = useState<Map<number, number>>(new Map());
  const [abrirExclusao, setAbrirExclusao] = useState<number | null>(null);
  const [solicitante, setSolicitante] = useState({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [tipoEntrega, setTipoEntrega] = useState<'Entrega' | 'Retirada'>('Entrega');
  const [pagamento, setPagamento] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [produtoDetalhe, setProdutoDetalhe] = useState<Produto | null>(null);
  const [qtdDetalhe, setQtdDetalhe] = useState(1);
  const [vista, setVista] = useState<'catalogo' | 'produto' | 'carrinho'>('catalogo');
const [menuCategorias, setMenuCategorias] = useState(false);
const [categoriaFiltrada, setCategoriaFiltrada] = useState<number | null>(null);
const [opacidadeNav, setOpacidadeNav] = useState(0);
const [contaAberta, setContaAberta] = useState(false);
const [cpfAcesso, setCpfAcesso] = useState('');
const [acessado, setAcessado] = useState(false);
const [clienteAcesso, setClienteAcesso] = useState<Cliente | null>(null);
const [pedidosAcesso, setPedidosAcesso] = useState<Pedido[]>([]);
const [buscandoAcesso, setBuscandoAcesso] = useState(false);
const [erroAcesso, setErroAcesso] = useState('');
  const [pedidoAberto, setPedidoAberto] = useState<number | null>(null);
  const [cpfAcessado, setCpfAcessado] = useState('');
  const salvarCarrinhoRef = useRef<number | null>(null);
  const tickerRef = useRef<HTMLDivElement | null>(null);

  const carrosselRef = useRef<HTMLDivElement>(null);
  const config = useSistemaStore((state) => state.config);
  
  // Theme Variables
  const primaryBg = 'bg-primary text-primary-foreground hover:bg-primary/90';
  const primaryBorderActive = 'border-primary bg-primary text-primary-foreground';

  const handleBuscarCEP = async () => {
    setBuscandoCEP(true);
    const resultado = await buscarCEP(solicitante.cep);
    if (resultado) {
      setSolicitante(f => ({
        ...f,
        logradouro: resultado.logradouro || f.logradouro,
        complemento: resultado.complemento || f.complemento,
        bairro: resultado.bairro || f.bairro,
        cidade: resultado.cidade || f.cidade,
        estado: resultado.estado || f.estado,
      }));
    }
    setBuscandoCEP(false);
  };

  const carregar = async () => {
    setCarregando(true);
    const [produtos, cats] = await Promise.all([
      produtoService.getCatalogo(),
      categoriaService.getCategorias(),
    ]);
    setTodasCategorias(cats);

    const map = new Map<number, CategoriaComProdutos>();
    const semCategoria: Produto[] = [];

    for (const p of produtos) {
      if (p.categoria) {
        if (!map.has(p.categoria.id)) {
          map.set(p.categoria.id, { categoria: p.categoria, grupos: [] });
        }
        const entry = map.get(p.categoria.id)!;
        let grupo = entry.grupos.find(g => g.marca?.id === p.marca?.id);
        if (!grupo) {
          grupo = { marca: p.marca ?? null, produtos: [] };
          entry.grupos.push(grupo);
        }
        grupo.produtos.push(p);
      } else {
        semCategoria.push(p);
      }
    }

    const lista = [...map.values()];
    if (semCategoria.length > 0) {
      lista.push({
        categoria: { id: 0, nome: 'Sem Categoria', ordem: 999 },
        grupos: [{ marca: null, produtos: semCategoria }],
      });
    }

    const posicao = new Map(cats.map((c, i) => [c.id, i]));
    lista.sort((a, b) => (posicao.get(a.categoria.id) ?? 999) - (posicao.get(b.categoria.id) ?? 999));

    setCategorias(lista);
    if (lista.length > 0 && categoriaAberta === null) {
      setCategoriaAberta(lista[0].categoria.id);
    }
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const normalizar = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const marcas = [...new Map(
    categorias
      .flatMap(c => c.grupos.flatMap(g => g.produtos.map(p => p.marca).filter((m): m is Marca => !!m)))
      .map(m => [m.id, m])
  ).values()];

  const marcaFiltrada = filtro.trim()
    ? marcas.find(m => normalizar(m.nome).includes(normalizar(filtro))) ?? null
    : null;

  const produtoFiltrado = (p: Produto) => {
    if (categoriaFiltrada !== null && p.categoriaId !== categoriaFiltrada) return false;
    if (!filtro) return true;
    const t = normalizar(filtro);
    return normalizar(p.nome).includes(t) || normalizar(p.marca?.nome ?? '').includes(t);
  };

  const precoPorQtd = (produto: Produto, qtd: number) =>
    qtd >= 5 ? produto.precoAtacado : produto.precoVarejo;

  const TAXA_EMBALAGEM = 2;

  const temTaxaEmbalagem = (produto: Produto | undefined, qtd: number) =>
    !!produto && produto.unidadeVenda?.toUpperCase() === 'KG' && qtd === 1;

  const totalTaxaEmbalagem = useMemo(() =>
    [...carrinho.entries()].reduce((acc, [id, qtd]) => {
      const p = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id);
      return acc + (temTaxaEmbalagem(p, qtd) ? TAXA_EMBALAGEM : 0);
    }, 0),
  [carrinho, categorias]);

  const setQtdCarrinho = (produtoId: number, quantidade: number) => {
    setCarrinho(prev => {
      const next = new Map(prev);
      if (quantidade <= 0) next.delete(produtoId);
      else next.set(produtoId, quantidade);
      return next;
    });
  };

  const qtdNoCarrinho = (produtoId: number) => carrinho.get(produtoId) ?? 0;
  const totalItensCarrinho = carrinho.size;
  const limparCarrinho = () => setCarrinho(new Map());

  const produtosCarrinho = useMemo(
    () => [...carrinho.entries()]
      .map(([id, quantidade]) => ({
        produto: categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id),
        quantidade,
      }))
      .filter((i): i is { produto: Produto; quantidade: number } => !!i.produto),
    [carrinho, categorias]
  );

  const valorTotalCarrinho = useMemo(
    () => produtosCarrinho.reduce((acc, i) => acc + precoPorQtd(i.produto, i.quantidade) * i.quantidade, 0) + totalTaxaEmbalagem,
    [produtosCarrinho, totalTaxaEmbalagem]
  );

  const pesoTotalCarrinho = useMemo(
    () => produtosCarrinho.reduce((acc, i) => acc + (i.produto.pesoUnidade ?? 0) * i.quantidade, 0),
    [produtosCarrinho]
  );

  const marcasSugestao: Sugestao[] = marcas.map(m => ({ rotulo: m.nome, subRotulo: 'Marca' }));

  const sugestoes: Sugestao[] = [
    ...marcasSugestao,
    ...categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).map(p => ({ rotulo: p.nome, subRotulo: p.estoque <= 0 ? 'Esgotado' : p.categoria?.nome })),
  ];

  const categoriasFiltradas = categorias
    .map(({ categoria, grupos }) => ({
      categoria,
      grupos: grupos
        .map(g => ({
          ...g,
          produtos: g.produtos
            .filter(produtoFiltrado)
            .sort((a, b) => (a.estoque > 0 ? 0 : 1) - (b.estoque > 0 ? 0 : 1)),
        }))
        .filter(g => g.produtos.length > 0),
    }))
    .filter(c => c.grupos.length > 0);

  const produtosDestaque = useMemo(() => {
    const todos = categorias
      .flatMap(c => c.grupos.flatMap(g => g.produtos))
      .filter(p => produtoImagemUrl(p) && p.ativo);
    const poolBase = todos.filter(p => p.destaque);
    const pools = new Map<number, Produto[]>();
    for (const p of poolBase) {
      const key = p.marca?.id ?? 0;
      if (!pools.has(key)) pools.set(key, []);
      pools.get(key)!.push(p);
    }
    const listas = [...pools.values()];
    const resultado: Produto[] = [];
    let adicionou = true;
    while (adicionou && resultado.length < 12) {
      adicionou = false;
      for (const lista of listas) {
        if (resultado.length >= 12) break;
        if (lista.length > 0) {
          resultado.push(lista.shift()!);
          adicionou = true;
        }
      }
    }
    return resultado;
  }, [categorias]);

  const rolarCarrossel = (direcao: number) => {
    const el = carrosselRef.current;
    if (!el) return;
    el.scrollBy({ left: direcao * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  useEffect(() => {
    const onScroll = () => {
      const t = tickerRef.current;
      if (!t) return;
      const bottom = t.getBoundingClientRect().bottom;
      setOpacidadeNav(Math.min(1, Math.max(0, (t.offsetHeight - bottom) / t.offsetHeight)));
    };
    let container: HTMLElement | null = tickerRef.current?.parentElement ?? null;
    while (container) {
      const oy = window.getComputedStyle(container).overflowY;
      if (oy === 'auto' || oy === 'scroll') break;
      container = container.parentElement;
    }
    if (container) container.style.overscrollBehaviorY = 'contain';
    const ehScrollavel = (el: Element): boolean => {
      const oy = window.getComputedStyle(el).overflowY;
      return (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1;
    };
    const targetEmScrollavelInterno = (alvo: EventTarget | null): boolean => {
      let el: Element | null = alvo instanceof Element ? alvo : null;
      while (el && el !== container) {
        if (ehScrollavel(el)) return true;
        el = el.parentElement;
      }
      return false;
    };
    let touchInicio: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchInicio = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!container || container.scrollTop > 0 || touchInicio == null) return;
      if (targetEmScrollavelInterno(e.target)) return;
      const y = e.touches[0]?.clientY ?? 0;
      if (y - touchInicio > 0) e.preventDefault();
    };
    const onWheel = (e: WheelEvent) => {
      if (!container || container.scrollTop > 0 || e.deltaY >= 0) return;
      if (targetEmScrollavelInterno(e.target)) return;
      e.preventDefault();
    };
    onScroll();
    container?.addEventListener('scroll', onScroll, { passive: true });
    container?.addEventListener('wheel', onWheel, { passive: false });
    container?.addEventListener('touchstart', onTouchStart, { passive: true });
    container?.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      container?.removeEventListener('scroll', onScroll);
      container?.removeEventListener('wheel', onWheel);
      container?.removeEventListener('touchstart', onTouchStart);
      container?.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('scroll', onScroll, { capture: true });
    };
  }, []);

  const scrollParaCatalogo = () => {
    const primeira = categoriasFiltradas[0];
    if (!primeira) return;
    const el = document.getElementById(`cat-${primeira.categoria.id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const buscarECatalogo = () => {
    if (vista !== 'catalogo') {
      setVista('catalogo');
      setTimeout(scrollParaCatalogo, 60);
    } else {
      scrollParaCatalogo();
    }
  };

  const aplicarFiltroCategoria = (id: number | null) => {
    setCategoriaFiltrada(id);
    setMenuCategorias(false);
    setTimeout(() => {
      const alvo = id ?? categorias[0]?.categoria.id;
      if (alvo === undefined) return;
      const el = document.getElementById(`cat-${alvo}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 60);
  };

  const categoriaFiltradaNome = categoriaFiltrada !== null
    ? todasCategorias.find(c => c.id === categoriaFiltrada)?.nome
    : undefined;

  const abrirDetalhe = (p: Produto) => {
    setQtdDetalhe(qtdNoCarrinho(p.id) || 1);
    setProdutoDetalhe(p);
    setVista('produto');
  };

  const adicionarDoDetalhe = () => {
    if (!produtoDetalhe || produtoDetalhe.estoque <= 0) return;
    setCarrinho(prev => {
      const atual = prev.get(produtoDetalhe.id) ?? 0;
      const proximo = Math.min(produtoDetalhe.estoque, atual + qtdDetalhe);
      return new Map(prev).set(produtoDetalhe.id, proximo);
    });
    setProdutoDetalhe(null);
    setVista('catalogo');
  };

  const finalizarPedido = async () => {
    if (!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || carrinho.size === 0) return;
    if (tipoEntrega === 'Entrega' && !solicitante.logradouro.trim()) return;
    setEnviando(true);
    const itens = [...carrinho.entries()].map(([produtoId, quantidade]) => {
      const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
      return { produtoId, quantidade, precoUnitario: produto ? precoPorQtd(produto, quantidade) : 0, pesoUnitario: produto?.pesoUnidade ?? 0 };
    });
    const valorTotal = itens.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0) + totalTaxaEmbalagem;
    await pedidoService.solicitarCatalogo({
      solicitanteNome: solicitante.nome.trim(),
      solicitanteTelefone: solicitante.telefone.trim(),
      cpfCnpj: solicitante.cpfCnpj.trim(),
      cep: solicitante.cep.trim(),
      logradouro: solicitante.logradouro.trim(),
      numero: solicitante.numero.trim(),
      complemento: solicitante.complemento.trim(),
      bairro: solicitante.bairro.trim(),
      cidade: solicitante.cidade.trim(),
      estado: solicitante.estado.trim(),
      valorTotal,
      tipoEntrega,
      pagamento: pagamento || undefined,
      desconto: 0,
      acrescimo: 0,
      itens,
    });
    setEnviando(false);
    setPedidoCriado(true);
    setSolicitante(solicitanteDeCliente(clienteAcesso));
    setTipoEntrega('Entrega');
    setPagamento('');
    limparCarrinho();
    if (cpfAcessado) carrinhoService.limparCarrinho(cpfAcessado);
  };

  const solicitanteDeCliente = (c: Cliente | null) => ({
    nome: c?.razaoSocialNome || c?.nomeFantasia || '',
    telefone: c?.telefone || '',
    cpfCnpj: c?.cpfCnpj || '',
    cep: c?.cep || '',
    logradouro: c?.logradouro || '',
    numero: c?.numero || '',
    complemento: c?.complemento || '',
    bairro: c?.bairro || '',
    cidade: c?.cidade || '',
    estado: c?.estado || '',
  });

  const acessarConta = async () => {
    const limpo = cpfAcesso.replace(/\D/g, '');
    if (limpo.length < 11) {
      setErroAcesso('Informe um CPF ou CNPJ válido.');
      return;
    }
    setBuscandoAcesso(true);
    setErroAcesso('');
    const [cliente, pedidos, carrinhoSalvo] = await Promise.all([
      clienteService.buscarPorCpfCnpj(cpfAcesso),
      pedidoService.getPedidosPorCpf(cpfAcesso),
      carrinhoService.getCarrinho(cpfAcesso),
    ]);
    setBuscandoAcesso(false);
    if (!cliente && pedidos.length === 0) {
      setErroAcesso('Nenhum registro encontrado para este CPF/CNPJ.');
      return;
    }
    setClienteAcesso(cliente);
    setPedidosAcesso(pedidos);
    setPedidoAberto(null);
    setAcessado(true);
    setCpfAcessado(limpo);
    if (cliente) setSolicitante(solicitanteDeCliente(cliente));
    if (carrinhoSalvo.length > 0) {
      const todos = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos));
      const novo = new Map<number, number>();
      for (const item of carrinhoSalvo) {
        const produto = todos.find(p => p.id === item.produtoId);
        if (!produto) continue;
        const qtd = Math.min(item.quantidade, Math.max(produto.estoque, 0));
        if (qtd > 0) novo.set(item.produtoId, qtd);
      }
      setCarrinho(novo);
    }
  };

  const sairConta = () => {
    if (salvarCarrinhoRef.current) clearTimeout(salvarCarrinhoRef.current);
    setClienteAcesso(null);
    setPedidosAcesso([]);
    setCpfAcesso('');
    setErroAcesso('');
    setPedidoAberto(null);
    setAcessado(false);
    setCpfAcessado('');
    setCarrinho(new Map());
  };

  useEffect(() => {
    if (!acessado || !cpfAcessado) return;
    if (salvarCarrinhoRef.current) clearTimeout(salvarCarrinhoRef.current);
    salvarCarrinhoRef.current = window.setTimeout(() => {
      carrinhoService.salvarCarrinho(
        cpfAcessado,
        [...carrinho.entries()].map(([produtoId, quantidade]) => ({ produtoId, quantidade }))
      );
    }, 600);
    return () => {
      if (salvarCarrinhoRef.current) clearTimeout(salvarCarrinhoRef.current);
    };
  }, [carrinho, acessado, cpfAcessado]);

  return (
    <div className="min-h-screen bg-[#F7F5F2]">
      
      {/* ── Nav fixa (dock) — detalhe geral do sistema ── */}
      {
        <div className="fixed top-0 inset-x-0 z-40 px-3 sm:px-4 pt-3">
          <div
            className="max-w-7xl mx-auto rounded-2xl sm:rounded-3xl transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300"
            style={{
              backgroundColor: `rgba(24,24,27,${((vista === 'catalogo' ? opacidadeNav : 1) * 0.6).toFixed(3)})`,
              backdropFilter: (vista === 'catalogo' ? opacidadeNav : 1) > 0 ? 'blur(20px) saturate(160%)' : 'none',
              WebkitBackdropFilter: (vista === 'catalogo' ? opacidadeNav : 1) > 0 ? 'blur(20px) saturate(160%)' : 'none',
              boxShadow: (vista === 'catalogo' ? opacidadeNav : 1) >= 1 ? '0 10px 40px rgba(0,0,0,0.35)' : 'none',
            }}
          >
          <div className="px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 flex items-center justify-start gap-8">
                  <div className="hidden md:block w-44 lg:w-48">
                    <SearchAutocomplete
                      placeholder="Buscar..."
                      valor={filtro}
                      onChange={setFiltro}
                      sugestoes={sugestoes}
                      aoSelecionar={s => setFiltro(s.rotulo)}
                      classNameInput="h-10 pl-10 pr-4 bg-white border border-primary rounded-full focus:outline-none text-sm transition-all"
                      onBuscar={buscarECatalogo}
                    />
                  </div>
                  <button
                    onClick={() => setMenuCategorias(true)}
                    className={`flex items-center gap-2 h-10 px-5 rounded-full font-bold uppercase tracking-widest text-xs shadow-sm transition-colors ${categoriaFiltrada !== null ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-white text-primary hover:bg-primary/10'}`}
                  >
                    <LayoutGrid size={16} />
                    <span className="max-w-28 truncate">{categoriaFiltradaNome ?? 'Categorias'}</span>
                  </button>
                </div>
                <h1 className="font-heading font-bold text-white text-xl sm:text-2xl tracking-wide drop-shadow-md whitespace-nowrap">{config.nomeEmpresa}</h1>
                <div className="flex-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setContaAberta(true)}
                    title="Conta"
                    className="h-10 w-10 flex items-center justify-center backdrop-blur-md bg-white/15 border border-white/40 text-white rounded-full hover:bg-white/25 transition-colors"
                  >
                    <User size={18} />
                  </button>
                  <button
                    onClick={() => setVista('carrinho')}
                    title="Carrinho"
                    className="relative h-10 w-10 flex items-center justify-center bg-white text-zinc-900 rounded-full shadow-sm hover:bg-zinc-100 transition-colors"
                  >
                    <ShoppingCart size={18} />
                    {totalItensCarrinho > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                        {totalItensCarrinho}
                      </span>
                    )}
                  </button>
                </div>
              </div>
              <div className="md:hidden mt-3">
                <SearchAutocomplete
                  placeholder="Buscar..."
                  valor={filtro}
                  onChange={setFiltro}
                  sugestoes={sugestoes}
                  aoSelecionar={s => setFiltro(s.rotulo)}
                  classNameInput="w-full h-10 pl-10 pr-4 bg-white border border-primary rounded-full focus:outline-none text-sm transition-all"
                  onBuscar={buscarECatalogo}
                />
              </div>
            </div>
          </div>
          </div>
        }

      {vista === 'produto' && produtoDetalhe ? (
        <div className="min-h-screen pb-10 pt-36 sm:pt-28">
          <div className="max-w-7xl mx-auto px-4">
            <button
              onClick={() => { setProdutoDetalhe(null); setVista('catalogo'); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors bg-primary hover:bg-primary/90 text-primary-foreground rounded-full uppercase tracking-widest text-xs"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <div>
                <div className="aspect-square rounded-3xl bg-[#F7F5F2] border border-zinc-900/10 overflow-hidden flex items-center justify-center md:sticky md:top-24">
                  {produtoImagemUrl(produtoDetalhe) ? (
                    <img src={produtoImagemUrl(produtoDetalhe)} alt={produtoDetalhe.nome} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-zinc-300 text-xs font-bold uppercase tracking-widest">Sem foto</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                {produtoDetalhe.marca && (() => {
                  const logoEmpresa = marcaImagemUrl(produtoDetalhe.marca);
                  const corClaraEmpresa = corClara(produtoDetalhe.marca.cor);
                  return (
                    <div
                      className={`flex items-center gap-3 mb-5 rounded-xl px-4 py-3 border border-zinc-900 overflow-hidden ${corClaraEmpresa ? 'text-zinc-900' : 'text-white'}`}
                      style={{ backgroundColor: produtoDetalhe.marca.cor ?? '#18181b' }}
                    >
                      <div className="flex items-center justify-center shrink-0">
                        {logoEmpresa ? (
                          <img src={logoEmpresa} alt={produtoDetalhe.marca.nome} className="h-12 w-auto object-contain" />
                        ) : (
                          <span className={`font-heading font-bold text-base ${corClaraEmpresa ? 'text-zinc-900' : 'text-white'}`}>{produtoDetalhe.marca.nome[0]}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-lg truncate leading-tight">{produtoDetalhe.marca.nome}</p>
                      </div>
                    </div>
                  );
                })()}
                <h2 className="font-heading font-bold text-2xl sm:text-3xl text-zinc-900 leading-tight mb-3">{produtoDetalhe.nome}</h2>
                <p className="text-xs uppercase tracking-widest font-semibold text-zinc-400 mb-5">
                  {produtoDetalhe.embalagem && `${produtoDetalhe.embalagem} `}
                  {produtoDetalhe.unidadeVenda && `· ${produtoDetalhe.unidadeVenda}`}
                </p>

                {produtoDetalhe.estoque <= 0 && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-6 text-sm font-bold uppercase tracking-wider">
                    <span className="h-2 w-2 rounded-full bg-red-600 shrink-0" />
                    Produto esgotado
                  </div>
                )}

                <div className="rounded-2xl bg-[#F7F5F2] border border-zinc-900/10 p-4 mb-6">
                  <div className="flex items-end justify-between gap-4">
                    {qtdDetalhe >= 5 ? (
                      <div>
                        <p className="text-xs text-zinc-400 line-through mb-0.5">{formatPreco(produtoDetalhe.precoVarejo)}</p>
                        <p className="text-3xl font-black text-zinc-900 leading-none">{formatPreco(produtoDetalhe.precoAtacado)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1.5">Preço atacado (5+ un.)</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">Preço varejo</p>
                        <p className="text-3xl font-black text-zinc-900 leading-none">{formatPreco(produtoDetalhe.precoVarejo)}</p>
                        {produtoDetalhe.precoAtacado > 0 && (
                          <p className="text-[10px] font-semibold text-zinc-500 mt-1.5">Atacado (5+ un.): {formatPreco(produtoDetalhe.precoAtacado)}</p>
                        )}
                      </div>
                    )}
                    <p className="text-xs font-bold text-zinc-500 text-right shrink-0">
                      Total
                      <span className="block text-lg font-black text-zinc-900">
                        {formatPreco((qtdDetalhe >= 5 ? produtoDetalhe.precoAtacado : produtoDetalhe.precoVarejo) * qtdDetalhe)}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Quantidade</p>
                    {produtoDetalhe.estoque > 0 && (
                      <p className="text-[11px] font-semibold text-emerald-600">
                        Disponível: {formatEstoque(produtoDetalhe.estoque)}{produtoDetalhe.unidadeVenda ? ` ${produtoDetalhe.unidadeVenda.toLowerCase()}` : ''}
                      </p>
                    )}
                  </div>
                  <CampoQuantidade valor={qtdDetalhe} max={Math.max(1, produtoDetalhe.estoque)} onChange={produtoDetalhe.estoque <= 0 ? () => {} : setQtdDetalhe} grande />
                </div>

                {produtoDetalhe.estoque <= 0 ? (
                  <button disabled className="w-full py-4 bg-zinc-200 text-zinc-400 font-bold uppercase tracking-widest text-sm rounded-full cursor-not-allowed">
                    Produto esgotado
                  </button>
                ) : (
                  <button onClick={adicionarDoDetalhe} className="w-full py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-sm rounded-full transition-colors shadow-sm">
                    Adicionar {qtdDetalhe} {produtoDetalhe.unidadeVenda ? produtoDetalhe.unidadeVenda.toLowerCase() : (qtdDetalhe === 1 ? 'item' : 'itens')} ao carrinho
                  </button>
                )}

                <div className="mt-8 border-t border-zinc-900/10 pt-6">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-3">Informações do produto</p>
                  {descricaoProduto(produtoDetalhe).length > 0 ? (
                    <dl className="divide-y divide-zinc-900/10 border border-zinc-900/10 rounded-2xl overflow-hidden">
                      {descricaoProduto(produtoDetalhe).map(item => (
                        <div key={item.rotulo} className="flex justify-between gap-4 px-4 py-2.5 bg-white text-sm">
                          <dt className="font-semibold text-zinc-500">{item.rotulo}</dt>
                          <dd className="font-bold text-zinc-900 text-right">{item.valor}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">Sem informações adicionais disponíveis.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : vista === 'carrinho' ? (
        <div className="min-h-screen flex flex-col lg:h-screen lg:overflow-hidden pt-36 sm:pt-28">
          <div className="max-w-6xl mx-auto w-full px-4 flex items-center gap-3 shrink-0">
            <button
              onClick={() => { setVista('catalogo'); setPedidoCriado(false); }}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors bg-primary hover:bg-primary/90 text-primary-foreground rounded-full uppercase tracking-widest text-xs"
            >
              <ArrowLeft size={16} /> Voltar
            </button>
            <h1 className="font-heading text-2xl text-zinc-900">Seu Pedido</h1>
          </div>
          <div className="max-w-6xl mx-auto w-full px-4 py-6 flex-1 min-h-0">
            {pedidoCriado ? (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full mb-6 bg-primary">
                  <CheckCircle2 size={40} className="text-primary-foreground" />
                </div>
                <h2 className="font-heading text-3xl font-bold text-zinc-900">Pedido enviado!</h2>
                <p className="mt-3 text-zinc-500 font-medium">Recebemos seu pedido com sucesso. Em breve entraremos em contato para confirmar.</p>
                <button onClick={() => { setPedidoCriado(false); setVista('catalogo'); }} className="mt-8 px-10 py-4 font-bold uppercase tracking-widest text-sm transition-colors shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                  Voltar ao catálogo
                </button>
              </div>
            ) : carrinho.size === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full mb-6 bg-white border border-zinc-900">
                  <ShoppingCart size={36} className="text-zinc-900" />
                </div>
                <h2 className="font-heading text-2xl font-bold text-zinc-900">Seu carrinho está vazio</h2>
                <p className="mt-2 text-zinc-500 font-medium">Navegue pelo catálogo e adicione produtos ao carrinho.</p>
                <button onClick={() => setVista('catalogo')} className="mt-8 px-10 py-4 font-bold uppercase tracking-widest text-sm transition-colors shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                  Ver produtos
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-6 lg:grid-cols-2 lg:h-full lg:min-h-0">
                  {/* Coluna esquerda — produtos e quantidades */}
                  <div className="flex flex-col lg:min-h-0">
                    <div className="space-y-3 lg:overflow-y-auto lg:pr-1 lg:flex-1 lg:min-h-0">
                    {[...carrinho.entries()].map(([produtoId, quantidade]) => {
                      const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
                      if (!produto) return null;
                      const preco = precoPorQtd(produto, quantidade);
                      return (
                        <div key={produtoId} className="relative overflow-hidden rounded-2xl border border-zinc-900/10">
                          <button
                            type="button"
                            onClick={() => { setQtdCarrinho(produtoId, 0); setAbrirExclusao(null); }}
                            className="absolute inset-1.5 flex items-center justify-end pr-4 bg-red-600 text-white hover:bg-red-700 transition-colors rounded-2xl"
                            title="Excluir produto"
                          >
                            <span className="flex items-center justify-center h-12 w-12 rounded-full bg-white/15">
                              <Trash2 size={22} />
                            </span>
                          </button>
                          <div className={`relative bg-white rounded-2xl transition-transform duration-300 ease-out ${abrirExclusao === produtoId ? '-translate-x-16' : ''}`}>
                            <div className="p-3">
                          <div className="flex items-start gap-3">
                            <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-[#F7F5F2] border border-zinc-900/10 flex items-center justify-center">
                              {produtoImagemUrl(produto) ? (
                                <img src={produtoImagemUrl(produto)} alt={produto.nome} loading="lazy" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-zinc-300 text-[8px] font-bold uppercase tracking-widest text-center">Sem foto</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-bold truncate text-zinc-900 text-sm">{produto.nome}</p>
                                <button
                                  type="button"
                                  onClick={() => setAbrirExclusao(prev => prev === produtoId ? null : produtoId)}
                                  className={`transition-colors shrink-0 ${abrirExclusao === produtoId ? 'text-red-600 bg-red-50 rounded-full p-1.5' : 'text-zinc-300 hover:text-red-600'}`}
                                  title={abrirExclusao === produtoId ? 'Fechar' : 'Remover'}
                                >
                                  {abrirExclusao === produtoId ? <ChevronRight size={16} /> : <Trash2 size={16} />}
                                </button>
                              </div>
                              <p className="text-sm text-zinc-500 font-medium">{formatPreco(preco)} / un.</p>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <CampoQuantidade
                                  valor={quantidade}
                                  max={produto.estoque}
                                  onChange={q => setQtdCarrinho(produtoId, q)}
                                  aoRemover={() => setQtdCarrinho(produtoId, 0)}
                                />
                                <span className="font-bold shrink-0 text-zinc-900">{formatPreco(preco * quantidade)}</span>
                              </div>
                            </div>
                          </div>
                          {temTaxaEmbalagem(produto, quantidade) && (
                            <div className="mt-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                              <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-amber-800 font-bold">Taxa de embalagem de {formatPreco(TAXA_EMBALAGEM)} (1kg)</p>
                                <p className="text-[11px] text-amber-700 mt-0.5">Deseja levar 2kg e não pagar a taxa?</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setQtdCarrinho(produtoId, 2)}
                                className="shrink-0 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest transition-colors bg-amber-500 hover:bg-amber-600 text-white rounded-full"
                              >
                                Levar 2kg
                              </button>
                            </div>
                          )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    </div>
                    <div className="p-4 mt-3 space-y-3 text-base shrink-0 bg-[#F7F5F2] rounded-2xl border border-zinc-900/10">
                    {totalTaxaEmbalagem > 0 && (
                      <>
                        <div className="pt-3 mt-3 flex justify-between text-sm border-t border-zinc-900 text-zinc-500 font-medium">
                          <span>Subtotal</span>
                          <span>{formatPreco([...carrinho.entries()].reduce((acc, [id, qtd]) => {
                            const p = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id);
                            return acc + (p ? precoPorQtd(p, qtd) * qtd : 0);
                          }, 0))}</span>
                        </div>
                        <div className="flex justify-between text-sm text-zinc-500 font-medium">
                          <span>Taxa de embalagem</span>
                          <span>{formatPreco(totalTaxaEmbalagem)}</span>
                        </div>
                      </>
                    )}
                    <div className="pt-3 mt-3 flex justify-between font-bold text-lg border-t border-zinc-900 text-zinc-900">
                      <span>Total</span>
                      <span>{formatPreco(valorTotalCarrinho)}</span>
                    </div>
                    {pesoTotalCarrinho > 0 && (
                      <div className="pt-2 flex justify-between text-sm text-zinc-500 font-medium">
                        <span>Peso total</span>
                        <span>{pesoTotalCarrinho.toFixed(2)} kg</span>
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Coluna direita — informações do pedido */}
                  <div className="space-y-5 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                  {/* Dados do solicitante */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-sm font-bold block mb-1 text-zinc-900 uppercase text-[11px] tracking-[0.15em]">Nome completo *</label>
                      <input value={solicitante.nome} onChange={e => setSolicitante({ ...solicitante, nome: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="Seu nome" />
                    </div>
                    <div>
                      <label className="text-sm font-bold block mb-1 text-zinc-900 uppercase text-[11px] tracking-[0.15em]">CPF / CNPJ *</label>
                      <input value={solicitante.cpfCnpj} onChange={e => setSolicitante({ ...solicitante, cpfCnpj: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className="text-sm font-bold block mb-1 text-zinc-900 uppercase text-[11px] tracking-[0.15em]">Telefone</label>
                      <input value={solicitante.telefone} onChange={e => setSolicitante({ ...solicitante, telefone: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="(81) 99999-9999" />
                    </div>
                  </div>

                  {/* Tipo de Entrega */}
                  <div>
                    <label className="text-sm font-bold block mb-2 text-zinc-900 uppercase text-[11px] tracking-[0.15em]">Opção de Recebimento *</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setTipoEntrega('Entrega')}
                        className={`flex-1 py-3 text-sm font-bold transition-all border rounded-full ${tipoEntrega === 'Entrega' ? primaryBorderActive : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900'}`}
                      >
                        Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoEntrega('Retirada')}
                        className={`flex-1 py-3 text-sm font-bold transition-all border rounded-full ${tipoEntrega === 'Retirada' ? primaryBorderActive : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900'}`}
                      >
                        Retirada
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-bold block mb-1 text-zinc-900 uppercase text-[11px] tracking-[0.15em]">Forma de Pagamento</label>
                    <select
                      value={pagamento}
                      onChange={e => setPagamento(e.target.value)}
                      className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white"
                    >
                      <option value="">Selecione na entrega/retirada</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="PIX">PIX</option>
                      <option value="Boleto">Boleto</option>
                    </select>
                    {pagamento === 'Boleto' && (
                      <p className="text-xs text-zinc-500 mt-2">
                        O vencimento do boleto será definido após análise e confirmação do pedido pela nossa equipe.
                      </p>
                    )}
                  </div>

                  {/* Endereço */}
                  {tipoEntrega === 'Entrega' && (
                    <div className="pt-2">
                      <p className="text-sm font-bold mb-3 text-zinc-900 uppercase text-[11px] tracking-[0.15em]">Endereço de entrega *</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="sm:col-span-2">
                          <input value={solicitante.logradouro} onChange={e => setSolicitante({ ...solicitante, logradouro: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="Rua, Avenida..." />
                        </div>
                        <div>
                          <input value={solicitante.numero} onChange={e => setSolicitante({ ...solicitante, numero: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="Número" />
                        </div>
                        <div>
                          <input value={solicitante.complemento} onChange={e => setSolicitante({ ...solicitante, complemento: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="Complemento" />
                        </div>
                        <div>
                          <div className="relative">
                            <input value={solicitante.cep} onChange={e => setSolicitante({ ...solicitante, cep: e.target.value })} onBlur={handleBuscarCEP} className={`w-full bg-white p-3 outline-none text-base transition-colors ${buscandoCEP ? 'pr-10' : ''} border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white`} placeholder="CEP" />
                            {buscandoCEP && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />}
                          </div>
                        </div>
                        <div>
                          <input value={solicitante.bairro} onChange={e => setSolicitante({ ...solicitante, bairro: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="Bairro" />
                        </div>
                        <div>
                          <input value={solicitante.cidade} onChange={e => setSolicitante({ ...solicitante, cidade: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="Cidade" />
                        </div>
                        <div>
                          <input value={solicitante.estado} onChange={e => setSolicitante({ ...solicitante, estado: e.target.value })} className="w-full bg-white p-3 outline-none text-base transition-colors border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white" placeholder="UF" maxLength={2} />
                        </div>
                      </div>
                    </div>
                  )}
                  <button onClick={finalizarPedido} disabled={!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || (tipoEntrega === 'Entrega' && !solicitante.logradouro.trim()) || enviando} className={`w-full py-4 font-bold text-lg transition-colors shadow-md rounded-full ${solicitante.nome.trim() && solicitante.cpfCnpj.replace(/\D/g, '') && (tipoEntrega === 'Retirada' || solicitante.logradouro.trim()) && !enviando ? primaryBg : 'bg-zinc-200 text-zinc-400 cursor-not-allowed'}`}>
                    {enviando ? 'Enviando...' : 'Confirmar Pedido'}
                  </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
      {/* ── Hero ── */}
      <div className="relative overflow-hidden shadow-sm h-screen rounded-none bg-white">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/multigraosvid.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/30" />

        <div className="relative z-10 px-4 h-full flex flex-col items-start text-left justify-end pb-16 md:pb-24 md:pl-16 lg:pl-24">
          <img
            src={midiaUrl(config.logoUrl)}
            alt={config.nomeEmpresa}
            className="h-auto object-contain mb-8 brightness-110 w-[9.4rem] md:w-[11.4rem]"
          />
            <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-wide text-white drop-shadow-md">
            O melhor da natureza para a sua loja.
          </h1>
          <p className="text-white/90 mt-6 font-medium drop-shadow text-sm md:text-base max-w-xl">
            Sua distribuidora de produtos naturais
          </p>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-white/90 font-medium justify-start">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-white/70" />
              {config.endereco}
            </span>
            <a href="https://wa.me/5581988593757" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={16} className="text-white/70" />
              (81) 98859-3757
            </a>
          </div>

          <button onClick={scrollParaCatalogo} className="mt-8 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-full shadow-[0_5px_0_rgba(0,0,0,0.35)] active:translate-y-[3px] active:shadow-none transition-all">
            Ver Produtos
          </button>
        </div>
      </div>

      <div ref={tickerRef} className="bg-primary text-primary-foreground">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[11px] font-bold uppercase tracking-[0.2em]">
            <span>{config.nomeEmpresa}</span>
            <span className="text-orange-500">●</span>
            <span>Varejo & Atacado</span>
            <span className="text-orange-500">●</span>
            <span>{config.endereco}</span>
            <span className="text-orange-500">●</span>
            <span>(81) 98859-3757</span>
          </div>
        </div>

      {/* ── Conteúdo ── */}
      <div className="max-w-7xl mx-auto px-4 py-12 pb-32">
        
        {categoriaFiltrada === null && produtosDestaque.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
        <div className="h-8 w-2 bg-primary rounded-full" />
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-zinc-900">Destaques</h2>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => rolarCarrossel(-1)} className="h-10 w-10 flex items-center justify-center bg-white border border-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => rolarCarrossel(1)} className="h-10 w-10 flex items-center justify-center bg-white border border-primary rounded-full hover:bg-primary hover:text-primary-foreground transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div
              ref={carrosselRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 px-1 pb-12"
            >
              {produtosDestaque.map(p => (
                <div key={p.id} className="w-72 sm:w-80 shrink-0 snap-start">
                  <CardCarrossel
                    produto={p}
                    qtd={qtdNoCarrinho(p.id)}
                    onQtd={q => setQtdCarrinho(p.id, q)}
                    onAbrir={() => abrirDetalhe(p)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {carregando ? (
          <div className="flex items-center justify-center py-20 text-neutral-400 text-sm italic">Carregando catálogo...</div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 text-sm italic">Nenhum produto encontrado.</div>
        ) : (
          <div className="space-y-16">
            {marcaFiltrada ? (
              <section className="scroll-mt-32">
                <FaixaMarca
                  marca={marcaFiltrada}
                  total={categoriasFiltradas.reduce((a, c) => a + c.grupos.reduce((x, g) => x + g.produtos.length, 0), 0)}
                />
                <div className="space-y-14 mt-10">
                  {categoriasFiltradas.map(({ categoria, grupos }) => {
                    const produtos = grupos.flatMap(g => g.produtos);
                    return (
                      <div key={categoria.id} id={`cat-${categoria.id}`} className="scroll-mt-32">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="h-7 w-2 shrink-0 bg-primary rounded-full" />
                          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">{categoria.nome}</h2>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
                          {produtos.map(p => (
                            <CardEcommerce
                              key={p.id}
                              produto={p}
                              qtd={qtdNoCarrinho(p.id)}
                              onQtd={q => setQtdCarrinho(p.id, q)}
                              onAbrir={() => abrirDetalhe(p)}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : (
              categoriasFiltradas.map(({ categoria, grupos }) => {
              return (
                <section key={categoria.id} id={`cat-${categoria.id}`} className="scroll-mt-32">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-8 w-2 shrink-0 bg-primary rounded-full" />
                    <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-zinc-900">
                      {categoria.nome}
                    </h2>
                  </div>

                  <div className="space-y-10">
                      {[...grupos]
                        .sort((a, b) => (a.marca ? 0 : 1) - (b.marca ? 0 : 1))
                        .map((grupo, gi) => {
                          return (
                          <div key={gi}>
                            <FaixaMarca marca={grupo.marca} total={grupo.produtos.length} />
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 mt-5">
                              {grupo.produtos.map(p => (
                                <CardEcommerce
                                  key={p.id}
                                  produto={p}
                                  qtd={qtdNoCarrinho(p.id)}
                                  onQtd={q => setQtdCarrinho(p.id, q)}
                                  onAbrir={() => abrirDetalhe(p)}
                                />
                              ))}
                            </div>
                          </div>
                          );
                        })}
                    </div>
                </section>
              );
            })
            )}
          </div>
        )}
      </div>

      {/* Mini barra de finalizar pedido */}
      {totalItensCarrinho > 0 && !pedidoCriado && (
        <div className="fixed bottom-4 inset-x-0 z-40 px-4 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <button
              onClick={() => setVista('carrinho')}
              className="w-full flex items-center justify-between gap-3 px-5 py-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.25)] transition-transform active:scale-[0.99] bg-primary text-primary-foreground rounded-full border-2 border-primary"
            >
              <span className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-bold truncate">{totalItensCarrinho} {totalItensCarrinho === 1 ? 'item' : 'itens'}</span>
                {pesoTotalCarrinho > 0 && (
                  <span className="text-xs font-semibold whitespace-nowrap text-white/60">
                    {pesoTotalCarrinho.toFixed(2)} kg
                  </span>
                )}
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-white/80">
                  {valorTotalCarrinho.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
                <span className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest whitespace-nowrap bg-white text-primary rounded-full">
                  <ShoppingBag size={16} /> Finalizar
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

        </>
      )}

      {/* ── Aba lateral: Conta do cliente ── */}
      {contaAberta && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setContaAberta(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#F7F5F2] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground">
              <h2 className="font-heading font-bold text-xl">Minha Conta</h2>
              <button onClick={() => setContaAberta(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {!acessado ? (
                <div>
                  <div className="flex flex-col items-center text-center mb-6 mt-2">
                    <div className="h-16 w-16 rounded-full bg-white border border-zinc-900/15 flex items-center justify-center mb-4">
                      <User size={28} className="text-zinc-900" />
                    </div>
                    <p className="font-heading font-bold text-zinc-900 text-lg">Acesse sua conta</p>
                    <p className="text-sm text-zinc-500 mt-1">Informe seu CPF ou CNPJ para consultar seus dados e pedidos.</p>
                  </div>
                  <div className="relative">
                    <IdCard size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={cpfAcesso}
                      onChange={e => setCpfAcesso(mascaraCpfCnpj(e.target.value))}
                      onKeyDown={e => { if (e.key === 'Enter') acessarConta(); }}
                      placeholder="CPF ou CNPJ"
                      className="w-full h-12 pl-11 pr-4 bg-white border border-primary rounded-full focus:outline-none text-sm font-medium text-zinc-900 placeholder:text-zinc-400 transition-all focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {erroAcesso && <p className="text-xs text-red-600 font-medium mt-2">{erroAcesso}</p>}
                  <button
                    onClick={acessarConta}
                    disabled={buscandoAcesso}
                    className="mt-4 w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs rounded-full transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {buscandoAcesso ? <><Loader2 size={16} className="animate-spin" /> Acessando...</> : <><KeyRound size={16} /> Acessar</>}
                  </button>
                </div>
              ) : (
                <div>
                  {clienteAcesso ? (
                  <div className="bg-white rounded-2xl border border-zinc-900/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-zinc-900 text-lg leading-tight truncate">{clienteAcesso.nomeFantasia || clienteAcesso.razaoSocialNome}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{clienteAcesso.cpfCnpj}</p>
                      </div>
                      <button onClick={sairConta} title="Sair" className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-full transition-colors shrink-0">
                        <LogOut size={13} /> Sair
                      </button>
                    </div>
                    {(clienteAcesso.telefone || clienteAcesso.email) && (
                      <div className="mt-3 space-y-1 text-sm text-zinc-600">
                        {clienteAcesso.telefone && <p className="flex items-center gap-2"><Phone size={14} className="text-zinc-400 shrink-0" /> {clienteAcesso.telefone}</p>}
                        {clienteAcesso.email && <p className="flex items-center gap-2 truncate">{clienteAcesso.email}</p>}
                      </div>
                    )}
                    {clienteAcesso.logradouro && (
                      <p className="mt-3 text-sm text-zinc-600 flex items-center gap-2">
                        <MapPin size={14} className="text-zinc-400 shrink-0" />
                        {[clienteAcesso.logradouro, clienteAcesso.numero, clienteAcesso.bairro, clienteAcesso.cidade, clienteAcesso.estado].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {clienteAcesso.vendedor?.nome && (
                      <p className="mt-3 text-xs text-zinc-500 font-medium">Vendedor: {clienteAcesso.vendedor.nome}</p>
                    )}
                  </div>
                  ) : (
                  <div className="bg-white rounded-2xl border border-zinc-900/15 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-zinc-900 text-lg leading-tight truncate">Conta do cliente</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{cpfAcesso}</p>
                      </div>
                      <button onClick={sairConta} title="Sair" className="flex items-center gap-1.5 px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-full transition-colors shrink-0">
                        <LogOut size={13} /> Sair
                      </button>
                    </div>
                  </div>
                  )}

                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mt-6 mb-2 flex items-center gap-2">
                    <Package size={14} /> Meus Pedidos ({pedidosAcesso.length})
                  </p>
                  {pedidosAcesso.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-zinc-300 p-8 text-center">
                      <Package size={28} className="mx-auto text-zinc-300 mb-2" />
                      <p className="text-sm text-zinc-500 font-medium">Nenhum pedido encontrado.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {pedidosAcesso.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-zinc-900/15 overflow-hidden">
                          <button
                            onClick={() => setPedidoAberto(pedidoAberto === p.id ? null : p.id)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-50 transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-zinc-900">Pedido #{p.id}</p>
                              <p className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><CalendarDays size={12} /> {formatarData(p.dataCriacao)} · {p.tipoEntrega}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${corStatus(p.status)}`}>{labelStatus(p.status)}</span>
                              <ChevronRight size={16} className={`text-zinc-400 transition-transform ${pedidoAberto === p.id ? 'rotate-90' : ''}`} />
                            </div>
                          </button>
                          {pedidoAberto === p.id && (
                            <div className="border-t border-zinc-900/10 px-4 py-3 bg-zinc-50">
                              <div className="space-y-1.5">
                                {p.itens.map(i => (
                                  <div key={i.id} className="flex items-center justify-between gap-3 text-sm">
                                    <span className="text-zinc-700 min-w-0 truncate">{i.quantidade}x {i.produto?.nome ?? `Produto #${i.produtoId}`}</span>
                                    <span className="text-zinc-900 font-bold shrink-0">{formatPreco((i.precoUnitario || 0) * i.quantidade)}</span>
                                  </div>
                                ))}
                              </div>
                              {p.pagamento && <p className="text-xs text-zinc-500 mt-2">Pagamento: {p.pagamento}</p>}
                              {p.observacao && <p className="text-xs text-zinc-500 mt-1">Obs.: {p.observacao}</p>}
                              <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-900/10">
                                <span className="text-xs text-zinc-500 font-medium">Total</span>
                                <span className="text-lg font-black text-zinc-900">{formatPreco(p.valorFinal || p.valorTotal)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ── Aba lateral: Categorias ── */}
      {menuCategorias && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuCategorias(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#F7F5F2] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 bg-primary text-primary-foreground">
              <h2 className="font-heading font-bold text-xl">Categorias</h2>
              <button onClick={() => setMenuCategorias(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Filtrar por</p>
              <div className="space-y-2">
                <button
                  onClick={() => aplicarFiltroCategoria(null)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors text-left ${categoriaFiltrada === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-zinc-900/15 hover:border-primary'}`}
                >
                  <span className="font-bold text-sm">Todas as categorias</span>
                  {categoriaFiltrada === null && <Check size={16} className="shrink-0" />}
                </button>
                {todasCategorias.map(c => (
                  <button
                    key={c.id}
                    onClick={() => aplicarFiltroCategoria(c.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl border transition-colors text-left ${categoriaFiltrada === c.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-white border-zinc-900/15 hover:border-primary'}`}
                  >
                    <span className="font-bold text-sm">{c.nome}</span>
                    {categoriaFiltrada === c.id ? <Check size={16} className="shrink-0" /> : <ChevronRight size={16} className="text-zinc-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
