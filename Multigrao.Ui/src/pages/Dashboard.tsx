import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown,
  ClipboardList, Headset, DollarSign,
  Boxes, PackageCheck, Truck, Route, ScanLine,
  Megaphone, Wheat, BarChart3, ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import GrainPattern from '../components/GrainPattern';
import { pedidoService } from '../services/pedidoService';
import { logisticaService } from '../services/logisticaService';
import { entregaService } from '../services/entregaService';
import { avisoService } from '../services/avisoService';
import type { LucideIcon } from 'lucide-react';
import { useSistemaStore } from '../store/sistemaStore';

interface Kpi {
  label: string;
  value: string;
  hint: string;
  trend?: { dir: 'up' | 'down'; value: string };
  icon: LucideIcon;
  accent?: string;
}

function getSectorKey(setores: string[]): string {
  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (setores.some(s => normalize(s) === normalize('Comercial'))) return 'comercial';
  if (setores.some(s => normalize(s) === normalize('Separação'))) return 'separacao';
  if (setores.some(s => normalize(s) === normalize('Logística'))) return 'logistica';
  return 'admin';
}

const FLOW = [
  'Comercial', 'Produção', 'Separação', 'Expedição',
  'Roteirização', 'Conferência', 'Entrega', 'Entregue',
];

const STATUS_LABEL: Record<string, string> = {
  Pendente: 'Pendente',
  EmProducao: 'Em produção',
  EmSeparacao: 'Em separação',
  ProntoEntrega: 'Pronto p/ entrega',
  Entregue: 'Entregue',
};

const STATUS_COLOR: Record<string, string> = {
  Pendente: 'bg-amber-100 text-amber-700',
  EmProducao: 'bg-blue-100 text-blue-700',
  EmSeparacao: 'bg-violet-100 text-violet-700',
  ProntoEntrega: 'bg-cyan-100 text-cyan-700',
  Entregue: 'bg-green-100 text-green-700',
};

export default function Dashboard() {
  const nome = useAuthStore(state => state.nome);
  const role = useAuthStore(state => state.role);
  const setores = useAuthStore(state => state.setores);
  const isAdmin = role === 'AdminMaster' || role === 'SuperAdmin';
  const config = useSistemaStore((state) => state.config);

  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [avisos, setAvisos] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<{ label: string; count: number }[]>([]);

  useEffect(() => {
    const carregar = async () => {
      setCarregando(true);
      try {
        const [pedidos, veiculos, entregas, avisos] = await Promise.all([
          pedidoService.getPedidos(),
          logisticaService.getVeiculos(),
          entregaService.getEntregas(),
          avisoService.getAvisos(),
        ]);
        setPedidos(pedidos);
        setAvisos(avisos);

        const pedidosAbertos = pedidos.filter(p => p.status === 'Pendente' || p.status === 'EmProducao').length;
        const pedidosEmSeparacao = pedidos.filter(p => p.status === 'EmSeparacao').length;
        const pedidosProntos = pedidos.filter(p => p.status === 'ProntoEntrega').length;
        const pedidosEntregues = pedidos.filter(p => p.status === 'Entregue').length;
        const faturamento = pedidos.reduce((acc, p) => acc + p.valorTotal, 0);

        const statuses = ['Pendente', 'EmProducao', 'EmSeparacao', 'ProntoEntrega', 'Entregue'];
        setStatusBreakdown(statuses.map(s => ({
          label: STATUS_LABEL[s] ?? s,
          count: pedidos.filter(p => p.status === s).length,
        })));

        const rotas = await logisticaService.getRotas();
        const rotasAtivas = rotas.filter(r => r.status === 'Criada' || r.status === 'EmAndamento').length;

        const entregasPendentes = entregas.filter(e => e.status === 'PendenteConferencia' || e.status === 'EmConferencia' || e.status === 'EmRota').length;

        const sectorKey = isAdmin ? 'admin' : getSectorKey(setores);

        const kpisBySector: Record<string, Kpi[]> = {
          comercial: [
            { label: 'Pedidos abertos', value: String(pedidosAbertos), hint: 'aguardando produção', icon: ClipboardList, accent: 'from-amber-500/20' },
            { label: 'Em separação', value: String(pedidosEmSeparacao), hint: 'sendo separados', icon: Boxes, accent: 'from-violet-500/20' },
            { label: 'Prontos p/ entrega', value: String(pedidosProntos), hint: 'expedidos', icon: PackageCheck, accent: 'from-cyan-500/20' },
            { label: 'Faturamento total', value: `R$ ${(faturamento / 1000).toFixed(1)}k`, hint: 'acumulado', icon: DollarSign, accent: 'from-green-500/20' },
          ],
          separacao: [
            { label: 'Pedidos em aberto', value: String(pedidosAbertos), hint: 'aguardando separação', icon: Boxes, accent: 'from-amber-500/20' },
            { label: 'Itens a separar', value: String(pedidos.reduce((acc, p) => acc + (p.itens?.length ?? 0), 0)), hint: 'distribuídos nos pedidos', icon: ClipboardList, accent: 'from-blue-500/20' },
            { label: 'Concluídos', value: String(pedidosEntregues + pedidosProntos), hint: 'prontos p/ entrega', icon: PackageCheck, accent: 'from-green-500/20' },
          ],
          logistica: [
            { label: 'Entregas pendentes', value: String(entregasPendentes), hint: 'aguardando', icon: Truck, accent: 'from-amber-500/20' },
            { label: 'Rotas ativas', value: String(rotasAtivas), hint: 'veículos em campo', icon: Route, accent: 'from-blue-500/20' },
            { label: 'Veículos', value: String(veiculos.length), hint: 'cadastrados', icon: ScanLine, accent: 'from-cyan-500/20' },
          ],
          admin: [
            { label: 'Avisos publicados', value: String(avisos.length), hint: 'no mural', icon: Megaphone, accent: 'from-amber-500/20' },
            { label: 'Pedidos totais', value: String(pedidos.length), hint: 'no sistema', icon: ClipboardList, accent: 'from-blue-500/20' },
            { label: 'Veículos', value: String(veiculos.length), hint: 'na frota', icon: Truck, accent: 'from-cyan-500/20' },
          ],
        };

        setKpis(kpisBySector[sectorKey] ?? kpisBySector.admin);
      } catch {
        setKpis([
          { label: 'Pedidos', value: '—', hint: 'carregando...', icon: ClipboardList },
        ]);
      }
      setCarregando(false);
    };
    carregar();
  }, [isAdmin, setores]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 p-4 sm:p-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-primary p-6 text-primary-foreground anim-fade-in-up sm:p-7">
        <GrainPattern opacity={0.10} color="#fafafa" className="inset-0 w-full h-full" animated />
        <div className="absolute top-0 right-0 w-52 h-52 bg-white/[0.04] rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <Wheat size={15} className="text-white/40" />
            <span className="text-[10px] font-semibold text-white/40 uppercase tracking-[0.2em]">{config.nomeEmpresa}{config.slogan ? ` — ${config.slogan}` : ''}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight">
            {greeting}, {nome?.split(' ')[0] || 'Operador'}
          </h2>
          <p className="text-white/50 text-sm max-w-lg mt-0.5">
            Indicadores operacionais para hoje. Tenha uma excelente jornada.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {carregando ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 animate-pulse">
              <div className="h-9 w-9 bg-secondary rounded-lg mb-3"></div>
              <div className="h-6 w-14 bg-secondary rounded mb-2"></div>
              <div className="h-3.5 w-24 bg-secondary rounded"></div>
            </div>
          ))
        ) : (
          kpis.map((kpi, i) => (
            <div key={kpi.label} className={`anim-fade-in-up anim-delay-${i + 1}`}>
              <KpiCard kpi={kpi} />
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2 relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card p-5 anim-fade-in-up anim-delay-3">
          <GrainPattern opacity={0.04} color="#a3a3a3" className="inset-0 w-full h-full" animated />
          <div className="relative z-10 flex flex-1 flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-heading font-semibold text-foreground">Fluxo do pedido</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Do atendimento comercial até a entrega final ao cliente.</p>
              </div>
              <div className="rounded-lg bg-secondary/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {statusBreakdown.reduce((a, b) => a + b.count, 0)} pedidos
              </div>
            </div>
            <ol className="flex flex-wrap items-center gap-2">
              {FLOW.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground">
                    {step}
                  </span>
                  {i < FLOW.length - 1 && (
                    <span className="text-muted-foreground" aria-hidden="true">›</span>
                  )}
                </li>
              ))}
            </ol>

            <div className="mt-5 grid flex-1 content-stretch grid-cols-2 gap-2 sm:grid-cols-5">
              {statusBreakdown.map(s => (
                <div key={s.label} className="flex flex-col justify-between rounded-xl border border-border bg-white/50 p-3">
                  <p className="text-lg font-heading font-bold text-foreground">{s.count}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${s.count > 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                    <span className="text-[11px] leading-tight text-muted-foreground line-clamp-2">{s.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 anim-fade-in-up anim-delay-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold text-foreground">Atalhos rápidos</h3>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {[
              { to: '/comercial', icon: Headset, label: 'Atendimento' },
              { to: '/comercial/pedidos', icon: ClipboardList, label: 'Pedidos' },
              { to: '/separacao', icon: PackageCheck, label: 'Separação' },
              { to: '/relatorios', icon: BarChart3, label: 'Relatórios' },
            ].map(item => (
              <Link
                key={item.to}
                to={item.to}
                className="group flex items-center gap-3 rounded-xl border border-border bg-white/50 p-3 transition-all hover:bg-secondary/50 hover:shadow-md hover:border-foreground/10"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <item.icon className="h-4.5 w-4.5 text-muted-foreground group-hover:text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground leading-tight">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="lg:col-span-2 rounded-2xl border border-border bg-card p-5 anim-fade-in-up anim-delay-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold text-foreground">Pedidos recentes</h3>
            <Link to="/comercial/pedidos" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {pedidos.slice(0, 5).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pedido registrado ainda.</p>
            ) : (
              pedidos.slice(0, 5).map(p => {
                const status = p.status || 'Pendente';
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-white/50 px-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <PackageCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          #{p.id} · {p.solicitanteNome || p.cliente?.razaoSocialNome || 'Cliente'}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.itens?.length ?? 0} itens · {new Date(p.dataCriacao ?? Date.now()).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-semibold text-foreground">
                        R$ {Number(p.valorTotal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${STATUS_COLOR[status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[status] ?? status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 anim-fade-in-up anim-delay-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-semibold text-foreground">Avisos</h3>
            <Link to="/empresa/avisos" className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
              Ver todos <ArrowRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {avisos.slice(0, 4).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum aviso publicado.</p>
            ) : (
              avisos.slice(0, 4).map(a => (
                <div key={a.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-white/50 p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                    <Megaphone className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{a.titulo || 'Aviso'}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{a.conteudo || a.mensagem || ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md hover:border-foreground/10">
      <div className={`pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full bg-gradient-to-br ${kpi.accent ?? 'from-primary/10'} to-transparent opacity-70`} />
      <div className="flex items-start justify-between relative">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary transition-colors group-hover:bg-primary/10">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        {kpi.trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${kpi.trend.dir === 'up' ? 'text-success' : 'text-destructive'}`}>
            {kpi.trend.dir === 'up' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {kpi.trend.value}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-heading font-bold text-foreground">{kpi.value}</p>
      <p className="text-sm font-medium text-foreground">{kpi.label}</p>
      <p className="text-xs text-muted-foreground">{kpi.hint}</p>
    </div>
  );
}
