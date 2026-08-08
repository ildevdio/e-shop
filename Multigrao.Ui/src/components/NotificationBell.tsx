import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ShoppingCart, Info, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { notificacaoService, type Notificacao } from '../services/notificacaoService';

const TIPO_ICONE: Record<string, typeof Info> = {
  pedido: ShoppingCart,
  aviso: AlertTriangle,
  sistema: Info,
  info: Info,
};

const TIPO_COR: Record<string, string> = {
  pedido: 'bg-blue-500/10 text-blue-600',
  aviso: 'bg-amber-500/10 text-amber-600',
  sistema: 'bg-gray-500/10 text-gray-600',
  info: 'bg-gray-500/10 text-gray-600',
};

export default function NotificationBell({ className }: { className?: string }) {
  const { usuarioId, setores } = useAuthStore();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [count, setCount] = useState(0);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const carregar = async () => {
    const params = { usuarioId: usuarioId ?? undefined, setor: setores[0] ?? undefined };
    const [lista, n] = await Promise.all([
      notificacaoService.listar(params),
      notificacaoService.contarNaoLidas(params),
    ]);
    setNotificacoes(lista);
    setCount(n);
  };

  useEffect(() => {
    carregar();
    const interval = setInterval(carregar, 15000);
    return () => clearInterval(interval);
  }, [usuarioId, setores]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const marcarLida = async (n: Notificacao) => {
    await notificacaoService.marcarLida(n.id);
    setNotificacoes(prev => prev.map(x => x.id === n.id ? { ...x, lida: true } : x));
    setCount(prev => Math.max(0, prev - 1));
    if (n.link) { setAberto(false); navigate(n.link); }
  };

  const marcarTodasLidas = async () => {
    const params = { usuarioId: usuarioId ?? undefined, setor: setores[0] ?? undefined };
    await notificacaoService.marcarTodasLidas(params);
    setNotificacoes(prev => prev.map(x => ({ ...x, lida: true })));
    setCount(0);
  };

  const tempoRelativo = (data: string) => {
    const diff = Date.now() - new Date(data).getTime();
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'agora';
    if (min < 60) return `${min}min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return `${d}d`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAberto(!aberto)}
        className={`relative flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted hover:text-foreground ${className ?? 'text-muted-foreground'}`}
        title="Notificações"
      >
        <Bell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-xl z-50">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">Notificações</h3>
            {count > 0 && (
              <button onClick={marcarTodasLidas} className="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1">
                <Check size={12} /> Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                <Bell size={24} className="mx-auto mb-2 text-gray-300" />
                Nenhuma notificação
              </div>
            ) : (
              notificacoes.map(n => {
                const Icone = TIPO_ICONE[n.tipo] || Info;
                const cor = TIPO_COR[n.tipo] || TIPO_COR.info;
                return (
                  <button
                    key={n.id}
                    onClick={() => marcarLida(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!n.lida ? 'bg-gray-50/80' : ''}`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cor}`}>
                      <Icone size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${!n.lida ? 'text-gray-900' : 'text-gray-700'}`}>{n.titulo}</span>
                        {!n.lida && <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{n.mensagem}</p>
                      <span className="text-[10px] text-gray-400 mt-1 block">{tempoRelativo(n.criadaEm)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
