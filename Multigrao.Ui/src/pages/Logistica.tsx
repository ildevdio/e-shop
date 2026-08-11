import { useState, useEffect } from 'react';
import { Truck, Map, Navigation, ArrowRight, Plus, Search, CheckCircle2, Trash2, ArrowUp, ArrowDown, User, Clock, Package, Filter, Calendar, RotateCcw, Pencil, X } from 'lucide-react';
import { logisticaService, type Veiculo, type Motorista, type PedidoPronto, type EntregaRota } from '../services/logisticaService';
import { useUiStore } from '../store/uiStore';

const ENTREGA_STATUS_LABELS: Record<string, string> = {
  PendenteConferencia: 'Pendente Conferência',
  EmConferencia: 'Em Conferência',
  EmRota: 'Em Rota',
  Entregue: 'Entregue',
  Devolvido: 'Devolvido',
};

const primeiroPedido = (e: EntregaRota) => e.entregaPedidos?.[0]?.pedido;
const todosItens = (e: EntregaRota) => e.entregaPedidos?.flatMap(ep => ep.pedido?.itens ?? []) ?? [];
const pedidosArray = (e: EntregaRota) => e.entregaPedidos?.map(ep => ep.pedido).filter((p): p is NonNullable<typeof p> => !!p) ?? [];
const nomeCliente = (e: EntregaRota) => primeiroPedido(e)?.cliente?.razaoSocialNome ?? 'Cliente';
const valorTotal = (e: EntregaRota) => pedidosArray(e).reduce((s, p) => s + (p.valorTotal ?? 0), 0);
const pesoTotal = (e: EntregaRota) => pedidosArray(e).reduce((s, p) => s + (p.pesoTotal ?? 0), 0);
const enderecoStr = (e: EntregaRota) => {
  const c = primeiroPedido(e)?.cliente;
  if (!c) return '';
  return `${c.logradouro ?? ''}, ${c.numero ?? ''}`.trim().replace(/^,\s*/, '') || c.bairro || '';
};
const pedidosLabel = (e: EntregaRota) => pedidosArray(e).map(p => `#${p.id}`).join(', ') || `#${e.id}`;

export default function Logistica() {
  const [activeTab, setActiveTab] = useState<'roteirizacao' | 'emEntrega' | 'consultas' | 'veiculos'>('roteirizacao');

  return (
    <div className="h-full flex flex-col gap-6 min-h-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
            <Map size={28} /> Logística e Rotas
          </h1>
          <p className="text-gray-500 mt-1">Gestão de frota e otimização de rotas de entrega.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button onClick={() => setActiveTab('roteirizacao')} className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${activeTab === 'roteirizacao' ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
          <Navigation size={18} /> Roteirização
        </button>
        <button onClick={() => setActiveTab('emEntrega')} className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${activeTab === 'emEntrega' ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
          <Truck size={18} /> Em Entrega
        </button>
        <button onClick={() => setActiveTab('consultas')} className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${activeTab === 'consultas' ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
          <Search size={18} /> Consultas
        </button>
        <button onClick={() => setActiveTab('veiculos')} className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${activeTab === 'veiculos' ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
          <Truck size={18} /> Veículos
        </button>
      </div>

      <div className="flex-1 min-h-0 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {activeTab === 'roteirizacao' && <RoteirizacaoTab />}
        {activeTab === 'emEntrega' && <EmEntregaTab />}
        {activeTab === 'consultas' && <ConsultasTab />}
        {activeTab === 'veiculos' && <VeiculosTab />}
      </div>
    </div>
  );
}

function RoteirizacaoTab() {
  const [pedidos, setPedidos] = useState<(PedidoPronto & { selecionado: boolean; ordem: number })[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [carregando, setCarregando] = useState(true);

  const [veiculoSelecionado, setVeiculoSelecionado] = useState<number | null>(null);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<number | null>(null);
  const [etapa, setEtapa] = useState<'selecionar' | 'rota'>('selecionar');
  const [rotaOtimizada, setRotaOtimizada] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const [veiculosData, motoristasData, pedidosData] = await Promise.all([
      logisticaService.getVeiculos(),
      logisticaService.getMotoristas(),
      logisticaService.getPedidosProntos(),
    ]);
    setVeiculos(veiculosData);
    setMotoristas(motoristasData);
    setPedidos(pedidosData.map(p => ({ ...p, selecionado: false, ordem: 0 })));
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const togglePedido = (id: number) => {
    setPedidos(pedidos.map(p => {
      if (p.id === id) {
        const novoSelecionado = !p.selecionado;
        return { ...p, selecionado: novoSelecionado, ordem: novoSelecionado ? pedidos.filter(pp => pp.selecionado).length + 1 : 0 };
      }
      return p;
    }));
  };

  const moverPedido = (id: number, direcao: 'up' | 'down') => {
    const selecionados = pedidos.filter(p => p.selecionado).sort((a, b) => a.ordem - b.ordem);
    const idx = selecionados.findIndex(p => p.id === id);
    if (idx === -1) return;

    const novoIdx = direcao === 'up' ? idx - 1 : idx + 1;
    if (novoIdx < 0 || novoIdx >= selecionados.length) return;

    const temp = { ...selecionados[idx] };
    selecionados[idx] = { ...selecionados[novoIdx] };
    selecionados[novoIdx] = temp;

    const novosPedidos = pedidos.map(p => {
      const idxNovo = selecionados.findIndex(s => s.id === p.id);
      if (idxNovo >= 0) return { ...p, ordem: idxNovo + 1 };
      return p;
    });
    setPedidos(novosPedidos);
  };

  const selecionados = pedidos.filter(p => p.selecionado).sort((a, b) => a.ordem - b.ordem);
  const totalPeso = selecionados.reduce((acc, p) => acc + (p.pesoTotal ?? 0), 0);

  const otimizarRota = () => {
    const ordenados = [...selecionados].sort((a, b) =>
      (a.cliente?.bairro ?? '').localeCompare(b.cliente?.bairro ?? '')
    );
    const novosPedidos = pedidos.map(p => {
      const idx = ordenados.findIndex(o => o.id === p.id);
      if (idx >= 0) return { ...p, ordem: idx + 1 };
      return p;
    });
    setPedidos(novosPedidos);
    setRotaOtimizada(true);
  };

  const finalizarRota = async () => {
    if (!veiculoSelecionado || !motoristaSelecionado || selecionados.length === 0) return;
    const result = await logisticaService.gerarRota({
      veiculoId: veiculoSelecionado,
      motoristaId: motoristaSelecionado,
      pedidosIds: selecionados.map(p => p.id),
    });
    if (result) {
      alert(`Rota #${result.rotaId} gerada com sucesso!`);
      setEtapa('selecionar');
      setRotaOtimizada(false);
      setVeiculoSelecionado(null);
      setMotoristaSelecionado(null);
      await carregar();
    }
  };

  if (carregando) {
    return <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando...</div>;
  }

  return (
    <div className="p-6 h-full min-h-0 flex flex-col">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button onClick={() => setEtapa('selecionar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${etapa === 'selecionar' ? 'bg-gray-100 text-gray-800 ring-1 ring-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'selecionar' ? 'bg-primary text-white' : 'bg-gray-300 text-white'}`}>1</span>
          Selecionar Pedidos
        </button>
        <ArrowRight size={16} className="text-gray-300" />
        <button onClick={() => etapa === 'selecionar' && selecionados.length > 0 && setEtapa('rota')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${etapa === 'rota' ? 'bg-gray-100 text-gray-800 ring-1 ring-gray-300' : 'bg-gray-100 text-gray-500'}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'rota' ? 'bg-primary text-white' : 'bg-gray-300 text-white'}`}>2</span>
          Montar Rota
        </button>
      </div>

      {etapa === 'selecionar' ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Pedidos Prontos para Expedição</h2>
            <button onClick={() => { const todosSelecionados = pedidos.every(p => p.selecionado); setPedidos(pedidos.map(p => ({ ...p, selecionado: !todosSelecionados, ordem: !todosSelecionados ? 0 : p.ordem }))); }} className="text-sm text-black font-semibold hover:text-gray-800 transition-colors">
              {pedidos.every(p => p.selecionado) ? 'Desmarcar Todos' : 'Selecionar Todos'}
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {pedidos.map(pedido => (
              <div key={pedido.id} onClick={() => togglePedido(pedido.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                pedido.selecionado ? 'bg-gray-100/80 border-gray-700 shadow-sm shadow-black/5' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                  pedido.selecionado ? 'bg-primary text-white shadow-sm' : 'border-2 border-gray-300 bg-white'
                }`}>
                  {pedido.selecionado && <CheckCircle2 size={16} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Pedido #{pedido.id}</div>
                  <div className="text-sm text-gray-500">{pedido.cliente?.razaoSocialNome ?? 'Cliente'} — {pedido.cliente?.bairro ?? ''}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-gray-900">R$ {(pedido.valorTotal ?? 0).toLocaleString('pt-BR')}</div>
                  {pedido.pesoTotal > 0 && (
                    <div className="text-xs text-gray-400 mt-0.5">{pedido.pesoTotal} kg</div>
                  )}
                </div>
              </div>
            ))}
            {pedidos.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">Nenhum pedido pronto para expedição</div>
            )}
          </div>

          <button onClick={() => setEtapa('rota')} disabled={selecionados.length === 0} className={`mt-4 w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
            selecionados.length > 0 ? 'bg-primary text-white hover:bg-primary shadow-sm shadow-black/20' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}>
            <Navigation size={18} /> AVANÇAR PARA MONTAGEM DE ROTA ({selecionados.length} pedidos)
          </button>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-1/2 min-h-0 flex flex-col rounded-2xl bg-gray-50/50 border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between shrink-0">
              <h2 className="font-semibold text-gray-800">Pedidos na Rota ({selecionados.length})</h2>
              <button onClick={() => setEtapa('selecionar')} className="text-xs text-black font-semibold hover:text-gray-800">Editar seleção</button>
            </div>
            <div className="p-4 flex-1 min-h-0 overflow-y-auto space-y-3">
              {selecionados.map((pedido) => (
                <div key={pedido.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {pedido.ordem}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Pedido #{pedido.id}</div>
                    <div className="text-sm text-gray-500">{pedido.cliente?.razaoSocialNome ?? 'Cliente'} — {pedido.cliente?.bairro ?? ''}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moverPedido(pedido.id, 'up')} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"><ArrowUp size={14} /></button>
                    <button onClick={() => moverPedido(pedido.id, 'down')} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"><ArrowDown size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white space-y-2 shrink-0">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Valor Total:</span>
                <span className="font-bold text-gray-900">R$ {selecionados.reduce((acc, p) => acc + (p.valorTotal ?? 0), 0).toLocaleString('pt-BR')}</span>
              </div>
              {totalPeso > 0 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Peso Total:</span>
                  <span className="font-semibold text-gray-700">{totalPeso} kg</span>
                </div>
              )}
            </div>
          </div>

          <div className="w-full md:w-1/2 min-h-0 flex flex-col rounded-2xl bg-gray-50/50 border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-white shrink-0">
              <h2 className="font-semibold text-gray-800">Veículo e Motorista</h2>
            </div>
            <div className="p-5 flex-1 min-h-0 overflow-y-auto space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Veículo</span>
                <div className="space-y-2">
                  {veiculos.map(veiculo => (
                    <div key={veiculo.id} onClick={() => setVeiculoSelecionado(veiculo.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      veiculoSelecionado === veiculo.id ? 'bg-gray-100/80 border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${veiculoSelecionado === veiculo.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Truck size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{veiculo.modelo}</div>
                        <div className="text-xs text-gray-500">{veiculo.placa} — {veiculo.pesoMaximo}kg max</div>
                      </div>
                      {veiculoSelecionado === veiculo.id && <CheckCircle2 size={18} className="text-black shrink-0" />}
                    </div>
                  ))}
                  {veiculos.length === 0 && <p className="text-xs text-gray-400">Nenhum veículo cadastrado</p>}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Motorista</span>
                <div className="space-y-2">
                  {motoristas.map(motorista => (
                    <div key={motorista.id} onClick={() => setMotoristaSelecionado(motorista.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                      motoristaSelecionado === motorista.id ? 'bg-gray-100/80 border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${motoristaSelecionado === motorista.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <User size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm">{motorista.nome}</div>
                      </div>
                      {motoristaSelecionado === motorista.id && <CheckCircle2 size={18} className="text-black shrink-0" />}
                    </div>
                  ))}
                  {motoristas.length === 0 && <p className="text-xs text-gray-400">Nenhum motorista no setor de Entregas</p>}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-gray-100 bg-white shrink-0 space-y-3">
              {rotaOtimizada && (
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 text-center">
                  <CheckCircle2 size={24} className="text-black mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">Rota otimizada por bairro!</p>
                  <p className="text-xs text-black mt-1">A ordem foi reorganizada automaticamente.</p>
                </div>
              )}

              <button onClick={otimizarRota} disabled={!veiculoSelecionado || !motoristaSelecionado} className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                veiculoSelecionado && motoristaSelecionado ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
                <Navigation size={18} /> OTIMIZAR ROTA
              </button>

              <button onClick={finalizarRota} disabled={!rotaOtimizada || !veiculoSelecionado || !motoristaSelecionado} className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                rotaOtimizada && veiculoSelecionado && motoristaSelecionado ? 'bg-primary text-white hover:bg-primary shadow-sm shadow-black/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}>
                <CheckCircle2 size={18} /> FINALIZAR E GERAR ENTREGA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmEntregaTab() {
  const [entregas, setEntregas] = useState<EntregaRota[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [expandido, setExpandido] = useState<number | null>(null);

  const carregar = async () => {
    setCarregando(true);
    const data = await logisticaService.getEntregas();
    setEntregas(data.filter(e => e.status === 'EmRota'));
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const porRota = entregas.reduce<Record<number, { rota: EntregaRota['rota']; entregas: EntregaRota[] }>>((acc, e) => {
    const rotaId = e.rotaId;
    if (!acc[rotaId]) acc[rotaId] = { rota: e.rota, entregas: [] };
    acc[rotaId].entregas.push(e);
    return acc;
  }, {});

  const totalPendentes = Object.values(porRota).reduce((acc, r) => acc + r.entregas.filter(e => e.status === 'EmRota').length, 0);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Truck size={20} /> Entregas em Andamento
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {totalPendentes} entrega{totalPendentes !== 1 ? 's' : ''} em rota
          </p>
        </div>
        <button onClick={carregar} className="text-sm text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
          <RotateCcw size={14} /> Atualizar
        </button>
      </div>

      {carregando ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
      ) : Object.keys(porRota).length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
          <Truck size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhuma entrega em andamento</p>
          <p className="text-xs mt-1">As entregas em rota aparecerão aqui</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-4">
          {Object.entries(porRota).map(([rotaId, { rota, entregas: rotasEntregas }]) => {
            const total = rotasEntregas.length;
            const concluidas = rotasEntregas.filter(e => e.status === 'Entregue').length;
            const problema = rotasEntregas.filter(e => e.status === 'Devolvido').length;
            const emRota = rotasEntregas.filter(e => e.status === 'EmRota');
            const proximaEntrega = emRota.sort((a, b) => a.ordem - b.ordem)[0];
            const progresso = total > 0 ? ((concluidas / total) * 100) : 0;
            const isExpanded = expandido === Number(rotaId);

            return (
              <div key={rotaId} className="border border-gray-200 rounded-2xl overflow-hidden">
                <div
                  onClick={() => setExpandido(isExpanded ? null : Number(rotaId))}
                  className="p-5 bg-gray-50/80 cursor-pointer hover:bg-gray-100/80 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center">
                        <Truck size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {rota?.motorista?.nome ?? 'Motorista'} — Rota #{rotaId}
                        </div>
                        <div className="text-xs text-gray-500">
                          {rota?.veiculo?.modelo} ({rota?.veiculo?.placa}) • {total} entrega{total !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-gray-900">{Math.round(progresso)}%</div>
                      <div className="text-xs text-gray-500">{concluidas}/{total} entregues</div>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progresso}%` }} />
                  </div>
                  <div className="flex gap-4 mt-3 text-xs">
                    <span className="text-emerald-600 font-medium">{concluidas} entregue{concluidas !== 1 ? 's' : ''}</span>
                    <span className="text-blue-600 font-medium">{emRota.length} em rota</span>
                    {problema > 0 && <span className="text-red-600 font-medium">{problema} devolvido{problema !== 1 ? 's' : ''}</span>}
                  </div>
                  {proximaEntrega && (
                    <div className="mt-3 p-3 bg-white rounded-xl border border-gray-200">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Próxima entrega</div>
                      <div className="text-sm font-medium text-gray-900">
                        {pedidosLabel(proximaEntrega)} — {nomeCliente(proximaEntrega)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {enderecoStr(proximaEntrega) || '—'}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <Clock size={12} />
                        <span>Ordem {proximaEntrega.ordem} de {total}</span>
                      </div>
                    </div>
                  )}
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-2">
                    {rotasEntregas.sort((a, b) => a.ordem - b.ordem).map(e => (
                      <div key={e.id} className={`flex items-center gap-3 p-3 rounded-xl border ${
                        e.status === 'Entregue' ? 'bg-emerald-50 border-emerald-200' :
                        e.status === 'Devolvido' ? 'bg-red-50 border-red-200' :
                        e.status === 'EmRota' ? 'bg-blue-50 border-blue-200' :
                        'bg-white border-gray-200'
                      }`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          e.status === 'Entregue' ? 'bg-emerald-500 text-white' :
                          e.status === 'Devolvido' ? 'bg-red-500 text-white' :
                          e.status === 'EmRota' ? 'bg-blue-500 text-white' :
                          'bg-gray-300 text-white'
                        }`}>
                          {e.ordem}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {pedidosLabel(e)}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {primeiroPedido(e)?.cliente?.bairro ?? ''}
                          </div>
                        </div>
                        <div className="shrink-0">
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            e.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' :
                            e.status === 'Devolvido' ? 'bg-red-100 text-red-700' :
                            e.status === 'EmRota' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {ENTREGA_STATUS_LABELS[e.status] ?? e.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ConsultasTab() {
  const [entregas, setEntregas] = useState<EntregaRota[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('Todos');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');
  const [resultados, setResultados] = useState<EntregaRota[]>([]);
  const [consultaRealizada, setConsultaRealizada] = useState(false);
  const [detalhe, setDetalhe] = useState<EntregaRota | null>(null);
  const [editando, setEditando] = useState<EntregaRota | null>(null);
  const [editForm, setEditForm] = useState({ observacao: '', ordem: 0, status: '' });

  const carregar = async () => {
    setCarregando(true);
    const data = await logisticaService.getEntregas();
    setEntregas(data);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const buscar = () => {
    let filtro = [...entregas];

    if (busca.trim()) {
      const termo = busca.toLowerCase();
      filtro = filtro.filter(e =>
        pedidosLabel(e).includes(termo) ||
        nomeCliente(e).toLowerCase().includes(termo) ||
        primeiroPedido(e)?.cliente?.bairro?.toLowerCase().includes(termo) ||
        e.rota?.motorista?.nome?.toLowerCase().includes(termo)
      );
    }

    if (filtroStatus !== 'Todos') {
      filtro = filtro.filter(e => e.status === filtroStatus);
    }

    if (filtroDataInicio) {
      const di = new Date(filtroDataInicio);
      filtro = filtro.filter(e => e.rota?.data && new Date(e.rota.data) >= di);
    }

    if (filtroDataFim) {
      const df = new Date(filtroDataFim);
      df.setDate(df.getDate() + 1);
      filtro = filtro.filter(e => e.rota?.data && new Date(e.rota.data) < df);
    }

    setResultados(filtro);
    setConsultaRealizada(true);
  };

  const temFiltro = busca || filtroStatus !== 'Todos' || filtroDataInicio || filtroDataFim;

  const limparFiltros = () => {
    setBusca('');
    setFiltroStatus('Todos');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setResultados([]);
    setConsultaRealizada(false);
  };

  const abrirEdicao = (e: EntregaRota) => {
    setEditando(e);
    setEditForm({ observacao: e.observacao ?? '', ordem: e.ordem, status: e.status });
  };

  const salvarEdicao = async () => {
    if (!editando) return;
    const ok = await logisticaService.editarEntrega(editando.id, editForm);
    if (ok) {
      setEditando(null);
      await carregar();
      if (consultaRealizada) buscar();
    }
  };

  const excluirEntrega = async (id: number) => {
    if (!confirm('Excluir esta entrega? O pedido voltará a ficar disponível para roteirização.')) return;
    const ok = await logisticaService.excluirEntrega(id);
    if (ok) {
      await carregar();
      if (consultaRealizada) buscar();
    }
  };

  const statusEntregue = resultados.filter(e => e.status === 'Entregue').length;
  const statusDevolvido = resultados.filter(e => e.status === 'Devolvido').length;
  const valorTotalGeral = resultados.reduce((acc, e) => acc + valorTotal(e), 0);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <Search size={20} /> Consulta de Entregas
        </h2>
        {temFiltro && (
          <button onClick={limparFiltros} className="text-xs text-gray-500 hover:text-black flex items-center gap-1 transition-colors">
            <RotateCcw size={12} /> Limpar filtros
          </button>
        )}
      </div>

      <div className="space-y-3 mb-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar por #pedido, cliente, bairro, motorista..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') buscar(); }}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all"
            />
          </div>
          <button
            onClick={buscar}
            className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors flex items-center gap-2 shadow-sm shadow-black/20"
          >
            <Search size={16} /> Buscar
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Status</label>
            <div className="flex flex-wrap gap-1.5">
              {['Todos', 'EmRota', 'Entregue', 'Devolvido', 'PendenteConferencia'].map(status => (
                <button
                  key={status}
                  onClick={() => setFiltroStatus(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filtroStatus === status
                      ? 'bg-primary text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {status === 'Todos' ? 'Todos' : ENTREGA_STATUS_LABELS[status] ?? status}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-[260px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Período</label>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="date" value={filtroDataInicio} onChange={e => setFiltroDataInicio(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black" />
              </div>
              <span className="text-gray-400 text-xs">até</span>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input type="date" value={filtroDataFim} onChange={e => setFiltroDataFim(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-black/20 focus:border-black" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {consultaRealizada && resultados.length > 0 && (
        <div className="flex gap-4 mb-4 text-xs">
          <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium text-gray-700">{resultados.length} resultado{resultados.length !== 1 ? 's' : ''}</span>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-medium">{statusEntregue} entregue{statusEntregue !== 1 ? 's' : ''}</span>
          {statusDevolvido > 0 && <span className="bg-red-50 text-red-700 px-3 py-1.5 rounded-lg font-medium">{statusDevolvido} devolvido{statusDevolvido !== 1 ? 's' : ''}</span>}
          <span className="bg-gray-100 px-3 py-1.5 rounded-lg font-medium text-gray-700">R$ {valorTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {carregando ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">Carregando...</div>
        ) : !consultaRealizada ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Filter size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Use os filtros e clique em Buscar</p>
            <p className="text-xs mt-1">para pesquisar entregas realizadas</p>
          </div>
        ) : resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Package size={32} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma entrega encontrada</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b sticky top-0">
              <tr>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Motorista</th>
                <th className="px-4 py-3 font-semibold">Veículo</th>
                <th className="px-4 py-3 font-semibold">Valor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {resultados.map(e => (
                <tr key={e.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{pedidosLabel(e)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{nomeCliente(e)}</div>
                    <div className="text-xs text-gray-400">{primeiroPedido(e)?.cliente?.bairro ?? ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{e.rota?.motorista?.nome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="text-gray-700">{e.rota?.veiculo?.modelo ?? '—'}</div>
                    <div className="text-xs text-gray-400">{e.rota?.veiculo?.placa}</div>
                  </td>
                  <td className="px-4 py-3">R$ {valorTotal(e).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      e.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' :
                      e.status === 'Devolvido' ? 'bg-red-100 text-red-700' :
                      e.status === 'EmRota' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {ENTREGA_STATUS_LABELS[e.status] ?? e.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setDetalhe(e)} className="text-gray-700 hover:underline text-xs font-medium">Ver</button>
                      <button onClick={() => abrirEdicao(e)} className="text-gray-400 hover:text-gray-700 transition-colors"><Pencil size={14} /></button>
                      <button onClick={() => excluirEntrega(e.id)} className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
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
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Detalhes da Entrega</h2>
              <button onClick={() => setDetalhe(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Pedido</span>
                <p className="text-gray-900 font-medium mt-0.5">{pedidosLabel(detalhe)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Status</span>
                <p className="mt-0.5">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    detalhe.status === 'Entregue' ? 'bg-emerald-100 text-emerald-700' :
                    detalhe.status === 'Devolvido' ? 'bg-red-100 text-red-700' :
                    detalhe.status === 'EmRota' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {ENTREGA_STATUS_LABELS[detalhe.status] ?? detalhe.status}
                  </span>
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Cliente</span>
                <p className="text-gray-900 font-medium mt-0.5">{nomeCliente(detalhe)}</p>
                {enderecoStr(detalhe) && (
                  <p className="text-xs text-gray-500 mt-0.5">{enderecoStr(detalhe)}</p>
                )}
                {primeiroPedido(detalhe)?.cliente?.telefone && (
                  <p className="text-xs text-gray-500 mt-0.5">Tel: {primeiroPedido(detalhe)?.cliente?.telefone}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Valor</span>
                  <p className="text-gray-900 font-medium mt-0.5">R$ {valorTotal(detalhe).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Peso</span>
                  <p className="text-gray-900 font-medium mt-0.5">{pesoTotal(detalhe).toFixed(2)} kg</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Motorista</span>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.rota?.motorista?.nome ?? '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Veículo</span>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.rota?.veiculo?.modelo} — {detalhe.rota?.veiculo?.placa}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <span className="text-gray-400 text-xs uppercase tracking-wider">Ordem na Rota</span>
                <p className="text-gray-900 font-medium mt-0.5">{detalhe.ordem}ª parada</p>
              </div>
              {detalhe.observacao && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-amber-600 text-xs uppercase tracking-wider font-semibold">Observação</span>
                  <p className="text-amber-900 text-sm mt-0.5">{detalhe.observacao}</p>
                </div>
              )}
              {detalhe.motivoDevolucao && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                  <span className="text-red-600 text-xs uppercase tracking-wider font-semibold">Motivo da Devolução</span>
                  <p className="text-red-900 text-sm mt-0.5">{detalhe.motivoDevolucao}</p>
                </div>
              )}
              {todosItens(detalhe).length > 0 && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <span className="text-gray-400 text-xs uppercase tracking-wider">Itens ({todosItens(detalhe).length})</span>
                  <div className="mt-2 space-y-1">
                    {todosItens(detalhe).map(item => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-gray-700">{item.produto?.nome ?? `Produto #${item.id}`}</span>
                        <span className="text-gray-500">{item.quantidade}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditando(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-serif font-bold text-gray-900">Editar Entrega #{editando.id}</h2>
              <button onClick={() => setEditando(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Pedido</label>
                <p className="text-gray-900 mt-0.5">{pedidosLabel(editando)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Ordem na Rota</label>
                <input type="number" min={1} value={editForm.ordem} onChange={e => setEditForm({ ...editForm, ordem: Number(e.target.value) })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black text-sm mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black text-sm mt-1">
                  {Object.entries(ENTREGA_STATUS_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Observação</label>
                <textarea value={editForm.observacao} onChange={e => setEditForm({ ...editForm, observacao: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black text-sm mt-1 resize-none" placeholder="Observações sobre a entrega..." />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setEditando(null)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={salvarEdicao} className="px-5 py-2.5 bg-primary text-white hover:bg-primary rounded-xl font-medium transition-colors text-sm">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VeiculosTab() {
  const { setModalAberto } = useUiStore();
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [showNovo, setShowNovo] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState({ modelo: '', placa: '', pesoMaximo: '' });
  const [isSaving, setIsSaving] = useState(false);

  const carregar = async () => {
    setCarregando(true);
    const v = await logisticaService.getVeiculos();
    setVeiculos(v);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const veiculosFiltrados = veiculos.filter(v =>
    v.modelo.toLowerCase().includes(busca.toLowerCase()) ||
    v.placa.toLowerCase().includes(busca.toLowerCase())
  );

  const adicionarVeiculo = async () => {
    if (!novoVeiculo.modelo.trim()) return;
    try {
      setIsSaving(true);
      const created = await logisticaService.criarVeiculo({
        modelo: novoVeiculo.modelo,
        placa: novoVeiculo.placa,
        pesoMaximo: parseFloat(novoVeiculo.pesoMaximo) || 0,
      });
      if (created) setVeiculos(prev => [...prev, created]);
      setNovoVeiculo({ modelo: '', placa: '', pesoMaximo: '' });
      setShowNovo(false);
      setModalAberto(false);
    } finally {
      setIsSaving(false);
    }
  };

  const remover = async (id: number) => {
    const ok = await logisticaService.excluirVeiculo(id);
    if (ok) setVeiculos(prev => prev.filter(v => v.id !== id));
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar veículo..." value={busca} onChange={e => setBusca(e.target.value)}
            className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all" />
        </div>
        <button onClick={() => { setShowNovo(true); setModalAberto(true); }} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
          <Plus size={18} /> Novo Veículo
        </button>
      </div>

      {carregando ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">Carregando...</div>
      ) : (
        <div className="flex-1 border rounded-lg overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 font-semibold">Modelo</th>
                <th className="px-6 py-3 font-semibold">Placa</th>
                <th className="px-6 py-3 font-semibold">Capacidade</th>
                <th className="px-6 py-3 font-semibold text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {veiculosFiltrados.map(veiculo => (
                <tr key={veiculo.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{veiculo.modelo}</td>
                  <td className="px-6 py-4 font-mono text-xs">{veiculo.placa}</td>
                  <td className="px-6 py-4">{veiculo.pesoMaximo ? `${veiculo.pesoMaximo}kg` : '—'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => remover(veiculo.id)} className="text-gray-600 hover:underline flex items-center gap-1 inline-flex"><Trash2 size={14} /> Remover</button>
                  </td>
                </tr>
              ))}
              {veiculosFiltrados.length === 0 && (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400 text-sm">{busca ? 'Nenhum veículo encontrado' : 'Nenhum veículo cadastrado'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showNovo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Veículo</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label><input type="text" value={novoVeiculo.modelo} onChange={e => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Ex: Fiat Fiorino" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Placa</label><input type="text" value={novoVeiculo.placa} onChange={e => setNovoVeiculo({ ...novoVeiculo, placa: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="ABC-1234" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Peso Máximo (kg)</label><input type="text" value={novoVeiculo.pesoMaximo} onChange={e => setNovoVeiculo({ ...novoVeiculo, pesoMaximo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="800" /></div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowNovo(false); setModalAberto(false); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={adicionarVeiculo} disabled={!novoVeiculo.modelo.trim() || isSaving} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novoVeiculo.modelo.trim() && !isSaving ? 'bg-primary text-white hover:bg-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{isSaving ? 'Salvando...' : 'Adicionar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
