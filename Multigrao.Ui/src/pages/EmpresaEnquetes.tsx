import { useState, useEffect } from 'react';
import { BarChart3, Plus, Search, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { enqueteService, type Enquete } from '../services/enqueteService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export default function EmpresaEnquetes() {
  const usuarioId = useAuthStore(state => state.usuarioId);
  const { setModalAberto } = useUiStore();
  const [enquetes, setEnquetes] = useState<Enquete[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [votouEm, setVotouEm] = useState<number[]>([]);
  const [showNova, setShowNova] = useState(false);
  const [novaEnquete, setNovaEnquete] = useState({ titulo: '', opcoes: ['', ''] });
  const [filtro, setFiltro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const dados = await enqueteService.getEnquetes();
    setEnquetes(dados);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const adicionarOpcao = () => {
    if (novaEnquete.opcoes.length < 4) {
      setNovaEnquete({ ...novaEnquete, opcoes: [...novaEnquete.opcoes, ''] });
    }
  };

  const removerOpcao = (idx: number) => {
    if (novaEnquete.opcoes.length > 2) {
      setNovaEnquete({ ...novaEnquete, opcoes: novaEnquete.opcoes.filter((_, i) => i !== idx) });
    }
  };

  const votar = async (enqueteId: number, opcaoId: number) => {
    if (!usuarioId || votouEm.includes(enqueteId)) return;
    const ok = await enqueteService.votar(enqueteId, opcaoId, usuarioId);
    if (ok) {
      setVotouEm(prev => [...prev, enqueteId]);
      await carregar();
    }
  };

  const excluir = async (id: number) => {
    await enqueteService.excluir(id);
    await carregar();
  };

  const enquetesFiltradas = enquetes.filter(e => {
    if (!filtro) return true;
    return e.titulo.toLowerCase().includes(filtro.toLowerCase());
  });

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to="/empresa" className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Enquetes</h1>
          <p className="text-gray-500 mt-1">Pesquisas de opinião e votações da equipe.</p>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 flex justify-between items-center border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar enquetes..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm flex-1 min-w-0 transition-all"
            />
          </div>
          <button onClick={() => { setShowNova(true); setModalAberto(true); }} className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
            <Plus size={18} /> Nova Enquete
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {carregando ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando enquetes...</div>
          ) : enquetesFiltradas.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhuma enquete encontrada</div>
          ) : (
            enquetesFiltradas.map(enquete => {
              const jaVotou = votouEm.includes(enquete.id);
              const statusLabel = enquete.ativa ? 'Ativa' : 'Encerrada';
              return (
                <div key={enquete.id} className={`p-5 rounded-2xl border-2 transition-all ${enquete.ativa ? 'bg-gray-50/50 border-gray-200 hover:border-gray-300' : 'bg-gray-100/50 border-gray-200 opacity-80'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center">
                        <BarChart3 size={20} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{enquete.titulo}</h3>
                        <span className="text-xs text-gray-400">{enquete.totalVotos} votos • por {enquete.autorNome}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${enquete.ativa ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-500'}`}>{statusLabel}</span>
                      <button onClick={() => excluir(enquete.id)} className="text-gray-400 hover:text-gray-900 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>

                  <div className="space-y-3 ml-[52px]">
                    {enquete.opcoes.map((opcao) => {
                      const pct = enquete.totalVotos > 0 ? (opcao.votos / enquete.totalVotos) * 100 : 0;
                      return (
                        <button
                          key={opcao.id}
                          onClick={() => votar(enquete.id, opcao.id)}
                          disabled={jaVotou || !enquete.ativa}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${!jaVotou && enquete.ativa ? 'border-gray-200 hover:border-gray-400 hover:bg-gray-50 cursor-pointer' : 'border-gray-200 cursor-default'} relative overflow-hidden`}
                        >
                          <div className="absolute inset-0 bg-gray-200/50 transition-all" style={{ width: `${pct}%` }}></div>
                          <div className="relative flex justify-between text-sm">
                            <span className="font-medium text-gray-700">{opcao.texto}</span>
                            <span className="font-bold text-gray-500">{pct.toFixed(0)}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {showNova && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Nova Enquete</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Pergunta *</label><input type="text" value={novaEnquete.titulo} onChange={e => setNovaEnquete({ ...novaEnquete, titulo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Ex: Qual melhor horário?" /></div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Opções</label>
                <div className="space-y-2">
                  {novaEnquete.opcoes.map((op, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input type="text" value={op} onChange={e => { const novas = [...novaEnquete.opcoes]; novas[idx] = e.target.value; setNovaEnquete({ ...novaEnquete, opcoes: novas }); }} className="flex-1 border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder={`Opção ${idx + 1}`} />
                      {novaEnquete.opcoes.length > 2 && <button onClick={() => removerOpcao(idx)} className="text-gray-400 hover:text-gray-900 transition-colors"><Trash2 size={18} /></button>}
                    </div>
                  ))}
                </div>
                {novaEnquete.opcoes.length < 4 && <button onClick={adicionarOpcao} className="text-xs text-black font-semibold hover:text-gray-800 mt-2 flex items-center gap-1"><Plus size={14} /> Adicionar opção</button>}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowNova(false); setModalAberto(false); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={async () => {
                if (!novaEnquete.titulo.trim() || novaEnquete.opcoes.some(o => !o.trim()) || !usuarioId) return;
                const ok = await enqueteService.criarEnquete({
                  titulo: novaEnquete.titulo,
                  autorId: usuarioId,
                  opcoes: novaEnquete.opcoes.filter(o => o.trim()),
                });
                if (ok) {
                  setNovaEnquete({ titulo: '', opcoes: ['', ''] });
                  setShowNova(false);
                  setModalAberto(false);
                  await carregar();
                }
              }} disabled={!novaEnquete.titulo.trim() || novaEnquete.opcoes.some(o => !o.trim())} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novaEnquete.titulo.trim() && novaEnquete.opcoes.every(o => o.trim()) ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Criar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
