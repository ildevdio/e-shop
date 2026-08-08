import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Bell, Target, TrendingUp, Plus, Calendar, Megaphone, X, Users, Vote, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { avisoService, type Aviso as AvisoApi } from '../services/avisoService';
import { enqueteService, type Enquete as EnqueteApi, type OpcaoEnquete } from '../services/enqueteService';
import { atendimentoService } from '../services/atendimentoService';

interface AvisoUI {
  id: number;
  titulo: string;
  conteudo: string;
  tipo: 'aviso' | 'meta' | 'comunicado' | 'destaque';
  dataPublicacao: string;
  autor: string;
  setorDestino?: string;
}

interface EnqueteUI {
  id: number;
  titulo: string;
  opcoes: { id: number; texto: string; votos: number }[];
  autor: string;
  dataPublicacao: string;
  dataExpiracao: string;
  ativa: boolean;
  votada: boolean;
}

export default function Empresa() {
  const nome = useAuthStore(state => state.nome);
  const usuarioId = useAuthStore(state => state.usuarioId);
  const role = useAuthStore(state => state.role);
  const isAdmin = role === 'AdminMaster' || role === 'SuperAdmin';
  const { setModalAberto } = useUiStore();
  const [avisos, setAvisos] = useState<AvisoUI[]>([]);
  const [enquetes, setEnquetes] = useState<EnqueteUI[]>([]);
  const [totalSetores, setTotalSetores] = useState(0);
  const [totalFuncionarios, setTotalFuncionarios] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [showNovoAviso, setShowNovoAviso] = useState(false);
  const [showNovaEnquete, setShowNovaEnquete] = useState(false);
  const [novoAviso, setNovoAviso] = useState({ titulo: '', conteudo: '', tipo: 'comunicado' as const, setorDestino: '' });
  const [novaEnquete, setNovaEnquete] = useState({ titulo: '', opcoes: ['', ''] });

  function tempoRestante(dataExpiracao: string): string {
    const diff = new Date(dataExpiracao).getTime() - Date.now();
    if (diff <= 0) return 'Encerrada';
    const horas = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (horas > 0) return `${horas}h ${mins}min`;
    return `${mins}min`;
  }

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl((import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + '/hubs/app')
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.on('ReceberNovoAviso', (aviso: AvisoUI) => {
            setAvisos(prev => [aviso, ...prev]);
          });
        })
        .catch(() => {});
    }
  }, [connection]);

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [avisosApi, enquetesApi, usuarios] = await Promise.all([
        avisoService.getAvisos(),
        enqueteService.getEnquetes(),
        atendimentoService.getUsuarios(),
      ]);

      const avisosUI: AvisoUI[] = avisosApi.map((a: AvisoApi) => ({
        id: a.id,
        titulo: a.titulo,
        conteudo: a.conteudo,
        tipo: (a.tipo as AvisoUI['tipo']) || 'comunicado',
        dataPublicacao: a.dataPublicacao,
        autor: a.autorNome || 'Sistema',
        setorDestino: a.setorAlvo || undefined,
      }));

      const enquetesUI: EnqueteUI[] = enquetesApi.map((e: EnqueteApi) => ({
        id: e.id,
        titulo: e.titulo,
        opcoes: e.opcoes.map((o: OpcaoEnquete) => ({ id: o.id, texto: o.texto, votos: o.votos })),
        autor: e.autorNome || 'Sistema',
        dataPublicacao: e.dataCriacao,
        dataExpiracao: e.dataExpiracao,
        ativa: e.ativa,
        votada: false,
      }));

      setAvisos(avisosUI);
      setEnquetes(enquetesUI);
      setTotalFuncionarios(usuarios.length);

      const setoresSet = new Set<string>();
      usuarios.forEach(u => u.setores?.forEach(s => setoresSet.add(s)));
      setTotalSetores(setoresSet.size || 5);
    } catch {
      setAvisos([]);
      setEnquetes([]);
    } finally {
      setIsLoading(false);
    }
  };

  const publicarAviso = async () => {
    if (!novoAviso.titulo.trim() || !novoAviso.conteudo.trim()) return;
    if (!usuarioId) return;

    const criado = await avisoService.criarAviso({
      titulo: novoAviso.titulo,
      conteudo: novoAviso.conteudo,
      autorId: usuarioId,
    });

    if (criado) {
      setAvisos(prev => [{
        id: criado.id,
        titulo: criado.titulo,
        conteudo: criado.conteudo,
        tipo: (criado.tipo as AvisoUI['tipo']) || 'comunicado',
        dataPublicacao: criado.dataPublicacao,
        autor: nome || 'Admin',
        setorDestino: criado.setorAlvo || undefined,
      }, ...prev]);
    }

    if (connection?.state === signalR.HubConnectionState.Connected) {
      connection.invoke('PublicarAviso', { titulo: novoAviso.titulo, conteudo: novoAviso.conteudo }).catch(() => {});
    }

    setNovoAviso({ titulo: '', conteudo: '', tipo: 'comunicado', setorDestino: '' });
    setShowNovoAviso(false);
    setModalAberto(false);
  };

  const publicarEnquete = async () => {
    if (!novaEnquete.titulo.trim() || novaEnquete.opcoes.filter(o => o.trim()).length < 2) return;
    if (!usuarioId) return;

    const ok = await enqueteService.criarEnquete({
      titulo: novaEnquete.titulo,
      autorId: usuarioId,
      opcoes: novaEnquete.opcoes.filter(o => o.trim()),
    });

    if (ok) await carregarDados();

    setNovaEnquete({ titulo: '', opcoes: ['', ''] });
    setShowNovaEnquete(false);
    setModalAberto(false);
  };

  const votarEnquete = async (enqueteId: number, opcao: { id: number; texto: string; votos: number }) => {
    if (!usuarioId) return;
    const ok = await enqueteService.votar(enqueteId, opcao.id, usuarioId);
    if (ok) {
      setEnquetes(enquetes.map(e => {
        if (e.id === enqueteId && !e.votada) {
          const novasOpcoes = e.opcoes.map(o => o.id === opcao.id ? { ...o, votos: o.votos + 1 } : o);
          return { ...e, opcoes: novasOpcoes, votada: true };
        }
        return e;
      }));
    }
  };

  const excluirAviso = async (id: number) => {
    const ok = await avisoService.excluirAviso(id);
    if (ok) setAvisos(avisos.filter(a => a.id !== id));
  };

  const excluirEnquete = async (id: number) => {
    const ok = await enqueteService.excluir(id);
    if (ok) setEnquetes(enquetes.filter(e => e.id !== id));
  };

  const tipoStyles: Record<string, { bg: string; icon: string; label: string }> = {
    aviso: { bg: 'bg-gray-50/50 border-gray-100', icon: 'bg-gray-100 text-gray-600', label: 'Aviso' },
    comunicado: { bg: 'bg-gray-50 border-gray-200', icon: 'bg-gray-100 text-gray-700', label: 'Comunicado' },
    meta: { bg: 'bg-gray-50 border-gray-200', icon: 'bg-gray-100 text-gray-500', label: 'Meta' },
    destaque: { bg: 'bg-gray-100/50 border-gray-200', icon: 'bg-gray-200 text-black', label: 'Destaque' },
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">Mural da Empresa</h1>
          <p className="text-gray-500 mt-1">Comunicados, enquetes e avisos gerais.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setShowNovaEnquete(true); setModalAberto(true); }}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Vote size={16} /> Nova Enquete
          </button>
          <button
            onClick={() => { setShowNovoAviso(true); setModalAberto(true); }}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20"
          >
            <Plus size={18} /> Novo Aviso
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avisos', valor: avisos.length, icon: Bell, cor: 'text-gray-700 bg-gray-50' },
          { label: 'Enquetes Ativas', valor: enquetes.filter(e => !e.votada).length, icon: Vote, cor: 'text-gray-700 bg-gray-50' },
          { label: 'Setores', valor: totalSetores, icon: Users, cor: 'text-black bg-gray-100' },
          { label: 'Funcionários', valor: totalFuncionarios, icon: Users, cor: 'text-gray-500 bg-gray-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100/50 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${stat.cor}`}>
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-xl font-serif font-bold text-gray-900">{stat.valor}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm ring-1 ring-gray-100/50 p-6 flex flex-col min-h-0">
          <h2 className="text-lg font-serif font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Megaphone size={20} className="text-gray-500" /> Avisos e Comunicados
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
            ) : avisos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Bell size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum aviso publicado ainda.</p>
              </div>
            ) : (
              avisos.map(aviso => {
                const estilo = tipoStyles[aviso.tipo] || tipoStyles.aviso;
                return (
                  <div key={aviso.id} className={`p-5 rounded-2xl border transition-all hover:shadow-md ${estilo.bg} relative group`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl ${estilo.icon}`}>
                        {aviso.tipo === 'meta' ? <TrendingUp size={18} /> : aviso.tipo === 'destaque' ? <Target size={18} /> : <Bell size={18} />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-gray-900">{aviso.titulo}</h3>
                            <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-100">{estilo.label}</span>
                            {aviso.setorDestino && (
                              <span className="text-[10px] font-semibold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-full">{aviso.setorDestino}</span>
                            )}
                          </div>
                          <button onClick={() => excluirAviso(aviso.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-lg transition-all text-gray-500 hover:text-gray-900">
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">{aviso.conteudo}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] font-semibold text-gray-400 bg-white px-2 py-0.5 rounded-full">{aviso.autor}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Calendar size={10} /> {new Date(aviso.dataPublicacao).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-gray-100/50 p-6 flex flex-col">
          <h2 className="text-lg font-serif font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Vote size={20} className="text-gray-500" /> Enquetes
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4">
            {isLoading ? (
              <div className="text-center py-12 text-gray-400 text-sm">Carregando...</div>
            ) : enquetes.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Vote size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma enquete ativa.</p>
              </div>
            ) : (
               enquetes.map(enquete => {
                const totalVotos = enquete.opcoes.reduce((acc, o) => acc + o.votos, 0);
                return (
                  <div key={enquete.id} className={`p-4 rounded-2xl border bg-gray-50 ${enquete.ativa ? 'border-gray-200' : 'border-gray-200 opacity-70'}`}>
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-bold text-gray-900 text-sm">{enquete.titulo}</h3>
                      {isAdmin && (
                        <button onClick={() => excluirEnquete(enquete.id)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-900 shrink-0"><Trash2 size={14} /></button>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-400 mb-1">{enquete.autor} - {new Date(enquete.dataPublicacao).toLocaleDateString('pt-BR')}</p>
                    {enquete.ativa && <p className="text-[10px] text-gray-500 mb-3 font-medium">{tempoRestante(enquete.dataExpiracao)}</p>}
                    <div className="space-y-2">
                      {enquete.opcoes.map((opcao) => {
                        const pct = totalVotos > 0 ? Math.round((opcao.votos / totalVotos) * 100) : 0;
                        return (
                          <button
                            key={opcao.id}
                            onClick={() => !enquete.votada && enquete.ativa && votarEnquete(enquete.id, opcao)}
                            disabled={enquete.votada || !enquete.ativa}
                            className={`w-full text-left p-3 rounded-xl text-sm transition-all relative overflow-hidden ${
                              enquete.votada
                                ? 'cursor-default'
                                : 'hover:bg-gray-100 cursor-pointer bg-white border border-gray-200'
                            }`}
                          >
                            {enquete.votada && (
                              <div className="absolute inset-0 bg-gray-100" style={{ width: `${pct}%` }} />
                            )}
                            <div className="relative flex items-center justify-between">
                              <span className="font-medium text-gray-800">{opcao.texto}</span>
                              {enquete.votada && (
                                <span className="text-xs font-bold text-gray-700">{pct}%</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2 text-center">{totalVotos} votos</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {showNovoAviso && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Novo Aviso</h2>
              <button onClick={() => { setShowNovoAviso(false); setModalAberto(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={novoAviso.titulo} onChange={e => setNovoAviso({ ...novoAviso, titulo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Ex: Reunião Sexta-feira" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conteúdo *</label>
                <textarea value={novoAviso.conteudo} onChange={e => setNovoAviso({ ...novoAviso, conteudo: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm resize-none" placeholder="Descreva o aviso..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <select value={novoAviso.tipo} onChange={e => setNovoAviso({ ...novoAviso, tipo: e.target.value as any })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm">
                    <option value="comunicado">Comunicado</option>
                    <option value="aviso">Aviso</option>
                    <option value="meta">Meta</option>
                    <option value="destaque">Destaque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Setor Destino (opcional)</label>
                  <select value={novoAviso.setorDestino} onChange={e => setNovoAviso({ ...novoAviso, setorDestino: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm">
                    <option value="">Todos os setores</option>
                    <option value="Comercial">Comercial</option>
                    <option value="Logística">Logística</option>
                    <option value="Separação">Separação</option>
                    <option value="Conferência">Conferência</option>
                    <option value="Entregas">Entregas</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowNovoAviso(false); setModalAberto(false); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={publicarAviso} disabled={!novoAviso.titulo.trim() || !novoAviso.conteudo.trim()} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novoAviso.titulo.trim() && novoAviso.conteudo.trim() ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Publicar</button>
            </div>
          </div>
        </div>
      )}

      {showNovaEnquete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nova Enquete</h2>
              <button onClick={() => { setShowNovaEnquete(false); setModalAberto(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pergunta *</label>
                <input type="text" value={novaEnquete.titulo} onChange={e => setNovaEnquete({ ...novaEnquete, titulo: e.target.value })} className="w-full border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder="Ex: Melhor horário para reunião?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Opções *</label>
                <div className="space-y-2">
                  {novaEnquete.opcoes.map((opcao, i) => (
                    <div key={i} className="flex gap-2">
                      <input type="text" value={opcao} onChange={e => { const novas = [...novaEnquete.opcoes]; novas[i] = e.target.value; setNovaEnquete({ ...novaEnquete, opcoes: novas }); }} className="flex-1 border border-gray-300 rounded-xl p-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black text-sm" placeholder={`Opção ${i + 1}`} />
                      {novaEnquete.opcoes.length > 2 && (
                        <button onClick={() => setNovaEnquete({ ...novaEnquete, opcoes: novaEnquete.opcoes.filter((_, j) => j !== i) })} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"><X size={16} /></button>
                      )}
                    </div>
                  ))}
                </div>
                {novaEnquete.opcoes.length < 6 && (
                  <button onClick={() => setNovaEnquete({ ...novaEnquete, opcoes: [...novaEnquete.opcoes, ''] })} className="mt-2 text-sm text-black font-semibold hover:text-gray-800">+ Adicionar opção</button>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => { setShowNovaEnquete(false); setModalAberto(false); }} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={publicarEnquete} disabled={!novaEnquete.titulo.trim() || novaEnquete.opcoes.filter(o => o.trim()).length < 2} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novaEnquete.titulo.trim() && novaEnquete.opcoes.filter(o => o.trim()).length >= 2 ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Publicar Enquete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
