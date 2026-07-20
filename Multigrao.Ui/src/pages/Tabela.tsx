import { useState, useEffect } from 'react';
import { Plus, X, Minus, ShoppingCart, ShoppingBag, MapPin, Phone, Mail } from 'lucide-react';
import SearchAutocomplete, { type Sugestao } from '../components/SearchAutocomplete';
import { produtoService, type Produto, type Categoria, type Marca } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';
import { pedidoService } from '../services/pedidoService';
import { imageUrl } from '../utils/imageUrl';

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
  const [enviando, setEnviando] = useState(false);
  const [pedidoCriado, setPedidoCriado] = useState(false);

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
      tipoEntrega: 'Entrega',
      desconto: 0,
      acrescimo: 0,
      itens,
    });
    setEnviando(false);
    setModalFinalizar(false);
    setPedidoCriado(true);
    setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
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
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc0IiBudW1PY3RhdmVzPSI0Ii8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2YpIiBvcGFjaXR5PSIwLjA0Ii8+PC9zdmc+')] opacity-40 pointer-events-none" />

        <div className="relative z-10 px-4 py-12 md:py-20 flex flex-col items-center text-center">
          <img
            src="/multigraos-logo.png"
            alt="Multigrãos"
            className="w-56 md:w-72 h-auto object-contain mb-6 brightness-110"
          />
          <h1 className="font-heading text-3xl md:text-4xl text-amber-50 tracking-wide">
            Tabela de Preços
          </h1>
          <p className="text-amber-200/70 text-sm mt-2 italic font-light">
            Confira nossos produtos e monte seu pedido
          </p>
          <p className="text-amber-300/40 text-[11px] mt-1 italic">
            Preços sujeitos a alteração sem aviso prévio
          </p>

          {/* Info minimalista */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-5 text-xs text-amber-100/60 font-light">
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-amber-300/50" />
              Centro — Paulista — PE
            </span>
            <a
              href="https://wa.me/5581988593757"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-amber-100/60 hover:text-amber-200 transition-colors"
            >
              <Phone size={12} className="text-amber-300/50" />
              (81) 98859-3757
            </a>
            <a
              href="mailto:distribuidoramultigraos@gmail.com"
              className="flex items-center gap-1.5 text-amber-100/60 hover:text-amber-200 transition-colors"
            >
              <Mail size={12} className="text-amber-300/50" />
              distribuidoramultigraos@gmail.com
            </a>
          </div>
        </div>
      </div>

      {/* ── Conteúdo branco ── */}
      <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
        {/* Avisos */}
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 mb-6 text-xs text-amber-700/70 space-y-1 font-light">
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
                className="px-3 py-1.5 bg-amber-50 border border-amber-200/60 rounded-full text-xs text-amber-700 hover:bg-amber-100 hover:border-amber-300 transition-colors font-medium"
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
                    <div className="h-7 w-1 bg-amber-600 rounded-full" />
                    <h2 className="font-heading text-lg font-bold text-neutral-800 tracking-wide">{categoria.nome}</h2>
                    <span className="text-xs text-neutral-400 italic">{totalProdutos} {totalProdutos === 1 ? 'item' : 'itens'}</span>
                  </div>

                  <div className="space-y-4">
                    {grupos.map((grupo, gi) => (
                      <div key={gi} className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
                        {grupo.marca && (
                          <div className="flex items-center justify-center px-5 py-3 border-b border-neutral-100" style={{ backgroundColor: grupo.marca.cor || '#f5f5f5' }}>
                            {grupo.marca.imagemUrl ? (
                              <img src={imageUrl(grupo.marca.imagemUrl)} alt={grupo.marca.nome} className="h-14 object-contain" />
                            ) : (
                              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: grupo.marca.cor ? '#fff' : '#6b7280' }}>{grupo.marca.nome}</span>
                            )}
                          </div>
                        )}
                        {!grupo.marca && (
                          <div className="flex items-center gap-2 px-5 py-3 bg-neutral-50 border-b border-neutral-100">
                            <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Diversos</span>
                            <span className="text-xs text-neutral-400 italic ml-auto">{grupo.produtos.length} {grupo.produtos.length === 1 ? 'produto' : 'produtos'}</span>
                          </div>
                        )}

                        <div className="divide-y divide-neutral-100">
                          {grupo.produtos.map(p => {
                            const qtd = qtdNoCarrinho(p.id);
                            const isAtacado = qtd >= 5;
                            return (
                              <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-neutral-50 transition-colors">
                                {p.imagemUrl && (
                                  <img src={imageUrl(p.imagemUrl)} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0 ring-1 ring-neutral-200" />
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-neutral-800 leading-tight">{p.nome}</p>
                                  <p className="text-[11px] text-neutral-400 italic mt-0.5">
                                    {p.embalagem && `${p.embalagem} `}
                                    {p.unidadeVenda && `· ${p.unidadeVenda}`}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  {isAtacado ? (
                                    <>
                                      <p className="text-xs text-neutral-400 line-through">{formatPreco(p.precoVarejo)}</p>
                                      <p className="text-sm font-bold text-emerald-600">{formatPreco(p.precoAtacado)}</p>
                                      <p className="text-[10px] text-emerald-500 font-medium italic">Atacado</p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-sm font-bold text-neutral-800">{formatPreco(p.precoVarejo)}</p>
                                      <p className="text-[11px] text-neutral-400 italic">{formatPreco(p.precoAtacado)} no atacado</p>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                  <button onClick={() => removeDoCarrinho(p.id)} className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors text-neutral-500">
                                    <Minus size={14} />
                                  </button>
                                  <span className="w-7 text-center text-sm font-semibold tabular-nums text-neutral-800">{qtd}</span>
                                  <button onClick={() => addAoCarrinho(p.id)} className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 transition-colors text-white">
                                    <Plus size={14} />
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
          <div className="max-w-5xl mx-auto pointer-events-auto">
            <div className="bg-white/95 backdrop-blur-md border border-neutral-200 rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.1)] px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-600 flex items-center justify-center">
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
                <button onClick={() => setModalFinalizar(true)} className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-500 transition-colors shadow-sm">
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
          <div className="max-w-5xl mx-auto pointer-events-auto">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 flex items-center gap-3 shadow-md">
              <div className="h-9 w-9 rounded-full bg-emerald-200 flex items-center justify-center">
                <ShoppingBag size={18} className="text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-emerald-700">Pedido enviado! Nossa equipe comercial entrará em contato em breve.</p>
            </div>
          </div>
        </div>
      )}

      {/* Modal finalizar */}
      {modalFinalizar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={() => { setModalFinalizar(false); setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }); }}>
          <div className="bg-white rounded-2xl border border-neutral-200 w-full max-w-md p-6 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-lg font-bold text-neutral-800">Finalizar Pedido</h2>
              <button onClick={() => { setModalFinalizar(false); setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }); }} className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"><X size={20} className="text-neutral-400" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-neutral-50 rounded-xl p-3 max-h-44 overflow-y-auto space-y-2 text-sm border border-neutral-100">
                {[...carrinho.entries()].map(([produtoId, quantidade]) => {
                  const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
                  if (!produto) return null;
                  const preco = precoPorQtd(produto, quantidade);
                  return (
                    <div key={produtoId} className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-medium text-neutral-800 truncate">{produto.nome}</p>
                        <p className="text-[11px] text-neutral-400 italic">qtd: {quantidade} x {formatPreco(preco)}</p>
                      </div>
                      <span className="font-semibold text-neutral-700 shrink-0">{formatPreco(preco * quantidade)}</span>
                    </div>
                  );
                })}
                <div className="border-t border-neutral-200 pt-2 flex justify-between font-bold text-neutral-800">
                  <span>Total</span>
                  <span>{formatPreco([...carrinho.entries()].reduce((acc, [id, qtd]) => {
                    const p = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(x => x.id === id);
                    return acc + (p ? precoPorQtd(p, qtd) * qtd : 0);
                  }, 0))}</span>
                </div>
              </div>

              {/* Dados do solicitante */}
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-neutral-700">Nome completo *</label>
                  <input value={solicitante.nome} onChange={e => setSolicitante({ ...solicitante, nome: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400 mt-0.5" placeholder="Seu nome" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">CPF / CNPJ *</label>
                  <input value={solicitante.cpfCnpj} onChange={e => setSolicitante({ ...solicitante, cpfCnpj: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400 mt-0.5" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-sm font-medium text-neutral-700">Telefone</label>
                  <input value={solicitante.telefone} onChange={e => setSolicitante({ ...solicitante, telefone: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400 mt-0.5" placeholder="(81) 99999-9999" />
                </div>
              </div>

              {/* Endereço */}
              <p className="text-sm font-medium text-neutral-700 mt-2">Endereço de entrega *</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-xs text-neutral-500">Logradouro</label>
                  <input value={solicitante.logradouro} onChange={e => setSolicitante({ ...solicitante, logradouro: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400" placeholder="Rua, Avenida..." />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Número</label>
                  <input value={solicitante.numero} onChange={e => setSolicitante({ ...solicitante, numero: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400" placeholder="123" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Complemento</label>
                  <input value={solicitante.complemento} onChange={e => setSolicitante({ ...solicitante, complemento: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400" placeholder="Apto, Bloco..." />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Bairro</label>
                  <input value={solicitante.bairro} onChange={e => setSolicitante({ ...solicitante, bairro: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400" placeholder="Bairro" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">CEP</label>
                  <input value={solicitante.cep} onChange={e => setSolicitante({ ...solicitante, cep: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400" placeholder="00000-000" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Cidade</label>
                  <input value={solicitante.cidade} onChange={e => setSolicitante({ ...solicitante, cidade: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400" placeholder="Cidade" />
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Estado</label>
                  <input value={solicitante.estado} onChange={e => setSolicitante({ ...solicitante, estado: e.target.value })} className="w-full bg-white border border-neutral-200 rounded-lg p-2.5 outline-none focus:border-amber-500 text-sm text-neutral-800 placeholder-neutral-400" placeholder="PE" maxLength={2} />
                </div>
              </div>
            </div>
            <button onClick={finalizarPedido} disabled={!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || enviando} className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors ${solicitante.nome.trim() && solicitante.cpfCnpj.replace(/\D/g, '') && !enviando ? 'bg-amber-600 text-white hover:bg-amber-500' : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'}`}>
              {enviando ? 'Enviando...' : 'Solicitar Pedido'}
            </button>
            <p className="text-[11px] text-neutral-400 text-center mt-3 italic">Seu pedido será enviado para nossa equipe comercial analisar e confirmar.</p>
          </div>
        </div>
      )}
    </div>
  );
}
