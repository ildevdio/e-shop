import { useState, useEffect } from 'react';
import { Navigation, ArrowRight, CheckCircle2, ArrowUp, ArrowDown, Truck, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { logisticaService, type Veiculo, type Motorista, type PedidoPronto } from '../services/logisticaService';

export default function LogisticaRoteirizacao() {
  const [pedidos, setPedidos] = useState<(PedidoPronto & { selecionado: boolean; ordem: number })[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [motoristas, setMotoristas] = useState<Motorista[]>([]);
  const [veiculoSelecionado, setVeiculoSelecionado] = useState<number | null>(null);
  const [motoristaSelecionado, setMotoristaSelecionado] = useState<number | null>(null);
  const [etapa, setEtapa] = useState<'selecionar' | 'rota'>('selecionar');
  const [rotaOtimizada, setRotaOtimizada] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
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
    carregar();
  }, []);

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

  const otimizarRota = () => {
    const ordenados = [...selecionados].sort((a, b) => (a.cliente?.bairro ?? '').localeCompare(b.cliente?.bairro ?? ''));
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
      const pedidosData = await logisticaService.getPedidosProntos();
      setPedidos(pedidosData.map(p => ({ ...p, selecionado: false, ordem: 0 })));
    }
  };

  const totalPeso = selecionados.reduce((acc, p) => acc + (p.pesoTotal ?? 0), 0);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/logistica" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Roteirização</h1>
          <p className="text-gray-500 mt-1">Monte a rota, selecione o motorista e otimize a entrega.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex items-center gap-4 border-b border-gray-100">
          <button onClick={() => setEtapa('selecionar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${etapa === 'selecionar' ? 'bg-gray-100 text-gray-800 ring-1 ring-gray-300' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'selecionar' ? 'bg-black text-white' : 'bg-gray-300 text-white'}`}>1</span>
            Selecionar Pedidos
          </button>
          <ArrowRight size={16} className="text-gray-300" />
          <button onClick={() => etapa === 'selecionar' && selecionados.length > 0 && setEtapa('rota')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${etapa === 'rota' ? 'bg-gray-100 text-gray-800 ring-1 ring-gray-300' : 'bg-gray-100 text-gray-500'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${etapa === 'rota' ? 'bg-black text-white' : 'bg-gray-300 text-white'}`}>2</span>
            Montar Rota
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {carregando ? (
            <div className="flex items-center justify-center h-32 text-sm text-gray-400">Carregando pedidos...</div>
          ) : etapa === 'selecionar' ? (
            <div className="flex-1 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">Pedidos Prontos para Expedição</h2>
                <button onClick={() => { const todosSelecionados = pedidos.every(p => p.selecionado); setPedidos(pedidos.map(p => ({ ...p, selecionado: !todosSelecionados, ordem: !todosSelecionados ? 0 : p.ordem }))); }} className="text-sm text-black font-semibold hover:text-gray-800 transition-colors">
                  {pedidos.every(p => p.selecionado) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                {pedidos.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">Nenhum pedido pronto para expedição</div>
                ) : pedidos.map(pedido => (
                  <div key={pedido.id} onClick={() => togglePedido(pedido.id)} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                    pedido.selecionado ? 'bg-gray-100/80 border-gray-700 shadow-sm shadow-black/5' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                      pedido.selecionado ? 'bg-black text-white shadow-sm' : 'border-2 border-gray-300 bg-white'
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
              </div>

              <button onClick={() => setEtapa('rota')} disabled={selecionados.length === 0} className={`mt-4 w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                selecionados.length > 0 ? 'bg-black text-white hover:bg-gray-800 shadow-sm shadow-black/20' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}>
                <Navigation size={18} /> AVANÇAR PARA MONTAGEM DE ROTA ({selecionados.length} pedidos)
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col md:flex-row gap-6 h-full">
              <div className="w-full md:w-1/2 flex flex-col h-full rounded-2xl bg-gray-50/50 border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white flex items-center justify-between">
                  <h2 className="font-semibold text-gray-800">Pedidos na Rota ({selecionados.length})</h2>
                  <button onClick={() => setEtapa('selecionar')} className="text-xs text-black font-semibold hover:text-gray-800">Editar seleção</button>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-3">
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
                <div className="p-4 border-t border-gray-100 bg-white space-y-2">
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

              <div className="w-full md:w-1/2 flex flex-col h-full rounded-2xl bg-gray-50/50 border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-white">
                  <h2 className="font-semibold text-gray-800">Veículo e Motorista</h2>
                </div>
                <div className="p-5 flex-1 flex flex-col gap-4 overflow-y-auto">

                  {/* Veículos */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Veículo</span>
                    <div className="space-y-2">
                      {veiculos.map(veiculo => (
                        <div key={veiculo.id} onClick={() => setVeiculoSelecionado(veiculo.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          veiculoSelecionado === veiculo.id ? 'bg-gray-100/80 border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${veiculoSelecionado === veiculo.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <Truck size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{veiculo.modelo}</div>
                            <div className="text-xs text-gray-500">{veiculo.placa} — {veiculo.pesoMaximo}kg max</div>
                          </div>
                          {veiculoSelecionado === veiculo.id && <CheckCircle2 size={18} className="text-black" />}
                        </div>
                      ))}
                      {veiculos.length === 0 && <p className="text-xs text-gray-400">Nenhum veículo cadastrado</p>}
                    </div>
                  </div>

                  {/* Motoristas */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 block">Motorista</span>
                    <div className="space-y-2">
                      {motoristas.map(motorista => (
                        <div key={motorista.id} onClick={() => setMotoristaSelecionado(motorista.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          motoristaSelecionado === motorista.id ? 'bg-gray-100/80 border-gray-700' : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}>
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${motoristaSelecionado === motorista.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <User size={20} />
                          </div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900 text-sm">{motorista.nome}</div>
                          </div>
                          {motoristaSelecionado === motorista.id && <CheckCircle2 size={18} className="text-black" />}
                        </div>
                      ))}
                      {motoristas.length === 0 && <p className="text-xs text-gray-400">Nenhum motorista no setor de Entregas</p>}
                    </div>
                  </div>

                  <div className="flex-1" />

                  <button onClick={otimizarRota} disabled={!veiculoSelecionado || !motoristaSelecionado} className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                    veiculoSelecionado && motoristaSelecionado ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}>
                    <Navigation size={18} /> OTIMIZAR ROTA
                  </button>

                  {rotaOtimizada && (
                    <div className="bg-gray-100 border border-gray-300 rounded-xl p-4 text-center">
                      <CheckCircle2 size={24} className="text-black mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-800">Rota otimizada por bairro!</p>
                      <p className="text-xs text-black mt-1">A ordem foi reorganizada automaticamente.</p>
                    </div>
                  )}

                  <button onClick={finalizarRota} disabled={!rotaOtimizada || !veiculoSelecionado || !motoristaSelecionado} className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                    rotaOtimizada && veiculoSelecionado && motoristaSelecionado ? 'bg-black text-white hover:bg-gray-800 shadow-sm shadow-black/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}>
                    <CheckCircle2 size={18} /> FINALIZAR E GERAR ENTREGA
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
