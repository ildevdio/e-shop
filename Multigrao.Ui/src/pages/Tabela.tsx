import { useState, useEffect } from 'react';
import { Plus, X, Minus, ShoppingCart, ShoppingBag, MapPin, Phone, Mail, Loader2 } from 'lucide-react';
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
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [solicitante, setSolicitante] = useState({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [tipoEntrega, setTipoEntrega] = useState<'Entrega' | 'Retirada'>('Entrega');
  const [pagamento, setPagamento] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(false);
  const [buscandoCEP, setBuscandoCEP] = useState(false);

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

    setCategorias(lista);
    if (lista.length > 0 && categoriaAberta === null) {
      setCategoriaAberta(lista[0].categoria.id);
    }
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const produtoFiltrado = (p: Produto) => {
    if (!filtro) return true;
    const t = filtro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(t);
  };

  const formatPreco = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

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

  const sugestoes: Sugestao[] = categorias
    .flatMap(c => c.grupos.flatMap(g => g.produtos))
    .map(p => ({ rotulo: p.nome, subRotulo: p.categoria?.nome }));

  const categoriasFiltradas = categorias
    .map(({ categoria, grupos }) => ({
      categoria,
      grupos: grupos
        .map(g => ({ ...g, produtos: g.produtos.filter(produtoFiltrado) }))
        .filter(g => g.produtos.length > 0),
    }))
    .filter(c => c.grupos.length > 0);

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
    setModalFinalizar(false);
    setPedidoCriado(true);
    setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
    setTipoEntrega('Entrega');
    setPagamento('');
    limparCarrinho();
    setTimeout(() => setPedidoCriado(false), 8000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Hero card com vídeo ── */}
      <div className="relative overflow-hidden rounded-none md:rounded-b-[3rem] shadow-xl">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover">
          <source src="/multigraosvid.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc0IiBudW1PY3RhdmVzPSI0Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2YpIiBvcGFjaXR5PSIwLjA0Ii8+PC9zdmc+')] opacity-40 pointer-events-none" />

        <div className="relative z-10 px-4 py-12 md:py-20 flex flex-col items-center text-center">
          <img
            src="/multigraos-logo.png"
            alt="Multigrãos"
            className="w-56 md:w-72 h-auto object-contain mb-6 brightness-110"
          />
          <h1 className="font-heading text-3xl md:text-5xl text-amber-50 font-bold tracking-wide drop-shadow-lg">
            Tabela de Preços
          </h1>
          <p className="text-white/80 text-base md:text-lg mt-3 font-light drop-shadow">
            Confira nossos produtos e monte seu pedido
          </p>
          <p className="text-white/50 text-sm mt-1 italic">
            Preços sujeitos a alteração sem aviso prévio
          </p>

          {/* Info */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-6 text-sm text-white/70 font-light">
            <span className="flex items-center gap-2">
              <MapPin size={16} className="text-white/50" />
              Centro — Paulista — PE
            </span>
            <a
              href="https://wa.me/5581988593757"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Phone size={16} className="text-white/50" />
              (81) 98859-3757
            </a>
            <a
              href="mailto:distribuidoramultigraos@gmail.com"
              className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
            >
              <Mail size={16} className="text-white/50" />
              distribuidoramultigraos@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* ── Conteúdo branco ── */}
      <div className="max-w-7xl mx-auto px-4 py-8 pb-32">
        {/* Avisos */}
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 mb-6 text-sm text-neutral-600 space-y-1.5">
          <p>* Frete sem custo adicional. Consulte nossa equipe sobre as condições comerciais para a sua região.</p>
          <p>* Condições de pagamento sujeitas à análise de crédito.</p>
          <p>* Produtos disponíveis em embalagens a partir de 1 kg. Acréscimos poderão ser aplicados a produtos fracionados.</p>
          <p>* Condições especiais para compras em maiores volumes.</p>
          <p>* Preços e condições comerciais sujeitos a alterações sem aviso prévio.</p>
        </div>

        {/* Busca */}
        <SearchAutocomplete
          placeholder="Pesquise pelo nome do produto..."
          valor={filtro}
          onChange={setFiltro}
          sugestoes={sugestoes}
          aoSelecionar={s => setFiltro(s.rotulo)}
          className="mb-6"
        />

        {/* Categorias - pills */}
        {filtro === '' && (
          <div className="flex flex-wrap gap-2 mb-6">
            {todasCategorias.map(c => (
              <button
                key={c.id}
                onClick={() => { const el = document.getElementById(`cat-${c.id}`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                className="px-4 py-2 bg-neutral-100 border border-neutral-200 rounded-full text-sm text-neutral-700 hover:bg-neutral-200 hover:border-neutral-300 transition-colors font-medium"
              >
                {c.nome}
              </button>
            ))}
          </div>
        )}

        {carregando ? (
          <div className="flex items-center justify-center py-20 text-neutral-400 text-sm italic">Carregando...</div>
        ) : categoriasFiltradas.length === 0 ? (
          <div className="text-center py-20 text-neutral-400 text-sm italic">Nenhum produto encontrado.</div>
        ) : (
          <div className="space-y-8">
            {categoriasFiltradas.map(({ categoria, grupos }) => {
              const totalProdutos = grupos.reduce((a, g) => a + g.produtos.length, 0);
              return (
                <section key={categoria.id} id={`cat-${categoria.id}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-1.5 bg-neutral-800 rounded-full" />
                    <h2 className="font-heading text-2xl font-bold text-neutral-800 tracking-wide">{categoria.nome}</h2>
                    <span className="text-sm text-neutral-400 italic">{totalProdutos} {totalProdutos === 1 ? 'item' : 'itens'}</span>
                  </div>

                  <div className="space-y-4">
                    {grupos.map((grupo, gi) => (
                      <div key={gi} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                        {grupo.marca && (
                          <div className="flex items-center gap-4 px-6 py-4 border-b border-neutral-100" style={{ backgroundColor: grupo.marca.cor || '#f5f5f5' }}>
                            {(grupo.marca.imagemUrl || grupo.marca.imagemContentType) && (
                              <img src={marcaImagemUrl(grupo.marca)} alt={grupo.marca.nome} className="h-14 object-contain shrink-0" />
                            )}
                            <span className="text-xl font-bold uppercase tracking-wider" style={{ color: grupo.marca.cor ? '#fff' : '#374151' }}>{grupo.marca.nome}</span>
                          </div>
                        )}
                        {!grupo.marca && (
                          <div className="flex items-center gap-2 px-6 py-3 bg-neutral-50 border-b border-neutral-100">
                            <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">Diversos</span>
                            <span className="text-sm text-neutral-400 italic ml-auto">{grupo.produtos.length} {grupo.produtos.length === 1 ? 'produto' : 'produtos'}</span>
                          </div>
                        )}

                        <div className="divide-y divide-neutral-100">
                          {grupo.produtos.map(p => {
                            const qtd = qtdNoCarrinho(p.id);
                            const isAtacado = qtd >= 5;
                            return (
                              <div key={p.id} className="px-6 py-5 flex items-center gap-5 hover:bg-neutral-50 transition-colors">
                                {p.imagemUrl && (
                                  <img src={imageUrl(p.imagemUrl)} alt="" className="h-28 w-28 rounded-xl object-cover shrink-0 ring-1 ring-neutral-200" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xl font-semibold text-neutral-800 leading-tight">{p.nome}</p>
                                  <p className="text-sm text-neutral-400 italic mt-1">
                                    {p.embalagem && `${p.embalagem} `}
                                    {p.unidadeVenda && `· ${p.unidadeVenda}`}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  {isAtacado ? (
                                    <>
                                      <p className="text-sm text-neutral-400 line-through">{formatPreco(p.precoVarejo)}</p>
                                      <p className="text-xl font-bold text-emerald-600">{formatPreco(p.precoAtacado)}</p>
                                      <p className="text-xs text-emerald-500 font-medium italic">Atacado</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-xl font-bold text-neutral-800">{formatPreco(p.precoVarejo)}</p>
                                      <p className="text-sm text-neutral-400 italic">{formatPreco(p.precoAtacado)} no atacado</p>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <button onClick={() => removeDoCarrinho(p.id)} className="p-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-500">
                                    <Minus size={20} />
                                  </button>
                                  <span className="w-10 text-center text-xl font-semibold tabular-nums text-neutral-800">{qtd}</span>
                                  <button onClick={() => addAoCarrinho(p.id)} className="p-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 transition-colors text-white">
                                    <Plus size={20} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 mt-8 mb-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                    <span className="text-neutral-300 text-sm">✦</span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Carrinho flutuante */}
      {totalItensCarrinho > 0 && !pedidoCriado && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md border border-neutral-200 rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-neutral-800 flex items-center justify-center">
                  <ShoppingCart size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">{totalItensCarrinho} {totalItensCarrinho === 1 ? 'item' : 'itens'}</p>
                  <p className="text-[11px] text-neutral-500 italic">
                    {[...carrinho.entries()].reduce((acc, [id, qtd]) => {
                      const p = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id);
                      return acc + (p ? precoPorQtd(p, qtd) * qtd : 0);
                    }, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={limparCarrinho} className="text-xs text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors italic">Limpar</button>
                <button onClick={() => setModalFinalizar(true)} className="flex items-center gap-2 bg-neutral-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-neutral-700 transition-colors shadow-sm">
                  <ShoppingBag size={16} /> Finalizar Pedido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback */}
      {pedidoCriado && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pointer-events-none">
          <div className="max-w-7xl mx-auto pointer-events-auto">
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl px-6 py-5 flex items-center gap-4 shadow-md">
              <div className="h-11 w-11 rounded-full bg-neutral-200 flex items-center justify-center">
                <ShoppingBag size={22} className="text-neutral-700" />
              </div>
              <p className="text-base font-medium text-neutral-700">Pedido enviado! Nossa equipe comercial entrará em contato em breve.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal finalizar */}
      {modalFinalizar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => { setModalFinalizar(false); setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }); setTipoEntrega('Entrega'); setPagamento(''); }}>
          <div className="bg-white rounded-2xl border border-neutral-200 w-full max-w-lg p-8 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-2xl font-bold text-neutral-800">Finalizar Pedido</h2>
              <button onClick={() => { setModalFinalizar(false); setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }); setTipoEntrega('Entrega'); setPagamento(''); }} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"><X size={24} className="text-neutral-400" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-neutral-50 rounded-xl p-4 max-h-48 overflow-y-auto space-y-3 text-base border border-neutral-100">
                {[...carrinho.entries()].map(([produtoId, quantidade]) => {
                  const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
                  if (!produto) return null;
                  const preco = precoPorQtd(produto, quantidade);
                  return (
                    <div key={produtoId} className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-neutral-800 truncate">{produto.nome}</p>
                        <p className="text-sm text-neutral-400 italic">qtd: {quantidade} x {formatPreco(preco)}</p>
                      </div>
                      <span className="font-semibold text-neutral-700 shrink-0">{formatPreco(preco * quantidade)}</span>
                    </div>
                  );
                })}
                <div className="border-t border-neutral-200 pt-2 flex justify-between font-bold text-neutral-800 text-lg">
                  <span>Total</span>
                  <span>{formatPreco([...carrinho.entries()].reduce((acc, [id, qtd]) => {
                    const p = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id);
                    return acc + (p ? precoPorQtd(p, qtd) * qtd : 0);
                  }, 0))}</span>
                </div>
              </div>

              {/* Dados do solicitante */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-base font-medium text-neutral-700">Nome completo *</label>
                  <input value={solicitante.nome} onChange={e => setSolicitante({ ...solicitante, nome: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400 mt-1" placeholder="Seu nome" />
                </div>
                <div>
                  <label className="text-base font-medium text-neutral-700">CPF / CNPJ *</label>
                  <input value={solicitante.cpfCnpj} onChange={e => setSolicitante({ ...solicitante, cpfCnpj: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400 mt-1" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-base font-medium text-neutral-700">Telefone</label>
                  <input value={solicitante.telefone} onChange={e => setSolicitante({ ...solicitante, telefone: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400 mt-1" placeholder="(81) 99999-9999" />
                </div>
              </div>

              {/* Tipo de Entrega */}
              <div>
                <label className="text-base font-medium text-neutral-700">Tipo de Pedido *</label>
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setTipoEntrega('Entrega')}
                    className={`flex-1 py-3 rounded-xl text-base font-medium border-2 transition-colors ${tipoEntrega === 'Entrega' ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
                  >
                    Entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoEntrega('Retirada')}
                    className={`flex-1 py-3 rounded-xl text-base font-medium border-2 transition-colors ${tipoEntrega === 'Retirada' ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300'}`}
                  >
                    Retirada
                  </button>
                </div>
                {tipoEntrega === 'Retirada' && (
                  <p className="text-sm text-neutral-400 mt-2 italic">Retire seu pedido em nossa filial</p>
                )}
              </div>

              <div>
                <p className="text-base font-medium text-neutral-700 mb-1">Forma de Pagamento</p>
                <select
                  value={pagamento}
                  onChange={e => setPagamento(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800"
                >
                  <option value="">Selecione...</option>
                  <option value="PIX">PIX</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Crédito Loja">Crédito Loja</option>
                  <option value="Fiado">Fiado</option>
                </select>
              </div>

              {/* Endereço - só aparece para entrega */}
              {tipoEntrega === 'Entrega' && (
                <>
                  <p className="text-base font-medium text-neutral-700 mt-3">Endereço de entrega *</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-sm text-neutral-500">Logradouro</label>
                      <input value={solicitante.logradouro} onChange={e => setSolicitante({ ...solicitante, logradouro: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400" placeholder="Rua, Avenida..." />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Número</label>
                      <input value={solicitante.numero} onChange={e => setSolicitante({ ...solicitante, numero: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400" placeholder="123" />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Complemento</label>
                      <input value={solicitante.complemento} onChange={e => setSolicitante({ ...solicitante, complemento: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400" placeholder="Apto, Bloco..." />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Bairro</label>
                      <input value={solicitante.bairro} onChange={e => setSolicitante({ ...solicitante, bairro: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400" placeholder="Bairro" />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">CEP</label>
                      <div className="relative">
                        <input value={solicitante.cep} onChange={e => setSolicitante({ ...solicitante, cep: e.target.value })} onBlur={handleBuscarCEP} className={`w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400 ${buscandoCEP ? 'pr-10' : ''}`} placeholder="00000-000" />
                        {buscandoCEP && <Loader2 size={18} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-neutral-400" />}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Cidade</label>
                      <input value={solicitante.cidade} onChange={e => setSolicitante({ ...solicitante, cidade: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400" placeholder="Cidade" />
                    </div>
                    <div>
                      <label className="text-sm text-neutral-500">Estado</label>
                      <input value={solicitante.estado} onChange={e => setSolicitante({ ...solicitante, estado: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-3 outline-none focus:border-neutral-800 text-base text-neutral-800 placeholder-neutral-400" placeholder="PE" maxLength={2} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <button onClick={finalizarPedido} disabled={!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || (tipoEntrega === 'Entrega' && !solicitante.logradouro.trim()) || enviando} className={`w-full py-3 rounded-xl font-semibold text-base transition-colors ${solicitante.nome.trim() && solicitante.cpfCnpj.replace(/\D/g, '') && (tipoEntrega === 'Retirada' || solicitante.logradouro.trim()) && !enviando ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}>
              {enviando ? 'Enviando...' : 'Solicitar Pedido'}
            </button>
            <p className="text-sm text-neutral-400 text-center mt-3 italic">Seu pedido será enviado para nossa equipe comercial analisar e confirmar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
