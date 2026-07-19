import { useState, useEffect } from 'react';
import { PackageCheck, QrCode, Camera, CheckCircle2, ArrowLeft, Search, Package } from 'lucide-react';
import { conferenciaService, type EntregaConferencia } from '../services/conferenciaService';

interface ItemConferencia {
  id: number;
  nome: string;
  quantidade: number;
  conferido: boolean;
}

export default function Conferencia() {
  const [telaAtiva, setTelaAtiva] = useState<'lista' | 'conferencia' | 'leitura-qr' | 'resultado'>('lista');
  const [pedidoSelecionado, setPedidoSelecionado] = useState<EntregaConferencia | null>(null);
  const [itensConferencia, setItensConferencia] = useState<ItemConferencia[]>([]);
  const [entregas, setEntregas] = useState<EntregaConferencia[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    const dados = await conferenciaService.getEntregasPendentes();
    setEntregas(dados);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const iniciarConferencia = async (entrega: EntregaConferencia) => {
    await conferenciaService.iniciarConferencia(entrega.id);
    setPedidoSelecionado(entrega);
    setItensConferencia(
      (entrega.pedido?.itens ?? []).map(it => ({
        id: it.id,
        nome: it.produto?.nome ?? `Item #${it.id}`,
        quantidade: it.quantidade,
        conferido: false,
      }))
    );
    setTelaAtiva('conferencia');
    await carregar();
  };

  const toggleItemConferencia = (itemId: number) => {
    setItensConferencia(itens =>
      itens.map(i => i.id === itemId ? { ...i, conferido: !i.conferido } : i)
    );
  };

  const finalizarConferencia = async () => {
    if (pedidoSelecionado) {
      await conferenciaService.concluirConferencia(pedidoSelecionado.id);
    }
    setTelaAtiva('lista');
    setPedidoSelecionado(null);
    await carregar();
  };

  const voltarParaLista = () => {
    setTelaAtiva('lista');
    setPedidoSelecionado(null);
  };

  const aguardando = entregas.filter(e => e.status === 'PendenteConferencia');
  const emConferencia = entregas.filter(e => e.status === 'EmConferencia');

  if (telaAtiva === 'lista') {
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
              <PackageCheck size={28} /> Conferência
            </h1>
            <p className="text-gray-500 mt-1">Bipagem e verificação de notas antes da expedição.</p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar pedido..."
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100/50 flex items-center gap-4">
            <div className="p-3 bg-gray-100 text-gray-700 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">Aguardando</p>
              <h3 className="text-2xl font-serif font-bold text-gray-900">{aguardando.length}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100/50 flex items-center gap-4">
            <div className="p-3 bg-gray-50 text-gray-700 rounded-xl">
              <QrCode size={24} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">Em Conferência</p>
              <h3 className="text-2xl font-serif font-bold text-gray-900">{emConferencia.length}</h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100/50 flex items-center gap-4">
            <div className="p-3 bg-gray-100 text-black rounded-xl">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">Conferidos Hoje</p>
              <h3 className="text-2xl font-serif font-bold text-gray-900">0</h3>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-800">Pedidos para Conferência</h2>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-auto">
            {carregando ? (
              <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando...</div>
            ) : (
              <table className="w-full text-left text-sm text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50/80 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 font-semibold">Pedido</th>
                    <th className="px-6 py-3 font-semibold">Cliente</th>
                    <th className="px-6 py-3 font-semibold">Itens</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 font-semibold text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.map(entrega => (
                    <tr key={entrega.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">#{entrega.pedido?.id ?? entrega.pedidoId}</td>
                      <td className="px-6 py-4">{entrega.pedido?.cliente?.razaoSocialNome ?? '—'}</td>
                      <td className="px-6 py-4">{entrega.pedido?.itens?.length ?? 0} itens</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={entrega.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {entrega.status === 'PendenteConferencia' && (
                          <button
                            onClick={() => iniciarConferencia(entrega)}
                            className="bg-black text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5 ml-auto shadow-sm"
                          >
                            <QrCode size={14} /> Iniciar Conferência
                          </button>
                        )}
                        {entrega.status === 'EmConferencia' && (
                          <button
                            onClick={() => iniciarConferencia(entrega)}
                            className="bg-gray-500 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-800 transition-colors flex items-center gap-1.5 ml-auto shadow-sm"
                          >
                            <PackageCheck size={14} /> Continuar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {entregas.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-12 text-gray-400 text-sm">Nenhuma entrega para conferir</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (telaAtiva === 'conferencia' && pedidoSelecionado) {
    const totalItens = itensConferencia.length;
    const itensConferidos = itensConferencia.filter(i => i.conferido).length;
    const progresso = totalItens > 0 ? (itensConferidos / totalItens) * 100 : 0;

    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center gap-4">
          <button onClick={voltarParaLista} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-serif font-bold text-gray-900">
              Conferência Pedido #{pedidoSelecionado.pedido?.id ?? pedidoSelecionado.pedidoId}
            </h1>
            <p className="text-gray-500 mt-1">{pedidoSelecionado.pedido?.cliente?.razaoSocialNome ?? '—'} - {itensConferencia.length} itens</p>
          </div>
          <button
            onClick={() => setTelaAtiva('leitura-qr')}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm"
          >
            <QrCode size={18} /> Bipar Nota Fiscal
          </button>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-600">Progresso da Conferência</span>
            <span className="text-sm font-bold text-black">{itensConferidos}/{totalItens} itens</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-800 to-gray-600 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
          </div>
        </div>

        <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">Itens do Pedido</h2>
            <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">Clique para conferir</span>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {itensConferencia.map(item => (
              <div
                key={item.id}
                onClick={() => toggleItemConferencia(item.id)}
                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                  item.conferido
                    ? 'bg-gray-100/80 ring-1 ring-gray-300'
                    : 'bg-gray-50 hover:bg-gray-100 ring-1 ring-gray-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                  item.conferido
                    ? 'bg-black text-white shadow-sm shadow-black/30'
                    : 'border-2 border-gray-300 bg-white'
                }`}>
                  {item.conferido && <CheckCircle2 size={16} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <span className={`font-medium ${item.conferido ? 'text-gray-800 line-through opacity-70' : 'text-gray-800'}`}>
                    {item.nome}
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${item.conferido ? 'text-black' : 'text-gray-500'}`}>
                    {item.quantidade} un
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={finalizarConferencia}
          disabled={itensConferidos < totalItens}
          className={`w-full py-4 rounded-2xl text-sm font-bold tracking-wide transition-all ${
            itensConferidos >= totalItens
              ? 'bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
        >
          {itensConferidos >= totalItens
            ? 'FINALIZAR CONFERÊNCIA E LIBERAR PARA EXPEDIÇÃO'
            : `Conferir todos os itens (${itensConferidos}/${totalItens})`
          }
        </button>
      </div>
    );
  }

  if (telaAtiva === 'leitura-qr') {
    return (
      <div className="flex flex-col h-full bg-[#111111] -mx-8 -my-2 sm:m-0 text-white rounded-[2rem] sm:rounded-none overflow-hidden relative">
        <div className="absolute top-6 left-6 z-20">
          <button onClick={() => setTelaAtiva('conferencia')} className="p-3 bg-white/10 rounded-full backdrop-blur-md active:bg-white/20 transition-colors">
            <ArrowLeft size={24} />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Camera size={48} className="text-gray-500 mb-6" />
          <h2 className="text-2xl font-bold mb-2 tracking-wide">Bipar Nota Fiscal</h2>
          <p className="text-gray-400 mb-10 max-w-[280px] leading-relaxed">
            Aponte a câmera para o QR Code da nota do Pedido #{pedidoSelecionado?.pedido?.id ?? pedidoSelecionado?.pedidoId}
          </p>
          <div className="w-64 h-64 border-2 border-black/50 border-dashed rounded-3xl relative mb-12 flex items-center justify-center bg-black/5 shadow-[0_0_50px_rgba(150,150,150,0.1)]">
            <QrCode size={64} className="text-black/20" />
            <div className="absolute top-0 w-full h-1 bg-gray-600 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_15px_#555]"></div>
          </div>
          <button onClick={() => setTelaAtiva('resultado')} className="w-full max-w-[320px] bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-all shadow-lg shadow-black/30 tracking-wide">
            SIMULAR LEITURA
          </button>
        </div>
      </div>
    );
  }

  if (telaAtiva === 'resultado') {
    return (
      <div className="flex flex-col h-full bg-[#111111] -mx-8 -my-2 sm:m-0 text-white rounded-[2rem] sm:rounded-none overflow-hidden">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 p-5 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setTelaAtiva('conferencia')} className="p-2.5 rounded-full bg-white/5 active:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-bold tracking-wide">Nota Fiscal Conferida</h1>
        </div>
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/50">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Nota Fiscal Bipada com Sucesso!</h2>
          <p className="text-gray-400 mb-8 max-w-sm">
            Pedido #{pedidoSelecionado?.pedido?.id ?? pedidoSelecionado?.pedidoId} foi verificado e está apto para expedição.
          </p>
          <button onClick={() => setTelaAtiva('conferencia')} className="w-full max-w-[320px] bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold text-lg py-4 rounded-2xl active:scale-[0.98] transition-all shadow-lg shadow-black/30 tracking-wide">
            VOLTAR À CONFERÊNCIA
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    'PendenteConferencia': 'bg-gray-100 text-gray-700 ring-gray-500/20',
    'EmConferencia': 'bg-gray-50 text-gray-700 ring-gray-500/20',
    'Conferido': 'bg-gray-100 text-gray-800 ring-black/20',
  };

  const labels: Record<string, string> = {
    'PendenteConferencia': 'Aguardando',
    'EmConferencia': 'Em Conferência',
    'Conferido': 'Conferido',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ${styles[status] || 'bg-gray-50 text-gray-700 ring-gray-500/20'}`}>
      {labels[status] || status}
    </span>
  );
}
