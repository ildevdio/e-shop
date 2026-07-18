import { useState, useRef, useEffect, useCallback } from 'react';
import * as signalR from '@microsoft/signalr';
import { Send, Search, Hash, Users, MessageSquareText, Clock, Smile, Paperclip, Phone, Video, UserPlus, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

interface Mensagem {
  id: string;
  autor: string;
  setor: string;
  conteudo: string;
  horario: string;
  avatar: string;
  tipo: 'texto' | 'arquivo' | 'sistema';
}

interface Canal {
  id: string;
  nome: string;
  tipo: 'setor' | 'geral' | 'direto';
  ultimaMensagem: string;
  naoLidas: number;
  online?: boolean;
  membros?: number;
}

const canaisIniciais: Canal[] = [
  { id: 'geral', nome: 'Geral', tipo: 'geral', ultimaMensagem: 'Bom dia pessoal!', naoLidas: 2, membros: 12 },
  { id: 'comercial', nome: 'Comercial', tipo: 'setor', ultimaMensagem: 'Pedido #1005 aprovado', naoLidas: 0, membros: 3 },
  { id: 'logistica', nome: 'Logística', tipo: 'setor', ultimaMensagem: 'Rota do dia confirmada', naoLidas: 1, membros: 4 },
  { id: 'separacao', nome: 'Separação', tipo: 'setor', ultimaMensagem: 'Fila vazia, liberados', naoLidas: 0, membros: 2 },
  { id: 'conferencia', nome: 'Conferência', tipo: 'setor', ultimaMensagem: 'Nota #1003 bipada', naoLidas: 0, membros: 2 },
  { id: 'admin', nome: 'Administração', tipo: 'setor', ultimaMensagem: 'Reunião amanhã 9h', naoLidas: 3, membros: 2 },
];

const mensagensIniciais: Record<string, Mensagem[]> = {
  'geral': [
    { id: '1', autor: 'Carlos Admin', setor: 'Admin', conteudo: 'Bom dia pessoal! Lembrete: reunião de integração sexta-feira às 14h.', horario: '08:30', avatar: 'CA', tipo: 'texto' },
    { id: '2', autor: 'Ana Comercial', setor: 'Comercial', conteudo: 'Bom dia! Recebi o pedido #1007, já está no sistema.', horario: '08:45', avatar: 'AC', tipo: 'texto' },
    { id: '3', autor: 'João Logística', setor: 'Logística', conteudo: 'Rota do dia confirmada, 5 paradas. Motorista já saiu.', horario: '09:00', avatar: 'JL', tipo: 'texto' },
    { id: '4', autor: 'Maria Separação', setor: 'Separação', conteudo: 'Fila de separação limpa! Podem mandar mais pedidos.', horario: '09:15', avatar: 'MS', tipo: 'texto' },
  ],
  'comercial': [
    { id: '5', autor: 'Ana Comercial', setor: 'Comercial', conteudo: 'Pessoal, cliente pediu urgência no pedido #1005. Alguém pode dar um retorno?', horario: '10:00', avatar: 'AC', tipo: 'texto' },
    { id: '6', autor: 'Carlos Admin', setor: 'Admin', conteudo: 'Verifiquei, está na separação. Deve sair até 11h.', horario: '10:05', avatar: 'CA', tipo: 'texto' },
  ],
  'logistica': [
    { id: '7', autor: 'João Logística', setor: 'Logística', conteudo: 'Rota otimizada pronta. 3 pedidos na rota de Boa Viagem.', horario: '08:30', avatar: 'JL', tipo: 'texto' },
    { id: '8', autor: 'Pedro Motorista', setor: 'Logística', conteudo: 'Saindo agora, primeira entrega em 20 min.', horario: '08:45', avatar: 'PM', tipo: 'texto' },
  ],
};

export default function Chat() {
  const nome = useAuthStore(state => state.nome);
  const [canais] = useState<Canal[]>(canaisIniciais);
  const [canalAtivo, setCanalAtivo] = useState('geral');
  const [mensagem, setMensagem] = useState('');
  const [mensagens, setMensagens] = useState<Record<string, Mensagem[]>>(mensagensIniciais);
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [showNovoChat, setShowNovoChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
          connection.on('ReceberMensagemInterna', (canalId: string, msg: Mensagem) => {
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

  const enviarMensagem = () => {
    if (!mensagem.trim()) return;

    const novaMsg: Mensagem = {
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

  return (
    <div className="h-full flex overflow-hidden bg-white rounded-[2rem] shadow-sm border border-gray-100">
      {/* Sidebar de Canais */}
      <div className="w-full md:w-[260px] shrink-0 bg-[#f8fafc] border-r border-gray-100 flex flex-col">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquareText size={20} className="text-black" /> Chat Interno
            </h2>
            <button 
              onClick={() => setShowNovoChat(true)}
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
          {canais.filter(c => c.tipo !== 'direto').map(canal => (
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
                <p className="text-xs text-gray-400 truncate mt-0.5">{canal.ultimaMensagem}</p>
              </div>
            </button>
          ))}

          <div className="px-3 py-2 mt-4">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.12em]">Conversas Diretas</span>
          </div>
          {[
            { id: 'dir-carlos', nome: 'Carlos Admin', online: true, status: 'Online' },
            { id: 'dir-ana', nome: 'Ana Comercial', online: true, status: 'Online' },
            { id: 'dir-joao', nome: 'João Logística', online: false, status: 'Offline' },
          ].map(pessoa => (
            <button
              key={pessoa.id}
              onClick={() => setCanalAtivo(pessoa.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left ${
                canalAtivo === pessoa.id
                  ? 'bg-white shadow-sm ring-1 ring-gray-200/50 text-gray-900'
                  : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                  canalAtivo === pessoa.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {pessoa.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#f8fafc] ${
                  pessoa.online ? 'bg-gray-600' : 'bg-gray-300'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-sm block">{pessoa.nome}</span>
                <p className="text-xs text-gray-400">{pessoa.status}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Janela de Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-[72px] border-b border-gray-100 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
              {canalAtual?.tipo === 'geral' ? <Hash size={18} /> : <Users size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-gray-900">#{canalAtual?.nome || 'Geral'}</h3>
              <p className="text-xs text-gray-400">{canalAtual?.membros || 12} membros</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <Phone size={18} />
            </button>
            <button className="p-2.5 hover:bg-gray-100 rounded-xl transition-colors text-gray-500">
              <Video size={18} />
            </button>
            <div className="flex -space-x-2 ml-2">
              {['CA', 'AC', 'JL', 'MS'].map((avatar, i) => (
                <div key={i} className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 border-2 border-white">
                  {avatar}
                </div>
              ))}
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-400 border-2 border-white">
                +{((canalAtual?.membros || 12) - 4)}
              </div>
            </div>
          </div>
        </div>

        {/* Mensagens */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {(mensagens[canalAtivo] || []).map(msg => {
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
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{msg.setor}</span>
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
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
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

      {/* Modal Nova Conversa */}
      {showNovoChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Nova Conversa</h2>
              <button onClick={() => setShowNovoChat(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <p className="text-gray-500 text-sm mb-4">Inicie uma conversa direta com qualquer funcionário.</p>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar por nome ou setor..."
                className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-black text-sm"
              />
            </div>
            <div className="space-y-2">
              {[
                { nome: 'Carlos Admin', setor: 'Administração', online: true },
                { nome: 'Ana Comercial', setor: 'Comercial', online: true },
                { nome: 'João Logística', setor: 'Logística', online: false },
                { nome: 'Maria Separação', setor: 'Separação', online: true },
              ].map((pessoa, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setCanalAtivo(`dir-${pessoa.nome.split(' ')[0].toLowerCase()}`);
                    setShowNovoChat(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center text-sm font-bold text-gray-600">
                      {pessoa.nome.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      pessoa.online ? 'bg-gray-600' : 'bg-gray-300'
                    }`} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-gray-900 block">{pessoa.nome}</span>
                    <span className="text-xs text-gray-400">{pessoa.setor}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
