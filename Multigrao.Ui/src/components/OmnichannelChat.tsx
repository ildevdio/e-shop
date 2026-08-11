import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Bot, UserSearch, Paperclip, Mic, FileText, Image as ImageIcon,
  User, ArrowRightLeft, Plus, Search, MessageSquareText, Clock, Play, Pause, X,
  Trash2, Pencil, Copy, ChevronDown, File, Download, Contact, Menu, Phone, ArrowRight
} from 'lucide-react';
import { atendimentoService, type ChatSession, type Message, type Lead } from '../services/atendimentoService';
import { contatoService, type Contato } from '../services/contatoService';
import { useAuthStore } from '../store/authStore';
import { useUiStore } from '../store/uiStore';

export default function OmnichannelChat() {
  const nome = useAuthStore(state => state.nome);
  const { setModalAberto } = useUiStore();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLeadSidebarOpen, setIsLeadSidebarOpen] = useState(true);
  const [isMobileListOpen, setIsMobileListOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isAttachMenuOpen, setIsAttachMenuOpen] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [chatSearchTerm, setChatSearchTerm] = useState('');
  const [chatFilter, setChatFilter] = useState<'todos' | 'abertos' | 'comercial' | 'fechados'>('abertos');
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isNewAtendimentoOpen, setIsNewAtendimentoOpen] = useState(false);
  const [novoAtendimento, setNovoAtendimento] = useState({ nome: '', telefone: '', interesse: '' });
  const [contatos, setContatos] = useState<Contato[]>([]);
  const [contatoSearch, setContatoSearch] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [attendants, setAttendants] = useState<{ id: number; nome: string; setores: string[] }[]>([]);

  const [contextMenu, setContextMenu] = useState<{ messageId: string; x: number; y: number } | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState<Record<string, number>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioElementsRef = useRef<Record<string, HTMLAudioElement>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    carregarAtendimentos();
    atendimentoService.getUsuarios().then(setAttendants).catch(() => setAttendants([]));
  }, []);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(audioElementsRef.current).forEach(a => a.pause());
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, []);

  const carregarAtendimentos = async () => {
    try {
      setIsLoading(true);
      const data = await atendimentoService.getAtendimentos();
      setChats(data);
      const abertos = data.filter(c => !c.lead.vendaFechada);
      if (abertos.length > 0) setActiveChatId(abertos[0].id);
      else if (data.length > 0) setActiveChatId(data[0].id);
    } catch {
      setChats([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchName = chat.lead.nome.toLowerCase().includes(chatSearchTerm.toLowerCase()) ||
                      chat.lead.interesse.toLowerCase().includes(chatSearchTerm.toLowerCase());
    let matchFilter = true;
    if (chatFilter === 'abertos') matchFilter = !chat.lead.vendaFechada;
    else if (chatFilter === 'fechados') matchFilter = chat.lead.vendaFechada === true;
    else if (chatFilter === 'comercial') matchFilter = chat.lead.origem.toLowerCase().includes('bot') || chat.lead.origem.toLowerCase().includes('whatsapp');
    return matchName && matchFilter;
  });

  const activeChat = filteredChats.find(c => c.id === activeChatId) || filteredChats[0] || null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages]);

  const updateChats = (updater: (prev: ChatSession[]) => ChatSession[]) => {
    setChats(prev => {
      const next = updater(prev);
      if (activeChatId) {
        const stillActive = next.find(c => c.id === activeChatId);
        if (!stillActive && next.length > 0) setActiveChatId(next[0].id);
      }
      return next;
    });
  };

  const updateActiveChat = async (updates: Partial<ChatSession>) => {
    if (!activeChatId) return;
    updateChats(prev => prev.map(c => c.id === activeChatId ? { ...c, ...updates } : c));
    if (updates.iaActive !== undefined) {
      await atendimentoService.atualizarLead(activeChatId, { iaActive: updates.iaActive }).catch(() => {});
    }
  };

  const updateActiveLead = async (leadUpdates: Partial<Lead>) => {
    if (!activeChatId || !activeChat) return;
    updateChats(prev => prev.map(c => c.id === activeChatId ? { ...c, lead: { ...c.lead, ...leadUpdates } } : c));
    await atendimentoService.atualizarLead(activeChatId, leadUpdates).catch(() => {});
  };

  const handleAssumir = () => updateActiveChat({ iaActive: false });

  const addMessageToActiveChat = (msg: Message) => {
    updateChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: [...c.messages, msg] } : c));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeChatId || !activeChat) return;
    if (activeChat.iaActive) updateActiveChat({ iaActive: false });

    const text = inputValue;
    setInputValue('');
    const tempId = Date.now().toString();
    const tempMessage: Message = { id: tempId, text, sender: 'agent', timestamp: new Date() };
    addMessageToActiveChat(tempMessage);

    try {
      const savedMsg = await atendimentoService.enviarMensagem(activeChatId, text, 'agent');
      updateChats(prev => prev.map(c => c.id === activeChatId ? { ...c, messages: c.messages.map(m => m.id === tempId ? savedMsg : m) } : c));
    } catch {
      console.error("Erro ao enviar mensagem");
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ messageId: msg.id, x: e.clientX, y: e.clientY });
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    setContextMenu(null);
  };

  const handleStartEdit = (msg: Message) => {
    setEditingMessageId(msg.id);
    setEditingText(msg.text);
    setContextMenu(null);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId || !activeChatId || !editingText.trim()) return;
    updateChats(prev => prev.map(c => c.id === activeChatId ? {
      ...c,
      messages: c.messages.map(m => m.id === editingMessageId ? { ...m, text: editingText, edited: true } : m)
    } : c));
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
  };

  const handleDeleteMessage = (msgId: string) => {
    if (!activeChatId) return;
    updateChats(prev => prev.map(c => c.id === activeChatId ? {
      ...c,
      messages: c.messages.filter(m => m.id !== msgId)
    } : c));
    setDeleteConfirmId(null);
    setModalAberto(false);
    setContextMenu(null);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        const msg: Message = {
          id: Date.now().toString(),
          text: `🎤 Mensagem de voz (${formatRecordingTime(recordingTime)})`,
          sender: 'agent',
          timestamp: new Date(),
          type: 'audio',
          fileUrl: url,
          duration: formatRecordingTime(recordingTime),
        };
        addMessageToActiveChat(msg);
        stream.getTracks().forEach(t => t.stop());
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
        setRecordingTime(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch {
      console.error("Erro ao acessar microfone");
      alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingTime(0);
  };

  const toggleAudioPlayback = (msgId: string, url: string) => {
    if (playingAudioId === msgId) {
      audioElementsRef.current[msgId]?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (playingAudioId && audioElementsRef.current[playingAudioId]) {
      audioElementsRef.current[playingAudioId].pause();
    }

    if (!audioElementsRef.current[msgId]) {
      const audio = new Audio(url);
      audioElementsRef.current[msgId] = audio;
      audio.ontimeupdate = () => {
        setAudioProgress(prev => ({ ...prev, [msgId]: (audio.currentTime / audio.duration) * 100 }));
      };
      audio.onended = () => {
        setPlayingAudioId(null);
        setAudioProgress(prev => ({ ...prev, [msgId]: 0 }));
      };
    }

    audioElementsRef.current[msgId].play();
    setPlayingAudioId(msgId);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const msg: Message = {
      id: Date.now().toString(),
      text: type === 'image' ? `📷 ${file.name}` : `📄 ${file.name}`,
      sender: 'agent',
      timestamp: new Date(),
      type,
      fileUrl: url,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
    };
    addMessageToActiveChat(msg);
    e.target.value = '';
  };

  const handleTransfer = () => setIsTransferModalOpen(true);

  const handleNovoAtendimento = async () => {
    setNovoAtendimento({ nome: '', telefone: '', interesse: '' });
    setContatoSearch('');
    setIsManualMode(false);
    setIsNewAtendimentoOpen(true);
    setModalAberto(true);
    try {
      const data = await contatoService.getContatos();
      setContatos(data);
    } catch {
      setContatos([]);
    }
  };

  const handleSelectContato = (contato: Contato) => {
    setNovoAtendimento({ nome: contato.nome, telefone: contato.telefone, interesse: '' });
    setIsManualMode(true);
  };

  const handleCriarAtendimento = async () => {
    if (!novoAtendimento.nome.trim()) return;
    try {
      const newChat = await atendimentoService.criarAtendimento(
        novoAtendimento.nome, novoAtendimento.telefone, novoAtendimento.interesse
      );
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newChat.id);
      setIsNewAtendimentoOpen(false);
      setModalAberto(false);
    } catch {
      const fallbackChat: ChatSession = {
        id: Date.now().toString(),
        lead: {
          nome: novoAtendimento.nome,
          telefone: novoAtendimento.telefone,
          interesse: novoAtendimento.interesse,
          origem: 'Manual',
          vendaFechada: false,
          resumoIA: '',
        },
        messages: [],
        iaActive: true,
      };
      setChats(prev => [fallbackChat, ...prev]);
      setActiveChatId(fallbackChat.id);
      setIsNewAtendimentoOpen(false);
      setModalAberto(false);
    }
  };

  const contatosFiltrados = contatos.filter(c =>
    c.nome.toLowerCase().includes(contatoSearch.toLowerCase()) ||
    c.telefone.includes(contatoSearch) ||
    (c.clienteNome && c.clienteNome.toLowerCase().includes(contatoSearch.toLowerCase()))
  );

  const confirmTransfer = (attendantName: string) => {
    alert(`Lead transferido para ${attendantName} com sucesso!`);
    if (!activeChat) return;
    updateActiveChat({
      lead: { ...activeChat.lead, origem: `Transferido para: ${attendantName}` },
      messages: [
        ...activeChat.messages,
        { id: Date.now().toString(), text: `🔄 Atendimento transferido para ${attendantName}.`, sender: 'bot', timestamp: new Date() }
      ]
    });
    setIsTransferModalOpen(false);
  };

  const simulateAIInteraction = () => {
    if (!activeChat) return;
    const aiMessage: Message = {
      id: Date.now().toString(),
      text: "O cliente informou: Preciso para entrega rápida na Vila Mariana. Serão 50kg de Castanha de Caju W1 e 30kg de Chia, embalados a granel em sacos de 10kg. Faturado no boleto bancário.",
      sender: 'bot', timestamp: new Date()
    };
    const updatedLead: Lead = {
      ...activeChat.lead, bairro: 'Vila Mariana', interesse: 'Castanha de Caju & Chia',
      quantidade: '80', embalagem: 'A Granel (Sacaria 20kg - 25kg)',
      pagamento: 'Boleto Faturado (14/28 dias)', tipoCliente: 'Empório / Loja de Produtos Naturais'
    };
    updateChats(prev => prev.map(c => c.id === activeChatId ? { ...c, lead: updatedLead, messages: [...c.messages, aiMessage] } : c));
  };

  const simulateVendaFechada = async () => {
    if (!activeChatId || !activeChat) return;
    try {
      await atendimentoService.finalizarAtendimento(activeChatId);
      updateActiveLead({ vendaFechada: true });
      alert('Venda fechada com sucesso! Logística notificada para separação.');
    } catch {
      alert('Erro ao fechar venda. O backend pode estar offline.');
    }
  };

  const isChecklistComplete = () => {
    if (!activeChat) return false;
    return !!activeChat.lead.bairro && !!activeChat.lead.interesse && !!activeChat.lead.quantidade &&
           !!activeChat.lead.embalagem && !!activeChat.lead.tipoCliente && !!activeChat.lead.pagamento;
  };

  const handleFinalizarAtendimento = async () => {
    if (!activeChatId || !activeChat) return;
    try {
      await atendimentoService.finalizarAtendimento(activeChatId);
      updateActiveLead({ vendaFechada: true });
      setChatFilter('todos');
      alert('Atendimento finalizado com sucesso!');
    } catch {
      alert('Erro ao finalizar atendimento.');
    }
  };

  const handleGenerateSummary = async () => {
    if (!activeChatId || !activeChat) return;
    setIsGeneratingSummary(true);
    try {
      const data = await atendimentoService.gerarResumoIa(activeChatId);
      updateActiveLead({ resumoIA: data.resumoIA });
    } catch {
      updateActiveLead({ resumoIA: "Resumo IA (Fallback): Cliente interessado. Dados extraídos offline." });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const isLeadValid = activeChat ? isChecklistComplete() : false;

  const renderMessageContent = (msg: Message) => {
    if (msg.type === 'image' && msg.fileUrl) {
      return (
        <div>
          <img src={msg.fileUrl} alt={msg.fileName} className="rounded-lg max-w-[280px] max-h-[300px] object-cover mb-1" />
          <div className="flex items-center gap-1 text-[10px] opacity-70">
            <ImageIcon size={10} /> {msg.fileName}
          </div>
        </div>
      );
    }
    if (msg.type === 'file' && msg.fileUrl) {
      return (
        <a href={msg.fileUrl} download={msg.fileName} className="flex items-center gap-3 no-underline">
          <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
            <File size={20} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">{msg.fileName}</div>
            <div className="text-[10px] opacity-70">{msg.fileSize}</div>
          </div>
          <Download size={14} className="shrink-0 opacity-70" />
        </a>
      );
    }
    if (msg.type === 'audio' && msg.fileUrl) {
      const isPlaying = playingAudioId === msg.id;
      const progress = audioProgress[msg.id] || 0;
      return (
        <div className="flex items-center gap-3 min-w-[200px]">
          <button
            onClick={(e) => { e.stopPropagation(); toggleAudioPlayback(msg.id, msg.fileUrl!); }}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0 hover:bg-white/30 transition-colors"
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
          <div className="flex-1">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white/70 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="flex justify-between text-[10px] opacity-70 mt-0.5">
              <span>{isPlaying ? formatRecordingTime(Math.floor((progress / 100) * (parseInt(msg.duration?.split(':')[0] || '0') * 60 + parseInt(msg.duration?.split(':')[1] || '0')))) : msg.duration}</span>
            </div>
          </div>
        </div>
      );
    }
    return msg.text;
  };

  return (
    <div className="h-full flex bg-white overflow-hidden">
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => handleFileSelect(e, 'file')} />
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, 'image')} />

      {/* SIDEBAR FIXO — lista de atendimentos */}
      {/* Desktop: always visible. Mobile: overlay drawer */}
      <div className={`absolute md:relative inset-y-0 left-0 z-20 h-full w-[300px] md:w-[320px] shrink-0 bg-[#f8fafc] flex flex-col border-r border-gray-100 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isMobileListOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
          {/* Título + busca — centralizados na coluna */}
          <div className="absolute left-4 right-4 z-[61] bg-[#f8fafc] pb-4" style={{ top: '22px' }}>
            <h2 className="text-xl font-serif font-bold text-gray-900 mb-4 pl-12 tracking-wide flex items-center justify-between">
              Atendimentos
              <button onClick={handleNovoAtendimento} className="p-2 bg-primary text-white rounded-xl hover:bg-primary transition-colors shadow-sm" title="Novo atendimento">
                <Plus size={16} />
              </button>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text" placeholder="Buscar cliente ou produto..."
                value={chatSearchTerm} onChange={(e) => setChatSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm transition-all shadow-sm"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-gray-100 pt-[128px]">
            {(['abertos', 'fechados', 'todos'] as const).map(f => (
              <button key={f} onClick={() => setChatFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                  chatFilter === f ? 'bg-primary text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                }`}>
                {f === 'abertos' ? 'Em Aberto' : f === 'fechados' ? 'Fechados' : 'Todos'}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
            {isLoading ? (
              <div className="flex items-center justify-center h-32 text-sm text-gray-400">Carregando...</div>
            ) : filteredChats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center px-4">
                <MessageSquareText size={32} className="text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-400">Nenhum atendimento</p>
                <p className="text-xs text-gray-300 mt-1">Quando um lead entrar em contato, ele aparecerá aqui.</p>
              </div>
            ) : (
              filteredChats.map((chat) => {
                const lastMessage = chat.messages[chat.messages.length - 1];
                return (
                  <div key={chat.id} onClick={() => { setActiveChatId(chat.id); setIsMobileListOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left cursor-pointer ${
                      activeChatId === chat.id ? 'bg-white shadow-sm ring-1 ring-gray-200/50 text-gray-900' : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
                    }`}>
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-xs font-bold">
                        {chat.lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#f8fafc] ${chat.iaActive ? 'bg-primary' : 'bg-gray-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm truncate">{chat.lead.nome}</span>
                        <span className="text-[10px] text-gray-400 shrink-0 ml-2">{lastMessage ? formatTime(new Date(lastMessage.timestamp)) : ''}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {lastMessage?.type === 'audio' ? '🎤 Áudio' : lastMessage?.type === 'image' ? '📷 Foto' : lastMessage?.type === 'file' ? '📄 Arquivo' : lastMessage?.text || 'Novo atendimento...'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      {/* ÁREA PRINCIPAL DO CHAT */}
      <div className="flex-1 flex flex-col min-w-0 relative">

        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquareText size={28} className="text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">Selecione um atendimento</h3>
              <p className="text-sm text-gray-400 mt-1">Escolha um cliente na lista ao lado para iniciar.</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="h-[72px] border-b border-gray-100 px-4 md:px-6 md:pl-16 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button onClick={() => setIsMobileListOpen(true)} className="md:hidden p-2 -ml-1 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
                  <Menu size={20} />
                </button>
                <div className="relative">
                  <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center text-sm font-bold">
                    {activeChat.lead.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${activeChat.iaActive ? 'bg-primary' : 'bg-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{activeChat.lead.nome}</h3>
                  {!activeChat.iaActive ? (
                    <p className="text-xs text-gray-500 font-medium">Atendente: {nome || 'Operador'}</p>
                  ) : (
                    <p className="text-xs text-gray-400">{activeChat.lead.telefone || 'Sem telefone'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeChat.iaActive ? (
                  <>
                    <button onClick={handleAssumir} className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-primary transition-colors">
                      Assumir Atendimento
                    </button>
                    <button onClick={simulateAIInteraction} className="bg-gray-100 text-black border border-gray-200 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors">
                      <Bot size={16} /> Extrair IA
                    </button>
                  </>
                ) : (
                  <>
                    <div className="relative">
                      <button onClick={handleTransfer} className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500" title="Transferir">
                        <ArrowRightLeft size={18} />
                      </button>
                      {isTransferModalOpen && (
                        <div className="absolute top-full right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 w-64 z-50">
                          <span className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2 block">Transferir para:</span>
                          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto">
                            {attendants.map(att => (
                              <button key={att.id} onClick={() => confirmTransfer(att.nome)} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl text-left transition-colors">
                                <div className="w-8 h-8 rounded-full bg-gray-200 text-black flex items-center justify-center font-bold text-sm">{att.nome.charAt(0)}</div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-gray-700">{att.nome}</span>
                                  <span className="text-[10px] text-gray-500">{att.setores?.join(', ') || 'Sem setor'}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-semibold bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                      <Bot size={16} />
                      <span>IA</span>
                      <button onClick={() => updateActiveChat({ iaActive: !activeChat.iaActive })}
                        className={`w-10 h-5 rounded-full relative transition-colors ${activeChat.iaActive ? 'bg-primary' : 'bg-gray-300'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-all ${activeChat.iaActive ? 'left-[22px]' : 'left-[3px]'}`} />
                      </button>
                    </div>
                    <button onClick={() => setIsLeadSidebarOpen(!isLeadSidebarOpen)}
                      className={`p-2.5 rounded-xl transition-colors ${isLeadSidebarOpen ? 'bg-gray-200 text-black' : 'text-gray-500 hover:bg-gray-100'}`}>
                      <UserSearch size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Mensagens */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {activeChat.messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-gray-400">Nenhuma mensagem ainda. Inicie a conversa abaixo.</p>
                </div>
              ) : (
                activeChat.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isEditing = editingMessageId === msg.id;

                  return (
                    <div key={msg.id} className={`flex gap-3 ${isUser ? '' : 'flex-row-reverse'}`}
                      onContextMenu={(e) => handleContextMenu(e, msg)}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        isUser ? 'bg-gray-200 text-gray-600' : 'bg-primary text-white'
                      }`}>
                        {isUser ? 'CL' : msg.sender === 'bot' ? <Bot size={16} /> : 'AT'}
                      </div>
                      <div className={`max-w-[70%] ${isUser ? '' : 'text-right'}`}>
                        <div className={`flex items-center gap-2 mb-1 ${isUser ? '' : 'justify-end'}`}>
                          <span className="text-sm font-semibold text-gray-900">{isUser ? 'Cliente' : msg.sender === 'bot' ? 'IA Bot' : 'Atendente'}</span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            {msg.edited && <span className="italic">editada</span>}
                            <Clock size={10} /> {formatTime(new Date(msg.timestamp))}
                          </span>
                          <button onClick={(e) => handleContextMenu(e, msg)}
                            className="p-0.5 rounded hover:bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ChevronDown size={12} className="text-gray-400" />
                          </button>
                        </div>
                        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed group relative ${
                          isUser ? 'bg-gray-100 text-gray-800 rounded-tl-sm' : 'bg-primary text-white rounded-tr-sm'
                        }`}>
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              <input type="text" value={editingText} onChange={(e) => setEditingText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit(); }}
                                className="bg-transparent border-b border-current outline-none text-sm w-full" autoFocus />
                              <div className="flex gap-2 justify-end">
                                <button onClick={handleCancelEdit} className="text-[10px] opacity-70 hover:opacity-100">Cancelar</button>
                                <button onClick={handleSaveEdit} className="text-[10px] font-bold hover:opacity-80">Salvar</button>
                              </div>
                            </div>
                          ) : (
                            renderMessageContent(msg)
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Context Menu */}
            {contextMenu && (
              <div ref={contextMenuRef}
                className="fixed z-[60] bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 w-48"
                style={{ top: contextMenu.y, left: contextMenu.x }}>
                {(() => {
                  const msg = activeChat.messages.find(m => m.id === contextMenu.messageId);
                  if (!msg) return null;
                  return (
                    <>
                      {msg.text && (
                        <button onClick={() => handleCopyMessage(msg.text)}
                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <Copy size={15} className="text-gray-400" /> Copiar
                        </button>
                      )}
                      {msg.sender === 'agent' && (
                        <>
                          <button onClick={() => handleStartEdit(msg)}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                            <Pencil size={15} className="text-gray-400" /> Editar
                          </button>
                          <button onClick={() => { setDeleteConfirmId(msg.id); setModalAberto(true); setContextMenu(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors">
                            <Trash2 size={15} /> Excluir
                          </button>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Delete Confirmation */}
            {deleteConfirmId && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => { setDeleteConfirmId(null); setModalAberto(false); }}>
                <div className="bg-white rounded-2xl p-6 shadow-xl w-80" onClick={e => e.stopPropagation()}>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Excluir mensagem?</h3>
                  <p className="text-sm text-gray-500 mb-5">Essa ação não pode ser desfeita.</p>
                  <div className="flex gap-3">
                    <button onClick={() => { setDeleteConfirmId(null); setModalAberto(false); }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                      Cancelar
                    </button>
                    <button onClick={() => handleDeleteMessage(deleteConfirmId)}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary transition-colors">
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
              {isRecording ? (
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-2xl p-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-gray-700">{formatRecordingTime(recordingTime)}</span>
                  <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden mx-2">
                    <div className="h-full bg-gray-400 rounded-full animate-pulse" style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }} />
                  </div>
                  <button onClick={cancelRecording} className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500" title="Cancelar">
                    <X size={20} />
                  </button>
                  <button onClick={stopRecording} className="p-3 bg-primary text-white rounded-xl hover:bg-primary transition-colors shadow-sm" title="Enviar">
                    <Send size={18} />
                  </button>
                </div>
              ) : (
                <div className="flex items-end gap-3 bg-gray-50 rounded-2xl p-2 ring-1 ring-gray-200/50 max-w-4xl mx-auto">
                  <button disabled={activeChat.iaActive} onClick={() => setIsAttachMenuOpen(!isAttachMenuOpen)}
                    className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100 disabled:opacity-50">
                    <Paperclip size={20} />
                  </button>
                  <button disabled={activeChat.iaActive} onClick={startRecording}
                    className="p-2.5 text-gray-400 hover:text-gray-600 transition-colors rounded-xl hover:bg-gray-100 disabled:opacity-50">
                    <Mic size={20} />
                  </button>
                  <input
                    type="text" value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSend(e); }}
                    disabled={activeChat.iaActive}
                    placeholder={activeChat.iaActive ? "IA ativa. Assuma o atendimento..." : "Digite sua mensagem..."}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-gray-800 placeholder-gray-400 py-2"
                  />
                  <button onClick={handleSend} disabled={activeChat.iaActive || !inputValue.trim()}
                    className={`p-3 rounded-xl transition-all ${
                      inputValue.trim() && !activeChat.iaActive ? 'bg-primary text-white hover:bg-primary shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}>
                    <Send size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Attach menu */}
            {isAttachMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsAttachMenuOpen(false)} />
                <div className="absolute bottom-[80px] left-16 bg-white border border-gray-100 rounded-2xl p-2 w-56 shadow-xl z-50 flex flex-col gap-1">
                  <button onClick={() => { imageInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gray-500 text-white flex items-center justify-center"><ImageIcon size={18} /></div>
                    <span className="text-sm font-medium text-gray-700">Foto ou Imagem</span>
                  </button>
                  <button onClick={() => { fileInputRef.current?.click(); setIsAttachMenuOpen(false); }}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center"><FileText size={18} /></div>
                    <span className="text-sm font-medium text-gray-700">Documento</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* LEAD SIDEBAR (CRM) — painel lateral direito */}
      {activeChat && (
        <>
          {/* Mobile backdrop */}
          {isLeadSidebarOpen && !activeChat.iaActive && (
            <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setIsLeadSidebarOpen(false)} />
          )}
          <div className={`transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] shrink-0 overflow-hidden ${
            (!isLeadSidebarOpen || activeChat.iaActive) ? 'w-0 opacity-0' : 'fixed md:relative inset-y-0 right-0 z-30 md:z-auto w-[300px] md:w-[320px] opacity-100'
          }`}>
          <div className="h-full bg-[#f8fafc] border-l border-gray-100 flex flex-col w-[320px]">
            <div className="p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Ficha do Cliente</h2>
              <p className="text-[11px] text-gray-400 mt-1">Dados cadastrais para cotação e expedição.</p>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cadastro</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Nome / Razão Social</label>
                    <input type="text" value={activeChat.lead.nome} onChange={(e) => updateActiveLead({ nome: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Telefone</label>
                    <input type="text" value={activeChat.lead.telefone} onChange={(e) => updateActiveLead({ telefone: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Bairro de Entrega *</label>
                    <input type="text" value={activeChat.lead.bairro || ''} onChange={(e) => updateActiveLead({ bairro: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Tipo de Cliente *</label>
                    <select value={activeChat.lead.tipoCliente || ''} onChange={(e) => updateActiveLead({ tipoCliente: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10">
                      <option value="">Selecione...</option>
                      <option value="Varejo">Varejo</option>
                      <option value="Empório">Empório / Produtos Naturais</option>
                      <option value="Indústria">Indústria de Alimentos</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Cotação</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Produtos de Interesse *</label>
                    <input type="text" value={activeChat.lead.interesse} onChange={(e) => updateActiveLead({ interesse: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Quantidade *</label>
                      <input type="text" value={activeChat.lead.quantidade || ''} onChange={(e) => updateActiveLead({ quantidade: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10" placeholder="kg" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">Pagamento *</label>
                      <select value={activeChat.lead.pagamento || ''} onChange={(e) => updateActiveLead({ pagamento: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10">
                        <option value="">Selecione</option>
                        <option value="PIX">PIX</option>
                        <option value="Boleto">Boleto</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 mb-1">Embalagem *</label>
                    <select value={activeChat.lead.embalagem || ''} onChange={(e) => updateActiveLead({ embalagem: e.target.value })} className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-black focus:ring-1 focus:ring-black/10">
                      <option value="">Selecione...</option>
                      <option value="Granel">A Granel (20kg)</option>
                      <option value="Fracionado">Pacotes 1kg</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Resumo IA</span>
                  <button onClick={handleGenerateSummary} disabled={isGeneratingSummary} className="text-xs bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded-lg hover:bg-gray-200 transition-colors">
                    Gerar
                  </button>
                </div>
                {isGeneratingSummary ? (
                  <div className="text-xs text-black animate-pulse text-center py-4 font-medium">Processando...</div>
                ) : (
                  <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-wrap">
                    {activeChat.lead.resumoIA || 'Nenhum resumo gerado.'}
                  </p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 space-y-2">
              {!isLeadValid && <div className="text-[10px] text-gray-500 font-bold text-center">Preencha os campos obrigatórios (*)</div>}
              <button onClick={simulateVendaFechada} disabled={activeChat.lead.vendaFechada || !isLeadValid}
                className="w-full bg-gray-100 text-gray-700 border border-gray-200 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50">
                {activeChat.lead.vendaFechada ? 'Venda Registrada' : 'Confirmar Pedido'}
              </button>
              <button onClick={handleFinalizarAtendimento} disabled={activeChat.lead.vendaFechada}
                className="w-full bg-primary text-white py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-primary transition-all disabled:opacity-50">
                {activeChat.lead.vendaFechada ? 'Atendimento Finalizado' : 'Finalizar Atendimento'}
              </button>
            </div>
          </div>
        </div>
        </>
      )}

      {/* MODAL — Novo Atendimento */}
      {isNewAtendimentoOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] flex items-center justify-center" onClick={() => { setIsNewAtendimentoOpen(false); setModalAberto(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] max-h-[80vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-serif font-bold text-gray-900">Novo Atendimento</h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Selecione um contato ou crie manualmente</p>
              </div>
              <button onClick={() => { setIsNewAtendimentoOpen(false); setModalAberto(false); }} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {!isManualMode ? (
                <>
                  {/* Search */}
                  <div className="px-6 pt-4 pb-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input
                        type="text" placeholder="Buscar por nome, telefone ou cliente..."
                        value={contatoSearch} onChange={(e) => setContatoSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/15 focus:border-black text-sm transition-all"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Contact list */}
                  <div className="flex-1 overflow-y-auto px-4 pb-2">
                    {contatosFiltrados.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <Contact size={28} className="text-gray-300 mb-2" />
                        <p className="text-sm text-gray-400 font-medium">
                          {contatos.length === 0 ? 'Nenhum contato cadastrado' : 'Nenhum contato encontrado'}
                        </p>
                        <p className="text-[11px] text-gray-300 mt-1">Crie um atendimento manualmente abaixo.</p>
                      </div>
                    ) : (
                      <div className="space-y-0.5">
                        {contatosFiltrados.map(c => (
                          <button key={c.id} onClick={() => handleSelectContato(c)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-50 transition-colors text-left group">
                            <div className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center text-xs font-bold shrink-0 group-hover:bg-primary transition-colors">
                              {c.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">{c.nome}</p>
                              <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                <Phone size={10} /> {c.telefone}
                                {c.clienteNome && <span className="text-gray-300">· {c.clienteNome}</span>}
                              </p>
                            </div>
                            <ArrowRight size={14} className="text-gray-300 group-hover:text-gray-600 transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual button */}
                  <div className="px-6 py-3 border-t border-gray-100">
                    <button onClick={() => setIsManualMode(true)}
                      className="w-full py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-semibold text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all flex items-center justify-center gap-2">
                      <User size={15} /> Criar com número manual
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Manual form */}
                  <div className="px-6 py-5 space-y-3">
                    {novoAtendimento.nome && (
                      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-1">
                        <div className="w-8 h-8 bg-primary text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                          {novoAtendimento.nome.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{novoAtendimento.nome}</p>
                          <p className="text-[11px] text-gray-400">{novoAtendimento.telefone || 'Sem telefone'}</p>
                        </div>
                        <button onClick={() => { setNovoAtendimento({ nome: '', telefone: '', interesse: '' }); setIsManualMode(false); }}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors text-gray-400">
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Nome / Razão Social *</label>
                      <input type="text" value={novoAtendimento.nome} onChange={(e) => setNovoAtendimento(p => ({ ...p, nome: e.target.value }))}
                        placeholder="Ex: Mercearia São Jorge"
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all" autoFocus />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Telefone</label>
                      <input type="text" value={novoAtendimento.telefone} onChange={(e) => setNovoAtendimento(p => ({ ...p, telefone: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCriarAtendimento(); }}
                        placeholder="(11) 99999-0000"
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all" />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Interesse</label>
                      <input type="text" value={novoAtendimento.interesse} onChange={(e) => setNovoAtendimento(p => ({ ...p, interesse: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleCriarAtendimento(); }}
                        placeholder="Ex: Castanha de Caju, Chia Orgânica"
                        className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-black focus:ring-1 focus:ring-black/10 transition-all" />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-6 py-3 border-t border-gray-100 flex gap-3">
                    <button onClick={() => { setIsManualMode(false); setNovoAtendimento({ nome: '', telefone: '', interesse: '' }); }}
                      className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                      Voltar
                    </button>
                    <button onClick={handleCriarAtendimento} disabled={!novoAtendimento.nome.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      Iniciar Atendimento
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
