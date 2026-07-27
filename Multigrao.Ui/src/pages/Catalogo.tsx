import { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Store, Package, Plus, X, Pencil, Trash2, ShoppingCart, ShoppingBag } from 'lucide-react';
import SearchAutocomplete, { type Sugestao } from '../components/SearchAutocomplete';
import { useAuthStore } from '../store/authStore';
import { produtoService, type Produto, type Categoria, type Marca } from '../services/produtoService';
import { categoriaService } from '../services/categoriaService';
import { marcaService } from '../services/marcaService';
import { uploadService } from '../services/uploadService';
import { pedidoService } from '../services/pedidoService';
import { imageUrl } from '../utils/imageUrl';

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

type Tab = 'visualizar' | 'gerenciar';

export default function Catalogo() {
  const { role, setores } = useAuthStore();
  const podeEditar = role === 'AdminMaster' || role === 'SuperAdmin' || setores.some(s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'compras');

  const [categorias, setCategorias] = useState<CategoriaComProdutos[]>([]);
  const [todasCategorias, setTodasCategorias] = useState<Categoria[]>([]);
  const [todasMarcas, setTodasMarcas] = useState<Marca[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [categoriaAberta, setCategoriaAberta] = useState<number | null>(null);
  const [aba, setAba] = useState<Tab>('visualizar');
  const [carrinho, setCarrinho] = useState<Map<number, number>>(new Map());
  const [modalFinalizar, setModalFinalizar] = useState(false);
  const [solicitante, setSolicitante] = useState({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
  const [enviando, setEnviando] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const copiarLinkTabela = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tabela`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const carregar = async () => {
    setCarregando(true);
    const [produtos, cats, marcas] = await Promise.all([
      produtoService.getCatalogo(),
      categoriaService.getCategorias(),
      marcaService.getMarcas(),
    ]);
    setTodasCategorias(cats);
    setTodasMarcas(marcas);

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

  const toggleCategoria = (id: number) => {
    setCategoriaAberta(categoriaAberta === id ? null : id);
  };

  const produtoFiltrado = (p: Produto) => {
    if (!filtro) return true;
    const t = filtro.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(t);
  };

  const formatPreco = (v: number) =>
    `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const precoPorQtd = (produto: Produto, qtd: number) =>
    qtd >= 5 ? produto.precoAtacado : produto.precoVarejo;

  const qtdNoCarrinho = (produtoId: number) => carrinho.get(produtoId) ?? 0;

  const totalItensCarrinho = [...carrinho.values()].reduce((a, b) => a + b, 0);

  const limparCarrinho = () => setCarrinho(new Map());

  const finalizarPedido = async () => {
    if (!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || carrinho.size === 0) return;
    setEnviando(true);
    const itens = [...carrinho.entries()].map(([produtoId, quantidade]) => {
      const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
      return {
        produtoId,
        quantidade,
        precoUnitario: produto ? precoPorQtd(produto, quantidade) : 0,
        pesoUnitario: 0,
      };
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
    setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' });
    limparCarrinho();
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Catálogo de Produtos</h1>
          <p className="text-gray-500 mt-1">Confira nossos produtos e monte seu pedido.</p>
        </div>
        <div className="flex items-center gap-2">
          {podeEditar && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setAba('visualizar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aba === 'visualizar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Visualizar
              </button>
              <button
                onClick={() => setAba('gerenciar')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${aba === 'gerenciar' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Gerenciar
              </button>
            </div>
          )}
          <button
            onClick={copiarLinkTabela}
            className="px-4 py-2 rounded-xl text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {copiado ? 'Link copiado!' : 'Compartilhar Tabela de Preços'}
          </button>
        </div>
      </div>

      {aba === 'visualizar' ? (
        <>
          <SearchAutocomplete
            placeholder="Pesquisar produto..."
            valor={filtro}
            onChange={setFiltro}
            sugestoes={categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).map(p => ({ rotulo: p.nome, subRotulo: p.categoria?.nome }))}
            aoSelecionar={(s) => { setFiltro(s.rotulo); }}
            className="mb-6"
          />

          {carregando ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando catálogo...</div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
              {categorias.map(({ categoria, grupos }) => {
                const gruposFiltrados = grupos
                  .map(g => ({ ...g, produtos: g.produtos.filter(produtoFiltrado) }))
                  .filter(g => g.produtos.length > 0);

                if (gruposFiltrados.length === 0) return null;

                const totalProdutos = gruposFiltrados.reduce((a, g) => a + g.produtos.length, 0);
                const aberta = categoriaAberta === categoria.id;

                return (
                  <div key={categoria.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleCategoria(categoria.id)}
                      className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Package size={20} className="text-gray-400" />
                        <div className="text-left">
                          <h2 className="text-lg font-bold text-gray-900">{categoria.nome}</h2>
                          <p className="text-xs text-gray-400">{totalProdutos} {totalProdutos === 1 ? 'produto' : 'produtos'}</p>
                        </div>
                      </div>
                      {aberta ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                    </button>

                    {aberta && (
                      <div className="border-t border-gray-100 px-6 py-4 space-y-6">
                        {gruposFiltrados.map((grupo, gi) => (
                          <div key={gi}>
                            {grupo.marca && (
                              <div className="flex items-center justify-center rounded-xl px-4 py-2 mb-3" style={{ backgroundColor: grupo.marca.cor || '#f3f4f6' }}>
                    {grupo.marca.imagemUrl || grupo.marca.imagemContentType ? (
                      <img src={marcaImagemUrl(grupo.marca)} alt={grupo.marca.nome} className="h-12 object-contain" />
                    ) : (
                                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color: grupo.marca.cor ? '#fff' : '#6b7280' }}>{grupo.marca.nome}</span>
                                )}
                              </div>
                            )}
                            {!grupo.marca && (
                              <div className="flex items-center gap-2 mb-3">
                                <Store size={16} className="text-gray-400" />
                                <span className="font-bold text-sm text-gray-500 uppercase tracking-wider">Diversos</span>
                              </div>
                            )}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-gray-100 text-[11px] text-gray-400 uppercase tracking-wider">
                                    <th className="text-left py-2 pr-4 font-medium">Produto</th>
                                    <th className="text-center py-2 px-2 font-medium w-16">Embalagem</th>
                                    <th className="text-center py-2 px-2 font-medium w-16">Und.</th>
                                    <th className="text-right py-2 pl-4 font-medium w-24">Varejo</th>
                                    <th className="text-right py-2 pl-4 font-medium w-24">Atacado</th>
                                    <th className="text-center py-2 pl-4 font-medium w-16">Qtd</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {grupo.produtos.map(p => {
                                    const qtd = qtdNoCarrinho(p.id);
                                    const isAtacado = qtd >= 5;
                                    return (
                                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                      <td className="py-2.5 pr-4">
                                        <div className="flex items-center gap-2">
                                           {p.imagemUrl && <img src={imageUrl(p.imagemUrl)} alt="" className="h-8 w-8 rounded-lg object-cover" />}
                                          <span className="font-medium text-gray-900">{p.nome}</span>
                                        </div>
                                      </td>
                                      <td className="text-center py-2.5 px-2 text-gray-500">{p.embalagem ?? '—'}</td>
                                      <td className="text-center py-2.5 px-2 text-gray-500">{p.unidadeVenda ?? '—'}</td>
                                      <td className="text-right py-2.5 pl-4">
                                        <span className={`font-semibold ${isAtacado ? 'text-gray-400 line-through text-xs' : 'text-gray-900'}`}>{formatPreco(p.precoVarejo)}</span>
                                      </td>
                                      <td className="text-right py-2.5 pl-4">
                                        <span className={`font-semibold ${isAtacado ? 'text-emerald-700' : 'text-gray-400'}`}>{formatPreco(p.precoAtacado)}</span>
                                        {isAtacado && <span className="block text-[10px] text-emerald-600 font-medium">Atacado</span>}
                                      </td>
                                      <td className="text-center py-2.5 pl-4">
                                        <span className="text-sm text-gray-400">—</span>
                                      </td>
                                    </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {categorias.length === 0 && (
                <div className="text-center py-16 text-gray-400 text-sm">Nenhum produto cadastrado no catálogo.</div>
              )}
            </div>
          )}
        </>
      ) : (
        <GerenciarCatalogo
          produtos={categorias.flatMap(c => c.grupos.flatMap(g => g.produtos))}
          categorias={todasCategorias}
          marcas={todasMarcas}
          onSalvo={carregar}
        />
      )}

      {totalItensCarrinho > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center justify-between z-30 rounded-t-2xl -mx-4">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} className="text-gray-700" />
            <span className="text-sm font-medium text-gray-700">{totalItensCarrinho} {totalItensCarrinho === 1 ? 'item' : 'itens'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={limparCarrinho} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">Limpar</button>
            <button onClick={() => setModalFinalizar(true)} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors">
              <ShoppingBag size={16} /> Finalizar Pedido
            </button>
          </div>
        </div>
      )}

      {modalFinalizar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setModalFinalizar(false); setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }); }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Finalizar Pedido</h2>
              <button onClick={() => { setModalFinalizar(false); setSolicitante({ nome: '', telefone: '', cpfCnpj: '', cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', estado: '' }); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 text-sm">
                {[...carrinho.entries()].map(([produtoId, quantidade]) => {
                  const produto = categorias.flatMap(c => c.grupos.flatMap(g => g.produtos)).find(p => p.id === produtoId);
                  if (!produto) return null;
                  const preco = precoPorQtd(produto, quantidade);
                  return (
                    <div key={produtoId} className="flex justify-between">
                      <span className="text-gray-700">{produto.nome} <span className="text-gray-400">x{quantidade}</span></span>
                      <div className="text-right">
                        <span className="font-medium text-gray-900">{formatPreco(preco * quantidade)}</span>
                        <span className="block text-[10px] text-gray-400">{formatPreco(preco)}/{produto.unidadeVenda ?? 'und'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-sm font-medium text-gray-700">Nome completo *</label>
                  <input value={solicitante.nome} onChange={e => setSolicitante({ ...solicitante, nome: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Seu nome" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">CPF / CNPJ *</label>
                  <input value={solicitante.cpfCnpj} onChange={e => setSolicitante({ ...solicitante, cpfCnpj: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Telefone</label>
                  <input value={solicitante.telefone} onChange={e => setSolicitante({ ...solicitante, telefone: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="(81) 99999-9999" />
                </div>
              </div>

              <p className="text-sm font-medium text-gray-700">Endereço de entrega *</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Logradouro</label>
                  <input value={solicitante.logradouro} onChange={e => setSolicitante({ ...solicitante, logradouro: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Rua, Avenida..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Número</label>
                  <input value={solicitante.numero} onChange={e => setSolicitante({ ...solicitante, numero: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="123" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Complemento</label>
                  <input value={solicitante.complemento} onChange={e => setSolicitante({ ...solicitante, complemento: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Apto, Bloco..." />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Bairro</label>
                  <input value={solicitante.bairro} onChange={e => setSolicitante({ ...solicitante, bairro: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Bairro" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">CEP</label>
                  <input value={solicitante.cep} onChange={e => setSolicitante({ ...solicitante, cep: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="00000-000" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Cidade</label>
                  <input value={solicitante.cidade} onChange={e => setSolicitante({ ...solicitante, cidade: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Cidade" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Estado</label>
                  <input value={solicitante.estado} onChange={e => setSolicitante({ ...solicitante, estado: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="PE" maxLength={2} />
                </div>
              </div>
            </div>
            <button onClick={finalizarPedido} disabled={!solicitante.nome.trim() || !solicitante.cpfCnpj.replace(/\D/g, '') || enviando} className={`w-full py-2.5 rounded-xl font-medium text-sm transition-colors ${solicitante.nome.trim() && solicitante.cpfCnpj.replace(/\D/g, '') && !enviando ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {enviando ? 'Enviando...' : 'Solicitar Pedido'}
            </button>
            <p className="text-[11px] text-gray-400 text-center mt-3">Seu pedido será enviado para nossa equipe comercial analisar e confirmar.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function GerenciarCatalogo({
  produtos, categorias, marcas, onSalvo,
}: {
  produtos: Produto[];
  categorias: Categoria[];
  marcas: Marca[];
  onSalvo: () => void;
}) {
  const [abaGerenciar, setAbaGerenciar] = useState<'produtos' | 'categorias' | 'marcas'>('produtos');
  const [editandoProduto, setEditandoProduto] = useState<Partial<Produto> | null>(null);
  const [editandoMarca, setEditandoMarca] = useState<Partial<Marca> | null>(null);
  const [filtroProdutos, setFiltroProdutos] = useState('');

  const produtosFiltrados = produtos.filter(p => {
    if (!filtroProdutos) return true;
    const t = filtroProdutos.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(t);
  });

  const sugestoesProdutos: Sugestao[] = produtos.map(p => ({
    rotulo: p.nome,
    subRotulo: p.categoria?.nome,
  }));

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-1 mb-4 self-start">
        {(['produtos', 'categorias', 'marcas'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setAbaGerenciar(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${abaGerenciar === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'produtos' ? 'Produtos' : tab === 'categorias' ? 'Categorias' : 'Marcas'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {abaGerenciar === 'produtos' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <SearchAutocomplete
                placeholder="Buscar produto..."
                valor={filtroProdutos}
                onChange={setFiltroProdutos}
                sugestoes={sugestoesProdutos}
                aoSelecionar={s => setFiltroProdutos(s.rotulo)}
                className="flex-1"
              />
              <button onClick={() => setEditandoProduto({ nome: '', ativo: true })} className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shrink-0">
                <Plus size={16} /> Novo
              </button>
            </div>
            {produtosFiltrados.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Nenhum produto encontrado.</p>
            ) : (
              produtosFiltrados.map(p => (
                <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                  <div>
                    <span className={`font-medium ${p.ativo ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{p.nome}</span>
                    <span className="text-xs text-gray-400 ml-2">{p.categoria?.nome} / {p.marca?.nome ?? 'Diversos'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditandoProduto(p)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={async () => { if (confirm(`Excluir "${p.nome}"?`)) { await produtoService.deletarProduto(p.id); onSalvo(); } }} className="p-2 text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {abaGerenciar === 'categorias' && (
          <CategoriasList categorias={categorias} onSalvo={onSalvo} />
        )}

        {abaGerenciar === 'marcas' && (
          <div className="space-y-2">
            <button onClick={() => setEditandoMarca({ nome: '', imagemUrl: '' })} className="flex items-center gap-2 text-sm font-medium text-black hover:underline mb-2">
              <Plus size={16} /> Nova Marca
            </button>
            {marcas.map(m => (
              <div key={m.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {m.imagemUrl || m.imagemContentType ? <img src={marcaImagemUrl(m)} alt={m.nome} className="h-8 object-contain" /> : <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{m.nome.charAt(0)}</div>}
                  <span className="font-medium text-gray-900">{m.nome}</span>
                </div>
                <button onClick={() => setEditandoMarca(m)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Pencil size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {editandoProduto && <ProdutoForm produto={editandoProduto} categorias={categorias} marcas={marcas} onClose={() => setEditandoProduto(null)} onSalvo={onSalvo} />}
      {editandoMarca && <MarcaForm marca={editandoMarca} onClose={() => setEditandoMarca(null)} onSalvo={onSalvo} />}
    </div>
  );
}

function ProdutoForm({ produto, categorias, marcas, onClose, onSalvo }: {
  produto: Partial<Produto>;
  categorias: Categoria[];
  marcas: Marca[];
  onClose: () => void;
  onSalvo: () => void;
}) {
  const [form, setForm] = useState({ ...produto });
  const [erro, setErro] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const validarENumero = (v: any): v is number => typeof v === 'number' && !isNaN(v);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadService.uploadImagem(file);
    if (url) setForm({ ...form, imagemUrl: url });
    setUploading(false);
  };

  const salvar = async () => {
    setErro('');
    const precoV = validarENumero(form.precoVarejo) ? form.precoVarejo : 0;
    const precoA = validarENumero(form.precoAtacado) ? form.precoAtacado : 0;
    if (!form.nome?.trim()) return;
    if (precoV === 0 && precoA === 0) {
      setErro('Informe pelo menos um preço (Varejo ou Atacado).');
      return;
    }
    const dto = {
      nome: form.nome.trim(),
      pesoUnidade: validarENumero(form.pesoUnidade) ? form.pesoUnidade : 0,
      codigoERP: form.codigoERP ?? '',
      categoriaId: form.categoriaId ?? null,
      marcaId: form.marcaId ?? null,
      precoVarejo: precoV,
      precoAtacado: precoA,
      embalagem: form.embalagem || null,
      unidadeVenda: form.unidadeVenda || null,
      imagemUrl: form.imagemUrl || null,
      ativo: form.ativo ?? true,
    };
    if (form.id) {
      await produtoService.atualizarProduto(form.id, dto);
    } else {
      await produtoService.criarProduto(dto);
    }
    onSalvo();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-gray-900">{form.id ? 'Editar' : 'Novo'} Produto</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome *</label>
            <input value={form.nome ?? ''} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Categoria</label>
              <select value={form.categoriaId ?? ''} onChange={e => setForm({ ...form, categoriaId: e.target.value ? parseInt(e.target.value) : null })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5">
                <option value="">Sem categoria</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Marca</label>
              <select value={form.marcaId ?? ''} onChange={e => setForm({ ...form, marcaId: e.target.value ? parseInt(e.target.value) : null })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5">
                <option value="">Sem marca</option>
                {marcas.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Preço Varejo</label>
                <input type="number" step={0.01} value={form.precoVarejo ?? ''} onChange={e => { const val = e.target.value; setForm({ ...form, precoVarejo: val === '' ? undefined : parseFloat(val) }); }} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Preço Atacado</label>
                <input type="number" step={0.01} value={form.precoAtacado ?? ''} onChange={e => { const val = e.target.value; setForm({ ...form, precoAtacado: val === '' ? undefined : parseFloat(val) }); }} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
              </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Embalagem</label>
              <input value={form.embalagem ?? ''} onChange={e => setForm({ ...form, embalagem: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" placeholder="Ex: 12· DZ" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Unid. Venda</label>
              <select value={form.unidadeVenda ?? ''} onChange={e => setForm({ ...form, unidadeVenda: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5">
                <option value="">Selecione...</option>
                <option value="UND">UND</option>
                <option value="KG">KG</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Peso Unidade (kg)</label>
              <input type="number" step={0.01} value={form.pesoUnidade ?? 0} onChange={e => setForm({ ...form, pesoUnidade: parseFloat(e.target.value) || 0 })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Código ERP</label>
              <input value={form.codigoERP ?? ''} onChange={e => setForm({ ...form, codigoERP: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Imagem do Produto</label>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
            <div onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-black transition-colors text-sm text-gray-500 mt-0.5">
              {uploading ? 'Enviando...' : 'Clique para selecionar JPG ou PNG'}
            </div>
            {form.imagemUrl && <img src={imageUrl(form.imagemUrl)} alt="Preview" className="h-16 mt-2 object-contain border rounded-lg" />}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.ativo ?? true} onChange={e => setForm({ ...form, ativo: e.target.checked })} className="rounded" />
            Produto ativo no catálogo
          </label>
        </div>
        {erro && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2.5">{erro}</p>}
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
          <button onClick={salvar} disabled={!form.nome?.trim() || (form.precoVarejo == null && form.precoAtacado == null)} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${form.nome?.trim() && (form.precoVarejo != null || form.precoAtacado != null) ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {form.id ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoriasList({ categorias, onSalvo }: {
  categorias: Categoria[];
  onSalvo: () => void;
}) {
  const [editando, setEditando] = useState<{ [id: number]: string }>({});
  const [nova, setNova] = useState('');
  const [salvando, setSalvando] = useState<number | 'nova' | null>(null);

  const salvarExistente = async (c: Categoria) => {
    setSalvando(c.id);
    await categoriaService.atualizarCategoria(c.id, { nome: editando[c.id] ?? c.nome, ordem: c.ordem });
    setEditando(prev => { const next = { ...prev }; delete next[c.id]; return next; });
    setSalvando(null);
    onSalvo();
  };

  const criarNova = async () => {
    if (!nova.trim()) return;
    setSalvando('nova');
    await categoriaService.criarCategoria({ nome: nova.trim(), ordem: 0 });
    setNova('');
    setSalvando(null);
    onSalvo();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <input
          value={nova}
          onChange={e => setNova(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') criarNova(); }}
          placeholder="Nova categoria..."
          className="flex-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm"
        />
        <button onClick={criarNova} disabled={!nova.trim() || salvando === 'nova'} className="px-4 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed">
          {salvando === 'nova' ? '...' : 'Adicionar'}
        </button>
      </div>
      {categorias.map(c => (
        <div key={c.id} className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-2">
          {editando[c.id] !== undefined ? (
            <>
              <input
                value={editando[c.id]}
                onChange={e => setEditando({ ...editando, [c.id]: e.target.value })}
                onKeyDown={e => { if (e.key === 'Enter') salvarExistente(c); if (e.key === 'Escape') setEditando(prev => { const next = { ...prev }; delete next[c.id]; return next; }); }}
                className="flex-1 border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm"
                autoFocus
              />
              <button onClick={() => salvarExistente(c)} disabled={salvando === c.id} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                {salvando === c.id ? <span className="text-xs">...</span> : <span className="text-sm font-medium">Salvar</span>}
              </button>
              <button onClick={() => setEditando(prev => { const next = { ...prev }; delete next[c.id]; return next; })} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={16} />
              </button>
            </>
          ) : (
            <>
              <span className="flex-1 font-medium text-gray-900">{c.nome}</span>
              <span className="text-xs text-gray-400 mr-2">ordem {c.ordem}</span>
              <button onClick={() => setEditando({ ...editando, [c.id]: c.nome })} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Pencil size={16} />
              </button>
            </>
          )}
        </div>
      ))}
      {categorias.length === 0 && <p className="text-sm text-gray-400 text-center py-8">Nenhuma categoria cadastrada.</p>}
    </div>
  );
}

function MarcaForm({ marca, onClose, onSalvo }: {
  marca: Partial<Marca>;
  onClose: () => void;
  onSalvo: () => void;
}) {
  const [form, setForm] = useState({ ...marca });
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pendingFileRef = useRef<File | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pendingFileRef.current = file;
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
  };

  const salvando = async () => {
    const dto = { nome: form.nome ?? '', cor: form.cor || null };
    let marcaId = form.id;

    if (marcaId) {
      await marcaService.atualizarMarca(marcaId, dto);
    } else {
      const criada = await marcaService.criarMarca(dto);
      if (criada) marcaId = criada.id;
    }

    if (marcaId && pendingFileRef.current) {
      setUploading(true);
      await marcaService.uploadImagem(marcaId, pendingFileRef.current);
      setUploading(false);
    }

    onSalvo();
    onClose();
  };

  const hasImagem = previewUrl || (marca.id && marca.imagemContentType);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-gray-900">{form.id ? 'Editar' : 'Nova'} Marca</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-gray-700">Nome *</label>
            <input value={form.nome ?? ''} onChange={e => setForm({ ...form, nome: e.target.value })} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm mt-0.5" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Cor da Marca</label>
            <div className="flex items-center gap-2 mt-0.5">
              <input type="color" value={form.cor || '#000000'} onChange={e => setForm({ ...form, cor: e.target.value })} className="h-10 w-10 rounded border border-gray-300 cursor-pointer" />
              <input value={form.cor || ''} onChange={e => setForm({ ...form, cor: e.target.value })} className="flex-1 border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black text-sm" placeholder="#000000" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Logo da Marca</label>
            <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleFile} className="hidden" />
            <div onClick={() => fileRef.current?.click()} className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-black transition-colors text-sm text-gray-500 mt-0.5">
              {uploading ? 'Enviando...' : 'Clique para selecionar JPG ou PNG'}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 italic">A logo deve conter o nome da marca. O nome da marca não será exibido como texto.</p>
            {previewUrl && <img src={previewUrl} alt="Preview" className="h-12 mt-2 object-contain border rounded-lg" />}
            {!previewUrl && marca.id && marca.imagemContentType && <img src={marcaService.getImagemUrl(marca.id)} alt="Preview" className="h-12 mt-2 object-contain border rounded-lg" />}
          </div>
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
          <button onClick={salvando} disabled={!form.nome?.trim() || uploading} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${form.nome?.trim() && !uploading ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {uploading ? 'Salvando...' : form.id ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  );
}
