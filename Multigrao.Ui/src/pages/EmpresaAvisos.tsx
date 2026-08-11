import { useState, useEffect } from 'react';
import { Megaphone, Plus, Search, Calendar, Target, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSlug } from '../services/tenantSetup';
import { ArrowLeft } from 'lucide-react';
import { avisoService, type Aviso } from '../services/avisoService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export default function EmpresaAvisos() {
  const usuarioId = useAuthStore(state => state.usuarioId);
  const { setModalAberto } = useUiStore();
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [showNovo, setShowNovo] = useState(false);
  const [novoAviso, setNovoAviso] = useState({ titulo: '', mensagem: '', alvo: 'Todos' });
  const [filtro, setFiltro] = useState('');

  const carregar = async () => {
    setCarregando(true);
    const dados = await avisoService.getAvisos();
    setAvisos(dados);
    setCarregando(false);
  };

  useEffect(() => { carregar(); }, []);

  const adicionarAviso = async () => {
    if (!novoAviso.titulo.trim() || !novoAviso.mensagem.trim() || !usuarioId) return;
    await avisoService.criarAviso({
      titulo: novoAviso.titulo,
      conteudo: novoAviso.mensagem,
      autorId: usuarioId,
    });
    setNovoAviso({ titulo: '', mensagem: '', alvo: 'Todos' });
    setShowNovo(false);
    setModalAberto(false);
    await carregar();
  };

  const excluir = async (id: number) => {
    await avisoService.excluirAviso(id);
    await carregar();
  };

  const avisosFiltrados = avisos.filter(a => {
    if (!filtro) return true;
    const termo = filtro.toLowerCase();
    return a.titulo.toLowerCase().includes(termo) || a.conteudo.toLowerCase().includes(termo);
  });

  const formatarData = (data: string) => {
    try {
      return new Date(data).toLocaleDateString('pt-BR');
    } catch {
      return data;
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center gap-4">
        <Link to={`/${getSlug()}/empresa`} className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
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
            <input
              type="text"
              placeholder="Buscar avisos..."
              value={filtro}
              onChange={e => setFiltro(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm flex-1 min-w-0 transition-all"
            />
          </div>
          <button onClick={() => { setShowNovo(true); setModalAberto(true); }} className="bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-primary transition-colors flex items-center gap-2 shadow-sm shadow-black/20">
            <Plus size={18} /> Novo Aviso
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {carregando ? (
            <div className="text-center py-16 text-gray-400 text-sm">Carregando avisos...</div>
          ) : avisosFiltrados.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">Nenhum aviso encontrado</div>
          ) : (
            avisosFiltrados.map(aviso => (
              <div key={aviso.id} className="p-5 rounded-2xl border-2 transition-all bg-gray-50/50 border-gray-200 hover:border-gray-300">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600">
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{aviso.titulo}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={12} /> {formatarData(aviso.dataPublicacao)}</span>
                        {aviso.setorAlvo && (
                          <span className="text-xs text-gray-400 flex items-center gap-1"><Target size={12} /> {aviso.setorAlvo}</span>
                        )}
                        <span className="text-xs text-gray-400">por {aviso.autorNome}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => excluir(aviso.id)} className="text-gray-400 hover:text-gray-900 transition-colors"><Trash2 size={16} /></button>
                </div>
                <p className="text-gray-600 mt-3 text-sm leading-relaxed ml-[52px]">{aviso.conteudo}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {showNovo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <h2 className="text-lg font-serif font-bold text-gray-900 mb-4">Novo Aviso</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Título *</label><input type="text" value={novoAviso.titulo} onChange={e => setNovoAviso({ ...novoAviso, titulo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm" placeholder="Ex: Meta de Vendas" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label><textarea value={novoAviso.mensagem} onChange={e => setNovoAviso({ ...novoAviso, mensagem: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm h-24 resize-none" placeholder="Detalhes do aviso..." /></div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowNovo(false); setModalAberto(false); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={adicionarAviso} disabled={!novoAviso.titulo.trim() || !novoAviso.mensagem.trim()} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novoAviso.titulo.trim() && novoAviso.mensagem.trim() ? 'bg-primary text-white hover:bg-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Publicar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
