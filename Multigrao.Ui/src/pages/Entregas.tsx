import { useState, useEffect } from 'react';
import { MapPin, CheckCircle2, AlertTriangle, ArrowLeft, Phone, ChevronRight, Truck, Navigation, Package, Play, Eye } from 'lucide-react';
import { entregaService, type Entrega } from '../services/entregaService';
import { useAuthStore } from '../store/authStore';

type TelaAtiva = 'lista' | 'conferir' | 'detalhes-entrega';

export default function Entregas() {
  const usuarioId = useAuthStore(state => state.usuarioId);
  const [telaAtiva, setTelaAtiva] = useState<TelaAtiva>('lista');
  const [entregaSelecionada, setEntregaSelecionada] = useState<Entrega | null>(null);
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    const dados = await entregaService.getEntregas(usuarioId ?? undefined);
    setEntregas(dados);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const pendentes = entregas.filter(e => e.status === 'PendenteConferencia' || e.status === 'EmConferencia');
  const emRota = entregas.filter(e => e.status === 'EmRota');
  const concluidas = entregas.filter(e => e.status === 'Entregue' || e.status === 'Devolvido');
  const progresso = entregas.length > 0 ? (concluidas.length / entregas.length) * 100 : 0;

  const iniciarEntrega = async (entrega: Entrega) => {
    await entregaService.registrarAcao(entrega.id, { acao: 'EmRota' });
    await carregar();
    setTelaAtiva('lista');
  };

  const registrarEntrega = async (id: number, acao: 'Entregue' | 'Devolvido') => {
    await entregaService.registrarAcao(id, { acao });
    setTelaAtiva('lista');
    setEntregaSelecionada(null);
    await carregar();
  };

  const abrirConferencia = (entrega: Entrega) => {
    setEntregaSelecionada(entrega);
    setTelaAtiva('conferir');
  };

  const abrirDetalhes = (entrega: Entrega) => {
    setEntregaSelecionada(entrega);
    setTelaAtiva('detalhes-entrega');
  };

  const getEndereco = (entrega: Entrega) => {
    const c = entrega.pedido?.cliente;
    if (!c) return 'Endereço não informado';
    return `${c.logradouro ?? ''}, ${c.numero ?? ''}`.trim().replace(/^,\s*/, '') || c.bairro || 'Endereço não informado';
  };

  const getBairro = (entrega: Entrega) => entrega.pedido?.cliente?.bairro ?? '';

  const pesoTotal = (entrega: Entrega) => entrega.pedido?.pesoTotal ?? 0;

  if (telaAtiva === 'lista') {
    return (
      <div className="flex flex-col h-full bg-[#111111] -mx-4 sm:mx-0 -my-2 sm:my-0 text-white rounded-[2rem] sm:rounded-none overflow-hidden relative">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 p-6 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-serif font-bold tracking-wide">Minhas Entregas</h1>
              <p className="text-sm text-gray-500 font-medium mt-1">Rota do Dia</p>
            </div>
            <div className="bg-white/5 rounded-xl px-4 py-2 text-center border border-white/5">
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Restam</p>
              <p className="text-xl font-bold text-gray-500">{pendentes.length + emRota.length}</p>
            </div>
          </div>
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-gray-800 to-gray-600 rounded-full transition-all duration-700" style={{ width: `${progresso}%` }} />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-500 font-medium">
            <span>{concluidas.length} entregues</span>
            <span>{entregas.length} total</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          {carregando ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando entregas...</div>
          ) : entregas.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhuma entrega encontrada</div>
          ) : (
            <>
              {/* Em rota */}
              {emRota.length > 0 && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1 pt-2">Em Rota</div>
                  {emRota.map(entrega => (
                    <div
                      key={entrega.id}
                      onClick={() => abrirDetalhes(entrega)}
                      className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-5 cursor-pointer active:scale-[0.98] hover:border-white/20 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-white/10 text-white text-xs font-bold tracking-wider px-3 py-1.5 rounded-lg border border-white/10">
                          OS #{entrega.id}
                        </span>
                        <span className="text-white flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-lg">
                          <Navigation size={12} /> Em Rota
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1">
                        {entrega.pedido?.cliente?.razaoSocialNome ?? 'Cliente'}
                      </h3>
                      <div className="flex items-start gap-2 text-gray-400 text-sm mt-2">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
                        <p className="leading-snug">{getEndereco(entrega)}, {getBairro(entrega)}</p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Package size={12} /> {entrega.pedido?.itens?.length ?? 0} itens</span>
                          {pesoTotal(entrega) > 0 && <span>{pesoTotal(entrega)} kg</span>}
                        </div>
                        <div className="text-gray-500 font-semibold text-sm flex items-center gap-1">
                          Detalhes <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Pendentes de conferência */}
              {pendentes.length > 0 && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1 pt-2">Aguardando Conferência</div>
                  {pendentes.map(entrega => (
                    <div
                      key={entrega.id}
                      className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5 transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="bg-white/5 text-gray-400 text-xs font-bold tracking-wider px-3 py-1.5 rounded-lg border border-white/5">
                          OS #{entrega.id}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white leading-tight mb-1">
                        {entrega.pedido?.cliente?.razaoSocialNome ?? 'Cliente'}
                      </h3>
                      <div className="flex items-start gap-2 text-gray-400 text-sm mt-2">
                        <MapPin size={16} className="mt-0.5 shrink-0 text-gray-500" />
                        <p className="leading-snug">{getEndereco(entrega)}, {getBairro(entrega)}</p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-white/5">
                        <span className="flex items-center gap-1"><Package size={12} /> {entrega.pedido?.itens?.length ?? 0} itens</span>
                        {pesoTotal(entrega) > 0 && <span>{pesoTotal(entrega)} kg</span>}
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={(e) => { e.stopPropagation(); abrirConferencia(entrega); }}
                          className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
                        >
                          <Eye size={16} /> CONFERIR
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); iniciarEntrega(entrega); }}
                          className="flex-1 bg-white text-black py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-black/20"
                        >
                          <Play size={16} /> COMEÇAR ENTREGA
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* Concluídas */}
              {concluidas.length > 0 && (
                <>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 px-1 pt-2">Concluídas</div>
                  {concluidas.map(entrega => (
                    <div key={entrega.id} className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-4 opacity-50">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 size={18} className={entrega.status === 'Entregue' ? 'text-white' : 'text-gray-500'} />
                          <div>
                            <span className="font-semibold text-white text-sm">OS #{entrega.id}</span>
                            <span className="text-gray-500 text-sm ml-2">{entrega.pedido?.cliente?.razaoSocialNome ?? 'Cliente'}</span>
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{entrega.status === 'Entregue' ? 'Entregue' : 'Devolvido'}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (telaAtiva === 'conferir' && entregaSelecionada) {
    return (
      <div className="flex flex-col h-full bg-[#111111] -mx-4 sm:mx-0 -my-2 sm:my-0 text-white rounded-[2rem] sm:rounded-none overflow-hidden">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 p-5 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setTelaAtiva('lista')} className="p-2.5 rounded-xl bg-white/5 active:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-serif font-bold tracking-wide">Conferir Entrega</h1>
            <p className="text-xs text-gray-400">Pedido #{entregaSelecionada.pedido?.id ?? entregaSelecionada.pedidoId}</p>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar space-y-4">
          {/* Resumo do pedido */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Dados da Entrega</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Cliente</span>
                <span className="text-white font-semibold">{entregaSelecionada.pedido?.cliente?.razaoSocialNome ?? '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Endereço</span>
                <span className="text-white text-right max-w-[60%]">{getEndereco(entregaSelecionada)}, {getBairro(entregaSelecionada)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Telefone</span>
                <span className="text-white">{entregaSelecionada.pedido?.cliente?.telefone ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Itens */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Itens ({entregaSelecionada.pedido?.itens?.length ?? 0})</h3>
            <div className="space-y-2">
              {entregaSelecionada.pedido?.itens?.map(item => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-sm text-white">{item.produto?.nome ?? `Item #${item.id}`}</span>
                  <span className="text-sm text-gray-400 font-medium">{item.quantidade} kg</span>
                </div>
              ))}
            </div>
          </div>

          {/* Peso e valor */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Peso Total</span>
              <span className="text-white font-bold">{pesoTotal(entregaSelecionada)} kg</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Valor Total</span>
              <span className="text-white font-bold">R$ {(entregaSelecionada.pedido?.valorTotal ?? 0).toLocaleString('pt-BR')}</span>
            </div>
          </div>

          {/* Rota */}
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-3">Rota</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Truck size={16} className="text-gray-500" />
                <span>{entregaSelecionada.rota?.veiculo?.modelo ?? '—'} — {entregaSelecionada.rota?.veiculo?.placa ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Navigation size={16} className="text-gray-500" />
                <span>Ordem {entregaSelecionada.ordem} na rota</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => { iniciarEntrega(entregaSelecionada); }}
              className="w-full bg-white text-black p-5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-black/20"
            >
              <span className="font-bold tracking-wide text-lg">COMEÇAR ENTREGA</span>
              <div className="bg-black/10 p-2 rounded-xl">
                <Play size={24} className="text-black" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (telaAtiva === 'detalhes-entrega' && entregaSelecionada) {
    return (
      <div className="flex flex-col h-full bg-[#111111] -mx-4 sm:mx-0 -my-2 sm:my-0 text-white rounded-[2rem] sm:rounded-none overflow-hidden">
        <div className="bg-[#1a1a1a]/80 backdrop-blur-xl border-b border-white/5 p-5 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setTelaAtiva('lista')} className="p-2.5 rounded-xl bg-white/5 active:bg-white/10 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-serif font-bold tracking-wide">Detalhes da Entrega</h1>
            <p className="text-xs text-gray-400">Pedido #{entregaSelecionada.pedido?.id ?? entregaSelecionada.pedidoId}</p>
          </div>
        </div>

        <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
          <div className="bg-[#1a1a1a] rounded-2xl border border-white/5 p-6 mb-5 text-center">
            <div className="w-16 h-16 bg-white/5 border border-white/10 text-white rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Truck size={32} />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white mb-2">
              {entregaSelecionada.pedido?.cliente?.razaoSocialNome ?? 'Cliente'}
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-2">
              <MapPin size={14} className="text-gray-500" />
              <span>{getEndereco(entregaSelecionada)}, {getBairro(entregaSelecionada)}</span>
            </div>
            <p className="text-sm text-gray-500">
              {entregaSelecionada.pedido?.itens?.length ?? 0} itens — {pesoTotal(entregaSelecionada)} kg — R$ {(entregaSelecionada.pedido?.valorTotal ?? 0).toLocaleString('pt-BR')}
            </p>

            <div className="mt-6 space-y-3">
              <button className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium flex items-center justify-center gap-3 text-gray-300 hover:bg-white/10 transition-colors">
                <Phone size={18} className="text-gray-500" />
                LIGAR PARA O CLIENTE
              </button>
              <button className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-medium flex items-center justify-center gap-3 text-gray-300 hover:bg-white/10 transition-colors">
                <Navigation size={18} className="text-gray-500" />
                ABRIR NO MAPA
              </button>
            </div>
          </div>

          <h3 className="font-bold text-gray-500 uppercase tracking-wider text-xs mb-4 px-1">Registrar Resultado</h3>

          <div className="space-y-3">
            <button
              onClick={() => registrarEntrega(entregaSelecionada.id, 'Entregue')}
              className="w-full bg-white text-black p-5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all shadow-lg shadow-black/20"
            >
              <span className="font-bold tracking-wide text-lg">ENTREGA CONCLUÍDA</span>
              <div className="bg-black/10 p-2 rounded-xl">
                <CheckCircle2 size={24} className="text-black" />
              </div>
            </button>

            <button
              onClick={() => registrarEntrega(entregaSelecionada.id, 'Devolvido')}
              className="w-full bg-white/5 border border-white/10 text-gray-400 p-5 rounded-2xl flex items-center justify-between active:scale-[0.98] transition-all hover:bg-white/10"
            >
              <span className="font-bold tracking-wide text-lg">HOUVE PROBLEMAS</span>
              <div className="bg-white/5 p-2 rounded-xl">
                <AlertTriangle size={24} className="text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
