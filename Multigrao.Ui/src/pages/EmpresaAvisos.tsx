import { useState } from 'react';
import { Megaphone, Plus, Search, Calendar, Target, Edit3, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function EmpresaAvisos() {
  const [avisos, setAvisos] = useState([
    { id: 1, titulo: 'Reunião de Results - Terça', mensagem: 'Reunião de resultados do mês será na terça às 15h na sala de reuniões.', data: '17/07/2026', alvo: 'Todos', urgente: false },
    { id: 2, titulo: 'Meta de Vendas Q3', mensagem: 'Precisamos atingir a meta de R$ 200.000 até o final do trimestre!', data: '10/07/2026', alvo: 'Equipe Comercial', urgente: true },
  ]);

  const [showNovo, setShowNovo] = useState(false);
  const [novoAviso, setNovoAviso] = useState({ titulo: '', mensagem: '', alvo: 'Todos', urgente: false });

  const adicionarAviso = () => {
    if (!novoAviso.titulo.trim() || !novoAviso.mensagem.trim()) return;
    setAvisos([{ id: Date.now(), titulo: novoAviso.titulo, mensagem: novoAviso.mensagem, data: new Date().toLocaleDateString('pt-BR'), alvo: novoAviso.alvo, urgente: novoAviso.urgente }, ...avisos]);
    setNovoAviso({ titulo: '', mensagem: '', alvo: 'Todos', urgente: false });
    setShowNovo(false);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/empresa" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Avisos</h1>
          <p className="text-gray-500 mt-1">Comunicados e anúncios para a equipe.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Buscar avisos..."               className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all" />
          </div>
          <button onClick={() => setShowNovo(true)} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
            <Plus size={18} /> Novo Aviso
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {avisos.map(aviso => (
            <div key={aviso.id} className={`p-5 rounded-2xl border-2 transition-all ${aviso.urgente ? 'bg-red-50/50 border-red-200' : 'bg-gray-50/50 border-gray-200 hover:border-gray-300'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${aviso.urgente ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{aviso.titulo}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> {aviso.data}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Target size={12} /> {aviso.alvo}</span>
                      {aviso.urgente && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Urgente</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="text-gray-400 hover:text-gray-600 transition-colors"><Edit3 size={16} /></button>
                  <button onClick={() => setAvisos(avisos.filter(a => a.id !== aviso.id))} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
              <p className="text-gray-600 mt-3 text-sm leading-relaxed ml-[52px]">{aviso.mensagem}</p>
            </div>
          ))}
        </div>
      </div>

      {showNovo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Novo Aviso</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Título *</label><input type="text" value={novoAviso.titulo} onChange={e => setNovoAviso({ ...novoAviso, titulo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Ex: Meta de Vendas" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label><textarea value={novoAviso.mensagem} onChange={e => setNovoAviso({ ...novoAviso, mensagem: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm h-24 resize-none" placeholder="Detalhes do aviso..." /></div>
              <div className="flex gap-4">
                <div className="flex-1"><label className="block text-sm font-medium text-gray-700 mb-1">Público-alvo</label>
                  <select value={novoAviso.alvo} onChange={e => setNovoAviso({ ...novoAviso, alvo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black text-sm">
                    <option value="Todos">Todos</option>
                    <option value="Equipe Comercial">Equipe Comercial</option>
                    <option value="Equipe Logística">Equipe Logística</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={novoAviso.urgente} onChange={e => setNovoAviso({ ...novoAviso, urgente: e.target.checked })} className="w-4 h-4 accent-red-600" />
                    <span className="text-sm font-medium text-gray-700">Urgente</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowNovo(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={adicionarAviso} disabled={!novoAviso.titulo.trim() || !novoAviso.mensagem.trim()} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novoAviso.titulo.trim() && novoAviso.mensagem.trim() ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Publicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
