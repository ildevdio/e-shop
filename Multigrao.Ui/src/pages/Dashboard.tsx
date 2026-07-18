import { Link } from 'react-router-dom';
import {
  Package, Truck, CheckSquare, MessageSquare, ShoppingCart, Map,
  Bell, Settings, Users, ArrowRight, Clock, TrendingUp,
  ClipboardList, Contact, Navigation, Zap, BarChart3, CircleCheck,
  AlertTriangle, Wheat, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Dashboard() {
  const nome = useAuthStore(state => state.nome);
  const role = useAuthStore(state => state.role);
  const setores = useAuthStore(state => state.setores);
  const logout = useAuthStore(state => state.logout);
  const isAdmin = role === 'AdminMaster' || role === 'SuperAdmin';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const kpis = [
    { title: 'Pedidos Abertos', value: 24, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-500', lightBg: 'bg-blue-50', trend: '+3', trendUp: true, path: '/comercial/pedidos' },
    { title: 'Em Separação', value: 8, icon: Package, color: 'text-amber-600', bg: 'bg-amber-500', lightBg: 'bg-amber-50', trend: '2 hoje', trendUp: true, path: '/separacao' },
    { title: 'Conferência', value: 5, icon: CheckSquare, color: 'text-emerald-600', bg: 'bg-emerald-500', lightBg: 'bg-emerald-50', trend: '1 pendente', trendUp: false, path: '/conferencia' },
    { title: 'Atendimentos', value: 5, icon: MessageSquare, color: 'text-purple-600', bg: 'bg-purple-500', lightBg: 'bg-purple-50', trend: '2 novos', trendUp: true, path: '/comercial' },
  ];

  const quickActions = [
    { label: 'Novo Atendimento', icon: MessageSquare, path: '/comercial', color: 'bg-black text-white hover:bg-gray-800' },
    { label: 'Pedidos', icon: ShoppingCart, path: '/comercial/pedidos', color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' },
    { label: 'Roteirização', icon: Navigation, path: '/logistica/roteirizacao', color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' },
    { label: 'Mural', icon: Bell, path: '/empresa', color: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50' },
  ];

  const sectorCards = [
    { label: 'Comercial', icon: ShoppingCart, desc: 'Atendimentos, pedidos e clientes', path: '/comercial', count: 24, setor: 'Comercial' },
    { label: 'Separação', icon: Package, desc: 'Ordens de separação pendentes', path: '/separacao', count: 8, setor: 'Separação' },
    { label: 'Conferência', icon: CheckSquare, desc: 'Pedidos para conferência', path: '/conferencia', count: 5, setor: 'Conferência' },
    { label: 'Logística', icon: Truck, desc: 'Rotas e veículos', path: '/logistica/roteirizacao', count: 3, setor: 'Logística' },
    { label: 'Entregas', icon: Map, desc: 'Entregas do dia', path: '/entregas', count: 2, setor: 'Entregas' },
    { label: 'Contatos', icon: Contact, desc: 'Base de contatos', path: '/comercial/contatos', count: null, setor: 'Comercial' },
  ];

  const recentActivity = [
    { time: '09:32', text: 'Pedido #1024 criado — Mercado São João', type: 'order' as const },
    { time: '09:15', text: 'Atendimento assume por Marcos — Mercearia São Jorge', type: 'chat' as const },
    { time: '08:47', text: 'Rota Centro gerada com 3 entregas', type: 'route' as const },
    { time: '08:30', text: 'Conferência iniciada — Pedido #1019', type: 'check' as const },
    { time: '08:12', text: 'Venda fechada — Padaria Pão Dourado (R$ 2.340)', type: 'sale' as const },
  ];

  const notices = [
    { id: 1, title: 'Atualização de Sistema', text: 'Nova versão do módulo de expedição será liberada sexta-feira às 18h.', type: 'info' as const },
    { id: 2, title: 'Meta de Vendas - Julho', text: 'Meta: R$ 150.000 em vendas este mês. Progresso: 62%.', type: 'goal' as const },
  ];

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const hasSetor = (nomeSetor: string) => isAdmin || setores.some(s => normalize(s) === normalize(nomeSetor));

  return (
    <div className="space-y-6">

      {/* HERO */}
      <div className="bg-[#111111] rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-40 h-40 bg-white/[0.02] rounded-full translate-y-1/2" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Wheat size={18} className="text-white/50" />
              <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em]">Multigrãos</span>
            </div>
            <button onClick={logout} className="p-2 rounded-lg text-white/20 hover:text-white/60 hover:bg-white/5 transition-all" title="Sair">
              <LogOut size={16} />
            </button>
          </div>
          <h1 className="text-3xl font-serif font-bold tracking-tight mb-1">
            {greeting}, {nome?.split(' ')[0] || 'Operador'}
          </h1>
          <p className="text-white/50 text-sm max-w-lg">
            Aqui está o panorama das operações de hoje. Tenha uma excelente jornada.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <Link key={i} to={kpi.path}
              className="bg-white rounded-2xl p-5 shadow-sm ring-1 ring-gray-100/50 hover:shadow-md hover:ring-gray-200/50 transition-all group block">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${kpi.lightBg} rounded-xl flex items-center justify-center`}>
                  <Icon size={20} className={kpi.color} />
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${kpi.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                  {kpi.trend}
                </span>
              </div>
              <p className="text-3xl font-serif font-bold text-gray-900 tracking-tight">{kpi.value}</p>
              <p className="text-xs text-gray-400 font-medium mt-1">{kpi.title}</p>
            </Link>
          );
        })}
      </div>

      {/* QUICK ACTIONS */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map((action, i) => {
          const Icon = action.icon;
          return (
            <Link key={i} to={action.path}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${action.color}`}>
              <Icon size={16} />
              {action.label}
            </Link>
          );
        })}
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SECTORS */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.12em] mb-3 px-1">Setores</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {sectorCards.filter(s => hasSetor(s.setor)).map((sector, i) => {
              const Icon = sector.icon;
              return (
                <Link key={i} to={sector.path}
                  className="bg-white rounded-2xl p-4 shadow-sm ring-1 ring-gray-100/50 hover:shadow-md hover:ring-gray-200/50 transition-all group block">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <Icon size={18} className="text-gray-500 group-hover:text-white transition-colors" />
                    </div>
                    {sector.count !== null && (
                      <span className="text-lg font-serif font-bold text-gray-900">{sector.count}</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{sector.label}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{sector.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <div className="flex flex-col">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.12em] mb-3 px-1">Atividade Recente</h2>
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100/50 flex-1 divide-y divide-gray-50">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5 first:rounded-t-2xl last:rounded-b-2xl">
                <div className="mt-0.5 shrink-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 ${
                    item.type === 'sale' ? 'bg-emerald-500' :
                    item.type === 'chat' ? 'bg-purple-500' :
                    item.type === 'order' ? 'bg-blue-500' :
                    item.type === 'route' ? 'bg-amber-500' :
                    'bg-gray-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 leading-snug">{item.text}</p>
                </div>
                <span className="text-[10px] text-gray-400 font-medium shrink-0 flex items-center gap-1 mt-0.5">
                  <Clock size={10} /> {item.time}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* AVISOS */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.12em]">Avisos</h2>
            <Link to="/empresa" className="text-xs font-semibold text-gray-400 hover:text-black transition-colors flex items-center gap-1">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {notices.map(n => (
              <div key={n.id} className={`p-4 rounded-xl border ${
                n.type === 'goal' ? 'bg-amber-50/60 border-amber-100' : 'bg-blue-50/60 border-blue-100'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {n.type === 'goal' ? <TrendingUp size={14} className="text-amber-600" /> : <Bell size={14} className="text-blue-600" />}
                  <h4 className={`font-bold text-sm ${n.type === 'goal' ? 'text-amber-900' : 'text-blue-900'}`}>{n.title}</h4>
                </div>
                <p className={`text-xs leading-relaxed ${n.type === 'goal' ? 'text-amber-800/80' : 'text-blue-800/80'}`}>{n.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* STATUS OPERACIONAL */}
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100/50 p-6">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-[0.12em] mb-4">Status Operacional</h2>
          <div className="space-y-3">
            {[
              { label: 'Pedidos em aberto', value: 24, max: 30, color: 'bg-blue-500' },
              { label: 'Em separação', value: 8, max: 15, color: 'bg-amber-500' },
              { label: 'Aguardando conferência', value: 5, max: 10, color: 'bg-emerald-500' },
              { label: 'Entregas realizadas', value: 12, max: 20, color: 'bg-purple-500' },
            ].map((bar, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-gray-600 font-medium">{bar.label}</span>
                  <span className="text-sm font-bold text-gray-900">{bar.value}<span className="text-gray-300 font-normal">/{bar.max}</span></span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${bar.color} rounded-full transition-all duration-700 ease-out`} style={{ width: `${(bar.value / bar.max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CircleCheck size={16} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Operação Normal</p>
              <p className="text-[11px] text-gray-400">Todos os setores funcionando</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
