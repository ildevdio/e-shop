import { useState, useRef, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { Send, Search, Hash, Users, MessageSquareText, Clock, Smile, Paperclip, UserPlus, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { chatService, type MensagemChat } from '../services/chatService';
import { atendimentoService } from '../services/atendimentoService';

interface CanalUI {
  id: string;
  nome: string;
  tipo: 'setor' | 'geral' | 'direto';
  ultimaMensagem: string;
  naoLidas: number;
  online?: boolean;
  membros?: number;
  apiId?: number;
}

interface MensagemUI {
  id: string;
  autor: string;
  setor: string;
  conteudo: string;
  horario: string;
  avatar: string;
  tipo: 'texto' | 'arquivo' | 'sistema';
}

export default function Chat() {
  const nome = useAuthStore(state => state.nome);
  const usuarioId = useAuthStore(state => state.usuarioId);
  const { setModalAberto } = useUiStore();
  const [canais, setCanais] = useState<CanalUI[]>([]);
  const [canalAtivo, setCanalAtivo] = useState<string>('');
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState<Record<string, MensagemUI[]>>({});
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [showNovoChat, setShowNovoChat] = useState(false);
  const [attendants, setAttendants] = useState<{ id: number; nome: string; setores: string[] }[]>([]);
  const [buscaPessoa, setBuscaPessoa] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

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
          connection.on('ReceberMensagemInterna', (canalId: string, msg: MensagemUI) => {
            setMensagens(prev => ({
              ...prev,
              [canalId]: [...(prev[canalId] || []), msg],
            }));
          });
        })
        .catch(e => console.log('Erro na conexão Chat: ', e));
    }
  }, [connection]);

  useEffect(() => {
    scrollToBottom();
  }, [mensagens, canalAtivo, scrollToBottom]);

  useEffect(() => {
    if (canalAtivo) {
      const canal = canais.find(c => c.id === canalAtivo);
      if (canal?.apiId) {
        chatService.getMensagens(canal.apiId).then(data => {
          const mapped = data.map(mapMensagemToUI);
          setMensagens(prev => ({ ...prev, [canalAtivo]: mapped }));
        }).catch(() => {});
      }
    }
  }, [canalAtivo, canais]);

  const mapMensagemToUI = (m: MensagemChat): MensagemUI => ({
    id: String(m.id),
    autor: m.remetente || 'Anônimo',
    setor: '',
    conteudo: m.texto,
    horario: new Date(m.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    avatar: (m.remetente || 'A').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
    tipo: 'texto',
  });

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [canaisApi, usuarios] = await Promise.all([
        chatService.getCanais(),
        atendimentoService.getUsuarios(),
      ]);

      const canaisUI: CanalUI[] = canaisApi.map(c => ({
        id: `canal-${c.id}`,
        nome: c.nome,
        tipo: 'setor' as const,
        ultimaMensagem: '',
        naoLidas: 0,
        membros: 0,
        apiId: c.id,
      }));

      setCanais(canaisUI);
      setAttendants(usuarios);

      if (canaisUI.length > 0) setCanalAtivo(canaisUI[0].id);
    } catch {
      setCanais([]);
    } finally {
      setIsLoading(false);
    }
  };

  const enviarMensagem = () => {
    if (!mensagem.trim()) return;

    const novaMsg: MensagemUI = {
      id: Date.now().toString(),
      autor: nome || 'Usuário',
      setor: 'Você',
      conteudo: mensagem.trim(),
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      avatar: (nome || 'U').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      tipo: 'texto',
    };

    setMensagens(prev => ({
      ...prev,
      [canalAtivo]: [...(prev[canalAtivo] || []), novaMsg],
    }));

    if (connection?.state === signalR.HubConnectionState.Connected) {
      connection.invoke('EnviarMensagemInterna', canalAtivo, novaMsg).catch(() => {});
    }

    setMensagem('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const canalAtual = canais.find(c => c.id === canalAtivo);

  const pessoasFiltradas = attendants.filter(a =>
    a.nome.toLowerCase().includes(buscaPessoa.toLowerCase()) ||
    a.setores?.some(s => s.toLowerCase().includes(buscaPessoa.toLowerCase()))
  );

  return (
    <div className="h-full flex overflow-hidden bg-white rounded-[2rem] shadow-sm border border-gray-100">
      <div className="w-full md:w-[260px] shrink-0 bg-[#f8fafc] border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquareText size={20} className="text-black" /> Chat Interno
            </h2>
            <button
              onClick={() => { setShowNovoChat(true); setModalAberto(true); }}
              className="p-2 hover:bg-gray-200 rounded-xl transition-colors text-gray-500"
              title="Nova conversa"
            >
              <UserPlus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Buscar canal ou pessoa..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">Canais</span>
          </div>
          {isLoading ? (
            <div className="px-3 py-6 text-center text-xs text-gray-400">Carregando...</div>
          ) : canais.filter(c => c.tipo !== 'direto').length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-gray-400">Nenhum canal disponível</div>
          ) : (
            canais.filter(c => c.tipo !== 'direto').map(canal => (
              <button
                key={canal.id}
                onClick={() => setCanalAtivo(canal.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  canalAtivo === canal.id
                    ? 'bg-white shadow-sm ring-1 ring-gray-200/50 text-gray-900'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  canalAtivo === canal.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {canal.tipo === 'geral' ? <Hash size={18} /> : <Users size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">{canal.nome}</span>
                    {canal.naoLidas > 0 && (
                      <span className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold">
                        {canal.naoLidas}
                      </span>
                    )}
                  </div>
                  {canal.ultimaMensagem && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{canal.ultimaMensagem}</p>
                  )}
                </div>
              </button>
            ))
          )}

          {attendants.length > 0 && (
            <>
              <div className="px-3 py-2 mt-4">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">Conversas Diretas</span>
              </div>
              {attendants.filter(a => a.id !== usuarioId).slice(0, 10).map(pessoa => (
                <button
                  key={`dir-${pessoa.id}`}
                  onClick={() => setCanalAtivo(`dir-${pessoa.id}`)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                    canalAtivo === `dir-${pessoa.id}`
                      ? 'bg-white shadow-sm ring-1 ring-gray-200/50 text-gray-900'
                      : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                  }`}
                >
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                      canalAtivo === `dir-${pessoa.id}` ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {pessoa.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#f8fafc] bg-gray-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm block">{pessoa.nome}</span>
                    <p className="text-xs text-gray-400">{pessoa.setores?.join(', ') || ''}</p>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-[72px] border-b border-gray-100 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
              {canalAtual?.tipo === 'geral' ? <Hash size={18} /> : <Users size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">#{canalAtual?.nome || 'Selecione um canal'}</h3>
              {canalAtual?.membros != null && canalAtual.membros > 0 && (
                <p className="text-xs text-gray-400">{canalAtual.membros} membros</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!canalAtivo ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Selecione um canal para começar.</p>
            </div>
          ) : (mensagens[canalAtivo] || []).length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>
            </div>
          ) : (
            (mensagens[canalAtivo] || []).map(msg => {
              const isMinhaMsg = msg.setor === 'Você';
              return (
                <div key={msg.id} className={`flex gap-3 ${isMinhaMsg ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isMinhaMsg ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {msg.avatar}
                  </div>
                  <div className={`max-w-[70%] ${isMinhaMsg ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isMinhaMsg ? 'justify-end' : ''}`}>
                      <span className="text-sm font-semibold text-gray-900">{msg.autor}</span>
                      {msg.setor && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{msg.setor}</span>}
                      <span className="text-[10px] text-gray-400 flex items-center gap-1"><Clock size={10} /> {msg.horario}</span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      isMinhaMsg
                        ? 'bg-black text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.conteudo}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-3 bg-gray-50 rounded-2xl p-2 ring-1 ring-gray-200/50">
            <button className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100">
              <Paperclip size={20} />
            </button>
            <button className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100">
              <Smile size={20} />
            </button>
            <textarea
              value={mensagem}
              onChange={e => setMensagem(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite sua mensagem..."
              rows={1}
              className="flex-1 bg-transparent resize-none focus:outline-none text-sm text-gray-800 placeholder-gray-400 py-2 max-h-32"
            />
            <button
              onClick={enviarMensagem}
              disabled={!mensagem.trim()}
              className={`p-3 rounded-xl transition-all ${
                mensagem.trim()
                  ? 'bg-black text-white hover:bg-gray-800 shadow-sm'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {showNovoChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nova Conversa</h2>
              <button onClick={() => { setShowNovoChat(false); setModalAberto(false); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Inicie uma conversa direta com qualquer funcionário.</p>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nome ou setor..."
                value={buscaPessoa}
                onChange={e => setBuscaPessoa(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm"
              />
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pessoasFiltradas.filter(a => a.id !== usuarioId).map((pessoa) => (
                <button
                  key={pessoa.id}
                  onClick={() => {
                    setCanalAtivo(`dir-${pessoa.id}`);
                    setShowNovoChat(false);
                    setModalAberto(false);
                    setBuscaPessoa('');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-sm font-bold text-gray-600">
                      {pessoa.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-gray-300" />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-gray-900 block">{pessoa.nome}</span>
                    <span className="text-xs text-gray-400">{pessoa.setores?.join(', ') || ''}</span>
                  </div>
                </button>
              ))}
              {pessoasFiltradas.filter(a => a.id !== usuarioId).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Nenhum funcionário encontrado.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
