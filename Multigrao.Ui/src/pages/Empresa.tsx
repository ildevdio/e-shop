import { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { Bell, Target, TrendingUp, Plus, Calendar, Megaphone, X, BarChart3, Users, Check, Vote } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Aviso {
  id: number;
  titulo: string;
  conteudo: string;
  tipo: 'aviso' | 'meta' | 'comunicado' | 'destaque';
  dataPublicacao: string;
  autor: string;
  setorDestino?: string;
  votos?: number;
  totalVotos?: number;
}

interface Enquete {
  id: number;
  titulo: string;
  opcoes: { texto: string; votos: number }[];
  autor: string;
  dataPublicacao: string;
  votada: boolean;
}

export default function Empresa() {
  const nome = useAuthStore(state => state.nome);
  const [avisos, setAvisos] = useState<Aviso[]>([
    { id: 1, titulo: 'Bem-vindo ao novo sistema!', conteudo: 'O sistema Multigrãos está online. Qualquer dúvida, fale com o setor de TI.', tipo: 'comunicado', dataPublicacao: new Date().toISOString(), autor: 'Admin' },
    { id: 2, titulo: 'Meta de Vendas - Julho', conteudo: 'Meta: R$ 150.000 em vendas este mês.', tipo: 'meta', dataPublicacao: new Date().toISOString(), autor: 'Comercial' },
    { id: 3, titulo: 'Destaque do Mês', conteudo: 'Parabéns à equipe de Separação por atingir 100% de conferência sem erros!', tipo: 'destaque', dataPublicacao: new Date().toISOString(), autor: 'RH' },
  ]);

  const [enquetes, setEnquetes] = useState<Enquete[]>([
    { id: 1, titulo: 'Melhor horário para reunião semanal?', opcoes: [{ texto: 'Segunda 8h', votos: 3 }, { texto: 'Terça 14h', votos: 5 }, { texto: 'Quarta 10h', votos: 2 }], autor: 'Admin', dataPublicacao: new Date().toISOString(), votada: false },
  ]);

  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [showNovoAviso, setShowNovoAviso] = useState(false);
  const [showNovaEnquete, setShowNovaEnquete] = useState(false);
  const [novoAviso, setNovoAviso] = useState({ titulo: '', conteudo: '', tipo: 'comunicado' as const, setorDestino: '' });
  const [novaEnquete, setNovaEnquete] = useState({ titulo: '', opcoes: ['', ''] });

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
          connection.on('ReceberNovoAviso', (aviso: Aviso) => {
            setAvisos(prev => [aviso, ...prev]);
          });
        })
        .catch(() => {});
    }
  }, [connection]);

  const publicarAviso = () => {
    if (!novoAviso.titulo.trim() || !novoAviso.conteudo.trim()) return;
    const aviso: Aviso = {
      id: Date.now(),
      titulo: novoAviso.titulo,
      conteudo: novoAviso.conteudo,
      tipo: novoAviso.tipo,
      dataPublicacao: new Date().toISOString(),
      autor: nome || 'Admin',
      setorDestino: novoAviso.setorDestino || undefined,
    };
    setAvisos(prev => [aviso, ...prev]);
    if (connection?.state === signalR.HubConnectionState.Connected) {
      connection.invoke('PublicarAviso', aviso).catch(() => {});
    }
    setNovoAviso({ titulo: '', conteudo: '', tipo: 'comunicado', setorDestino: '' });
    setShowNovoAviso(false);
  };

  const publicarEnquete = () => {
    if (!novaEnquete.titulo.trim() || novaEnquete.opcoes.filter(o => o.trim()).length < 2) return;
    const enquete: Enquete = {
      id: Date.now(),
      titulo: novaEnquete.titulo,
      opcoes: novaEnquete.opcoes.filter(o => o.trim()).map(texto => ({ texto, votos: 0 })),
      autor: nome || 'Admin',
      dataPublicacao: new Date().toISOString(),
      votada: false,
    };
    setEnquetes(prev => [enquete, ...prev]);
    setNovaEnquete({ titulo: '', opcoes: ['', ''] });
    setShowNovaEnquete(false);
  };

  const votarEnquete = (enqueteId: number, opcaoIndex: number) => {
    setEnquetes(enquetes.map(e => {
      if (e.id === enqueteId && !e.votada) {
        const novasOpcoes = e.opcoes.map((o, i) => i === opcaoIndex ? { ...o, votos: o.votos + 1 } : o);
        return { ...e, opcoes: novasOpcoes, votada: true };
      }
      return e;
    }));
  };

  const excluirAviso = (id: number) => {
    setAvisos(avisos.filter(a => a.id !== id));
  };

  const tipoStyles: Record<string, { bg: string; icon: string; label: string }> = {
    aviso: { bg: 'bg-gray-50/50 border-gray-100', icon: 'bg-gray-100 text-gray-600', label: 'Aviso' },
    comunicado: { bg: 'bg-blue-50/50 border-blue-100', icon: 'bg-blue-100 text-blue-600', label: 'Comunicado' },
    meta: { bg: 'bg-amber-50/50 border-amber-100', icon: 'bg-amber-100 text-amber-600', label: 'Meta' },
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
            onClick={() => setShowNovaEnquete(true)}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Vote size={16} /> Nova Enquete
          </button>
          <button
            onClick={() => setShowNovoAviso(true)}
            className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm shadow-black/20"
          >
            <Plus size={18} /> Novo Aviso
          </button>
        </div>
      </div>

      {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Avisos Hoje', valor: avisos.length, icon: Bell, cor: 'text-blue-600 bg-blue-50' },
          { label: 'Enquetes Ativas', valor: enquetes.filter(e => !e.votada).length, icon: Vote, cor: 'text-purple-600 bg-purple-50' },
          { label: 'Setores', valor: 5, icon: Users, cor: 'text-black bg-gray-100' },
          { label: 'Funcionários', valor: 12, icon: BarChart3, cor: 'text-amber-600 bg-amber-50' },
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
        {/* Avisos */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm ring-1 ring-gray-100/50 p-6 flex flex-col min-h-0">
            <h2 className="text-lg font-serif font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Megaphone size={20} className="text-blue-500" /> Avisos e Comunicados
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {avisos.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Bell size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhum aviso publicado ainda.</p>
              </div>
            )}
            {avisos.map(aviso => {
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
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{aviso.setorDestino}</span>
                          )}
                        </div>
                        <button onClick={() => excluirAviso(aviso.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded-lg transition-all text-red-400 hover:text-red-600">
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
            })}
          </div>
        </div>

        {/* Enquetes */}
        <div className="bg-white rounded-[2rem] shadow-sm ring-1 ring-gray-100/50 p-6 flex flex-col">
            <h2 className="text-lg font-serif font-bold text-gray-800 mb-5 flex items-center gap-2">
            <Vote size={20} className="text-purple-500" /> Enquetes
          </h2>
          <div className="flex-1 overflow-y-auto space-y-4">
            {enquetes.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Vote size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma enquete ativa.</p>
              </div>
            )}
            {enquetes.map(enquete => {
              const totalVotos = enquete.opcoes.reduce((acc, o) => acc + o.votos, 0);
              return (
                <div key={enquete.id} className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30">
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{enquete.titulo}</h3>
                  <p className="text-[10px] text-gray-400 mb-3">{enquete.autor} - {new Date(enquete.dataPublicacao).toLocaleDateString('pt-BR')}</p>
                  <div className="space-y-2">
                    {enquete.opcoes.map((opcao, i) => {
                      const pct = totalVotos > 0 ? Math.round((opcao.votos / totalVotos) * 100) : 0;
                      return (
                        <button
                          key={i}
                          onClick={() => votarEnquete(enquete.id, i)}
                          disabled={enquete.votada}
                          className={`w-full text-left p-3 rounded-xl text-sm transition-all relative overflow-hidden ${
                            enquete.votada
                              ? 'cursor-default'
                              : 'hover:bg-purple-100 cursor-pointer bg-white border border-purple-200'
                          }`}
                        >
                          {enquete.votada && (
                            <div className="absolute inset-0 bg-purple-500/10" style={{ width: `${pct}%` }} />
                          )}
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {enquete.votada && <Check size={14} className="text-purple-600" />}
                              <span className="font-medium text-gray-800">{opcao.texto}</span>
                            </div>
                            {enquete.votada && (
                              <span className="text-xs font-bold text-purple-700">{pct}%</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 text-center">{totalVotos} votos</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal Novo Aviso */}
      {showNovoAviso && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Novo Aviso</h2>
              <button onClick={() => setShowNovoAviso(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
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
              <button onClick={() => setShowNovoAviso(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={publicarAviso} disabled={!novoAviso.titulo.trim() || !novoAviso.conteudo.trim()} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novoAviso.titulo.trim() && novoAviso.conteudo.trim() ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Publicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nova Enquete */}
      {showNovaEnquete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nova Enquete</h2>
              <button onClick={() => setShowNovaEnquete(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} /></button>
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
                        <button onClick={() => setNovaEnquete({ ...novaEnquete, opcoes: novaEnquete.opcoes.filter((_, j) => j !== i) })} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><X size={16} /></button>
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
              <button onClick={() => setShowNovaEnquete(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors text-sm">Cancelar</button>
              <button onClick={publicarEnquete} disabled={!novaEnquete.titulo.trim() || novaEnquete.opcoes.filter(o => o.trim()).length < 2} className={`px-5 py-2.5 rounded-xl font-medium transition-colors text-sm ${novaEnquete.titulo.trim() && novaEnquete.opcoes.filter(o => o.trim()).length >= 2 ? 'bg-black text-white hover:bg-gray-800' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>Publicar Enquete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
