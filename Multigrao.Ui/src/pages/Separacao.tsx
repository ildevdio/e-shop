import { useState } from 'react';
import { PackageOpen, Check, Play, QrCode, MapPin, Search, User, Clock } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface ItemPedido {
  id: number;
  nome: string;
  quantidade: number;
  unidade: string;
  localizacao: string;
  separado: boolean;
  separadoPor?: string;
}

interface Pedido {
  id: number;
  cliente: string;
  status: 'Pendente' | 'EmSeparacao' | 'ProntoEntrega';
  itens: ItemPedido[];
  assumidoPor?: string;
  dataAssumido?: string;
}

export default function Separacao() {
  const nome = useAuthStore(state => state.nome);

  const [pedidos, setPedidos] = useState<Pedido[]>([
    {
      id: 1001, cliente: 'Mercado São João', status: 'Pendente',
      itens: [
        { id: 1, nome: 'Castanha do Pará', quantidade: 10, unidade: 'kg', localizacao: 'Prateleira A3', separado: false },
        { id: 2, nome: 'Amendoim Torrado', quantidade: 5, unidade: 'kg', localizacao: 'Prateleira B1', separado: false },
        { id: 3, nome: 'Nozes', quantidade: 3, unidade: 'kg', localizacao: 'Prateleira A1', separado: false },
      ]
    },
    {
      id: 1002, cliente: 'Empório Natural', status: 'EmSeparacao',
      assumidoPor: 'Maria',
      dataAssumido: '09:15',
      itens: [
        { id: 4, nome: 'Aveia em Flocos', quantidade: 8, unidade: 'kg', localizacao: 'Corredor C2', separado: true, separadoPor: 'Maria' },
        { id: 5, nome: 'Semente de Chia', quantidade: 15, unidade: 'kg', localizacao: 'Prateleira D4', separado: false },
      ]
    },
    {
      id: 1003, cliente: 'Supermercado Nova Era', status: 'ProntoEntrega',
      assumidoPor: 'Carlos',
      itens: [
        { id: 6, nome: 'Nozes (500g)', quantidade: 20, unidade: 'un', localizacao: 'Prateleira A1', separado: true, separadoPor: 'Carlos' },
      ]
    },
  ]);

  const assumirPedido = (id: number) => {
    setPedidos(pedidos.map(p => p.id === id ? { ...p, status: 'EmSeparacao', assumidoPor: nome || 'Usuário', dataAssumido: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) } : p));
  };

  const toggleItem = (pedidoId: number, itemId: number) => {
    setPedidos(pedidos.map(p => {
      if (p.id === pedidoId && p.status === 'EmSeparacao') {
        const novosItens = p.itens.map(i => i.id === itemId ? { ...i, separado: !i.separado, separadoPor: !i.separado ? (nome || 'Usuário') : undefined } : i);
        return { ...p, itens: novosItens };
      }
      return p;
    }));
  };

  const concluirSeparacao = (id: number) => {
    setPedidos(pedidos.map(p => p.id === id ? { ...p, status: 'ProntoEntrega' } : p));
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <PackageOpen size={28} /> Setor de Separação
          </h1>
          <p className="text-gray-500 mt-1">Separe os itens, registre quem separou e libere para expedição.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar pedido..."               className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Coluna 1: Pendentes */}
        <div className="bg-[#f8fafc] rounded-[2rem] p-5 border border-gray-100 flex flex-col h-full shadow-sm">
          <h2 className="font-semibold text-gray-700 mb-5 flex items-center justify-between px-1">
            Aguardando Separação
            <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold">{pedidos.filter(p => p.status === 'Pendente').length}</span>
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            {pedidos.filter(p => p.status === 'Pendente').map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-100/50 hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <span className="font-bold text-gray-900">Pedido #{p.id}</span>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">{p.itens.length} itens</span>
                </div>
                <p className="text-sm text-gray-500 mb-1">{p.cliente}</p>
                <p className="text-xs text-gray-400 mb-4">{p.itens.reduce((acc, i) => acc + i.quantidade, 0)} {p.itens[0]?.unidade || 'un'} total</p>
                <button onClick={() => assumirPedido(p.id)} className="w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-semibold tracking-wide flex items-center justify-center gap-2 hover:bg-black shadow-sm transition-all">
                  <Play size={16} /> ASSUMIR PEDIDO
                </button>
              </div>
            ))}
            {pedidos.filter(p => p.status === 'Pendente').length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Nenhum pedido pendente</div>
            )}
          </div>
        </div>

        {/* Coluna 2: Em Separação */}
        <div className="bg-blue-50/50 rounded-[2rem] p-5 border border-blue-100/50 flex flex-col h-full shadow-sm">
          <h2 className="font-semibold text-blue-900 mb-5 flex items-center justify-between px-1">
            Em Separação
            <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">{pedidos.filter(p => p.status === 'EmSeparacao').length}</span>
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            {pedidos.filter(p => p.status === 'EmSeparacao').map(p => {
              const total = p.itens.length;
              const concluidos = p.itens.filter(i => i.separado).length;
              const prontoParaConcluir = total === concluidos;
              const progresso = total > 0 ? (concluidos / total) * 100 : 0;

              return (
                <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-blue-100 hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-blue-900">Pedido #{p.id}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <User size={10} /> {p.assumidoPor} • <Clock size={10} /> {p.dataAssumido}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{concluidos}/{total}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">{p.cliente}</p>

                  {/* Barra de progresso */}
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-gradient-to-r from-gray-800 to-gray-600 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
                  </div>

                  {/* Checklist */}
                  <div className="space-y-2.5 mb-5">
                    {p.itens.map(item => (
                      <div
                        key={item.id}
                        onClick={() => toggleItem(p.id, item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${item.separado ? 'bg-gray-100/50 ring-1 ring-gray-300' : 'bg-gray-50 hover:bg-gray-100'}`}
                      >
                        <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all shrink-0 ${item.separado ? 'bg-black text-white shadow-sm' : 'border border-gray-300 bg-white'}`}>
                          {item.separado && <Check size={14} strokeWidth={3} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-medium block ${item.separado ? 'text-gray-800 line-through opacity-70' : 'text-gray-700'}`}>
                            {item.nome}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400">{item.quantidade} {item.unidade}</span>
                            <span className="text-xs text-gray-300">|</span>
                            <span className="text-xs text-blue-500 flex items-center gap-0.5"><MapPin size={10} /> {item.localizacao}</span>
                          </div>
                          {item.separado && item.separadoPor && (
                            <span className="text-[10px] text-black mt-0.5 block">Separado por: {item.separadoPor}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => concluirSeparacao(p.id)}
                    disabled={!prontoParaConcluir}
                    className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all shadow-sm ${
                      prontoParaConcluir ? 'bg-black text-white hover:bg-gray-800 shadow-black/20' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {prontoParaConcluir ? 'FINALIZAR SEPARAÇÃO' : `Aguardar todos os itens (${concluidos}/${total})`}
                  </button>
                </div>
              );
            })}
            {pedidos.filter(p => p.status === 'EmSeparacao').length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Nenhum pedido em separação</div>
            )}
          </div>
        </div>

        {/* Coluna 3: Pronto para Expedição */}
        <div className="bg-gray-100/50 rounded-[2rem] p-5 border border-gray-200/50 flex flex-col h-full shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-5 flex items-center justify-between px-1">
            Pronto para Expedição
            <span className="bg-gray-200 text-gray-800 text-xs px-2.5 py-1 rounded-full font-bold">{pedidos.filter(p => p.status === 'ProntoEntrega').length}</span>
          </h2>
          <div className="space-y-4 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            {pedidos.filter(p => p.status === 'ProntoEntrega').map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm ring-1 ring-gray-200 hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3 text-black">
                  <Check size={24} strokeWidth={3} />
                </div>
                <div className="font-bold text-gray-900">Pedido #{p.id}</div>
                <p className="text-sm text-gray-500 mb-1">{p.cliente}</p>
                {p.assumidoPor && (
                  <p className="text-xs text-gray-400 mb-3">Separado por: {p.assumidoPor}</p>
                )}

                <div className="bg-gray-50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 border border-dashed border-gray-200">
                  <QrCode size={36} className="text-gray-400" />
                  <span className="text-xs text-gray-500 font-mono tracking-widest font-semibold bg-white px-2 py-1 rounded-md shadow-sm">QR-{p.id}</span>
                </div>

                <div className="mt-3 text-xs text-gray-400">
                  {p.itens.length} itens • Pronto para conferência
                </div>
              </div>
            ))}
            {pedidos.filter(p => p.status === 'ProntoEntrega').length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Nenhum pedido pronto</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
