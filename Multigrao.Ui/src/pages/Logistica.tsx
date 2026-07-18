import { useState } from 'react';
import { Truck, Map, Navigation, ArrowRight, Plus, Search, CheckCircle2, Edit3, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

export default function Logistica() {
  const [activeTab, setActiveTab] = useState<'roteirizacao' | 'veiculos'>('roteirizacao');

  return (
    <div className="space-y-6 h-full flex flex-col">
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
        <button onClick={() => setActiveTab('veiculos')} className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 rounded-xl transition-all ${activeTab === 'veiculos' ? 'bg-white shadow-sm text-black ring-1 ring-gray-200/50' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}>
          <Truck size={18} /> Veículos
        </button>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {activeTab === 'roteirizacao' && <RoteirizacaoTab />}
        {activeTab === 'veiculos' && <VeiculosTab />}
      </div>
    </div>
  );
}

function RoteirizacaoTab() {
  const [pedidos, setPedidos] = useState([
    { id: 1003, cliente: 'Supermercado Nova Era', bairro: 'Boa Viagem', valor: 2500, selecionado: false, ordem: 0 },
    { id: 1004, cliente: 'Armazém Fit', bairro: 'Pina', valor: 800, selecionado: false, ordem: 0 },
    { id: 1005, cliente: 'Padaria Tradição', bairro: 'Boa Vista', valor: 1200, selecionado: false, ordem: 0 },
    { id: 1006, cliente: 'Mercado São João', bairro: 'Casa Forte', valor: 1450, selecionado: false, ordem: 0 },
  ]);

  const veiculos = [
    { id: 1, modelo: 'Fiat Fiorino', placa: 'ABC-1234', disponivel: true },
    { id: 2, modelo: 'VW Delivery', placa: 'XYZ-9876', disponivel: false },
  ];

  const [veiculoSelecionado, setVeiculoSelecionado] = useState<number | null>(null);
  const [etapa, setEtapa] = useState<'selecionar' | 'rota'>('selecionar');
  const [rotaOtimizada, setRotaOtimizada] = useState(false);

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
    const ordenados = [...selecionados].sort((a, b) => a.bairro.localeCompare(b.bairro));
    const novosPedidos = pedidos.map(p => {
      const idx = ordenados.findIndex(o => o.id === p.id);
      if (idx >= 0) return { ...p, ordem: idx + 1 };
      return p;
    });
    setPedidos(novosPedidos);
    setRotaOtimizada(true);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Steps */}
      <div className="flex items-center gap-4 mb-6">
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
                  pedido.selecionado ? 'bg-black text-white shadow-sm' : 'border-2 border-gray-300 bg-white'
                }`}>
                  {pedido.selecionado && <CheckCircle2 size={16} strokeWidth={3} />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">Pedido #{pedido.id}</div>
                  <div className="text-sm text-gray-500">{pedido.cliente} - {pedido.bairro}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">R$ {pedido.valor.toLocaleString('pt-BR')}</div>
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
        <div className="flex-1 flex flex-col md:flex-row gap-6">
          {/* Lista Ordenada */}
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
                    <div className="text-sm text-gray-500">{pedido.cliente} - {pedido.bairro}</div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => moverPedido(pedido.id, 'up')} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"><ArrowUp size={14} /></button>
                    <button onClick={() => moverPedido(pedido.id, 'down')} className="p-1 hover:bg-gray-100 rounded transition-colors text-gray-400 hover:text-gray-600"><ArrowDown size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Total:</span>
                <span className="font-bold text-gray-900">R$ {selecionados.reduce((acc, p) => acc + p.valor, 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Veículo + Ações */}
          <div className="w-full md:w-1/2 flex flex-col h-full rounded-2xl bg-gray-50/50 border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-white">
              <h2 className="font-semibold text-gray-800">Veículo / Motorista</h2>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-4">
              {veiculos.map(veiculo => (
                <div key={veiculo.id} onClick={() => veiculo.disponivel && setVeiculoSelecionado(veiculo.id)} className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center gap-4 ${
                  veiculoSelecionado === veiculo.id ? 'bg-gray-100/80 border-gray-700' : veiculo.disponivel ? 'bg-white border-gray-200 hover:border-gray-300' : 'bg-gray-100 border-gray-200 opacity-50 cursor-not-allowed'
                }`}>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${veiculoSelecionado === veiculo.id ? 'bg-black text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <Truck size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">{veiculo.modelo}</div>
                    <div className="text-sm text-gray-500">{veiculo.placa}</div>
                  </div>
                  {!veiculo.disponivel && <span className="text-xs text-gray-400 bg-gray-200 px-3 py-1 rounded-full font-medium">Ocupado</span>}
                  {veiculoSelecionado === veiculo.id && <CheckCircle2 size={20} className="text-black" />}
                </div>
              ))}

              <div className="flex-1" />

              <button onClick={otimizarRota} disabled={!veiculoSelecionado} className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                veiculoSelecionado ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

              <button disabled={!rotaOtimizada || !veiculoSelecionado} className={`w-full py-3.5 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 ${
                rotaOtimizada && veiculoSelecionado ? 'bg-black text-white hover:bg-gray-800 shadow-sm shadow-black/20' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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

function VeiculosTab() {
  const [veiculos, setVeiculos] = useState([
    { id: 1, modelo: 'Fiat Fiorino', placa: 'ABC-1234', capacidade: '600kg', status: 'Disponível' },
    { id: 2, modelo: 'VW Delivery', placa: 'XYZ-9876', capacidade: '1200kg', status: 'Em Rota' },
    { id: 3, modelo: 'Mercedes Sprinter', placa: 'DEF-5678', capacidade: '1800kg', status: 'Disponível' },
  ]);

  const [showNovo, setShowNovo] = useState(false);
  const [novoVeiculo, setNovoVeiculo] = useState({ modelo: '', placa: '', capacidade: '' });

  const adicionarVeiculo = () => {
    if (!novoVeiculo.modelo.trim()) return;
    setVeiculos([...veiculos, { id: Date.now(), modelo: novoVeiculo.modelo, placa: novoVeiculo.placa, capacidade: novoVeiculo.capacidade, status: 'Disponível' }]);
    setNovoVeiculo({ modelo: '', placa: '', capacidade: '' });
    setShowNovo(false);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input type="text" placeholder="Buscar veículo..."               className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all" />
        </div>
        <button onClick={() => setShowNovo(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
          <Plus size={18} /> Novo Veículo
        </button>
      </div>

      <div className="flex-1 border rounded-lg overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 font-semibold">Modelo</th>
              <th className="px-6 py-3 font-semibold">Placa</th>
              <th className="px-6 py-3 font-semibold">Capacidade</th>
              <th className="px-6 py-3 font-semibold">Status</th>
              <th className="px-6 py-3 font-semibold text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {veiculos.map(veiculo => (
              <tr key={veiculo.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900">{veiculo.modelo}</td>
                <td className="px-6 py-4 font-mono text-xs">{veiculo.placa}</td>
                <td className="px-6 py-4">{veiculo.capacidade}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ring-1 ${
                    veiculo.status === 'Disponível' ? 'bg-gray-100 text-gray-800 ring-black/20' : 'bg-amber-50 text-amber-700 ring-amber-500/20'
                  }`}>
                    {veiculo.status === 'Disponível' && <CheckCircle2 size={12} className="mr-1" />}
                    {veiculo.status === 'Em Rota' && <Navigation size={12} className="mr-1" />}
                    {veiculo.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-blue-600 hover:underline mr-3 flex items-center gap-1 inline-flex"><Edit3 size={14} /> Editar</button>
                  <button onClick={() => setVeiculos(veiculos.filter(v => v.id !== veiculo.id))} className="text-red-600 hover:underline flex items-center gap-1 inline-flex"><Trash2 size={14} /> Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNovo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Novo Veículo</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Modelo *</label><input type="text" value={novoVeiculo.modelo} onChange={e => setNovoVeiculo({ ...novoVeiculo, modelo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Ex: Fiat Fiorino" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Placa</label><input type="text" value={novoVeiculo.placa} onChange={e => setNovoVeiculo({ ...novoVeiculo, placa: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="ABC-1234" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Capacidade</label><input type="text" value={novoVeiculo.capacidade} onChange={e => setNovoVeiculo({ ...novoVeiculo, capacidade: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="600kg" /></div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowNovo(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={adicionarVeiculo} disabled={!novoVeiculo.modelo.trim()} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novoVeiculo.modelo.trim() ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Adicionar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
