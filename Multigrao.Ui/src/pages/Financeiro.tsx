import { useState, useEffect } from 'react';
import { ShieldCheck, Search, RotateCcw, Unlock, X, Loader2 } from 'lucide-react';
import { pedidoService, type Pedido } from '../services/pedidoService';

export default function Financeiro() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [liberando, setLiberando] = useState<number | null>(null);
  const [detalhe, setDetalhe] = useState<Pedido | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const todos = await pedidoService.getPedidos();
    const bloqueados = todos.filter(p => p.status === 'BloqueadoFinanceiro');
    setPedidos(bloqueados);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const liberar = async (id: number) => {
    setLiberando(id);
    const ok = await pedidoService.liberarPedido(id);
    if (ok) {
      setPedidos(prev => prev.filter(p => p.id !== id));
      setDetalhe(null);
    }
    setLiberando(null);
  };

  const filtrados = pedidos.filter(p => {
    const termo = busca.toLowerCase();
    return (
      String(p.id).includes(termo) ||
      p.cliente?.razaoSocialNome?.toLowerCase().includes(termo) ||
      p.solicitanteNome?.toLowerCase().includes(termo) ||
      p.cliente?.cpfCnpj?.includes(busca)
    );
  });

  const totalValor = filtrados.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <ShieldCheck size={20} /> Controle Financeiro
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {pedidos.length} pedido{pedidos.length !== 1 ? 's' : ''} aguardando liberação
          </p>
        </div>
        <button onClick={carregar} className="text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
          <RotateCcw size={14} /> Atualizar
        </button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por #pedido, cliente, CPF/CNPJ..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all"
          />
        </div>
      </div>

      {filtrados.length > 0 && (
        <div className="flex gap-4 mb-4 text-xs">
          <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium text-gray-700">{filtrados.length} pedido{filtrados.length !== 1 ? 's' : ''}</span>
          <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg font-medium">R$ {totalValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {carregando ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando...</div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShieldCheck size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhum pedido bloqueado</p>
            <p className="text-xs mt-1">Pedidos de clientes bloqueados aparecerão aqui</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Solicitante</th>
                <th className="px-4 py-3 font-semibold">Data</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map(p => (
                <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">#{p.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{p.cliente?.razaoSocialNome ?? 'Sem cliente vinculado'}</div>
                    {p.cliente?.cpfCnpj && <div className="text-xs text-gray-400">{p.cliente.cpfCnpj}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.solicitanteNome || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(p.dataCriacao).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3">R$ {(p.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDetalhe(p)} className="text-gray-700 hover:underline text-xs font-medium">Ver</button>
                      <button
                        onClick={() => liberar(p.id)}
                        disabled={liberando === p.id}
                        className="flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        {liberando === p.id ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
                        Liberar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detalhe && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDetalhe(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Pedido #{detalhe.id}</h2>
              <button onClick={() => setDetalhe(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
                <p className="mt-0.5">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    Bloqueado Financeiro
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Cliente</span>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.cliente?.razaoSocialNome ?? 'Sem cliente vinculado'}</p>
                {detalhe.cliente?.cpfCnpj && <p className="text-xs text-gray-500 mt-0.5">{detalhe.cliente.cpfCnpj}</p>}
              </div>
              {detalhe.solicitanteNome && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Solicitante</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.solicitanteNome}</p>
                  {detalhe.solicitanteTelefone && <p className="text-xs text-gray-500 mt-0.5">Tel: {detalhe.solicitanteTelefone}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Valor</span>
                  <p className="text-gray-900 font-medium mt-0.5">R$ {(detalhe.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Tipo</span>
                  <p className="text-gray-900 font-medium mt-0.5">{detalhe.tipoEntrega}</p>
                </div>
              </div>
              {detalhe.itens && detalhe.itens.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Itens ({detalhe.itens.length})</span>
                  <div className="mt-2 space-y-1">
                    {detalhe.itens.map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.produto?.nome ?? `Produto #${item.id}`}</span>
                        <span className="text-gray-500">{item.quantidade}x R$ {item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setDetalhe(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Fechar</button>
              <button
                onClick={() => liberar(detalhe.id)}
                disabled={liberando === detalhe.id}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl font-medium transition-colors text-sm disabled:opacity-50"
              >
                {liberando === detalhe.id ? <Loader2 size={14} className="animate-spin" /> : <Unlock size={14} />}
                Liberar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
