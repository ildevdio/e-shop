import { useState, useEffect, Fragment, useRef, useMemo } from 'react';
import { Plus, Minus, ShoppingCart, ShoppingBag, MapPin, Phone, Loader2, Palette, ChevronLeft, ChevronRight, ArrowLeft, CheckCircle2, X, User, LayoutGrid } from 'lucide-react';
import SearchAutocomplete, { type Sugestao } from '../components/SearchAutocomplete';
import { produtoService, type Produto, type Categoria, type Marca } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';
import { pedidoService } from '../services/pedidoService';
import { imageUrl } from '../utils/imageUrl';
import { marcaService } from '../services/marcaService';
import { buscarCEP } from '../utils/buscarCEP';

function marcaImagemUrl(marca: { id: number; imagemUrl?: string | null; imagemContentType?: string | null } | null | undefined): string | undefined {
  if (!marca) return undefined;
  if (marca.imagemContentType && marca.id) return marcaService.getImagemUrl(marca.id);
  if (marca.imagemUrl) return imageUrl(marca.imagemUrl);
  return undefined;
}

function formatPreco(v: number) {
  return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

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
  onAdd,
  onRemove,
  onAbrir,
  showMarca,
}: {
  produto: Produto;
  qtd: number;
  onAdd: () => void;
  onRemove: () => void;
  onAbrir: () => void;
  showMarca?: boolean;
}) {
  const isAtacado = qtd >= 5;
  return (
    <div className="group bg-white rounded-3xl border border-zinc-900/15 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] hover:-translate-y-1 transition-all flex flex-col h-full overflow-hidden">
      <button onClick={onAbrir} className="relative aspect-square overflow-hidden bg-[#F7F5F2] border-b border-zinc-900/10 text-left">
        {produto.imagemUrl ? (
          <img src={imageUrl(produto.imagemUrl)} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Sem foto</span>
        )}
        {isAtacado && (
          <span className="absolute top-3 left-3 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Atacado</span>
        )}
      </button>
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {showMarca && produto.marca?.nome && (
          <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">{produto.marca.nome}</p>
        )}
        <button onClick={onAbrir} className="text-left">
          <h3 className="font-heading font-bold text-zinc-900 text-lg leading-snug line-clamp-2 hover:underline decoration-zinc-300 underline-offset-4">{produto.nome}</h3>
        </button>
        <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-400 mt-1.5 mb-3">
          {produto.embalagem && `${produto.embalagem} `}
          {produto.unidadeVenda && `· ${produto.unidadeVenda}`}
        </p>
        <div className="mt-auto pt-3 pb-4">
          {isAtacado ? (
            <>
              <p className="text-xs font-medium text-zinc-400 line-through">{formatPreco(produto.precoVarejo)}</p>
              <p className="text-2xl font-black text-zinc-900 leading-none">{formatPreco(produto.precoAtacado)}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mt-1">Atacado · 5+ un.</p>
            </>
          ) : (
            <p className="text-2xl font-black text-zinc-900 leading-none">{formatPreco(produto.precoVarejo)}</p>
          )}
        </div>
        {qtd > 0 ? (
          <div className="flex items-center justify-between rounded-full border border-zinc-900/20 bg-zinc-50 p-1">
            <button onClick={onRemove} className="p-2 rounded-full text-zinc-700 hover:bg-white hover:shadow-sm transition-colors">
              <Minus size={16} />
            </button>
            <span className="font-bold text-zinc-900 w-10 text-center">{qtd}</span>
            <button onClick={onAdd} className="p-2 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors">
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button onClick={onAbrir} className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-xs rounded-full transition-colors">
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
  onAdd,
  onRemove,
  onAbrir,
}: {
  produto: Produto;
  qtd: number;
  onAdd: () => void;
  onRemove: () => void;
  onAbrir: () => void;
}) {
  const isAtacado = qtd >= 5;
  return (
    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden group bg-[#F7F5F2] border border-zinc-900/15 shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(0,0,0,0.14)] transition-all">
      {produto.imagemUrl ? (
        <img src={imageUrl(produto.imagemUrl)} alt={produto.nome} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-300 text-[10px] font-bold uppercase tracking-widest">Sem foto</div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      {isAtacado && (
        <span className="absolute top-3 left-3 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">Atacado</span>
      )}
      <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
        {produto.marca?.nome && (
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 mb-1">{produto.marca.nome}</p>
        )}
        <button onClick={onAbrir} className="text-left block w-full">
          <h3 className="font-heading font-bold text-white text-xl leading-snug line-clamp-2 hover:underline decoration-white/40 underline-offset-4">{produto.nome}</h3>
        </button>
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
            <div className="flex items-center rounded-full bg-white p-1 shrink-0">
              <button onClick={onRemove} className="p-1.5 rounded-full text-zinc-700 hover:bg-zinc-100 transition-colors"><Minus size={14} /></button>
              <span className="font-bold text-zinc-900 w-7 text-center text-sm">{qtd}</span>
              <button onClick={onAdd} className="p-1.5 rounded-full bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"><Plus size={14} /></button>
            </div>
          ) : (
            <button onClick={onAbrir} className="px-4 py-2 bg-white text-zinc-900 font-bold uppercase tracking-widest text-[10px] rounded-full hover:bg-zinc-100 transition-colors shrink-0">Ver Produto</button>
          )}
        </div>
      </div>
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
        <div className="h-8 w-2 bg-zinc-900 rounded-full" />
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
  const [tema, setTema] = useState<'restaurant' | 'ecommerce'>('restaurant');
  const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([]);
  const [todasCategorias, setTodasCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [categoriaAberta, setCategoriaAberta] = useState<number | null>(null);
  const [carrinho, setCarrinho] = useState<Map<number, number>>(new Map());
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
  const [opacidadeNav, setOpacidadeNav] = useState(0);
  const tickerRef = useRef<HTMLDivElement | null>(null);

  const isRestaurant = tema === 'restaurant';
  const carrosselRef = useRef<HTMLDivElement>(null);
  
  // Theme Variables
  const primaryBg = isRestaurant ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white';
  const primaryBorderActive = isRestaurant ? 'border-red-600 bg-red-600 text-white' : 'border-zinc-900 bg-zinc-900 text-white';

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
    if (!filtro) return true;
    const t = normalizar(filtro);
    return normalizar(p.nome).includes(t) || normalizar(p.marca?.nome ?? '').includes(t);
  };

  const precoPorQtd = (produto: Produto, qtd: number) =>
    qtd >= 5 ? produto.precoAtacado : produto.precoVarejo;

  const addAoCarrinho = (produtoId: number) => {
    setCarrinho(prev => new Map(prev).set(produtoId, (prev.get(produtoId) ?? 0) + 1));
  };

  const removeDoCarrinho = (produtoId: number) => {
    setCarrinho(prev => {
      const next = new Map(prev);
      const qtd = next.get(produtoId) ?? 0;
      if (qtd <= 1) next.delete(produtoId);
      else next.set(produtoId, qtd - 1);
      return next;
    });
  };

  const qtdNoCarrinho = (produtoId: number) => carrinho.get(produtoId) ?? 0;
  const totalItensCarrinho = [...carrinho.values()].reduce((a, b) => a + b, 0);
  const limparCarrinho = () => setCarrinho(new Map());

  const marcasSugestao: Sugestao[] = marcas.map(m => ({ rotulo: m.nome, subRotulo: 'Marca' }));

  const sugestoes: Sugestao[] = [
    ...marcasSugestao,
    ...categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).map(p => ({ rotulo: p.nome, subRotulo: p.categoria?.nome })),
  ];

  const categoriasFiltradas = categorias
    .map(({ categoria, grupos }) => ({
      categoria,
      grupos: grupos
        .map(g => ({ ...g, produtos: g.produtos.filter(produtoFiltrado) }))
        .filter(g => g.produtos.length > 0),
    }))
    .filter(c => c.grupos.length > 0);

  const produtosDestaque = useMemo(() => {
    const pools = new Map<number, Produto[]>();
    for (const p of categorias.flatMap(c => c.grupos.flatMap(g => g.produtos))) {
      if (!p.imagemUrl || !p.ativo) continue;
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
    const timer = setInterval(() => {
      const el = carrosselRef.current;
      if (!el || el.scrollWidth <= el.clientWidth) return;
      const primeiro = el.children[0] as HTMLElement | undefined;
      const passo = primeiro ? primeiro.offsetWidth + 16 : el.clientWidth * 0.8;
      const alvo = el.scrollLeft + passo;
      if (alvo >= el.scrollWidth - el.clientWidth - 1) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollTo({ left: alvo, behavior: 'smooth' });
      }
    }, 3000);
    return () => clearInterval(timer);
  }, []);

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
    let touchInicio: number | null = null;
    const onTouchStart = (e: TouchEvent) => {
      touchInicio = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!container || container.scrollTop > 0 || touchInicio == null) return;
      const y = e.touches[0]?.clientY ?? 0;
      if (y - touchInicio > 0) e.preventDefault();
    };
    const onWheel = (e: WheelEvent) => {
      if (container && container.scrollTop <= 0 && e.deltaY < 0) e.preventDefault();
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
  }, [isRestaurant]);

  const scrollParaCatalogo = () => {
    const primeira = categoriasFiltradas[0];
    if (!primeira) return;
    const el = document.getElementById(`cat-${primeira.categoria.id}`);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollParaCategoria = (id: number) => {
    setMenuCategorias(false);
    setTimeout(() => {
      const el = document.getElementById(`cat-${id}`);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  const abrirDetalhe = (p: Produto) => {
    setQtdDetalhe(qtdNoCarrinho(p.id) || 1);
    setProdutoDetalhe(p);
    setVista('produto');
  };

  const adicionarDoDetalhe = () => {
    if (!produtoDetalhe) return;
    setCarrinho(prev => new Map(prev).set(produtoDetalhe.id, (prev.get(produtoDetalhe.id) ?? 0) + qtdDetalhe));
    setProdutoDetalhe(null);
    setVista('catalogo');
  };

  const finalizarPedido = async () => {
    if (!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || carrinho.size === 0) return;
    if (tipoEntrega === 'Entrega' && !solicitante.logradouro.trim()) return;
    setEnviando(true);
    const itens = [...carrinho.entries()].map(([produtoId, quantidade]) => {
      const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
      return { produtoId, quantidade, precoUnitario: produto ? precoPorQtd(produto, quantidade) : 0, pesoUnitario: 0 };
    });
    const valorTotal = itens.reduce((acc, i) => acc + i.precoUnitario * i.quantidade, 0);
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
    setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
    setTipoEntrega('Entrega');
    setPagamento('');
    limparCarrinho();
  };

  return (
    <div className={`min-h-screen ${isRestaurant ? 'bg-neutral-50/50' : 'bg-[#F7F5F2]'}`}>
      
      {/* ── Theme Switcher (restaurante; no e-commerce fica na nav) ── */}
      {isRestaurant && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => setTema('ecommerce')}
            className="flex items-center gap-2 backdrop-blur-md px-4 py-2 shadow-sm transition-colors text-sm font-medium bg-white/90 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 rounded-full"
          >
            <Palette size={16} className="text-red-500" />
            Tema: Restaurante
          </button>
        </div>
      )}

      {vista === 'produto' && produtoDetalhe ? (
        <div className="min-h-screen pb-10">
          <div className={`${isRestaurant ? 'bg-white border-b border-neutral-200' : 'bg-white border-b-2 border-zinc-900'}`}>
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3">
              <button
                onClick={() => { setProdutoDetalhe(null); setVista('catalogo'); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${isRestaurant ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl' : 'bg-zinc-900 hover:bg-zinc-800 text-white rounded-full uppercase tracking-widest text-xs'}`}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <h1 className={`font-bold ${isRestaurant ? 'text-lg text-neutral-900' : 'font-heading text-2xl text-zinc-900'}`}>Detalhes do produto</h1>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              <div>
                <div className="aspect-square rounded-3xl bg-[#F7F5F2] border border-zinc-900/10 overflow-hidden flex items-center justify-center md:sticky md:top-24">
                  {produtoDetalhe.imagemUrl ? (
                    <img src={imageUrl(produtoDetalhe.imagemUrl)} alt={produtoDetalhe.nome} className="w-full h-full object-cover" />
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
                  <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Quantidade</p>
                  <div className="inline-flex items-center rounded-full border border-zinc-900/20 bg-white overflow-hidden">
                    <button onClick={() => setQtdDetalhe(q => Math.max(1, q - 1))} className="p-3 text-zinc-700 hover:bg-zinc-50 transition-colors"><Minus size={18} /></button>
                    <span className="font-black text-zinc-900 w-12 text-center">{qtdDetalhe}</span>
                    <button onClick={() => setQtdDetalhe(q => q + 1)} className="p-3 text-zinc-700 hover:bg-zinc-50 transition-colors"><Plus size={18} /></button>
                  </div>
                </div>

                <button onClick={adicionarDoDetalhe} className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-sm rounded-full transition-colors shadow-sm">
                  Adicionar {qtdDetalhe} {qtdDetalhe === 1 ? 'item' : 'itens'} ao carrinho
                </button>

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
        <div className="min-h-screen pb-10">
          <div className={`${isRestaurant ? 'bg-white border-b border-neutral-200' : 'bg-white border-b-2 border-zinc-900'}`}>
            <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
              <button
                onClick={() => { setVista('catalogo'); setPedidoCriado(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-colors ${isRestaurant ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl' : 'bg-zinc-900 hover:bg-zinc-800 text-white rounded-full uppercase tracking-widest text-xs'}`}
              >
                <ArrowLeft size={16} /> Voltar
              </button>
              <h1 className={`font-bold ${isRestaurant ? 'text-lg text-neutral-900' : 'font-heading text-2xl text-zinc-900'}`}>Seu Pedido</h1>
            </div>
          </div>
          <div className="max-w-2xl mx-auto px-4 py-8">
            {pedidoCriado ? (
              <div className="text-center py-16">
                <div className={`mx-auto h-20 w-20 flex items-center justify-center rounded-full mb-6 ${isRestaurant ? 'bg-red-50' : 'bg-zinc-900'}`}>
                  <CheckCircle2 size={40} className={isRestaurant ? 'text-red-600' : 'text-white'} />
                </div>
                <h2 className={`font-heading text-3xl font-bold ${isRestaurant ? 'text-neutral-900' : 'text-zinc-900'}`}>Pedido enviado!</h2>
                <p className={`mt-3 ${isRestaurant ? 'text-neutral-500' : 'text-zinc-500 font-medium'}`}>Recebemos seu pedido com sucesso. Em breve entraremos em contato para confirmar.</p>
                <button onClick={() => { setPedidoCriado(false); setVista('catalogo'); }} className={`mt-8 px-10 py-4 font-bold uppercase tracking-widest text-sm transition-colors shadow-sm ${isRestaurant ? 'bg-red-600 hover:bg-red-700 text-white rounded-xl' : 'bg-zinc-900 hover:bg-zinc-800 text-white rounded-full'}`}>
                  Voltar ao catálogo
                </button>
              </div>
            ) : carrinho.size === 0 ? (
              <div className="text-center py-16">
                <div className={`mx-auto h-20 w-20 flex items-center justify-center rounded-full mb-6 ${isRestaurant ? 'bg-neutral-100' : 'bg-white border border-zinc-900'}`}>
                  <ShoppingCart size={36} className={isRestaurant ? 'text-neutral-400' : 'text-zinc-900'} />
                </div>
                <h2 className={`font-heading text-2xl font-bold ${isRestaurant ? 'text-neutral-900' : 'text-zinc-900'}`}>Seu carrinho está vazio</h2>
                <p className={`mt-2 ${isRestaurant ? 'text-neutral-500' : 'text-zinc-500 font-medium'}`}>Navegue pelo catálogo e adicione produtos ao carrinho.</p>
                <button onClick={() => setVista('catalogo')} className={`mt-8 px-10 py-4 font-bold uppercase tracking-widest text-sm transition-colors shadow-sm ${isRestaurant ? 'bg-red-600 hover:bg-red-700 text-white rounded-xl' : 'bg-zinc-900 hover:bg-zinc-800 text-white rounded-full'}`}>
                  Ver produtos
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-5 mb-8">
                  <div className={`p-4 space-y-3 text-base ${isRestaurant ? 'bg-neutral-50 rounded-2xl border border-neutral-100' : 'bg-[#F7F5F2] rounded-2xl border border-zinc-900/10'}`}>
                    {[...carrinho.entries()].map(([produtoId, quantidade]) => {
                      const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
                      if (!produto) return null;
                      const preco = precoPorQtd(produto, quantidade);
                      return (
                        <div key={produtoId} className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 mr-3">
                            <p className={`font-bold truncate ${isRestaurant ? 'text-neutral-800' : 'text-zinc-900 text-sm'}`}>{produto.nome}</p>
                            <p className={`text-sm ${isRestaurant ? 'text-neutral-500' : 'text-zinc-500 font-medium'}`}>{quantidade} x {formatPreco(preco)}</p>
                          </div>
                          <span className={`font-bold shrink-0 ${isRestaurant ? 'text-neutral-800' : 'text-zinc-900'}`}>{formatPreco(preco * quantidade)}</span>
                        </div>
                      );
                    })}
                    <div className={`pt-3 mt-3 flex justify-between font-bold text-lg ${isRestaurant ? 'border-t border-neutral-200 text-neutral-900' : 'border-t border-zinc-900 text-zinc-900'}`}>
                      <span>Total</span>
                      <span>{formatPreco([...carrinho.entries()].reduce((acc, [id, qtd]) => {
                        const p = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id);
                        return acc + (p ? precoPorQtd(p, qtd) * qtd : 0);
                      }, 0))}</span>
                    </div>
                  </div>

                  {/* Dados do solicitante */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className={`text-sm font-bold block mb-1 ${isRestaurant ? 'text-neutral-700' : 'text-zinc-900 uppercase text-[11px] tracking-[0.15em]'}`}>Nome completo *</label>
                      <input value={solicitante.nome} onChange={e => setSolicitante({ ...solicitante, nome: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="Seu nome" />
                    </div>
                    <div>
                      <label className={`text-sm font-bold block mb-1 ${isRestaurant ? 'text-neutral-700' : 'text-zinc-900 uppercase text-[11px] tracking-[0.15em]'}`}>CPF / CNPJ *</label>
                      <input value={solicitante.cpfCnpj} onChange={e => setSolicitante({ ...solicitante, cpfCnpj: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <label className={`text-sm font-bold block mb-1 ${isRestaurant ? 'text-neutral-700' : 'text-zinc-900 uppercase text-[11px] tracking-[0.15em]'}`}>Telefone</label>
                      <input value={solicitante.telefone} onChange={e => setSolicitante({ ...solicitante, telefone: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="(81) 99999-9999" />
                    </div>
                  </div>

                  {/* Tipo de Entrega */}
                  <div>
                    <label className={`text-sm font-bold block mb-2 ${isRestaurant ? 'text-neutral-700' : 'text-zinc-900 uppercase text-[11px] tracking-[0.15em]'}`}>Opção de Recebimento *</label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setTipoEntrega('Entrega')}
                        className={`flex-1 py-3 text-sm font-bold transition-all border ${isRestaurant ? 'rounded-xl' : 'rounded-full'} ${tipoEntrega === 'Entrega' ? primaryBorderActive : (isRestaurant ? 'bg-white text-neutral-600 border-neutral-200' : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900')}`}
                      >
                        Entrega
                      </button>
                      <button
                        type="button"
                        onClick={() => setTipoEntrega('Retirada')}
                        className={`flex-1 py-3 text-sm font-bold transition-all border ${isRestaurant ? 'rounded-xl' : 'rounded-full'} ${tipoEntrega === 'Retirada' ? primaryBorderActive : (isRestaurant ? 'bg-white text-neutral-600 border-neutral-200' : 'bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900')}`}
                      >
                        Retirada
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={`text-sm font-bold block mb-1 ${isRestaurant ? 'text-neutral-700' : 'text-zinc-900 uppercase text-[11px] tracking-[0.15em]'}`}>Forma de Pagamento</label>
                    <select
                      value={pagamento}
                      onChange={e => setPagamento(e.target.value)}
                      className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`}
                    >
                      <option value="">Selecione na entrega/retirada</option>
                      <option value="PIX">PIX</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Dinheiro">Dinheiro</option>
                    </select>
                  </div>

                  {/* Endereço */}
                  {tipoEntrega === 'Entrega' && (
                    <div className="pt-2">
                      <p className={`text-sm font-bold mb-3 ${isRestaurant ? 'text-neutral-700' : 'text-zinc-900 uppercase text-[11px] tracking-[0.15em]'}`}>Endereço de entrega *</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <input value={solicitante.logradouro} onChange={e => setSolicitante({ ...solicitante, logradouro: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="Rua, Avenida..." />
                        </div>
                        <div>
                          <input value={solicitante.numero} onChange={e => setSolicitante({ ...solicitante, numero: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="Número" />
                        </div>
                        <div>
                          <input value={solicitante.complemento} onChange={e => setSolicitante({ ...solicitante, complemento: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="Complemento" />
                        </div>
                        <div>
                          <div className="relative">
                            <input value={solicitante.cep} onChange={e => setSolicitante({ ...solicitante, cep: e.target.value })} onBlur={handleBuscarCEP} className={`w-full bg-white p-3 outline-none text-base transition-colors ${buscandoCEP ? 'pr-10' : ''} ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="CEP" />
                            {buscandoCEP && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />}
                          </div>
                        </div>
                        <div>
                          <input value={solicitante.bairro} onChange={e => setSolicitante({ ...solicitante, bairro: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="Bairro" />
                        </div>
                        <div>
                          <input value={solicitante.cidade} onChange={e => setSolicitante({ ...solicitante, cidade: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="Cidade" />
                        </div>
                        <div>
                          <input value={solicitante.estado} onChange={e => setSolicitante({ ...solicitante, estado: e.target.value })} className={`w-full bg-white p-3 outline-none text-base transition-colors ${isRestaurant ? 'border border-neutral-200 rounded-xl focus:border-neutral-400' : 'border border-zinc-300 rounded-xl focus:border-zinc-900 bg-white'}`} placeholder="UF" maxLength={2} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={finalizarPedido} disabled={!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || (tipoEntrega === 'Entrega' && !solicitante.logradouro.trim()) || enviando} className={`w-full py-4 font-bold text-lg transition-colors shadow-md ${isRestaurant ? 'rounded-xl' : 'rounded-full'} ${solicitante.nome.trim() && solicitante.cpfCnpj.replace(/\D/g, '') && (tipoEntrega === 'Retirada' || solicitante.logradouro.trim()) && !enviando ? primaryBg : (isRestaurant ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed' : 'bg-zinc-200 text-zinc-400 cursor-not-allowed')}`}>
                  {enviando ? 'Enviando...' : 'Confirmar Pedido'}
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
      {/* ── Nav fixa (dock) ── */}
      {!isRestaurant && (
        <div className="fixed top-0 inset-x-0 z-40 px-3 sm:px-4 pt-3">
          <div
            className="max-w-7xl mx-auto rounded-2xl sm:rounded-3xl transition-[background-color,backdrop-filter,border-color,box-shadow] duration-300"
            style={{
              backgroundColor: `rgba(24,24,27,${(opacidadeNav * 0.6).toFixed(3)})`,
              backdropFilter: opacidadeNav > 0 ? 'blur(20px) saturate(160%)' : 'none',
              WebkitBackdropFilter: opacidadeNav > 0 ? 'blur(20px) saturate(160%)' : 'none',
              boxShadow: opacidadeNav >= 1 ? '0 10px 40px rgba(0,0,0,0.35)' : 'none',
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
                      classNameInput="h-10 pl-10 pr-4 bg-white border border-zinc-900 rounded-full focus:outline-none text-sm transition-all"
                      onBuscar={scrollParaCatalogo}
                    />
                  </div>
                  <button
                    onClick={() => setMenuCategorias(true)}
                    className="flex items-center gap-2 h-10 px-5 bg-white text-zinc-900 rounded-full font-bold uppercase tracking-widest text-xs shadow-sm hover:bg-zinc-100 transition-colors"
                  >
                    <LayoutGrid size={16} /> Categorias
                  </button>
                </div>
                <h1 className="font-heading font-bold text-white text-xl sm:text-2xl tracking-wide drop-shadow-md whitespace-nowrap">Multigrãos</h1>
                <div className="flex-1 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setTema('restaurant')}
                    title="Tema restaurante"
                    className="h-10 w-10 flex items-center justify-center backdrop-blur-md bg-white/15 border border-white/40 text-white rounded-full hover:bg-white/25 transition-colors"
                  >
                    <Palette size={18} />
                  </button>
                  <button
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
                      <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 bg-zinc-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
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
                  classNameInput="w-full h-10 pl-10 pr-4 bg-white border border-zinc-900 rounded-full focus:outline-none text-sm transition-all"
                  onBuscar={scrollParaCatalogo}
                />
              </div>
            </div>
          </div>
          </div>
        )}

      {/* ── Hero ── */}
      <div className={`relative overflow-hidden shadow-sm ${isRestaurant ? 'rounded-none md:rounded-b-[3rem]' : 'h-screen rounded-none bg-white'}`}>
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/multigraosvid.mp4" type="video/mp4" />
        </video>
        <div className={`absolute inset-0 ${isRestaurant ? 'bg-black/50' : 'bg-black/30'}`} />

        <div className={`relative z-10 px-4 h-full flex flex-col ${isRestaurant ? 'items-center text-center py-12 md:py-20' : 'items-start text-left justify-end pb-16 md:pb-24 md:pl-16 lg:pl-24'}`}>
          <img
            src="/multigraos-logo.png"
            alt="Multigrãos"
            className={`h-auto object-contain mb-8 brightness-110 ${isRestaurant ? 'w-56 md:w-72' : 'w-[9.4rem] md:w-[11.4rem]'}`}
          />
            <h1 className={`${isRestaurant ? 'font-heading text-3xl md:text-5xl tracking-wide font-bold' : 'font-heading text-2xl md:text-3xl font-bold tracking-wide'} text-white drop-shadow-md`}>
            {isRestaurant ? 'Nosso Menu Digital' : 'O melhor da natureza para a sua loja.'}
          </h1>
          <p className={`text-white/90 mt-6 font-medium drop-shadow ${isRestaurant ? 'text-base md:text-lg max-w-xl' : 'text-sm md:text-base max-w-xl'}`}>
            {isRestaurant ? 'Escolha seus produtos favoritos de forma simples e rápida' : 'Sua distribuidora de produtos naturais'}
          </p>

          <div className={`flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-sm text-white/90 font-medium ${isRestaurant ? 'justify-center' : 'justify-start'}`}>
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-white/70" />
              Centro — Paulista — PE
            </span>
            <a href="https://wa.me/5581988593757" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone size={16} className="text-white/70" />
              (81) 98859-3757
            </a>
          </div>

          {!isRestaurant && (
            <button onClick={scrollParaCatalogo} className="mt-8 px-8 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold uppercase tracking-widest text-xs rounded-full shadow-[0_5px_0_rgba(0,0,0,0.35)] active:translate-y-[3px] active:shadow-none transition-all">
              Ver Produtos
            </button>
          )}
        </div>
      </div>

      {!isRestaurant && (
        <div ref={tickerRef} className="bg-zinc-900 text-white">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-8 gap-y-1 text-[11px] font-bold uppercase tracking-[0.2em]">
            <span>Multigrãos</span>
            <span className="text-orange-500">●</span>
            <span>Varejo & Atacado</span>
            <span className="text-orange-500">●</span>
            <span>Centro — Paulista — PE</span>
            <span className="text-orange-500">●</span>
            <span>(81) 98859-3757</span>
          </div>
        </div>
      )}

      {/* ── Conteúdo ── */}
      <div className={`max-w-7xl mx-auto px-4 ${isRestaurant ? 'py-10' : 'py-12'} pb-32`}>
        
        {!isRestaurant && produtosDestaque.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-2 bg-zinc-900 rounded-full" />
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-zinc-900">Destaques</h2>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <button onClick={() => rolarCarrossel(-1)} className="h-10 w-10 flex items-center justify-center bg-white border border-zinc-900 rounded-full hover:bg-zinc-900 hover:text-white transition-colors">
                  <ChevronLeft size={20} />
                </button>
                <button onClick={() => rolarCarrossel(1)} className="h-10 w-10 flex items-center justify-center bg-white border border-zinc-900 rounded-full hover:bg-zinc-900 hover:text-white transition-colors">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <div ref={carrosselRef} className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-1 px-1 pb-12">
              {produtosDestaque.map(p => (
                <div key={p.id} className="w-72 sm:w-80 shrink-0 snap-start">
                  <CardCarrossel
                    produto={p}
                    qtd={qtdNoCarrinho(p.id)}
                    onAdd={() => addAoCarrinho(p.id)}
                    onRemove={() => removeDoCarrinho(p.id)}
                    onAbrir={() => abrirDetalhe(p)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {isRestaurant && (
          <div className="sticky top-0 z-30 pt-4 pb-4 bg-neutral-50/90 backdrop-blur-md mb-6">
            <SearchAutocomplete
              placeholder="Pesquise pelo nome do produto..."
              valor={filtro}
              onChange={setFiltro}
              sugestoes={sugestoes}
              aoSelecionar={s => setFiltro(s.rotulo)}
              className="mb-4"
              onBuscar={scrollParaCatalogo}
            />

            {filtro === '' && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x items-center">
                {todasCategorias.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { const el = document.getElementById(`cat-${c.id}`); if (el) { const y = el.getBoundingClientRect().top + window.pageYOffset - 120; window.scrollTo({top: y, behavior: 'smooth'}); } }}
                    className="snap-start shrink-0 transition-all px-5 py-2.5 rounded-full text-sm font-medium bg-white border border-neutral-200 text-neutral-700 hover:border-red-200 hover:text-red-600 shadow-sm"
                  >
                    {c.nome}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {carregando ? (
          <div className="flex items-center justify-center py-20 text-neutral-400 text-sm italic">Carregando catálogo...</div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 text-sm italic">Nenhum produto encontrado.</div>
        ) : (
          <div className="space-y-16">
            {!isRestaurant && marcaFiltrada ? (
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
                          <div className="h-7 w-2 shrink-0 bg-zinc-900 rounded-full" />
                          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">{categoria.nome}</h2>
                          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">{produtos.length} {produtos.length === 1 ? 'produto' : 'produtos'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                          {produtos.map(p => (
                            <CardEcommerce
                              key={p.id}
                              produto={p}
                              qtd={qtdNoCarrinho(p.id)}
                              onAdd={() => addAoCarrinho(p.id)}
                              onRemove={() => removeDoCarrinho(p.id)}
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
                  <div className={`flex items-center gap-3 mb-8 ${isRestaurant ? 'px-2' : ''}`}>
                    {isRestaurant && <div className="h-8 w-1.5 bg-red-500 rounded-full" />}
                    {!isRestaurant && <div className="h-8 w-2 shrink-0 bg-zinc-900 rounded-full" />}
                    <h2 className={`${isRestaurant ? 'font-heading text-2xl md:text-3xl font-bold tracking-tight text-slate-900' : 'font-heading text-2xl md:text-3xl font-bold tracking-tight text-zinc-900'}`}>
                      {categoria.nome}
                    </h2>
                  </div>

                  {isRestaurant ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {grupos.map((grupo, gi) => {
                        return (
                          <Fragment key={gi}>
                            {grupo.marca && (
                              <div className="col-span-full mt-2 mb-2 flex items-center gap-4">
                                <h3 className="uppercase tracking-widest text-neutral-500 text-sm font-bold">
                                  {grupo.marca.nome}
                                </h3>
                                <div className="flex-1 h-px bg-neutral-200" />
                              </div>
                            )}
                            {grupo.produtos.map(p => {
                              const qtd = qtdNoCarrinho(p.id);
                              const isAtacado = qtd >= 5;
                              return (
                                <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-neutral-100 flex flex-col h-full hover:shadow-md transition-shadow">
                                  <div className="flex gap-4 mb-4">
                                    {p.imagemUrl ? (
                                      <img src={imageUrl(p.imagemUrl)} alt="" className="h-24 w-24 rounded-xl object-cover shrink-0 ring-1 ring-neutral-100" />
                                    ) : (
                                      <div className="h-24 w-24 rounded-xl bg-neutral-50 flex items-center justify-center shrink-0 ring-1 ring-neutral-100">
                                        <span className="text-neutral-300 text-xs">Sem foto</span>
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <h3 className="font-bold text-neutral-800 leading-tight mb-1">{p.nome}</h3>
                                      <p className="text-xs text-neutral-500 line-clamp-2 mb-2">
                                        {p.embalagem && `${p.embalagem} `}
                                        {p.unidadeVenda && `· ${p.unidadeVenda}`}
                                      </p>
                                      <div className="mt-auto">
                                        {isAtacado ? (
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm text-neutral-400 line-through">{formatPreco(p.precoVarejo)}</p>
                                            <p className="text-lg font-bold text-emerald-600">{formatPreco(p.precoAtacado)}</p>
                                          </div>
                                        ) : (
                                          <p className="text-lg font-bold text-neutral-900">{formatPreco(p.precoVarejo)}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-auto pt-3 border-t border-neutral-100">
                                    {qtd > 0 ? (
                                      <div className="flex items-center justify-between bg-neutral-50 rounded-xl p-1 border border-neutral-100">
                                        <button onClick={() => removeDoCarrinho(p.id)} className="p-2.5 rounded-lg bg-white hover:bg-neutral-100 text-neutral-600 shadow-sm transition-colors">
                                          <Minus size={16} />
                                        </button>
                                        <span className="font-semibold text-neutral-800 w-12 text-center">{qtd}</span>
                                        <button onClick={() => addAoCarrinho(p.id)} className="p-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors">
                                          <Plus size={16} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button onClick={() => addAoCarrinho(p.id)} className="w-full py-2.5 rounded-xl border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 text-sm">
                                        <Plus size={16} /> Adicionar
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </Fragment>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-10">
                      {[...grupos]
                        .sort((a, b) => (a.marca ? 0 : 1) - (b.marca ? 0 : 1))
                        .map((grupo, gi) => {
                          return (
                          <div key={gi}>
                            <FaixaMarca marca={grupo.marca} total={grupo.produtos.length} />
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5 mt-5">
                              {grupo.produtos.map(p => (
                                <CardEcommerce
                                  key={p.id}
                                  produto={p}
                                  qtd={qtdNoCarrinho(p.id)}
                                  onAdd={() => addAoCarrinho(p.id)}
                                  onRemove={() => removeDoCarrinho(p.id)}
                                  onAbrir={() => abrirDetalhe(p)}
                                />
                              ))}
                            </div>
                          </div>
                          );
                        })}
                    </div>
                  )}
                </section>
              );
            })
            )}
          </div>
        )}
      </div>

      {/* Carrinho flutuante */}
      {totalItensCarrinho > 0 && !pedidoCriado && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <div className={`backdrop-blur-md px-5 py-4 flex items-center justify-between shadow-[0_-8px_30px_rgba(0,0,0,0.12)] ${isRestaurant ? 'bg-white/95 border border-neutral-200 rounded-2xl' : 'bg-zinc-900 text-white rounded-3xl border-2 border-zinc-900'}`}>
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 flex items-center justify-center ${isRestaurant ? 'bg-red-50 rounded-full' : 'bg-white rounded-full'}`}>
                  <ShoppingCart size={22} className={isRestaurant ? 'text-red-600' : 'text-zinc-900'} />
                </div>
                <div>
                  <p className={`text-sm font-bold ${isRestaurant ? 'text-neutral-800' : 'text-white'}`}>{totalItensCarrinho} {totalItensCarrinho === 1 ? 'item' : 'itens'}</p>
                  <p className={`text-xs font-medium ${isRestaurant ? 'text-neutral-500' : 'text-white/80 font-bold'}`}>
                    {[...carrinho.entries()].reduce((acc, [id, qtd]) => {
                      const p = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id);
                      return acc + (p ? precoPorQtd(p, qtd) * qtd : 0);
                    }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={limparCarrinho} className={`text-xs px-2 py-1.5 font-medium transition-colors ${isRestaurant ? 'text-neutral-400 hover:text-neutral-600' : 'text-white/60 hover:text-white'}`}>Limpar</button>
                <button onClick={() => setVista('carrinho')} className={`flex items-center gap-2 px-6 py-3 text-sm font-bold transition-colors shadow-sm ${isRestaurant ? 'rounded-xl bg-red-600 hover:bg-red-700 text-white' : 'rounded-full bg-white text-zinc-900 hover:bg-zinc-200 uppercase tracking-widest text-xs'}`}>
                  <ShoppingBag size={18} /> {isRestaurant ? 'Ver Pedido' : 'Finalizar Pedido'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        </>
      )}

      {/* ── Aba lateral: Categorias / Conta / Carrinho ── */}
      {!isRestaurant && menuCategorias && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMenuCategorias(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-sm bg-[#F7F5F2] shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 bg-zinc-900 text-white">
              <h2 className="font-heading font-bold text-xl">Categorias</h2>
              <button onClick={() => setMenuCategorias(false)} className="p-2 rounded-full hover:bg-white/10 transition-colors"><X size={22} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              {/* Todas as categorias */}
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-2">Produtos</p>
                <div className="space-y-2">
                  {todasCategorias.map(c => (
                    <button
                      key={c.id}
                      onClick={() => scrollParaCategoria(c.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-2xl border border-zinc-900/15 hover:border-zinc-900 transition-colors text-left"
                    >
                      <span className="font-bold text-zinc-900 text-sm">{c.nome}</span>
                      <ChevronRight size={16} className="text-zinc-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
