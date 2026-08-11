import { useState, useRef, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { Send, Search, Hash, Users, MessageSquareText, Check, CheckCheck, Smile, Paperclip, UserPlus, X, MapPin, Package, File } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';
import { chatService, type MensagemChat } from '../services/chatService';
import { atendimentoService } from '../services/atendimentoService';
import { getSlug } from '../services/tenantSetup';

interface CanalUI {
  id: string;
  nome: string;
  tipo: 'setor' | 'direto';
  conversaId?: number;
  setorId?: number;
  usuarioId?: number;
}

interface MensagemUI {
  id: string;
  autor: string;
  conteudo: string;
  horario: string;
  avatar: string;
  dataVisualizacao: string | null;
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
  const [loadingMsg, setLoadingMsg] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAnexos, setShowAnexos] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const anexosRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canaisRef = useRef<CanalUI[]>(canais);
  canaisRef.current = canais;

  const emojis = ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','😎','🥳','🤩','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😡','😠','🤬','👍','👎','👊','✊','🤛','🎉','❤️','🔥','💯','✅','❌','🙏','💪','🚀','👀'];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) setShowEmojiPicker(false);
      if (anexosRef.current && !anexosRef.current.contains(e.target as Node)) setShowAnexos(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl((import.meta.env.VITE_API_URL ?? 'http://localhost:5050') + `/hubs/app?slug=${getSlug()}`)
      .withAutomaticReconnect()
      .build();
    setConnection(newConnection);
  }, []);

  useEffect(() => {
    if (connection) {
      connection.start()
        .then(() => {
          connection.on('ReceberMensagemInterna', (msg: any) => {
            const canaisAtuais = canaisRef.current;
            let entry = canaisAtuais.find(c => c.conversaId === msg.conversaId);
            if (entry) {
              setMensagens(prev => ({
                ...prev,
                [entry.id]: [...(prev[entry.id] || []), mapMensagemToUI(msg)],
              }));
            } else if (msg.conversaId) {
              chatService.getConversas().then(conversas => {
                const conv = conversas.find(c => c.id === msg.conversaId);
                if (!conv) return;
                const novoId = `conv-${msg.conversaId}`;
                setCanais(prev => {
                  if (prev.some(c => c.id === novoId)) return prev;
                  return [{
                    id: novoId,
                    nome: conv.titulo?.startsWith('_canal:') ? `Canal #${conv.titulo.split(':')[1]}` : 'Conversa',
                    tipo: 'direto' as const,
                    conversaId: msg.conversaId,
                  }, ...prev];
                });
                setMensagens(prev => ({
                  ...prev,
                  [novoId]: [mapMensagemToUI(msg)],
                }));
              });
            }
          });

          connection.on('MensagensVisualizadas', (data: any) => {
            setMensagens(prev => {
              const updated = { ...prev };
              for (const key of Object.keys(updated)) {
                updated[key] = updated[key].map(msg =>
                  data.mensagensIds.includes(Number(msg.id))
                    ? { ...msg, dataVisualizacao: data.dataVisualizacao }
                    : msg
                );
              }
              return updated;
            });
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
      carregarMensagens(canalAtivo);
    }
  }, [canalAtivo]);

  const canaisObj = canais.reduce<Record<string, CanalUI>>((acc, c) => ({ ...acc, [c.id]: c }), {});

  const mapMensagemToUI = (m: MensagemChat | any): MensagemUI => ({
    id: String(m.id),
    autor: m.remetente || m.remetenteNome || 'Anônimo',
    conteudo: m.texto,
    horario: new Date(m.dataEnvio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    avatar: (m.remetente || m.remetenteNome || 'A').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase(),
    dataVisualizacao: m.dataVisualizacao ?? null,
  });

  const marcarVisualizadas = useCallback(async (conversaId: number) => {
    if (!usuarioId) return;
    await chatService.marcarVisualizadas(conversaId, usuarioId);
  }, [usuarioId]);

  const carregarMensagens = async (canalId: string) => {
    const canal = canaisObj[canalId];
    if (!canal?.conversaId) return;
    setLoadingMsg(true);
    const data = await chatService.getMensagens(canal.conversaId);
    setMensagens(prev => ({ ...prev, [canalId]: data.map(mapMensagemToUI) }));
    setLoadingMsg(false);
    marcarVisualizadas(canal.conversaId);
  };

  const carregarDados = async () => {
    try {
      setIsLoading(true);
      const [canaisApi, usuarios, conversas] = await Promise.all([
        chatService.getCanais(),
        atendimentoService.getUsuarios(),
        chatService.getConversas(),
      ]);

      const canaisUI: CanalUI[] = canaisApi.map(c => {
        const conv = conversas.find(conv => conv.titulo === `_canal:${c.id}`);
        return {
          id: `canal-${c.id}`,
          nome: c.nome,
          tipo: 'setor' as const,
          setorId: c.id,
          conversaId: conv?.id,
        };
      });

      const diretasUI: CanalUI[] = conversas
        .filter(c => c.titulo && c.titulo.startsWith('_direto:'))
        .map(c => {
          const parts = c.titulo.replace('_direto:', '').split('-').map(Number);
          const outrosId = parts[0] === usuarioId ? parts[1] : parts[0];
          const pessoa = usuarios.find(u => u.id === outrosId);
          return {
            id: `dir-${outrosId}`,
            nome: pessoa?.nome ?? `Usuário #${outrosId}`,
            tipo: 'direto' as const,
            usuarioId: outrosId,
            conversaId: c.id,
          };
        });

      setCanais([...canaisUI, ...diretasUI]);
      setAttendants(usuarios);

      if (canaisUI.length > 0) setCanalAtivo(canaisUI[0].id);
    } catch {
      setCanais([]);
    } finally {
      setIsLoading(false);
    }
  };

  const selecionarCanal = async (canal: CanalUI) => {
    setCanalAtivo(canal.id);
    if (canal.conversaId) return;

    if (canal.tipo === 'setor' && canal.setorId) {
      const conv = await chatService.getOuCriarConversaCanal(canal.setorId);
      if (conv) {
        setCanais(prev => prev.map(c =>
          c.id === canal.id ? { ...c, conversaId: conv.id } : c
        ));
      }
    } else if (canal.tipo === 'direto' && canal.usuarioId && usuarioId) {
      const conv = await chatService.getOuCriarConversaDireta(usuarioId, canal.usuarioId);
      if (conv) {
        setCanais(prev => prev.map(c =>
          c.id === canal.id ? { ...c, conversaId: conv.id } : c
        ));
      }
    }
  };

  const enviarMensagem = async () => {
    if (!mensagem.trim() || !usuarioId) return;
    const canal = canaisObj[canalAtivo];
    if (!canal?.conversaId) return;

    const ok = await chatService.enviarMensagemHttp(canal.conversaId, usuarioId, mensagem.trim());
    if (ok) {
      setMensagem('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  const inserirEmoji = (emoji: string) => {
    setMensagem(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canalAtual?.conversaId || !usuarioId) return;
    setShowAnexos(false);
    const result = await chatService.uploadArquivo(file);
    if (result) {
      await chatService.enviarMensagemArquivo(canalAtual.conversaId, usuarioId, `📁 ${result.nomeOriginal}\n${result.url}`, result.url);
    }
    e.target.value = '';
  };

  const enviarLocalizacao = async () => {
    if (!canalAtual?.conversaId || !usuarioId) return;
    setShowAnexos(false);
    const endereco = prompt('Digite o endereço ou local para compartilhar:');
    if (!endereco) return;
    const url = `https://www.google.com/maps/search/${encodeURIComponent(endereco)}`;
    await chatService.enviarMensagemHttp(canalAtual.conversaId, usuarioId, `📍 ${endereco}\n${url}`);
  };

  const enviarPedido = async () => {
    if (!canalAtual?.conversaId || !usuarioId) return;
    setShowAnexos(false);
    const pedidoId = prompt('Número do pedido:');
    if (!pedidoId) return;
    const url = `${window.location.origin}/${getSlug()}/pedidos/${pedidoId}`;
    await chatService.enviarMensagemHttp(canalAtual.conversaId, usuarioId, `📦 Pedido #${pedidoId}\n${url}`);
  };

  const canalAtual = canais.find(c => c.id === canalAtivo);

  const pessoasFiltradas = attendants.filter(a =>
    a.nome.toLowerCase().includes(buscaPessoa.toLowerCase()) ||
    a.setores?.some(s => s.toLowerCase().includes(buscaPessoa.toLowerCase()))
  );

  const iniciarConversaDireta = async (pessoa: { id: number; nome: string }) => {
    const canalId = `dir-${pessoa.id}`;
    const existente = canais.find(c => c.id === canalId);
    if (!existente) {
      const conv = usuarioId ? await chatService.getOuCriarConversaDireta(usuarioId, pessoa.id) : null;
      setCanais(prev => [
        { id: canalId, nome: pessoa.nome, tipo: 'direto', usuarioId: pessoa.id, conversaId: conv?.id },
        ...prev,
      ]);
    }
    setCanalAtivo(canalId);
    setShowNovoChat(false);
    setModalAberto(false);
    setBuscaPessoa('');
  };

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
              placeholder="Buscar canal..."
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
                onClick={() => selecionarCanal(canal)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                  canalAtivo === canal.id
                    ? 'bg-white shadow-sm ring-1 ring-gray-200/50 text-gray-900'
                    : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  canalAtivo === canal.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {canal.tipo === 'direto' ? <Users size={18} /> : <Hash size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-semibold text-sm">{canal.nome}</span>
                </div>
              </button>
            ))
          )}

          {canais.filter(c => c.tipo === 'direto').length > 0 && (
            <>
              <div className="px-3 py-2 mt-4">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">Conversas Diretas</span>
              </div>
              {canais.filter(c => c.tipo === 'direto').map(canal => (
                <button
                  key={canal.id}
                  onClick={() => selecionarCanal(canal)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                    canalAtivo === canal.id
                      ? 'bg-white shadow-sm ring-1 ring-gray-200/50 text-gray-900'
                      : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                    canalAtivo === canal.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {canal.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold text-sm block">{canal.nome}</span>
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
            <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center">
              {canalAtual?.tipo === 'setor' ? <Hash size={18} /> : <Users size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">#{canalAtual?.nome || 'Selecione um canal'}</h3>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {!canalAtivo ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Selecione um canal para começar.</p>
            </div>
          ) : loadingMsg ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Carregando mensagens...</p>
            </div>
          ) : (mensagens[canalAtivo] || []).length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-gray-400">Nenhuma mensagem ainda.</p>
            </div>
          ) : (
            (mensagens[canalAtivo] || []).map(msg => {
              const isMinhaMsg = msg.autor === nome;
              return (
                <div key={msg.id} className={`flex gap-3 ${isMinhaMsg ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                    isMinhaMsg ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {msg.avatar}
                  </div>
                  <div className={`max-w-[70%] ${isMinhaMsg ? 'text-right' : ''}`}>
                    <div className={`flex items-center gap-2 mb-1 ${isMinhaMsg ? 'justify-end' : ''}`}>
                      <span className="text-sm font-semibold text-gray-900">{msg.autor}</span>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        {isMinhaMsg ? (
                          msg.dataVisualizacao
                            ? <CheckCheck size={10} className="text-blue-500" />
                            : <Check size={10} />
                        ) : null}
                        {msg.horario}
                      </span>
                    </div>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed text-left ${
                      isMinhaMsg
                        ? 'bg-primary text-white rounded-tr-sm'
                        : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                    }`}>
                      {msg.conteudo.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
                        part.match(/^https?:\/\//)
                          ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className={isMinhaMsg ? 'underline text-blue-200' : 'underline text-blue-600'}>{part}</a>
                          : part
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-100 shrink-0">
          <div className="flex items-end gap-3 bg-gray-50 rounded-2xl p-2 ring-1 ring-gray-200/50 relative">
            <div className="relative" ref={anexosRef}>
              <button
                onClick={() => { setShowAnexos(!showAnexos); setShowEmojiPicker(false); }}
                className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
                title="Anexar"
              >
                <Paperclip size={20} />
              </button>
              {showAnexos && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-2 w-48 z-50">
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                    <File size={18} className="text-gray-500" /> Enviar arquivo
                  </button>
                  <button onClick={enviarLocalizacao} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                    <MapPin size={18} className="text-gray-500" /> Localização
                  </button>
                  <button onClick={enviarPedido} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition-colors">
                    <Package size={18} className="text-gray-500" /> Pedido
                  </button>
                </div>
              )}
              <input ref={fileInputRef} type="file" onChange={handleFileUpload} className="hidden" />
            </div>
            <div className="relative" ref={emojiRef}>
              <button
                onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowAnexos(false); }}
                className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100"
                title="Emoji"
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-3 w-72 z-50">
                  <div className="grid grid-cols-8 gap-1">
                    {emojis.map(e => (
                      <button key={e} onClick={() => inserirEmoji(e)} className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg text-lg transition-colors">
                        {e}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              disabled={!mensagem.trim() || !canalAtual?.conversaId}
              className={`p-3 rounded-xl transition-all ${
                mensagem.trim() && canalAtual?.conversaId
                  ? 'bg-primary text-white hover:bg-primary shadow-sm'
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
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
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
                  onClick={() => iniciarConversaDireta(pessoa)}
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
