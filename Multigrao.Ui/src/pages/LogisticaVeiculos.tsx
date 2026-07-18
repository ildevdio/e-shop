import { useState } from 'react';
import { Navigation, Plus, Search, CheckCircle2, Edit3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function LogisticaVeiculos() {
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
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/logistica" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Veículos</h1>
          <p className="text-gray-500 mt-1">Cadastro e gestão da frota de veículos.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar veículo..."               className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all" />
          </div>
          <button onClick={() => setShowNovo(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
            <Plus size={18} /> Novo Veículo
          </button>
        </div>

        <div className="flex-1 overflow-x-auto">
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
      </div>

      {showNovo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Novo Veículo</h2>
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
