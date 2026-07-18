import { useState } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, ArrowLeft, Phone, ChevronRight, Truck, Navigation, Package } from 'lucide-react';

interface Entrega {
  id: number;
  pedidoId: number;
  cliente: string;
  endereco: string;
  bairro: string;
  valor: number;
  status: 'Pendente' | 'Entregue' | 'Devolvido';
  horaEstimada: string;
  itens: number;
}

export default function Entregas() {
  const [telaAtiva, setTelaAtiva] = useState<'lista' | 'detalhes-entrega'>('lista');
  const [entregaSelecionada, setEntregaSelecionada] = useState<Entrega | null>(null);

  const [entregas, setEntregas] = useState<Entrega[]>([
    { id: 1, pedidoId: 1003, cliente: 'Supermercado Nova Era', endereco: 'Rua Setúbal, 120', bairro: 'Boa Viagem', valor: 2500, status: 'Pendente', horaEstimada: '09:30', itens: 5 },
    { id: 2, pedidoId: 1004, cliente: 'Armazém Fit', endereco: 'Av. Boa Viagem, 300', bairro: 'Pina', valor: 800, status: 'Pendente', horaEstimada: '10:15', itens: 3 },
    { id: 3, pedidoId: 1005, cliente: 'Padaria Tradição', endereco: 'Rua da Aurora, 45', bairro: 'Boa Vista', valor: 1200, status: 'Entregue', horaEstimada: '11:00', itens: 8 },
  ]);

  const entregasPendentes = entregas.filter(e => e.status === 'Pendente').length;
  const entregasConcluidas = entregas.filter(e => e.status === 'Entregue' || e.status === 'Devolvido').length;
  const progresso = entregas.length > 0 ? (entregasConcluidas / entregas.length) * 100 : 0;

  const registrarEntrega = (id: number, acao: 'Entregue' | 'Devolvido') => {
    setEntregas(entregas.map(e => e.id === id ? { ...e, status: acao } : e));
    setTelaAtiva('lista');
    setEntregaSelecionada(null);
  };

  const abrirDetalhes = (entrega: Entrega) => {
    setEntregaSelecionada(entrega);
    setTelaAtiva('detalhes-entrega');
  };

  // -----------------------------------------------------
  // TELA 1: LISTA DE ENTREGAS DO MOTORISTA
  // -----------------------------------------------------
  if (telaAtiva === 'lista') {
    return (
      <div className="flex flex-col h-full bg-[#111111] -mx-8 -my-2 sm:m-0 text-white rounded-[2rem] sm:rounded-none overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 p-6 sticky top-0 z-10 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-wide">Minhas Entregas</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Rota do Dia</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/5 rounded-xl px-4 py-2 text-center border border-white/5">
                <p className="text-xs text-gray-500 font-medium">Restam</p>
                <p className="text-xl font-bold text-gray-500">{entregasPendentes}</p>
              </div>
            </div>
          </div>
          {/* Barra de Progresso */}
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-800 to-gray-600 rounded-full transition-all duration-700" style={{ width: `${progresso}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
            <span>{entregasConcluidas} entregues</span>
            <span>{entregas.length} total</span>
          </div>
        </div>

        {/* Lista de Entregas */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {entregas.map((entrega) => (
            <div
              key={entrega.id}
              onClick={() => entrega.status === 'Pendente' ? abrirDetalhes(entrega) : null}
              className={`bg-[#1a1a1a] rounded-[1.5rem] shadow-sm border p-5 relative active:scale-[0.98] transition-all ${
                entrega.status === 'Entregue'
                  ? 'border-black/30 opacity-60'
                  : entrega.status === 'Devolvido'
                    ? 'border-red-500/30 opacity-60'
                    : 'border-white/5 cursor-pointer hover:border-black/50 hover:shadow-black/5'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className="bg-white/5 text-gray-300 text-xs font-bold tracking-wider px-3 py-1.5 rounded-lg border border-white/5">
                  OS #{entrega.id}
                </span>
                {entrega.status === 'Pendente' && (
                  <span className="text-blue-400 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-blue-500/10 px-3 py-1.5 rounded-lg">
                    <Navigation size={12} /> Próxima
                  </span>
                )}
                {entrega.status === 'Entregue' && (
                  <span className="text-black flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-black/10 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 size={14} /> Concluída
                  </span>
                )}
                {entrega.status === 'Devolvido' && (
                  <span className="text-red-400 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-red-500/10 px-3 py-1.5 rounded-lg">
                    <AlertTriangle size={14} /> Problema
                  </span>
                )}
              </div>

              <h3 className="text-lg font-bold text-white leading-tight mb-1">{entrega.cliente}</h3>

              <div className="flex items-start gap-2 text-gray-400 text-sm mt-3">
                <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
                <p className="leading-snug">{entrega.endereco}, {entrega.bairro}</p>
              </div>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><Package size={12} /> {entrega.itens} itens</span>
                  <span>Est. {entrega.horaEstimada}</span>
                </div>
                {entrega.status === 'Pendente' && (
                  <div className="text-gray-500 font-semibold tracking-wide text-sm flex items-center gap-1">
                    Detalhes <ChevronRight size={16} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // -----------------------------------------------------
  // TELA 2: DETALHES E CONFIRMAÇÃO DE ENTREGA
  // -----------------------------------------------------
  if (telaAtiva === 'detalhes-entrega' && entregaSelecionada) {
    return (
      <div className="flex flex-col h-full bg-[#111111] -mx-8 -my-2 sm:m-0 text-white rounded-[2rem] sm:rounded-none overflow-hidden">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 p-5 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setTelaAtiva('lista')} className="p-2.5 rounded-full bg-white/5 active:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold tracking-wide">Detalhes da Entrega</h1>
            <p className="text-xs text-gray-400">Pedido #{entregaSelecionada.pedidoId}</p>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {/* Card do Cliente */}
          <div className="bg-[#1a1a1a] rounded-[1.5rem] shadow-sm border border-white/5 p-6 mb-6 text-center relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-black/20 blur-[50px] rounded-full pointer-events-none"></div>

            <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-black/50 relative z-10">
              <Truck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 relative z-10">{entregaSelecionada.cliente}</h2>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2 relative z-10">
              <MapPin size={14} className="text-gray-500" />
              <span>{entregaSelecionada.endereco}, {entregaSelecionada.bairro}</span>
            </div>
            <p className="text-sm text-gray-500 relative z-10">{entregaSelecionada.itens} itens - R$ {entregaSelecionada.valor.toLocaleString('pt-BR')}</p>

            <div className="mt-6 space-y-3 relative z-10">
              <button className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium flex items-center justify-center gap-3 text-gray-300 hover:bg-white/10 transition-colors">
                <Phone size={18} className="text-gray-500" />
                LIGAR PARA O CLIENTE
              </button>
              <button className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium flex items-center justify-center gap-3 text-gray-300 hover:bg-white/10 transition-colors">
                <Navigation size={18} className="text-blue-400" />
                ABRIR NO MAPA
              </button>
            </div>
          </div>

          {/* Ações de Resultado */}
          <h3 className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-4 px-2">Registrar Resultado</h3>

          <div className="space-y-4">
            <button
              onClick={() => registrarEntrega(entregaSelecionada.id, 'Entregue')}
              className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white p-5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-black/20"
            >
              <span className="font-bold tracking-wide text-lg">ENTREGA CONCLUÍDA</span>
              <div className="bg-white/20 p-2 rounded-xl">
                <CheckCircle2 size={24} className="text-white" />
              </div>
            </button>

            <button
              onClick={() => registrarEntrega(entregaSelecionada.id, 'Devolvido')}
              className="w-full bg-white/5 border border-red-500/30 text-red-400 p-5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all hover:bg-red-500/10"
            >
              <span className="font-bold tracking-wide text-lg">HOUVE PROBLEMAS</span>
              <div className="bg-red-500/10 p-2 rounded-xl">
                <AlertTriangle size={24} className="text-red-400" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
