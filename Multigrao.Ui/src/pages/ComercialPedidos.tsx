import { useState, useRef, useEffect } from 'react';
import { Plus, X, Upload, FileCheck, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { pedidoService, type Pedido } from '../services/pedidoService';
import { clienteService, type Cliente } from '../services/clienteService';
import { produtoService, type Produto } from '../services/produtoService';
import { useUiStore } from '../store/uiStore';
import SearchAutocomplete, { type Sugestao } from '../components/SearchAutocomplete';

const STATUS_LABELS: Record<string, string> = {
  Pendente: 'Pendente',
  EmProducao: 'Em Produção',
  EmSeparacao: 'Em Separação',
  ProntoEntrega: 'Pronto p/ Entrega',
  ProntoRetirada: 'Pronto p/ Retirada',
  EmEntrega: 'Em Entrega',
  Entregue: 'Entregue',
  Devolvido: 'Devolvido',
};

interface ItemForm {
  produtoId: number;
  produto: Produto;
  quantidade: number;
  precoUnitario: number;
}

export default function ComercialPedidos() {
  const { setModalAberto } = useUiStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState('');

  const [novoPedido, setNovoPedido] = useState({ clienteId: '', valor: '', tipoEntrega: 'Entrega', desconto: '', acrescimo: '' });
  const [itensPedido, setItensPedido] = useState<ItemForm[]>([]);
  const [davFile, setDavFile] = useState<File | null>(null);
  const davInputRef = useRef<HTMLInputElement>(null);
  const [detalhe, setDetalhe] = useState<Pedido | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const [p, c, pr] = await Promise.all([
      pedidoService.getPedidos(),
      clienteService.getClientes(),
      produtoService.getProdutos(),
    ]);
    setPedidos(p);
    setClientes(c);
    setProdutos(pr);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const handleDavUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      alert('Somente arquivos PDF são aceitos para DAV.');
      return;
    }
    setDavFile(file);
  };

  const adicionarItem = () => {
    if (produtos.length === 0) return;
    const primeiro = produtos[0];
    setItensPedido([...itensPedido, { produtoId: primeiro.id, produto: primeiro, quantidade: 1, precoUnitario: 0 }]);
  };

  const atualizarItem = (index: number, campo: keyof ItemForm, valor: number) => {
    const atualizados = [...itensPedido];
    if (campo === 'produtoId') {
      const produto = produtos.find(p => p.id === valor);
      if (produto) {
        atualizados[index] = { ...atualizados[index], produtoId: valor, produto, quantidade: 1, precoUnitario: 0 };
      }
    } else {
      (atualizados[index] as any)[campo] = valor;
    }
    setItensPedido(atualizados);
  };

  const removerItem = (index: number) => {
    setItensPedido(itensPedido.filter((_, i) => i !== index));
  };

  const pesoTotalItens = itensPedido.reduce((acc, item) => acc + item.produto.pesoUnidade * item.quantidade, 0);

  const criarPedido = async () => {
    if (!novoPedido.clienteId || !novoPedido.valor.trim() || itensPedido.length === 0) return;
    const clienteId = parseInt(novoPedido.clienteId);
    const valor = parseFloat(novoPedido.valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const desconto = parseFloat(novoPedido.desconto.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    const acrescimo = parseFloat(novoPedido.acrescimo.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
    await pedidoService.criarPedido({
      clienteId,
      valorTotal: valor,
      pesoTotal: pesoTotalItens,
      tipoEntrega: novoPedido.tipoEntrega,
      desconto,
      acrescimo,
      itens: itensPedido.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade, precoUnitario: i.precoUnitario, pesoUnitario: i.produto.pesoUnidade })),
    });
    setNovoPedido({ clienteId: '', valor: '', tipoEntrega: 'Entrega', desconto: '', acrescimo: '' });
    setItensPedido([]);
    setDavFile(null);
    setIsModalOpen(false);
    setModalAberto(false);
    await carregar();
  };

  const resetModal = () => {
    setNovoPedido({ clienteId: '', valor: '', tipoEntrega: 'Entrega', desconto: '', acrescimo: '' });
    setItensPedido([]);
    setDavFile(null);
    setIsModalOpen(false);
    setModalAberto(false);
  };

  const sugestoes: Sugestao[] = pedidos.map(p => ({
    rotulo: `#${p.id} - ${p.cliente?.razaoSocialNome ?? 'Sem cliente'}`,
    subRotulo: p.status,
  }));

  const pedidosFiltrados = pedidos.filter(p => {
    if (!filtro) return true;
    const termo = filtro.toLowerCase();
    return (
      String(p.id).includes(termo) ||
      p.cliente?.razaoSocialNome?.toLowerCase().includes(termo) ||
      STATUS_LABELS[p.status]?.toLowerCase().includes(termo)
    );
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/comercial" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Pedidos</h1>
          <p className="text-gray-500 mt-1">Gestão de pedidos e DAVs do setor comercial.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <SearchAutocomplete placeholder="Buscar pedido..." valor={filtro} onChange={setFiltro} sugestoes={sugestoes} aoSelecionar={(s) => { setFiltro(s.rotulo); }} />
          <button
            onClick={() => { setIsModalOpen(true); setModalAberto(true); }}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20"
          >
            <Plus size={18} /> Novo Pedido
          </button>
        </div>

        <div className="flex-1 overflow-x-auto">
          {carregando ? (
            <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando pedidos...</div>
          ) : (
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID</th>
                  <th className="px-6 py-3 font-semibold">Cliente</th>
                  <th className="px-6 py-3 font-semibold">Valor</th>
                  <th className="px-6 py-3 font-semibold">Itens</th>
                  <th className="px-6 py-3 font-semibold">Peso</th>
                  <th className="px-6 py-3 font-semibold">Tipo</th>
                  <th className="px-6 py-3 font-semibold">Data</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosFiltrados.map(pedido => (
                  <tr key={pedido.id} onDoubleClick={() => { setDetalhe(pedido); setModalAberto(true); }} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4 font-medium text-gray-900">#{pedido.id}</td>
                    <td className="px-6 py-4">{pedido.cliente?.razaoSocialNome ?? '—'}</td>
                    <td className="px-6 py-4">R$ {pedido.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4">{pedido.itens?.length ?? 0} itens</td>
                    <td className="px-6 py-4">{pedido.pesoTotal.toFixed(2)} kg</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${pedido.tipoEntrega === 'Retirada' ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300' : 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'}`}>
                        {pedido.tipoEntrega === 'Retirada' ? 'Retirada' : 'Entrega'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{new Date(pedido.dataCriacao).toLocaleDateString('pt-BR')}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-black ring-1 ring-black/20">
                        {STATUS_LABELS[pedido.status] ?? pedido.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => { setDetalhe(pedido); setModalAberto(true); }} className="text-gray-700 hover:underline">Ver</button>
                    </td>
                  </tr>
                ))}
                {pedidosFiltrados.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Nenhum pedido encontrado</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Novo Pedido</h2>
              <button onClick={resetModal} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 mb-6 text-sm">Preencha os dados do pedido e selecione os produtos.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                <select
                  value={novoPedido.clienteId}
                  onChange={e => setNovoPedido({ ...novoPedido, clienteId: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                >
                  <option value="">Selecione o cliente...</option>
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.razaoSocialNome}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Entrega</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNovoPedido({ ...novoPedido, tipoEntrega: 'Entrega' })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${novoPedido.tipoEntrega === 'Entrega' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                  >
                    Entrega
                  </button>
                  <button
                    type="button"
                    onClick={() => setNovoPedido({ ...novoPedido, tipoEntrega: 'Retirada' })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${novoPedido.tipoEntrega === 'Retirada' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'}`}
                  >
                    Retirada
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Total (R$) *</label>
                  <input
                    type="text"
                    value={novoPedido.valor}
                    onChange={e => setNovoPedido({ ...novoPedido, valor: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Desconto (R$)</label>
                  <input
                    type="text"
                    value={novoPedido.desconto}
                    onChange={e => setNovoPedido({ ...novoPedido, desconto: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                    placeholder="0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acréscimo (R$)</label>
                  <input
                    type="text"
                    value={novoPedido.acrescimo}
                    onChange={e => setNovoPedido({ ...novoPedido, acrescimo: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Produtos *</label>
                  <button
                    type="button"
                    onClick={adicionarItem}
                    className="text-xs text-black font-medium hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} /> Adicionar produto
                  </button>
                </div>
                {itensPedido.length === 0 && (
                  <p className="text-xs text-gray-400 py-2">Nenhum produto adicionado. Clique em "Adicionar produto".</p>
                )}
                <div className="space-y-2">
                  {itensPedido.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end border border-gray-200 rounded-lg p-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider">Produto</label>
                        <select
                          value={item.produtoId}
                          onChange={e => atualizarItem(index, 'produtoId', parseInt(e.target.value))}
                          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-0.5"
                        >
                          {produtos.map(p => (
                            <option key={p.id} value={p.id}>{p.nome} ({p.pesoUnidade} kg)</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-24">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider">Qtd</label>
                        <input
                          type="number"
                          min={0.1}
                          step={0.1}
                          value={item.quantidade}
                          onChange={e => atualizarItem(index, 'quantidade', parseFloat(e.target.value) || 0)}
                          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-0.5"
                        />
                      </div>
                      <div className="w-28">
                        <label className="text-[10px] text-gray-400 uppercase tracking-wider">Preço unit.</label>
                        <input
                          type="text"
                          value={item.precoUnitario === 0 ? '' : item.precoUnitario.toFixed(2)}
                          onChange={e => {
                            const val = parseFloat(e.target.value.replace(',', '.')) || 0;
                            atualizarItem(index, 'precoUnitario', val);
                          }}
                          className="w-full border border-gray-300 rounded-lg p-2 outline-none focus:border-black text-sm mt-0.5"
                          placeholder="0,00"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removerItem(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                {itensPedido.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Peso total estimado: <strong>{pesoTotalItens.toFixed(2)} kg</strong>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arquivo DAV (PDF)</label>
                <input ref={davInputRef} type="file" accept=".pdf" className="hidden" onChange={handleDavUpload} />
                {davFile ? (
                  <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3">
                    <FileCheck size={20} className="text-emerald-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-emerald-900 truncate">{davFile.name}</p>
                      <p className="text-[11px] text-emerald-600">{(davFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button onClick={() => setDavFile(null)} className="p-1.5 hover:bg-emerald-100 rounded-lg transition-colors text-emerald-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => davInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-gray-400 cursor-pointer transition-all"
                  >
                    <Upload size={24} className="mb-2 text-gray-400" />
                    <p className="text-sm font-medium">Clique para enviar o PDF do DAV</p>
                    <p className="text-[11px] text-gray-400 mt-1">Somente arquivos .pdf</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-8">
              <button onClick={resetModal} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">
                Cancelar
              </button>
              <button
                onClick={criarPedido}
                disabled={!novoPedido.clienteId || !novoPedido.valor.trim() || itensPedido.length === 0}
                className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${
                  novoPedido.clienteId && novoPedido.valor.trim() && itensPedido.length > 0
                    ? 'bg-black text-white hover:bg-gray-800'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                Criar Pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {detalhe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setDetalhe(null); setModalAberto(false); }}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Detalhes do Pedido</h2>
              <button onClick={() => { setDetalhe(null); setModalAberto(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Pedido</span>
                <p className="text-gray-900 font-medium mt-0.5">#{detalhe.id}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
                <p className="text-gray-900 font-medium mt-0.5">{STATUS_LABELS[detalhe.status] ?? detalhe.status}</p>
              </div>
              <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Cliente</span>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.cliente?.razaoSocialNome ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Tipo</span>
                <p className="text-gray-900 font-medium mt-0.5 capitalize">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${detalhe.tipoEntrega === 'Retirada' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {detalhe.tipoEntrega}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Valor Total</span>
                <p className="text-gray-900 font-medium mt-0.5">R$ {detalhe.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              {detalhe.desconto > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Desconto</span>
                  <p className="text-red-600 font-medium mt-0.5">- R$ {detalhe.desconto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              {detalhe.acrescimo > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Acréscimo</span>
                  <p className="text-amber-600 font-medium mt-0.5">+ R$ {detalhe.acrescimo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Valor Final</span>
                <p className="text-gray-900 font-bold mt-0.5">R$ {detalhe.valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Peso Total</span>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.pesoTotal.toFixed(2)} kg</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Data</span>
                <p className="text-gray-900 font-medium mt-0.5">{new Date(detalhe.dataCriacao).toLocaleDateString('pt-BR')}</p>
              </div>
              {detalhe.itens && detalhe.itens.length > 0 && (
                <div className="col-span-2 bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Itens ({detalhe.itens.length})</span>
                  <div className="mt-2 space-y-1">
                    {detalhe.itens.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.produto?.nome ?? `Produto #${item.produtoId}`}</span>
                        <span className="text-gray-500">
                          {item.quantidade} x R$ {item.precoUnitario.toFixed(2)}
                          {item.separado && ' ✓'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {detalhe.tipoEntrega === 'Retirada' && detalhe.status === 'ProntoEntrega' && (
              <button
                onClick={async () => {
                  await pedidoService.confirmarRetirada(detalhe.id);
                  setDetalhe(null);
                  setModalAberto(false);
                  await carregar();
                }}
                className="w-full mt-4 py-2.5 rounded-xl font-medium text-sm bg-amber-600 text-white hover:bg-amber-500 transition-colors"
              >
                Confirmar Retirada
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
